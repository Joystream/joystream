#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Only run codegen if no generated files found
[ ! -d "generated/" ] && yarn build

# Make sure typeorm is available.. it get removed when yarn is run again
# typeorm commandline is used by db:migrate step below.
ln -s ../../../../../node_modules/typeorm/cli.js generated/graphql-server/node_modules/.bin/typeorm || :

set -a
. ../.env
set +a

# Clean start
docker-compose down -v

function cleanup() {
    # Show tail end of logs for the processor and indexer containers to
    # see any possible errors
    (echo "## Processor Logs ##" && docker logs joystream_processor_1 --tail 50) || :
    (echo "## Indexer Logs ##" && docker logs joystream_indexer_1 --tail 50) || :
    (echo "## Indexer API Gateway Logs ##" && docker logs joystream_indexer-api-gateway_1 --tail 50) || :
    docker-compose down -v
}

trap cleanup EXIT

# Bring up db
docker-compose up -d db

# Migrate the databases
yarn workspace query-node-root db:migrate

docker-compose up -d graphql-server

# Start the joystream-node before the indexer
docker-compose up -d joystream-node

# Starting up processor will bring up all services it depends on
docker-compose up -d processor

time yarn workspace network-tests run-test-scenario content-directory
