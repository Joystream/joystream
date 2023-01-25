#!/usr/bin/env bash
set -e

# THIS IS JUST A REFERENCE SCRIPT, NOT USED FOR ACTUAL GIZA->OLYMPIA TESTING

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# The joystream/node docker image tag which contains WASM runtime to upgrade chain with
TARGET_RUNTIME_TAG=${TARGET_RUNTIME_TAG:=$(../../scripts/runtime-code-shasum.sh)}
# The joystream/node docker image tag to start the chain with
RUNTIME_TAG=${RUNTIME_TAG:=6740a4ae2bf40fe7c670fb49943cbbe290277601}
# Post migration assertions by means of typescript scenarios required
POST_MIGRATION_ASYNC_ASSERTIONS=${POST_MIGRATION_ASYNC_ASSERTIONS:=$true}
# source common function used for node setup
source ./node-utils.sh

#######################################
# use fork-off to generate a chainspec file with the current s
# Globals:
#   DATA_PATH
# Arguments:
#   None
#######################################
function fork_off_init() {
    # chain-spec-raw already existing

    # download the raw storage state 
    if ! [[ -f ${DATA_PATH}/storage.json ]]; then
        curl http://testnet-rpc-3-uk.joystream.org:9933 -H \
            "Content-type: application/json" -d \
            '{"jsonrpc":"2.0","id":1,"method":"state_getPairs","params":["0x"]}' \
            > ${DATA_PATH}/storage.json
    fi

    # provide types definition for the storage state
    if ! [[ -f ${DATA_PATH}/schema.json ]]; then
        cp $SCRIPT_PATH/../../types/augment/all/defs.json ${DATA_PATH}/schema.json
    fi

    # set old runtime.wasm before the upgrade
    set_old_runtime 

    # RPC endpoint for live RUNTIME testnet
    WS_RPC_ENDPOINT="wss://testnet-rpc-3-uk.joystream.org" \
        yarn workspace api-scripts tsnode-strict src/fork-off.ts
}

#######################################
# Perform substrate forkless upgrade by replacing the runtime.wasm
# Globals:
#   TARGET_RUNTIME_TAG
#   DATA_PATH
# Arguments:
#   None
#######################################
function set_old_runtime {
    # TODO: replace this with a scenario using proposals
    id=$(docker create joystream/node:${TARGET_RUNTIME_TAG})
    docker cp $id:/joystream/runtime.compact.wasm ${DATA_PATH}/runtime.wasm
  }

#######################################
# Write initial genesis state to disk
# Globals:
#   DATA_PATH
# Arguments:
#   None
#######################################
function export_chainspec_file_to_disk() {
    echo "**** Initializing node database by exporting state ****"
    # write the initial genesis state to db, in order to avoid waiting for an arbitrary amount of time
    docker-compose -f ../../docker-compose.yml run \
		   -v ${DATA_PATH}:/spec joystream-node export-state \
		   --chain /spec/chain-spec-raw.json \
		   --base-path /data --pruning archive > ${DATA_PATH}/exported-state.json
}

# entrypoint
function main {
    CONTAINER_ID=""

    echo "**** CREATING EMPTY CHAINSPEC ****"
    # create_initial_config
    create_chainspec_file
    convert_chainspec
    echo "**** EMPTY CHAINSPEC CREATED SUCCESSFULLY ****"

    # use forkoff to update chainspec with the live state + update runtime code
    fork_off_init
    
    # export chain-spec BEFORE starting the node
    export_chainspec_file_to_disk
    
    echo "***** STARTING NODE WITH FORKED STATE *****"

    export JOYSTREAM_NODE_TAG=$RUNTIME_TAG

    CONTAINER_ID=$(start_node)

    trap cleanup EXIT

    if ( $POST_MIGRATION_ASYNC_ASSERTIONS ); then
        sleep 120
        # verify assertion using typsecript
        echo "***** POST MIGRATION TYPESCRIPT *****"
        ./run-test-scenario.sh postRuntimeUpdate
    fi
}

# main entrypoint
main
