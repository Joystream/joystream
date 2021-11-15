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

WS_PROVIDER_ENDPOINT_URI=ws://localhost:9944 SKIP_MOCK_CONTENT=true \
  ./tests/network-tests/run-test-scenario.sh setup-new-chain

# Set sudo as the membership screening authority
yarn workspace api-scripts set-sudo-as-screening-auth

## Query Node Infrastructure

# Initialize a new database for the query node infrastructure
docker-compose up -d db

# Override DB_HOST for db setup
# Make sure we use dev config for db migrations (prevents "Cannot create database..." and some other errors)
export DB_HOST=localhost
yarn workspace query-node config:dev
# Migrate the databases
yarn workspace query-node-root db:prepare
yarn workspace query-node-root db:migrate
# Set DB_HOST back to docker-service one
export DB_HOST=db

# Start processor and graphql server
docker-compose up -d processor
docker-compose up -d graphql-server

## Storage Infrastructure
docker-compose run -d --name colossus-1 --entrypoint sh colossus-1 -c "\
  yarn storage-node server --queryNodeHost ${GRAPHQL_SERVER_HOST}:${GRAPHQL_SERVER_PORT} \
  --port ${COLOSSUS_CONTAINER_PORT} \
  --uploads /data --worker 0 \
  --accountUri=//testing//worker//Storage//0 \
  --apiUrl ${WS_PROVIDER_ENDPOINT_URI} \
  --sync --syncInterval=1 \
  --elasticSearchHost=${ELASTIC_SEARCH_HOST}"

docker-compose up -d distributor-1

docker-compose up -d pioneer

echo "use Ctrl+C to shutdown the development network."

while true; do 
  read
done
