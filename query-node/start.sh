#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Only run codegen if no generated files found
[ ! -d "generated/" ] && yarn build

# Bring up db
docker-compose -f ../docker-compose.yml up -d db

# Wait for the db to be up
until docker-compose -f ../docker-compose.yml logs db | grep "server started"; do
  echo "Waiting for the db to be ready..."
  sleep 1
done

# Make sure we use dev config for db migrations (prevents "Cannot create database..." and some other errors)
docker-compose -f ../docker-compose.yml run --rm --entrypoint sh graphql-server -c "yarn workspace query-node config:dev"
# Migrate the databases
docker-compose -f ../docker-compose.yml run --rm --entrypoint sh graphql-server -c "yarn workspace query-node-root db:prepare"
docker-compose -f ../docker-compose.yml run --rm --entrypoint sh graphql-server -c "yarn workspace query-node-root db:migrate"

# Start indexer and gateway
docker-compose -f ../docker-compose.yml up -d indexer
docker-compose -f ../docker-compose.yml up -d hydra-indexer-gateway

# Start processor and graphql server
docker-compose -f ../docker-compose.yml up -d processor
docker-compose -f ../docker-compose.yml up -d graphql-server

