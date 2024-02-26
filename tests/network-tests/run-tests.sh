#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

rm ./output.json || :

export RUNTIME_PROFILE=TESTING
CONTAINER_ID=$(./run-node-docker.sh)

if [ "${PERSIST}" == true ]; then
  echo "Starting services"
else
  function cleanup() {
    echo "# Colossus-1 Logs"
    docker logs colossus-1 --tail 100 || :
    echo "# Colossus-2 Logs"
    docker logs colossus-2 --tail 100 || :
    docker logs ${CONTAINER_ID} --tail 15
    docker stop ${CONTAINER_ID}
    docker rm ${CONTAINER_ID}

    if [ "${NO_STORAGE}" != true ]; then
      docker-compose -f ../../docker-compose.storage-squid.yml down -v
    fi

    docker-compose -f ../../docker-compose.yml down -v
  }

  trap cleanup EXIT
fi

sleep 3

# Display runtime version
yarn workspace api-scripts tsnode-strict src/status.ts | grep Runtime

# Start a query-node
if [ "${NO_QN}" != true ]; then
  ../../query-node/start.sh
fi

if [ "${NO_STORAGE}" != true ]; then
  ./start-storage.sh
fi

# Execute tests
./run-test-scenario.sh $*
