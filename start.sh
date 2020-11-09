#!/usr/bin/env bash
set -e

# Run a complete joystream development network on your machine using docker.

# TODO
# - Check if docker is installed and prompt to install.
# - Prompt user if they wish to rebuild before starting . default no, timeout if not prompted.
# - Try to fetch a cached joystream/node image if one is found matching code shasum.

# if ! docker inspect joystream/node:latest > /dev/null 2>&1;
# then
#   echo "Didn't find a joystream/node:latest docker image."
#   exit 1
# fi

# Clean start!
docker-compose down -v

function down()
{
    # Stop containers and clear volumes
    docker-compose down -v
}

trap down EXIT

# Run a development joystream-node chain
docker-compose up -d joystream-node

## Storage Infrastructure
# Configure a dev storage node and start storage node
DEBUG=joystream:storage-cli:dev yarn storage-cli dev-init
docker-compose up -d colossus
# Initialise the content directory with standard classes, schemas and initial entities
yarn workspace cd-schemas initialize:dev

## Query Node Infrastructure
# Initialize a new database for the query node infrastructure
docker-compose up -d db
yarn workspace query-node-root db:migrate
# Startup all query-node infrastructure services
docker-compose up -d processor

echo "press Ctrl+C to shutdown"

# Start a dev instance of pioneer and wait for exit
docker-compose up pioneer