#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Location that will be mounted as the /data volume in containers
# This is how we access the initial members and balances files from
# the containers and where generated chainspec files will be located.
DATA_PATH=${DATA_PATH:=~/tmp}

# Initial account balance for Alice
# Alice is the source of funds for all new accounts that are created in the tests.
ALICE_INITIAL_BALANCE=${ALICE_INITIAL_BALANCE:=100000000}

# The docker image tag to use for joystream/node as the starting chain
# that will be upgraded to the latest runtime.
RUNTIME=${RUNTIME:=latest}
TARGET_RUNTIME=${TARGET_RUNTIME:=latest}

mkdir -p ${DATA_PATH}

echo "{
  \"balances\":[
    [\"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY\", ${ALICE_INITIAL_BALANCE}]
  ]
}" > ${DATA_PATH}/initial-balances.json

# Make Alice a member
echo '
  [{
    "member_id":0,
    "root_account":"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    "controller_account":"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    "handle":"alice",
    "avatar_uri":"https://alice.com/avatar.png",
    "about":"Alice",
    "registered_at_time":0
  }]
' > ${DATA_PATH}/initial-members.json

# Create a chain spec file
docker run --rm -v ${DATA_PATH}:/data --entrypoint ./chain-spec-builder joystream/node:${RUNTIME} \
  new \
  --authority-seeds Alice \
  --sudo-account  5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY \
  --deployment dev \
  --chain-spec-path /data/chain-spec.json \
  --initial-balances-path /data/initial-balances.json \
  --initial-members-path /data/initial-members.json

# Convert the chain spec file to a raw chainspec file
docker run --rm -v ${DATA_PATH}:/data joystream/node:${RUNTIME} build-spec \
  --raw --disable-default-bootnode \
  --chain /data/chain-spec.json > ~/tmp/chain-spec-raw.json

NETWORK_ARG=
if [ "$ATTACH_TO_NETWORK" != "" ]; then
  NETWORK_ARG="--network ${ATTACH_TO_NETWORK}"
fi

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

if [ "$TARGET_RUNTIME" == "$RUNTIME" ]; then
  echo "Not Performing a runtime upgrade."
else
  # Copy new runtime wasm file from target joystream/node image
  echo "Extracting wasm blob from target joystream/node image."
  id=`docker create joystream/node:${TARGET_RUNTIME}`
  docker cp $id:/joystream/runtime.compact.wasm ${DATA_PATH}
  docker rm $id

  # Display runtime version before runtime upgrade
  yarn workspace api-scripts tsnode-strict src/status.ts | grep Runtime

  echo "Performing runtime upgrade."
  yarn workspace api-scripts tsnode-strict \
    src/dev-set-runtime-code.ts -- ${DATA_PATH}/runtime.compact.wasm

  echo "Runtime upgraded."
fi

# Display runtime version
yarn workspace api-scripts tsnode-strict src/status.ts | grep Runtime

#./run-test-scenario.sh $1
