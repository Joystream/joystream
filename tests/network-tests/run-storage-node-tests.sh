#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

set -a
. ../../.env
set +a

function cleanup() {
    # Show tail end of logs for the processor and indexer containers to
    # see any possible errors
    (echo "## Processor Logs ##" && docker logs joystream_processor_1 --tail 50) || :
    (echo "## Indexer Logs ##" && docker logs joystream_indexer_1 --tail 50) || :
    docker-compose down -v
}

trap cleanup EXIT

# clean start
docker-compose down -v

docker-compose up -d joystream-node

# Storage node
DEBUG=joystream:storage-cli:dev yarn storage-cli dev-init
docker-compose up -d colossus

# Query node is expected to have been already built
docker-compose up -d db
yarn workspace query-node-root db:migrate
docker-compose up -d graphql-server
# Starting up processor will bring up all services it depends on
docker-compose up -d processor

yarn workspace @joystream/cd-schemas initialize:dev

# Fixes Error: No active storage providers available
echo "Waiting for ipfs name registration"
sleep 120

echo "Creating channel..."
yarn joystream-cli media:createChannel \
  --input ./assets/TestChannel.json --confirm

echo "Uploading video..."
yes | yarn joystream-cli media:uploadVideo ./assets/joystream.MOV \
  --input ./assets/TestVideo.json \
  --confirm 

time DEBUG=* yarn workspace network-tests run-test-scenario storage-node
