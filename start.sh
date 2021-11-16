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
./query-node/start.sh

## Storage Infrastructure
docker-compose up -d colossus-1
docker-compose up -d distributor-1

## Pioneer UI
docker-compose up -d pioneer

echo "use Ctrl+C to shutdown the development network."

while true; do 
  read
done
