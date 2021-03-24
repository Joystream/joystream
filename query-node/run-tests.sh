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
    (echo "\n\n## Processor Logs ##" && docker logs joystream_processor-mnt_1 --tail 50) || :
    (echo "\n\n## Indexer Logs ##" && docker logs joystream_indexer_1 --tail 50) || :
    (echo "\n\n## Indexer API Gateway Logs ##" && docker logs joystream_hydra-indexer-gateway_1 --tail 50) || :
    (echo "\n\n## Graphql Server Logs ##" && docker logs joystream_graphql-server-mnt_1 --tail 50) || :
    docker-compose down -v
}

trap cleanup EXIT

# Clean start
docker-compose down -v

# Start the joystream-node first to allow fetching Olympia metadata during build (typegen)
docker-compose up -d joystream-node

# Only run codegen if no generated files found
[ ! -d "generated/" ] && yarn build

# Bring up db
docker-compose up -d db

# Make sure we use dev config for db migrations (prevents "Cannot create database..." and some other errors)
yarn workspace query-node config:dev

# Migrate the databases
yarn workspace query-node-root db:prepare
yarn workspace query-node-root db:migrate

# Initialize databse (ie. membership module configuration)
yarn workspace query-node-root db:init

docker-compose up -d graphql-server-mnt

# Starting up processor will bring up all services it depends on
docker-compose up -d processor-mnt

time yarn workspace integration-tests run-test-scenario olympia
