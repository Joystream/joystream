#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

CONTAINER_ID=`./run-test-node-docker.sh`

function cleanup() {
    docker logs ${CONTAINER_ID} --tail 15
    docker-compose -f ../../docker-compose.yml down -v
}

trap cleanup EXIT

sleep 3

# Display runtime version
yarn workspace api-scripts tsnode-strict src/status.ts | grep Runtime

# Init chain state
./run-test-scenario.sh setup-new-chain
