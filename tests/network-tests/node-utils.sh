#!/usr/bin/env bash

# style reference https://google.github.io/styleguide/shellguide.html

set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Log only to stderr
# Only output from this script should be the container id of the node at the very end

# Location that will be mounted as the /data volume in containers
# This is where the initial members and balances files and generated chainspec files will be located.
export DATA_PATH=${DATA_PATH:=$(pwd)/data}
mkdir -p ${DATA_PATH}

# Initial account balance for sudo account
SUDO_INITIAL_BALANCE=${SUDO_INITIAL_BALANCE:=100000000}
SUDO_ACCOUNT_URI=${SUDO_ACCOUNT_URI:="//Alice"}
SUDO_ACCOUNT=$(docker run --rm --pull=always docker.io/parity/subkey:2.0.1 inspect ${SUDO_ACCOUNT_URI} --output-type json | jq .ss58Address -r)

# Source of funds for all new accounts that are created in the tests.
TREASURY_INITIAL_BALANCE=${TREASURY_INITIAL_BALANCE:=100000000}
TREASURY_ACCOUNT_URI=${TREASURY_ACCOUNT_URI:=$SUDO_ACCOUNT_URI}
TREASURY_ACCOUNT=$(docker run --rm --pull=always docker.io/parity/subkey:2.0.1 inspect ${TREASURY_ACCOUNT_URI} --output-type json | jq .ss58Address -r)

>&2 echo "sudo account from suri: ${SUDO_ACCOUNT}"
>&2 echo "treasury account from suri: ${TREASURY_ACCOUNT}"

# Prevent joystream cli from prompting
export AUTO_CONFIRM=true

export JOYSTREAM_NODE_TAG=${RUNTIME_TAG}

#######################################
# create initial-balances.json & initial-members.json files
# Globals:
#   SUDO_INITIAL_BALANCES
#   SUDO_ACCOUNT
#   TREASURY_ACCOUNT
#   TREASURY_INITIAL_BALANCE
#   DATA_PATH
# Arguments:
#   None
#######################################
function create_initial_config {
    echo "{
  \"balances\":[
    [\"$SUDO_ACCOUNT\", $SUDO_INITIAL_BALANCE],
    [\"$TREASURY_ACCOUNT\", $TREASURY_INITIAL_BALANCE]
  ]
}" > ${DATA_PATH}/initial-balances.json

    # Remember if there are initial members at genesis query-node needs to be bootstrapped
    # or any events processed for this member will cause processor to fail.
    if [ "${MAKE_SUDO_MEMBER}" == true ]
    then
	echo "
    [{
      \"member_id\":0,
      \"root_account\":\"$SUDO_ACCOUNT\",
      \"controller_account\":\"$SUDO_ACCOUNT\",
      \"handle\":\"sudosudo\",
      \"avatar_uri\":\"https://sudo.com/avatar.png\",
      \"about\":\"Sudo\",
      \"registered_at_time\":0
    }]
  " > ${DATA_PATH}/initial-members.json
    else
	echo "[]" > ${DATA_PATH}/initial-members.json
    fi
}

#######################################
# create human-readable chainspec file
# Globals:
#   SUDO_ACCOUNT
#   DATA_PATH
# Arguments:
#   None
#######################################
function create_chainspec_file {
    # Create a chain spec file
    docker run --rm -v ${DATA_PATH}:/data --entrypoint ./chain-spec-builder \
	   joystream/node:${RUNTIME_TAG} \
	   new \
	   --authority-seeds Alice \
	   --sudo-account ${SUDO_ACCOUNT} \
	   --deployment dev \
	   --chain-spec-path /data/chain-spec.json \
	   --initial-balances-path /data/initial-balances.json \
	   --initial-members-path /data/initial-members.json
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
    find ./assets/ -name '[A-Z0-9]*__rejectedContent.json' -delete
    rm -rf $DATA_PATH
}

#######################################
# Start a chain with generated chain spec
# Globals:
#   DATA_PATH
# Arguments:
#   None
#######################################
function start_node {
    docker-compose -f ../../docker-compose.yml run \
		   -d -v ${DATA_PATH}:/spec --name "${JOYSTREAM_NODE_TAG}" \
		   -p 9944:9944 -p 9933:9933 joystream-node \
		   --alice --validator --unsafe-ws-external --unsafe-rpc-external \
		   --rpc-methods Unsafe --rpc-cors=all -l runtime \
		   --chain /spec/chain-spec-raw.json \
		   --base-path /data
}
