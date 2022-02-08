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
    (echo "\n\n## Processor Logs ##" && docker logs joystream_processor_1 --tail 50) || :
    (echo "\n\n## Indexer Logs ##" && docker logs joystream_indexer_1 --tail 50) || :
    (echo "\n\n## Indexer API Gateway Logs ##" && docker logs joystream_hydra-indexer-gateway_1 --tail 50) || :
    (echo "\n\n## Graphql Server Logs ##" && docker logs joystream_graphql-server_1 --tail 50) || :
    docker-compose down -v
}

trap cleanup EXIT

# Clean start
docker-compose down -v

docker-compose -f ../docker-compose.yml up -d joystream-node
./start.sh

# pass the scenario name without .ts extension
SCENARIO=$1
# fallback if scenario if not specified
SCENARIO=${SCENARIO:=full}

#time yarn workspace integration-tests run-test-scenario ${SCENARIO}
time yarn workspace network-tests run-test-scenario ${SCENARIO}
