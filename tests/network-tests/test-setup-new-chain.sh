#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Custom sudo and treasury accounts - export them before start new chain
# will be used to configre chainspec and override test framework defaults.
export TREASURY_ACCOUNT_URI=//Bob
export TREASURY_INITIAL_BALANCE=1000000

CONTAINER_ID=$(./run-test-node-docker.sh)

function cleanup() {
    docker logs ${CONTAINER_ID} --tail 15
    docker-compose -f ../../docker-compose.yml down -v
}

trap cleanup EXIT

sleep 3

# Start the query node
../../query-node/start.sh

# Display runtime version
yarn workspace api-scripts tsnode-strict src/status.ts | grep Runtime

# Init chain state
./run-test-scenario.sh setupNewChain
