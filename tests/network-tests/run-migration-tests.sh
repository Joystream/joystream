#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# The joystream/node docker image tag which contains WASM runtime to upgrade chain with
TARGET_RUNTIME_TAG=${TARGET_RUNTIME_TAG:=$(../../scripts/runtime-code-shasum.sh)}
# The joystream/node docker image tag to start the chain with
RUNTIME_TAG=${RUNTIME_TAG:=sumer}
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

    if ! [[ -f ${DATA_PATH}/storage.json ]]; then
        curl http://testnet-rpc-3-uk.joystream.org:9933 -H \
            "Content-type: application/json" -d \
            '{"jsonrpc":"2.0","id":1,"method":"state_getPairs","params":["0x"]}' \
            > ${DATA_PATH}/storage.json
    fi

    if ! [[ -f ${DATA_PATH}/schema.json ]]; then
        cp $SCRIPT_PATH/../../types/augment/all/defs.json ${DATA_PATH}/schema.json
    fi

    id=$(docker create joystream/node:${TARGET_RUNTIME_TAG})
    docker cp $id:/joystream/runtime.compact.wasm ${DATA_PATH}/runtime.wasm

    # RPC endpoint for live RUNTIME testnet 
    WS_RPC_ENDPOINT="wss://testnet-rpc-3-uk.joystream.org" \
        yarn workspace api-scripts tsnode-strict src/fork-off.ts
}

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
    create_initial_config
    create_chainspec_file
    convert_chainspec
    echo "**** EMPTY CHAINSPEC CREATED SUCCESSFULLY ****"

    # use forkoff to update chainspec with the live state + update runtime code
    fork_off_init

    export JOYSTREAM_NODE_TAG=$RUNTIME_TAG

    # export chain-spec BEFORE starting the node
    export_chainspec_file_to_disk
    
    echo "***** STARTING NODE WITH FORKED STATE *****"
    CONTAINER_ID=$(start_node)

    if ( $POST_MIGRATION_ASYNC_ASSERTIONS ); then
        sleep 120
        # verify assertion using typsecript
        echo "***** POST MIGRATION TYPESCRIPT *****"
        yarn workspace network-tests node-ts-strict src/scenarios/post-migration.ts
    fi
}

# main entrypoint
main || :
cleanup
