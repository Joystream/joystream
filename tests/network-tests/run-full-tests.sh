#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

CONTAINER_ID=$(./run-test-node-docker.sh)

function cleanup() {
    docker logs ${CONTAINER_ID} --tail 15
    docker-compose -f ../../docker-compose.yml down -v
}

trap cleanup EXIT

sleep 3

# Display runtime version
yarn workspace api-scripts tsnode-strict src/status.ts | grep Runtime

# Start a query-node
../../query-node/start.sh

./run-test-scenario.sh proposals

# set worker ids (needed after proposals scenario affects hired leads)
export COLOSSUS_1_WORKER_ID=1
export COLOSSUS_1_WORKER_URI=//testing//worker//Storage//${COLOSSUS_1_WORKER_ID}
export DISTRIBUTOR_1_WORKER_ID=1
export DISTRIBUTOR_1_ACCOUNT_URI=//testing//worker//Distribution//${DISTRIBUTOR_1_WORKER_ID}

# Start storage and distribution services
REUSE_KEYS=true ./start-storage.sh

# Run combined tests reusing the existing keys
REUSE_KEYS=true ./run-test-scenario.sh combined
