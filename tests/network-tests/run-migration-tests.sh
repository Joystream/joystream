#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Location to store runtime WASM for runtime upgrade
DATA_PATH=${DATA_PATH:=$(PWD)/data}

# The djoystream/node ocker image tag to start chain
export RUNTIME=${RUNTIME:=latest}

# The joystream/node docker image tag which contains WASM runtime to upgrade chain with
TARGET_RUNTIME=${TARGET_RUNTIME:=latest}

# Prevent joystream cli from prompting
export AUTO_CONFIRM=true

CONTAINER_ID=`MAKE_SUDO_MEMBER=true ./run-test-node-docker.sh`

function cleanup() {
    docker logs ${CONTAINER_ID} --tail 15
    docker-compose -f ../../docker-compose.yml down -v
    rm ./assets/TestChannel__rejectedContent.json || true
    rm ./assets/TestVideo__rejectedContent.json || true
}

function pre_migration_hook() {
  sleep 10 # needed otherwise docker image won't be ready yet
  # Display runtime version
  yarn workspace api-scripts tsnode-strict src/status.ts | grep Runtime

  yarn joystream-cli account:choose --address 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY # Alice
  echo "creating 1 channel"
  yarn joystream-cli content:createChannel --input=./assets/TestChannel.json --context=Member || true
  echo "adding 1 video to the above channel"
  yarn joystream-cli content:createVideo -c 1 --input=./assets/TestVideo.json || true
}

function post_migration_hook() {
  echo "*** verify existence of the 5 new groups ***"
  yarn joystream-cli working-groups:overview --group=operationsAlpha
  yarn joystream-cli working-groups:overview --group=operationsBeta
  yarn joystream-cli working-groups:overview --group=operationsGamma
  yarn joystream-cli working-groups:overview --group=curators
  yarn joystream-cli working-groups:overview --group=distributors

  echo "*** verify previously created channel and video are cleared ***"
  # FIXME: assert these fail as expected
  yarn joystream-cli content:videos 1 || true
  yarn joystream-cli content:channel 1 || true
}    

trap cleanup EXIT

if [ "$TARGET_RUNTIME" == "$RUNTIME" ]; then
  echo "Not Performing a runtime upgrade."
else
  # FIXME: code against old runtime will fail running from newer runtime code
  pre_migration_hook

  # Copy new runtime wasm file from target joystream/node image
  echo "Extracting wasm blob from target joystream/node image."
  id=$(docker create joystream/node:${TARGET_RUNTIME})
  docker cp $id:/joystream/runtime.compact.wasm ${DATA_PATH}
  docker rm $id

  # Display runtime version before runtime upgrade
  yarn workspace api-scripts tsnode-strict src/status.ts | grep Runtime

  echo "Performing runtime upgrade."
  yarn workspace api-scripts tsnode-strict \
    src/dev-set-runtime-code.ts -- ${DATA_PATH}/runtime.compact.wasm

  echo "Runtime upgraded."

  echo "Performing migration tests"
  # post migration hook
  post_migration_hook
  echo "Done with migrations tests"
fi

# Display runtime version
yarn workspace api-scripts tsnode-strict src/status.ts | grep Runtime