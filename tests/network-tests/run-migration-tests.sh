#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Location to store runtime WASM for runtime upgrade
DATA_PATH=${DATA_PATH:=$PWD/data}

# The joystream/node docker image tag to start chain
export RUNTIME=${RUNTIME:=latest}

# The joystream/node docker image tag which contains WASM runtime to upgrade chain with
TARGET_RUNTIME=${TARGET_RUNTIME:=latest}

# Prevent joystream cli from prompting
export AUTO_CONFIRM=true

# Create chainspec with Alice (sudo) as member so we can use her in joystream-cli
CONTAINER_ID=$(MAKE_SUDO_MEMBER=true ./run-test-node-docker.sh)

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

  # assume older version of joystream-cli is installed globally. So we run these commands to
  # work against older runtime. Assert it is version  `@joystream/cli/0.5.1` ?
  joystream-cli --version

  joystream-cli account:choose --address 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY # Alice
  echo "creating 1 channel"
  joystream-cli content:createChannel --input=./assets/TestChannel.json --context=Member || true
  echo "adding 1 video to the above channel"
  joystream-cli content:createVideo -c 1 --input=./assets/TestVideo.json || true

  # Confirm channel and video created successfully
  joystream-cli content:videos 1
  joystream-cli content:channel 1
}

function post_migration_hook() {
  echo "*** verify existence of the 5 new groups ***"
  yarn joystream-cli working-groups:overview --group=operationsAlpha
  yarn joystream-cli working-groups:overview --group=operationsBeta
  yarn joystream-cli working-groups:overview --group=operationsGamma
  yarn joystream-cli working-groups:overview --group=curators
  yarn joystream-cli working-groups:overview --group=distributors

  echo "*** verify previously created channel and video are cleared ***"
  # Allow a few blocks for migration to complete
  sleep 12
  
  # FIXME: Howto assert these fail as expected. They should report video and channel do no exist
  # Can we get json output to more easily parse result of query?
  set +e
  yarn joystream-cli content:channel 1
  if [ $? -eq 0 ]; then
    echo "Unexpected channel was found"
    exit -1
  fi
  # This cammand doesn't give error exit code if videos not found in a channel
  yarn joystream-cli content:videos 1
}    

trap cleanup EXIT

if [ "$TARGET_RUNTIME" == "$RUNTIME" ]; then
  echo "Not Performing a runtime upgrade."
else
  pre_migration_hook

  # Copy new runtime wasm file from target joystream/node image
  echo "Extracting wasm blob from target joystream/node image."
  id=$(docker create joystream/node:${TARGET_RUNTIME})
  docker cp $id:/joystream/runtime.compact.wasm ${DATA_PATH}
  docker rm $id

  echo "Performing runtime upgrade."
  yarn workspace api-scripts tsnode-strict \
    src/dev-set-runtime-code.ts -- ${DATA_PATH}/runtime.compact.wasm

  echo "Runtime upgraded."

  # Display runtime version
  yarn workspace api-scripts tsnode-strict src/status.ts | grep Runtime

  echo "Performing migration tests"

  post_migration_hook

  echo "Done with migrations tests"
fi
