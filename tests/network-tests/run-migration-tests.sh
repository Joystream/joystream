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

# The latest docker image tag to use for joystream/node (testing profile)
RUNTIME=${RUNTIME:=mainnetDev}
TARGET_RUNTIME=${TARGET_RUNTIME:=ephesus}

# Initial account balance for sudo account
SUDO_INITIAL_BALANCE=${SUDO_INITIAL_BALANCE:="100000000"}
SUDO_ACCOUNT_URI=${SUDO_ACCOUNT_URI:="//Alice"}
SUDO_ACCOUNT=$(docker run --rm joystream/node:${RUNTIME} key inspect ${SUDO_ACCOUNT_URI} --output-type json | jq .ss58Address -r)

# Source of funds for all new accounts that are created in the tests.
TREASURY_INITIAL_BALANCE=${TREASURY_INITIAL_BALANCE:="100000000"}
TREASURY_ACCOUNT_URI=${TREASURY_ACCOUNT_URI:="//Bob"}
TREASURY_ACCOUNT=$(docker run --rm joystream/node:${RUNTIME} key inspect ${TREASURY_ACCOUNT_URI} --output-type json | jq .ss58Address -r)

echo >&2 "sudo account from suri: ${SUDO_ACCOUNT}"
echo >&2 "treasury account from suri: ${TREASURY_ACCOUNT}"

# Default initial balances
function generate_config_files() {
    echo "{
  \"balances\":[
    [\"$SUDO_ACCOUNT\", $SUDO_INITIAL_BALANCE],
    [\"$TREASURY_ACCOUNT\", $TREASURY_INITIAL_BALANCE]
  ],
  \"vesting\":[]
}" >${DATA_PATH}/initial-balances.json

    # Override initial balances from external source
    if [[ $INITIAL_BALANCES == http* ]]; then
        echo >&2 "fetching ${INITIAL_BALANCES}"
        wget -O ${DATA_PATH}/initial-balances.json ${INITIAL_BALANCES}
    else
        if [ ! -z "$INITIAL_BALANCES" ]; then
            if jq -e . >/dev/null 2>&1 <<<"$INITIAL_BALANCES"; then
                echo >&2 "Detected some valid JSON in INITIAL_BALANCES"
                echo $INITIAL_BALANCES >${DATA_PATH}/initial-balances.json
            else
                echo >&2 "Failed to parse INITIAL_BALANCES as JSON, or got false/null"
            fi
        fi
    fi
}

# Create a chain spec file
function create_hex_chain_spec() {
    docker run --rm -v ${DATA_PATH}:/spec --entrypoint ./chain-spec-builder joystream/node:${RUNTIME} \
        new \
        --fund-accounts \
        --authorities //Alice \
        --sudo-account ${SUDO_ACCOUNT} \
        --deployment dev \
        --chain-spec-path /spec/chain-spec.json \
        --initial-balances-path /spec/initial-balances.json

    # Convert the chain spec file to a raw chainspec file
    docker run --rm -v ${DATA_PATH}:/spec joystream/node:${RUNTIME} build-spec \
        --raw --disable-default-bootnode \
        --chain /spec/chain-spec.json >${DATA_PATH}/chain-spec-raw.json
}

# Start a chain with generated chain spec
function start_old_joystream_node {
    docker-compose -f ../../docker-compose.yml run -d -v ${DATA_PATH}:/spec --name joystream-node \
        -p 9944:9944 -p 9933:9933 joystream-node \
        --alice --validator --unsafe-ws-external --unsafe-rpc-external \
        --rpc-methods Unsafe --rpc-cors=all -l runtime \
        --chain /spec/chain-spec-forked.json --pruning=archive --no-telemetry
}

#######################################
# Copy the new wasm to the data directory
# Globals:
#   TARGET_RUNTIME
#   DATA_PATH
# Arguments:
#   None
#######################################
function set_new_runtime_wasm_path() {
    docker create --name target-node joystream/node:${TARGET_RUNTIME}
    docker cp target-node:/joystream/runtime.compact.compressed.wasm ${DATA_PATH}/new_runtime.wasm
}

#######################################
# use fork-off to generate a chainspec file with the current s
# Globals:
#   DATA_PATH
#   SCRIPT_PATH
# Arguments:
#   None
#######################################
function fork_off_init() {
    # chain-spec-raw already existing

    # http endpoint where to get metadata from mainnet
    if [[ -z $WS_RPC_ENDPOINT ]]; then
        export WS_RPC_ENDPOINT="wss://rpc.joystream.org:9944"
    fi
    # http endpoint where to download storage data
    if [[ -z $HTTP_RPC_ENDPOINT ]]; then
        export HTTP_RPC_ENDPOINT="http://mainnet-rpc-1.joystream.org:9933"
    fi

    # download the raw storage state
    if ! [[ -f ${DATA_PATH}/storage.json ]]; then
        curl $HTTP_RPC_ENDPOINT -H \
            "Content-type: application/json" -d \
            '{"jsonrpc":"2.0","id":1,"method":"state_getPairs","params":["0x"]}' \
            >${DATA_PATH}/storage.json
        echo >&2 "storage trie downloaded at ${DATA_PATH}/storage.json"
    fi

    yarn workspace api-scripts tsnode-strict src/fork-off.ts ${DATA_PATH} ${WS_RPC_ENDPOINT}
}

#######################################
# Write initial genesis state to disk
# Globals:
#   DATA_PATH
# Arguments:
#   None
#######################################
function export_chainspec_file_to_disk() {
    # write the initial genesis state to db, in order to avoid waiting for an arbitrary amount of time
    # exporting should give some essential tasks errors but they are harmless https://github.com/paritytech/substrate/issues/10583
    echo >&2 "exporting state"
    docker-compose -f ../../docker-compose.yml run \
        -v ${DATA_PATH}:/spec joystream-node export-state \
        --chain /spec/chain-spec-raw.json \
        --base-path /data --pruning archive >${DATA_PATH}/exported-state.json
}

# cleanup
function cleanup() {
    docker logs ${CONTAINER_ID} --tail 15
    docker rm --volumes target-node
    docker-compose -f ../../docker-compose.yml down -v
    rm -rf ${DATA_PATH}
}

# entrypoint
function main {
    # Start a query-node
    if [ "${NO_QN}" != true ]; then
        ../../query-node/start.sh
    fi

    CONTAINER_ID=""
    export JOYSTREAM_NODE_TAG=${RUNTIME}
    if [ $TARGET_RUNTIME != $RUNTIME ]; then
        if ! [[ -f ${DATA_PATH}/chain-spec-raw.json ]]; then
            # 0. Generate config files
            generate_config_files
            echo >&2 "config files generated"
            # 1. create empty raw chainspec
            create_hex_chain_spec
            echo >&2 "chainspec generated"
            # 2. clone live chainspec with fork it
            fork_off_init
            echo >&2 "storage downloaded & dumped into the raw chainspec"
            # 3. set path to new runtime.wasm
            set_new_runtime_wasm_path
            echo >&2 "new wasm path set"
            # 4. copy chainspec to disk
            export_chainspec_file_to_disk
            echo >&2 "chainspec exported"
        fi
    fi
    # 5. start node
    CONTAINER_ID=$(start_old_joystream_node)
    echo >&2 "mainnet node starting"

    # wait 1 minute
    sleep 60
    
    trap cleanup EXIT

    ./run-test-scenario.sh runtimeUpgrade
}

# main entrypoint
main
