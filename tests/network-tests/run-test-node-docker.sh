#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Location that will be mounted as the /data volume in containers
# This is where the initial members and balances files and generated chainspec files will be located.
DATA_PATH=${DATA_PATH:=$(pwd)/data}
mkdir -p ${DATA_PATH}

# Initial account balance for sudo account
# Will be the source of funds for all new accounts that are created in the tests.
SUDO_INITIAL_BALANCE=${SUDO_INITIAL_BALANCE:=100000000}
export SUDO_ACCOUNT_URI=${SUDO_ACCOUNT_URI:="//Alice"}
SUDO_ACCOUNT=$(docker run -it --rm --pull=always docker.io/parity/subkey:2.0.1 inspect ${SUDO_ACCOUNT_URI} --output-type json | jq .ss58Address -r)
export TREASURY_ACCOUNT_URI=${SUDO_ACCOUNT_URI}

# The docker image tag to use for joystream/node
RUNTIME=${RUNTIME:=latest}

echo "{
  \"balances\":[
    [\"$SUDO_ACCOUNT\", $SUDO_INITIAL_BALANCE]
  ]
}" > ${DATA_PATH}/initial-balances.json

if [ "${MAKE_SUDO_MEMBER}" == true ]
then
  echo "
    [{
      \"member_id\":0,
      \"root_account\":\"$SUDO_ACCOUNT\",
      \"controller_account\":\"$SUDO_ACCOUNT\",
      \"handle\":\"sudosudo\",
      \"avatar_uri\":\"https://sudo.com/avatar.png\",
      \"about\":\"Sudo\",
      \"registered_at_time\":0
    }]
  " > ${DATA_PATH}/initial-members.json
else
  echo "[]" > ${DATA_PATH}/initial-members.json
fi

# Create a chain spec file
docker run --rm -v ${DATA_PATH}:/data --entrypoint ./chain-spec-builder joystream/node:${RUNTIME} \
  new \
  --authority-seeds Alice \
  --sudo-account ${SUDO_ACCOUNT} \
  --deployment dev \
  --chain-spec-path /data/chain-spec.json \
  --initial-balances-path /data/initial-balances.json \
  --initial-members-path /data/initial-members.json

# Convert the chain spec file to a raw chainspec file
docker run --rm -v ${DATA_PATH}:/data joystream/node:${RUNTIME} build-spec \
  --raw --disable-default-bootnode \
  --chain /data/chain-spec.json > ${DATA_PATH}/chain-spec-raw.json

# Start a chain with generated chain spec
export JOYSTREAM_NODE_TAG=${RUNTIME}
docker-compose -f ../../docker-compose.yml run -d -v ${DATA_PATH}:/data --name joystream-node \
  -p 9944:9944 -p 9933:9933 joystream-node \
  --alice --validator --unsafe-ws-external --unsafe-rpc-external \
  --rpc-methods Unsafe --rpc-cors=all -l runtime \
  --chain /data/chain-spec-raw.json
