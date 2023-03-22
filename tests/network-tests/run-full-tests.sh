#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Clean start
docker-compose -f ../../docker-compose.yml down -v

if [ "${DEV_NODE}" == true ]
then
  docker-compose -f ../../docker-compose.yml up -d joystream-node
  NODE_CONTAINER_ID="joystream-node"

else
  NODE_CONTAINER_ID=$(./run-test-node-docker.sh)
fi

if [ "${PERSIST}" != true ]
then
  function cleanup() {
      printf "**************************************************************************\n"
      printf "***************************JOSYTREAM NODE LOGS****************************\n"
      printf "**************************************************************************\n\n"
      docker logs ${NODE_CONTAINER_ID} --tail 50
      docker stop ${NODE_CONTAINER_ID}
      docker rm ${NODE_CONTAINER_ID}

      printf "\n\n\n"
      printf "**************************************************************************\n"
      printf "****************************HYDRA INDEXER LOGS****************************\n"
      printf "**************************************************************************\n\n"
      docker logs indexer --tail 50

      printf "\n\n\n"
      printf "**************************************************************************\n"
      printf "*************************QUERY NODE PROCESSOR LOGS************************\n"
      printf "**************************************************************************\n\n"
      docker logs processor --tail 50

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
./start-storage.sh

# Run full tests reusing the existing keys
REUSE_KEYS=true IGNORE_HIRED_LEADS=true SKIP_STORAGE_AND_DISTRIBUTION=true ./run-test-scenario.sh $SCENARIO
