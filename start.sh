#!/usr/bin/env bash
set -e

# Run a complete joystream development network on your machine using docker.
# Make sure to run build-docker-images.sh prior to running this script to use
# the local build.

set -a
. .env
set +a

# Clean start!
docker-compose down -v

function down()
{
    # Stop containers and clear volumes
    docker-compose down -v
}

trap down EXIT

# Run a local development chain
docker-compose up -d joystream-node

## Storage Infrastructure
# Configure a dev storage node and start storage node
yarn workspace api-scripts storage-dev-init
docker-compose up -d colossus
# Create a new content directory lead
GROUP=contentDirectoryWorkingGroup yarn workspace api-scripts initialize-lead

## Query Node Infrastructure
# Initialize a new database for the query node infrastructure
docker-compose up -d db
yarn workspace query-node-root db:prepare
yarn workspace query-node-root db:migrate

# Startup all query-node infrastructure services
export WS_PROVIDER_ENDPOINT_URI=ws://joystream-node:9944
docker-compose up -d graphql-server
docker-compose up -d processor

echo "use Ctrl+C to shutdown the development network."

while true; do
  read
done
