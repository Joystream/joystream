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

#trap cleanup EXIT

# Bring up db
docker-compose up -d db

# Migrate the databases
yarn workspace query-node-root db:prepare
yarn workspace query-node-root db:migrate

docker-compose up -d graphql-server

# Starting up processor will bring up all services it depends on
docker-compose up -d processor

time yarn workspace network-tests run-test-scenario content-directory
