#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Only run codegen if no generated files found
[ ! -d "generated/" ] && yarn build

# Bring up db
docker-compose -f ../docker-compose.yml up -d db
echo "Waiting for the db to be ready..."
sleep 5

# Start indexer and gateway
docker-compose -f ../docker-compose.yml up -d indexer
docker-compose -f ../docker-compose.yml up -d hydra-indexer-gateway

# Start processor
docker-compose -f ../docker-compose.yml up -d processor
echo "Waiting for processor to be ready..." && sleep 30
if [[ "$OSTYPE" == "darwin"* ]]; then
    # On Docker Desktop things take a bit longer to startup
    sleep 150
fi

# Start graphql-server
docker-compose -f ../docker-compose.yml up -d graphql-server
echo "Waiting for graphql-server to be ready..." && sleep 30
