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

# Wait for processor db bootstrapping to complete, can take a bit longer on docker desktop
docker version
docker version --format json || \
DOCKER_PLATFORM=$(docker version --format json | jq -r ".Server.Platform.Name") && \
  [[ "$DOCKER_PLATFORM" = "Docker Desktop"* ]] && \
  echo "1. Waiting for processor to be ready..." && sleep 30

DOCKER_PLATFORM=$(docker version | grep "Server: Docker Desktop"); ! [[ -z $DOCKER_PLATFORM ]] && \
    echo "2. Waiting for processor to be ready..." && sleep 30

# Start graphql-server
docker-compose -f ../docker-compose.yml up -d graphql-server
echo "Waiting for graphql-server to be ready..."
sleep 30
