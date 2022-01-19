#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

set -a
. ../.env
set +a

function cleanup() {
    # Show tail end of logs for the processor and indexer containers to
    # see any possible errors
    (echo "## Processor Logs ##" && docker logs joystream_processor_1 --tail 50) || :
    (echo "## Indexer Logs ##" && docker logs joystream_indexer_1 --tail 50) || :
    (echo "## Indexer API Gateway Logs ##" && docker logs joystream_hydra-indexer-gateway_1 --tail 50) || :
    (echo "## Graphql Server Logs ##" && docker logs joystream_graphql-server_1 --tail 50) || :
    docker-compose down -v
}

trap cleanup EXIT

# start node
docker-compose up -d joystream-node

./start.sh

# run content directory tests
yarn workspace network-tests run-test-scenario content-directory
