#!/usr/bin/env bash

# style reference https://google.github.io/styleguide/shellguide.html

set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Log only to stderr
# Only output from this script should be the container id of the node at the very end

# Location that will be mounted as the /data volume in containers
# This is where the initial balances files and generated chainspec files will be located.
export DATA_PATH=${DATA_PATH:=$(pwd)/data}
mkdir -p ${DATA_PATH}

# Source of funds for all new accounts that are created in the tests.
TREASURY_INITIAL_BALANCE=${TREASURY_INITIAL_BALANCE:=100000000}
TREASURY_ACCOUNT_URI=${TREASURY_ACCOUNT_URI:="//Alice"}
TREASURY_ACCOUNT=$(docker run --rm joystream/node:${RUNTIME_TAG} key inspect ${TREASURY_ACCOUNT_URI} --output-type json | jq .ss58Address -r)

>&2 echo "treasury account from suri: ${TREASURY_ACCOUNT}"

# Prevent joystream cli from prompting
export AUTO_CONFIRM=true

export JOYSTREAM_NODE_TAG=${RUNTIME_TAG}

#######################################
# create initial-balances.json files
# Globals:
#   TREASURY_ACCOUNT
#   TREASURY_INITIAL_BALANCE
#   DATA_PATH
# Arguments:
#   None
#######################################
function create_initial_config {
  echo "{
    \"balances\":[
      [\"$TREASURY_ACCOUNT\", $TREASURY_INITIAL_BALANCE]
    ],
    \"vesting\": []
  }" > ${DATA_PATH}/initial-balances.json

}

#######################################
# create human-readable chainspec file
# Globals:
#   DATA_PATH
# Arguments:
#   None
#######################################
function create_chainspec_file {
    # Create a chain spec file
    docker run --rm -v ${DATA_PATH}:/data --entrypoint ./chain-spec-builder \
	   joystream/node:${RUNTIME_TAG} \
	   new \
	   --authorities //Alice \
	   --deployment dev \
	   --chain-spec-path /data/chain-spec.json \
	   # --initial-balances-path /data/initial-balances.json # no balances
} 

#######################################
# convert human-readable chainspec into
# raw chainspec
# Globals:
#   DATA_PATH
# Arguments:
#   None
#######################################
function convert_chainspec {
    docker run --rm -v ${DATA_PATH}:/data joystream/node:${RUNTIME_TAG} build-spec \
	   --raw --disable-default-bootnode \
	   --chain /data/chain-spec.json > ${DATA_PATH}/chain-spec-raw.json
}

#######################################
# cleanup docker logs and shuts down container
# Globals:
#   CONTAINER_ID
# Arguments:
#   None
#######################################
function cleanup() {
    # if [[ -z $CONTAINER_ID ]]; then
    # 	docker logs ${CONTAINER_ID} --tail 15
    # fi
    docker-compose -f ../../docker-compose.yml down -v
    rm -rf $DATA_PATH
}

##############################################################################
# Start a chain with generated chain spec
# Globals:
#   DATA_PATH: directory where to find the chainspec at root /spec
#   JOYSTREAM_NODE_TAG: tag for the joystream/node docker image to be used
# Arguments:
#   None
##############################################################################
function start_node {
    docker-compose -f ../../docker-compose.yml run \
		   -d -v ${DATA_PATH}:/spec --name "${JOYSTREAM_NODE_TAG}" \
		   -p 9944:9944 -p 9933:9933 joystream-node \
		   --alice --validator --unsafe-ws-external --unsafe-rpc-external \
		   --rpc-methods Unsafe --rpc-cors=all -l runtime \
		   --chain /spec/chain-spec-raw.json \
		   --base-path /data
}
