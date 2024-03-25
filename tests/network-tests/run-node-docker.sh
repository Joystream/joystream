#!/usr/bin/env bash
set -e

SCRIPT_PATH=`dirname "${BASH_SOURCE[0]}"`
cd $SCRIPT_PATH

rm ./output.json || :

# Log only to stderr
# Only output from this script should be the container id of the node at the very end

# Location that will be mounted to /spec in containers
# This is where the initial balances files and generated chainspec files will be located.
DATA_PATH=$PWD/data
mkdir -p ${DATA_PATH}

# The docker image tag to use for joystream/node
if [[ "$RUNTIME" == "" ]]; then
  RUNTIME=`../../scripts/runtime-code-shasum.sh`
fi

# Source of funds for all new accounts that are created in the tests.
TREASURY_INITIAL_BALANCE=${TREASURY_INITIAL_BALANCE:="100000000"}
TREASURY_ACCOUNT_URI=${TREASURY_ACCOUNT_URI:="//Bob"}
TREASURY_ACCOUNT=`docker run --pull never --rm joystream/node:${RUNTIME} key inspect ${TREASURY_ACCOUNT_URI} --output-type json | jq .ss58Address -r`

>&2 echo "treasury account from suri: ${TREASURY_ACCOUNT}"

# Default initial balances
echo "{
  \"balances\":[
    [\"$TREASURY_ACCOUNT\", $TREASURY_INITIAL_BALANCE]
  ],
  \"vesting\":[]
}" > ${DATA_PATH}/initial-balances.json

# Override initial balances from external source
if [[ $INITIAL_BALANCES == http* ]];
then
  >&2 echo "fetching ${INITIAL_BALANCES}"
  wget -O ${DATA_PATH}/initial-balances.json ${INITIAL_BALANCES}
else
  if [ ! -z "$INITIAL_BALANCES" ]; then
    if jq -e . >/dev/null 2>&1 <<<"$INITIAL_BALANCES"; then
      >&2 echo "Detected some valid JSON in INITIAL_BALANCES"
      echo $INITIAL_BALANCES > ${DATA_PATH}/initial-balances.json
    else
      >&2 echo "Failed to parse INITIAL_BALANCES as JSON, or got false/null"
    fi
  fi
fi

# Create a chain spec file
docker run --pull never --rm -v ${DATA_PATH}:/spec --entrypoint ./chain-spec-builder joystream/node:${RUNTIME} \
  new \
  --fund-accounts \
  --authorities //Alice \
  --deployment dev \
  --chain-spec-path /spec/chain-spec.json \
  --initial-balances-path /spec/initial-balances.json

# Convert the chain spec file to a raw chainspec file
docker run --pull never --rm -v ${DATA_PATH}:/spec joystream/node:${RUNTIME} build-spec \
  --raw --disable-default-bootnode \
  --chain /spec/chain-spec.json > ${DATA_PATH}/chain-spec-raw.json

# Start a chain with generated chain spec
export JOYSTREAM_NODE_TAG=${RUNTIME}
docker-compose -p joystream -f ../../docker-compose.yml run -d -v ${DATA_PATH}:/spec --name joystream-node \
  --service-ports joystream-node \
  --alice --validator --unsafe-ws-external --unsafe-rpc-external \
  --rpc-methods Unsafe --rpc-cors=all -l runtime \
  --chain /spec/chain-spec-raw.json --pruning=archive --no-telemetry \
  --no-hardware-benchmarks
