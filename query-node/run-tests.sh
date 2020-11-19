#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

function cleanup() {
    # Show tail end of logs for the processor and indexer containers to
    # see any possible errors
    (echo "## Processor Logs ##" && docker logs joystream_processor_1 --tail 50) || :
    (echo "## Indexer Logs ##" && docker logs joystream_indexer_1 --tail 50) || :
    docker-compose down -v
}

trap cleanup EXIT

export WS_PROVIDER_ENDPOINT_URI=ws://joystream-node:9944/

# Only run codegen if no generated files found
[ ! -d "generated/" ] && yarn build

# Make sure typeorm is available.. it get removed again when yarn is run again
# typeorm commandline is used by db:migrate step below.
ln -s ../../../../../node_modules/typeorm/cli.js generated/graphql-server/node_modules/.bin/typeorm || :

# clean start
docker-compose down -v

docker-compose up -d db
yarn db:migrate
docker-compose up -d graphql-server
# Starting up processor will bring up all services it depends on
docker-compose up -d processor

# Run tests
ATTACH_TO_NETWORK=joystream_default ../tests/network-tests/run-tests.sh content-directory
