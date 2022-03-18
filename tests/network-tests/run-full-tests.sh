#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Clean start
docker-compose -f ../../docker-compose.yml down -v

if [ "${DEV_NODE}" == true ]
then
  docker-compose -f ../../docker-compose.yml up -d joystream-node
  function cleanup() {
      docker logs joystream-node --tail 15
      docker-compose -f ../../docker-compose.yml down -v
  }
  trap cleanup EXIT

else
  CONTAINER_ID=$(./run-test-node-docker.sh)
  function cleanup() {
      docker logs ${CONTAINER_ID} --tail 15
      docker-compose -f ../../docker-compose.yml down -v
  }
  trap cleanup EXIT
fi

# pass the scenario name without .ts extension
SCENARIO=$1
# default to "full" if scenario is not specified
SCENARIO=${SCENARIO:=full}

sleep 3

# Display runtime version
yarn workspace api-scripts tsnode-strict src/status.ts | grep Runtime

# Start a query-node
../../query-node/start.sh

# Start storage and distribution services
REUSE_KEYS=true ./start-storage.sh

# Run full tests reusing the existing keys
REUSE_KEYS=true IGNORE_HIRED_LEADS=true ./run-test-scenario.sh $SCENARIO
