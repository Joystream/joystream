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

## Query Node Infrastructure
# Initialize a new database for the query node infrastructure
docker-compose up -d db

# Override DB_HOST for db setup
export DB_HOST=localhost

# Make sure we use dev config for db migrations (prevents "Cannot create database..." and some other errors)
yarn workspace query-node config:dev

# Migrate the databases
yarn workspace query-node-root db:prepare
yarn workspace query-node-root db:migrate

# Set DB_HOST back to docker-service one
export DB_HOST=db

# Start processor and graphql server
docker-compose up -d processor-mnt
docker-compose up -d graphql-server-mnt

## Storage Infrastructure
docker-compose up -d colossus
# # Create a new content directory lead
# yarn workspace api-scripts initialize-content-lead

# # Set sudo as the membership screening authority
# yarn workspace api-scripts set-sudo-as-screening-auth

# docker-compose up -d pioneer

echo "use Ctrl+C to shutdown the development network."

while true; do 
  read
done
