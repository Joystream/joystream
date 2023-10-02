#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

rm ./keys.json || :

CONTAINER_ID=$(./run-test-node-docker.sh)

if [ "${PERSIST}" == true ]
then
  echo "Starting services"
else
  function cleanup() {
    docker logs ${CONTAINER_ID} --tail 15
    docker stop ${CONTAINER_ID}
    docker rm ${CONTAINER_ID}
    docker-compose -f ../../docker-compose.yml down -v
  }

  trap cleanup EXIT
fi

sleep 3

# Display runtime version
yarn workspace api-scripts tsnode-strict src/status.ts | grep Runtime

# Start a query-node
if [ "${NO_QN}" != true ]
then
  ../../query-node/start.sh
fi

if [ "${NO_STORAGE}" != true ]
then
  ./start-storage.sh
fi

# Execute tests
./run-test-scenario.sh $1 $2
