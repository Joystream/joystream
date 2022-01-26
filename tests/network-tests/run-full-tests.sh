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

# Start any other services we want
# docker-compose -f ../../docker-compose.yml up -d colossus-1

# Start a query-node
../../query-node/start.sh

# Run proposals tests first, since they require no leads hired
./run-test-scenario.sh proposals

# Setup storage & distribution
HOST_IP=$(./get-host-ip.sh)
# Because proposals tests hire and then fire each lead,
# we need to override COLOSSUS_1_WORKER_ID (0 => 1) and DISTRIBUTOR_1_WORKER_ID (0 => 1)
export COLOSSUS_1_URL="http://${HOST_IP}:3333"
export COLOSSUS_1_WORKER_ID=1
export COLOSSUS_1_WORKER_URI=//testing//worker//Storage//${COLOSSUS_1_WORKER_ID}
export COLOSSUS_1_TRANSACTOR_KEY=$(docker run --rm --pull=always docker.io/parity/subkey:2.0.1 inspect ${COLOSSUS_1_TRANSACTOR_URI} --output-type json | jq .ss58Address -r)
export DISTRIBUTOR_1_URL="http://${HOST_IP}:3334"
export DISTRIBUTOR_1_WORKER_ID=1
export DISTRIBUTOR_1_ACCOUNT_URI=//testing//worker//Distribution//${DISTRIBUTOR_1_WORKER_ID}
REUSE_KEYS=true ./run-test-scenario.sh init-storage-and-distribution

# Start colossus & argus
docker-compose -f ../../docker-compose.yml up -d colossus-1
docker-compose -f ../../docker-compose.yml up -d distributor-1

# Run combined tests reusing the existing keys
REUSE_KEYS=true ./run-test-scenario.sh combined
