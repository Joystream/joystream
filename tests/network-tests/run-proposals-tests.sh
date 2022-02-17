#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

set -a
. ../../.env
set +a

export JOYSTREAM_NODE_TAG=${JOYSTREAM_NODE_TAG:=$(TEST_NODE=true ../../scripts/runtime-code-shasum.sh)}

# Fresh start
docker-compose -f ../../docker-compose.yml down -v

if [ "${CHAINSPEC_NODE}" == true ]
then
  ./run-test-node-docker.sh
else
  docker-compose up -d joystream-node
fi

function cleanup() {
    docker-compose -f ../../docker-compose.yml logs --tail 200 joystream-node
    docker-compose -f ../../docker-compose.yml down -v
}
trap cleanup EXIT

sleep 3

# Start a query-node
../../query-node/start.sh

# Run full tests reusing the existing keys
./run-test-scenario.sh proposals
