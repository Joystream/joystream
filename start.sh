#!/usr/bin/env bash
set -e

# Run a complete joystream development network on your machine using docker.
# Make sure to run build-docker-images.sh prior to running this script to use
# the local build.

# Clean start!
docker-compose down -v

function down()
{
    # Stop containers and clear volumes
    docker-compose down -v
}

trap down EXIT

## Run a local development chain
docker-compose up -d joystream-node

## Init the chain with some state
SKIP_MOCK_CONTENT=true ./tests/network-tests/run-test-scenario.sh setup-new-chain

## Set sudo as the membership screening authority
yarn workspace api-scripts set-sudo-as-screening-auth

## Query Node Infrastructure

# Initialize a new database for the query node infrastructure
docker-compose up -d db

# Make sure we use dev config for db migrations (prevents "Cannot create database..." and some other errors)
docker-compose run --rm --entrypoint sh graphql-server -c "yarn workspace query-node config:dev"
# Migrate the databases
docker-compose run --rm --entrypoint sh graphql-server -c "yarn workspace query-node-root db:prepare"
docker-compose run --rm --entrypoint sh graphql-server -c "yarn workspace query-node-root db:migrate"

# Start indexer and gateway
docker-compose up -d indexer
docker-compose up -d hydra-indexer-gateway

# Start processor and graphql server
docker-compose up -d processor
docker-compose up -d graphql-server

## Storage Infrastructure
docker-compose up -d colossus-1
docker-compose up -d distributor-1

## Pioneer UI
docker-compose up -d pioneer

echo "use Ctrl+C to shutdown the development network."

while true; do 
  read
done
