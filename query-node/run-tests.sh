#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

function cleanup() {
    # Show tail end of logs for the processor and indexer containers to
    # see any possible errors
    echo "## Processor Logs ##"
    docker logs query-node_processor_1 --tail 50
    echo "## Indexer Logs ##"
    docker logs query-node_indexer_1 --tail 50
    docker-compose down -v
}

trap cleanup EXIT

yarn build
yarn db:up
yarn db:migrate
WS_PROVIDER_ENDPOINT_URI=ws://joystream-node:9944/ yarn docker:up

# Run tests
ATTACH_TO_NETWORK=query-node_default ../tests/network-tests/run-tests.sh content-directory


