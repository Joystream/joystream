#!/usr/bin/env bash
set -e

# SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
# cd $SCRIPT_PATH

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
[ ! -d "query-node/generated/" ] && yarn workspace query-node-root build

# Make sure typeorm is available.. it get removed again when yarn is run again
# typeorm commandline is used by db:migrate step below.
ln -s ../../../../../node_modules/typeorm/cli.js query-node/generated/graphql-server/node_modules/.bin/typeorm || :

# clean start
docker-compose down -v

docker-compose up -d joystream-node

# Storage node
DEBUG=joystream:storage-cli:dev yarn storage-cli dev-init
docker-compose up -d colossus

docker-compose up -d db
yarn workspace query-node-root db:migrate
docker-compose up -d graphql-server
# Starting up processor will bring up all services it depends on
docker-compose up -d processor

yarn workspace @joystream/cd-schemas initialize:dev

# Fixes Error: No active storage providers available
sleep 1m 

echo "Creating channel..."
yarn joystream-cli media:createChannel \
  --input ./tests/network-tests/assets/TestChannel.json --confirm

echo "Uploading video..."
yes | yarn joystream-cli media:uploadVideo ./tests/network-tests/assets/joystream.MOV \
  --input ./tests/network-tests/assets/TestVideo.json \
  --confirm 

time DEBUG=* yarn workspace network-tests test-run src/scenarios/storage-node.ts
