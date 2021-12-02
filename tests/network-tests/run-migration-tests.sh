#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

<<<<<<< HEAD
# Location to store runtime WASM for runtime upgrade
DATA_PATH=$PWD/data

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
=======
# The joystream/node docker image tag which contains WASM runtime to upgrade chain with
TARGET_RUNTIME_TAG=${TARGET_RUNTIME_TAG:=latest}
# The joystream/node docker image tag to start the chain with
RUNTIME_TAG=${RUNTIME_TAG:=sumer}
# Use fork-off tool in order to clone live $TARGET_RUNTIME_TAG state
CLONE_CURRENT_STATE=${CLONE_CURRENT_STATE:=$false}
# If state modification by means of joystream-cli are required before migration
PRE_MIGRATION_CLI_SETUP=${PRE_MIGRATION_CLI_SETUP:=$true}
# If state modification by means of typescript scenarios are required before migration
PRE_MIGRATION_ASYNC_SETUP=${PRE_MIGRATION_ASYNC_SETUP:=$false}
# Post migration assertions by means of joystream-cli required
POST_MIGRATION_CLI_ASSERTIONS=${POST_MIGRATION_CLI_ASSERTIONS=$true}
# Post migration assertions by means of typescript scenarios required
POST_MIGRATION_ASYNC_ASSERTIONS=${POST_MIGRATION_ASYNC_ASSERTIONS=$false}

# source common function used for node setup
source ./node-utils.sh
source ./.env

#######################################
# use fork-off to generate a chainspec file with the current s
# Globals:
#   DATA_PATH
# Arguments:
#   None
#######################################
function fork_off_init() {
    # chain-spec-raw already existing
    
    if [[ -z ${DATA_PATH}/storage.json ]]; then
	sudo scp ignazio@testnet-rpc-3-uk.joystream.org:/home/ignazio/storage.json \
	     ${DATA_PATH}/storage.json
    fi
    
    if [[ -z ${DATA_PATH}/schema.json ]]; then
	cp ../../types/augment/all/defs.json \
	     ${DATA_PATH}/schema.json
    fi

    id=$(docker create joystream/node:${TARGET_RUNTIME_TAG})
    docker cp $id:/joystream/runtime.compact.wasm ${DATA_PATH}/runtime.wasm
    cat ${DATA_PATH}/runtime.wasm | hexdump -ve \'/1 "%02x"\ > ${DATA_PATH}/runtime.hex
    
    npm start
}
#######################################
# create initial-balances.json & initial-members.json files
# Globals:
#   DATA_PATH
# Arguments:
#   None
#######################################
function upgrade_runtime() {
    if [ "$TARGET_RUNTIME_TAG" == "$RUNTIME_TAG" ]; then
	echo "Not Performing a runtime upgrade."
    else
	echo "**** PERFORMING RUNTIME UPGRADE ****"	
	# Copy new runtime wasm file from target joystream/node image
	id=$(docker create joystream/node:${TARGET_RUNTIME_TAG})
	docker cp $id:/joystream/runtime.compact.wasm ${DATA_PATH}
	docker rm $id

	yarn workspace api-scripts tsnode-strict \
	     src/dev-set-runtime-code.ts -- ${DATA_PATH}/runtime.compact.wasm

	echo "**** RUNTIME UPGRADED ****"

	# # Display runtime version
	# yarn workspace api-scripts tsnode-strict src/status.ts | grep Runtime
    fi
}

#######################################
# Setup pre migration scenario
# Globals:
#   None
# Arguments:
#   None
#######################################
function pre_migration_cli() {
  sleep 10 # needed otherwise docker image won't be ready yet
  # Display runtime version
  yarn workspace api-scripts tsnode-strict src/status.ts | grep Runtime

  # assume older version of joystream-cli is installed globally. So we run these commands to
  # work against older runtime. Assert it is version  `@joystream/cli/0.5.1` ?
  joystream-cli --version
>>>>>>> c3007a79d9 (added migration scripts & utils.sh file)

  joystream-cli account:choose --address 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY # Alice
  echo "creating 1 channel"
  joystream-cli content:createChannel --input=./assets/TestChannel.json --context=Member || true
  echo "adding 1 video to the above channel"
  joystream-cli content:createVideo -c 1 --input=./assets/TestVideo.json || true

  # Confirm channel and video created successfully
  joystream-cli content:videos 1
  joystream-cli content:channel 1
}

#######################################
# Verifies post migration assertions
# Globals:
#   None
# Arguments:
#   None
#######################################
function post_migration_cli() {
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

# entrypoint
function main {
    # Section A: pre migration

    CONTAINER_ID=""

    echo "**** CREATING EMPTY CHAINSPEC ****"
    create_initial_config
    create_chainspec_file
    convert_chainspec
    echo "**** EMPTY CHAINSPEC CREATED SUCCESSFULLY ****"

    # use forkoff
    if ( $CLONE_LIVE_STATE ); then
	fork_off_init
    fi

    # node has to be started because upgrade runtime uses signAndSend to update code on storage
    JOYSTREAM_NODE_TAG=${TARGET_RUNTIME_TAG}
    echo "******* STARTING ${JOYSTREAM_NODE_TAG} ********"	
    CONTAINER_ID=$(start_node)
    echo "******* JS BINARY STARTED CONTAINER_ID: $CONTAINER_ID ********"	

    # Section B: migration
    upgrade_runtime

    # Section C: assertions
    # verify that the number of outstanding channels & videos == 0
    if [[ $POST_MIGRATION_CLI_ASSERTIONS ]]; then
	# verify assertion using cli
	echo "***** POST MIGRATION CLI *****"
	post_migration_cli
    fi
    
    # if [[ $POST_MIGRATION_ASYNC_ASSERTION]]; then
    # 	# verify assertion using scenarios
    # fi
}

# main entrypoint
main
cleanup
