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

# Execute tests

# We can load env config used to start docker services and pass them on to the
# tests. This could be useful to capture keys used or URLs.
# We just have to watchout for clashing env var names.
#set -a
#. ../../.env
#set +a

# First scenario..
./run-test-scenario.sh $1

# In between pickup generated keys from first scenario or bootstrap scene with all well known
# keys for workers and members..

# Second scenario..
# ./run-test-scenario.sh $2