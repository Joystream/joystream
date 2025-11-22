#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

rm ./output.json || :

function cleanup() {
    docker logs joystream-node --tail 15 || :
    docker stop joystream-node || :
    docker rm joystream-node || :
    echo "# Colossus-1 Logs"
    docker logs colossus-1 --tail 100 || :
    echo "# Colossus-2 Logs"
    docker logs colossus-2 --tail 100 || :

    if [ "${NO_STORAGE}" != true ]; then
      docker compose -f ../../docker-compose.storage-squid.yml down -v
    fi

    docker compose -f ../../docker-compose.yml down -v
  }

trap cleanup EXIT ERR SIGINT SIGTERM

export JOYSTREAM_NODE_TAG=`RUNTIME_PROFILE=TESTING ../../scripts/runtime-code-shasum.sh`
CHAIN=dev docker compose -f ../../docker-compose.yml up -d joystream-node

sleep 30

# Display runtime version
yarn workspace api-scripts tsnode-strict src/status.ts | grep Runtime

# Start a query-node
if [ "${NO_QN}" != true ]; then
  ../../query-node/start.sh
fi

if [ "${NO_STORAGE}" != true ]; then
  export CLEANUP_INTERVAL
  ./start-storage.sh
fi

# Execute tests
./run-test-scenario.sh $*
