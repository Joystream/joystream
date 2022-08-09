#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Log only to stderr
# Only output from this script should be the container id of the node at the very end

# Location that will be mounted to /spec in containers
# This is where the initial balances files and generated chainspec files will be located.
DATA_PATH=$PWD/data
mkdir -p ${DATA_PATH}

# The docker image tag to use for joystream/node
RUNTIME=${RUNTIME:=$(RUNTIME_PROFILE=TESTING ../../scripts/runtime-code-shasum.sh)}

# Initial account balance for sudo account
SUDO_INITIAL_BALANCE=${SUDO_INITIAL_BALANCE:=1000000000000000000}
SUDO_ACCOUNT_URI=${SUDO_ACCOUNT_URI:="//Alice"}
SUDO_ACCOUNT=$(docker run --rm joystream/node:${RUNTIME} key inspect ${SUDO_ACCOUNT_URI} --output-type json | jq .ss58Address -r)

# Source of funds for all new accounts that are created in the tests.
TREASURY_INITIAL_BALANCE=${TREASURY_INITIAL_BALANCE:=1000000000000000000}
TREASURY_ACCOUNT_URI=${TREASURY_ACCOUNT_URI:="//Bob"}
TREASURY_ACCOUNT=$(docker run --rm joystream/node:${RUNTIME} key inspect ${TREASURY_ACCOUNT_URI} --output-type json | jq .ss58Address -r)

>&2 echo "sudo account from suri: ${SUDO_ACCOUNT}"
>&2 echo "treasury account from suri: ${TREASURY_ACCOUNT}"

echo "{
  \"balances\":[
    [\"$SUDO_ACCOUNT\", $SUDO_INITIAL_BALANCE],
    [\"$TREASURY_ACCOUNT\", $TREASURY_INITIAL_BALANCE]
  ]
}" > ${DATA_PATH}/initial-balances.json

# Create a chain spec file
docker run --rm -v ${DATA_PATH}:/spec --entrypoint ./chain-spec-builder joystream/node:${RUNTIME} \
  new \
  --authority-seeds Alice \
  --sudo-account ${SUDO_ACCOUNT} \
  --deployment dev \
  --chain-spec-path /spec/chain-spec.json \
  --initial-balances-path /spec/initial-balances.json

# Convert the chain spec file to a raw chainspec file
docker run --rm -v ${DATA_PATH}:/spec joystream/node:${RUNTIME} build-spec \
  --raw --disable-default-bootnode \
  --chain /spec/chain-spec.json > ${DATA_PATH}/chain-spec-raw.json

# Start a chain with generated chain spec
export JOYSTREAM_NODE_TAG=${RUNTIME}
docker-compose -f ../../docker-compose.yml run -d -v ${DATA_PATH}:/spec --name joystream-node \
  -p 9944:9944 -p 9933:9933 joystream-node \
  --alice --validator --unsafe-ws-external --unsafe-rpc-external \
  --rpc-methods Unsafe --rpc-cors=all -l runtime \
  --chain /spec/chain-spec-raw.json --pruning=archive
