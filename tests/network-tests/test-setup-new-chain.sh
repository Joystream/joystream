#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Location that will be mounted as the /data volume in containers
# This is where the initial members and balances files and generated chainspec files will be located.
DATA_PATH=${DATA_PATH:=~/tmp}
mkdir -p ${DATA_PATH}

# Initial account balance for sudo account
# Will be the source of funds for all new accounts that are created in the tests.
SUDO_INITIAL_BALANCE=${SUDO_INITIAL_BALANCE:=100000000}
export SUDO_ACCOUNT_URI=${SUDO_ACCOUNT_URI:="//Alice"}
SUDO_ACCOUNT=$(subkey inspect ${SUDO_ACCOUNT_URI} --output-type json | jq .ss58Address -r)
export TREASURY_ACCOUNT_URI=${SUDO_ACCOUNT_URI}

# The docker image tag to use for joystream/node
RUNTIME=${RUNTIME:=latest}

echo "{
  \"balances\":[
    [\"$SUDO_ACCOUNT\", $SUDO_INITIAL_BALANCE]
  ]
}" > ${DATA_PATH}/initial-balances.json

# Make sudo a member as well - do we really need this ?
# echo "
#   [{
#     \"member_id\":0,
#     \"root_account\":\"$SUDO_ACCOUNT\",
#     \"controller_account\":\"$SUDO_ACCOUNT\",
#     \"handle\":\"sudosudo\",
#     \"avatar_uri\":\"https://sudo.com/avatar.png\",
#     \"about\":\"Sudo\",
#     \"registered_at_time\":0
#   }]
# " > ${DATA_PATH}/initial-members.json

echo "creating chainspec file"
# Create a chain spec file
docker run --rm -v ${DATA_PATH}:/data --entrypoint ./chain-spec-builder joystream/node:${RUNTIME} \
  new \
  --authority-seeds Alice \
  --sudo-account ${SUDO_ACCOUNT} \
  --deployment dev \
  --chain-spec-path /data/chain-spec.json \
  --initial-balances-path /data/initial-balances.json
  # --initial-members-path /data/initial-members.json

echo "converting chainspec to raw format"
# Convert the chain spec file to a raw chainspec file
docker run --rm -v ${DATA_PATH}:/data joystream/node:${RUNTIME} build-spec \
  --raw --disable-default-bootnode \
  --chain /data/chain-spec.json > ~/tmp/chain-spec-raw.json

NETWORK_ARG=
if [ "$ATTACH_TO_NETWORK" != "" ]; then
  NETWORK_ARG="--network ${ATTACH_TO_NETWORK}"
fi

echo "starting joystream-node container"
# Start a chain with generated chain spec
# Add "-l ws=trace,ws::handler=info" to get websocket trace logs
CONTAINER_ID=`docker run -d -v ${DATA_PATH}:/data -p 9944:9944 ${NETWORK_ARG} --name joystream-node joystream/node:${RUNTIME} \
  --validator --alice --unsafe-ws-external --rpc-cors=all -l runtime \
  --chain /data/chain-spec-raw.json`

function cleanup() {
    docker logs ${CONTAINER_ID} --tail 15
    docker stop ${CONTAINER_ID}
    docker rm ${CONTAINER_ID}
}

trap cleanup EXIT

# Display runtime version
yarn workspace api-scripts tsnode-strict src/status.ts | grep Runtime

# Init chain state
echo 'executing scenario'
./run-test-scenario.sh setup-new-chain