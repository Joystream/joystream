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
RUNTIME_TAG=${RUNTIME_TAG:=mainnetDev}
TARGET_RUNTIME_TAG=${TARGET_RUNTIME_TAG:=ephesus}

# Initial account balance for sudo account
SUDO_INITIAL_BALANCE=${SUDO_INITIAL_BALANCE:="100000000"}
SUDO_ACCOUNT_URI=${SUDO_ACCOUNT_URI:="//Alice"}
SUDO_ACCOUNT=$(docker run --rm joystream/node:${RUNTIME_TAG} key inspect ${SUDO_ACCOUNT_URI} --output-type json | jq .ss58Address -r)

# Source of funds for all new accounts that are created in the tests.
TREASURY_INITIAL_BALANCE=${TREASURY_INITIAL_BALANCE:="100000000"}
TREASURY_ACCOUNT_URI=${TREASURY_ACCOUNT_URI:="//Bob"}
TREASURY_ACCOUNT=$(docker run --rm joystream/node:${RUNTIME_TAG} key inspect ${TREASURY_ACCOUNT_URI} --output-type json | jq .ss58Address -r)

# >&2 echo "sudo account from suri: ${SUDO_ACCOUNT}"
# >&2 echo "treasury account from suri: ${TREASURY_ACCOUNT}"
>&2 echo "current runtime ${RUNTIME_TAG}"
>&2 echo "target runtime ${TARGET_RUNTIME_TAG}"

# Default initial balances
function generate_config_files {
  echo "{
    \"balances\":[
      [\"$SUDO_ACCOUNT\", $SUDO_INITIAL_BALANCE],
      [\"$TREASURY_ACCOUNT\", $TREASURY_INITIAL_BALANCE]
    ],
    \"vesting\":[]
  }" > ${DATA_PATH}/initial-balances.json

  # Override initial balances from external source
  if [[ $INITIAL_BALANCES == http* ]];
  then
    >&2 echo "fetching ${INITIAL_BALANCES}"
    wget -O ${DATA_PATH}/initial-balances.json ${INITIAL_BALANCES}
  else
    if [ ! -z "$INITIAL_BALANCES" ]; then
      if jq -e . >/dev/null 2>&1 <<<"$INITIAL_BALANCES"; then
        >&2 echo "Detected some valid JSON in INITIAL_BALANCES"
        echo $INITIAL_BALANCES > ${DATA_PATH}/initial-balances.json
      else
        >&2 echo "Failed to parse INITIAL_BALANCES as JSON, or got false/null"
      fi
    fi
  fi
}

# Create a chain spec file
function create_hex_chain_spec {
  docker run --rm -v ${DATA_PATH}:/spec --entrypoint ./chain-spec-builder joystream/node:${RUNTIME_TAG} \
    new \
    --fund-accounts \
    --authorities //Alice \
    --sudo-account ${SUDO_ACCOUNT} \
    --deployment dev \
    --chain-spec-path /spec/chain-spec.json \
    --initial-balances-path /spec/initial-balances.json

  # Convert the chain spec file to a raw chainspec file
  docker run --rm -v ${DATA_PATH}:/spec joystream/node:${RUNTIME_TAG} build-spec \
    --raw --disable-default-bootnode \
    --chain /spec/chain-spec.json > ${DATA_PATH}/chain-spec-raw.json
}

# Start a chain with generated chain spec
function start_joystream_node {
  docker-compose -f ../../docker-compose.yml run -d -v ${DATA_PATH}:/spec --name joystream-node \
    -p 9944:9944 -p 9933:9933 joystream-node \
    --alice --validator --unsafe-ws-external --unsafe-rpc-external \
    --rpc-methods Unsafe --rpc-cors=all -l runtime \
    --chain /spec/chain-spec-forked.json --pruning=archive --no-telemetry
}

#######################################
# Perform substrate forkless upgrade by replacing the runtime.wasm
# Globals:
#   TARGET_RUNTIME_TAG
#   DATA_PATH
# Arguments:
#   None
#######################################
function set_new_runtime_wasm_path() {
  id=$(docker create joystream/node:${TARGET_RUNTIME_TAG})
  # needed for runtimeUpgrade integration test scenario
  export RUNTIME_UPGRADE_TARGET_WASM_PATH=$id:/joystream/runtime.compact.was 
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

    # RPC endpoint for live RUNTIME testnet
    if [[ -z $WS_RPC_ENDPOINT ]]; then
      export WS_RPC_ENDPOINT="wss://rpc.joystream.org:9944" 
    fi

    if [[ -z $HTTP_RPC_ENDPOINT ]]; then
      export HTTP_RPC_ENDPOINT="http://mainnet-rpc-1.joystream.org:9933" 
    fi

    # download the raw storage state 
    if ! [[ -f ${DATA_PATH}/storage.json ]]; then
      curl $HTTP_RPC_ENDPOINT -H \
          "Content-type: application/json" -d \
          '{"jsonrpc":"2.0","id":1,"method":"state_getPairs","params":["0x"]}' \
          > ${DATA_PATH}/storage.json
      >&2 echo "storage trie downloaded at ${DATA_PATH}/storage.json"
    fi

    yarn workspace api-scripts tsnode-strict src/fork-off.ts
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
		   --base-path /data --pruning archive > ${DATA_PATH}/exported-state.json
}

# entrypoint
function main {
  if [ $TARGET_RUNTIME_TAG != $RUNTIME_TAG ]; then 
    if ! [[ -f ${DATA_PATH}/chain-spec-raw.json ]]; then
      # 0. Generate config files
      generate_config_files
      >&2 echo "config files generated"
      # 1. create empty raw chainspec
      create_hex_chain_spec
      >&2 echo "chainspec generated"
      # 2. clone live chainspec with fork it
      fork_off_init
      >&2 echo "storage downloaded & dumped into the raw chainspec"
      # 3. set path to new runtime.wasm
      set_new_runtime_wasm_path
    fi
    export JOYSTREAM_NODE_TAG=${RUNTIME_TAG}
    # 3. copy chainspec to disk
    # export_chainspec_file_to_disk
    # >&2 echo "chainspec exported"
  fi
  # 5. start node
  start_joystream_node
}

main