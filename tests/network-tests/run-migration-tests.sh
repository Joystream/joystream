#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# The joystream/node docker image tag which contains WASM runtime to upgrade chain with
TARGET_RUNTIME_TAG=${TARGET_RUNTIME_TAG:=latest}
# The joystream/node docker image tag to start the chain with
RUNTIME_TAG=${RUNTIME_TAG:=sumer}
# Post migration assertions by means of typescript scenarios required
POST_MIGRATION_ASYNC_ASSERTIONS=${POST_MIGRATION_ASYNC_ASSERTIONS=$true}
# The joystream/node docker image tag to start the chain with
RUNTIME_TAG=${RUNTIME_TAG:=sumer}
# RPC endpoint for live RUNTIME testnet 
export WS_RPC_ENDPOINT="wss://testnet-rpc-3-uk.joystream.org"

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

    if ! [[ -f $(pwd)/storage.json ]]; then
	curl http://testnet-rpc-3-uk.joystream.org:9933 -H \
	     "Content-type: application/json" -d \
	     '{"jsonrpc":"2.0","id":1,"method":"state_getPairs","params":["0x"]}' \
	     > storage.json	
    fi
	cp $(pwd)/storage.json ${DATA_PATH}/storage.json    

    if ! [[ -f ${DATA_PATH}/schema.json ]]; then
	cp $(pwd)/../../types/augment/all/defs.json ${DATA_PATH}/schema.json
    fi

    id=$(docker create joystream/node:${TARGET_RUNTIME_TAG})
    docker cp $id:/joystream/runtime.compact.wasm ${DATA_PATH}/runtime.wasm
#    cat ${DATA_PATH}/runtime.wasm | hexdump -ve '/1 "%02x"\' > ${DATA_PATH}/runtime.hex
    
    yarn workspace api-scripts tsnode-strict src/fork-off.ts
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

    echo "***** STARTING NODE WITH FORKED STATE *****"
    export JOYSTREAM_NODE_TAG=$RUNTIME_TAG
    CONTAINER_ID=$(start_node)

    # 120 sec needed to load the chainspec + 480 sec in order to perform migration, given that
    # a new block is produced every 6 sec
    sleep 600
    
    if ( $POST_MIGRATION_ASYNC_ASSERTIONS ); then
	# verify assertion using typsecript
	echo "***** POST MIGRATION TYPESCRIPT *****"	
	yarn workspace network-tests node-ts-strict src/scenarios/post-migration.ts
    fi
}

# main entrypoint
main
cleanup
