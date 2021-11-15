#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

set -a
. ../.env
set +a

# Start the joystream-node first to allow fetching Olympia metadata during build (typegen)
docker-compose up -d joystream-node

# Only run codegen if no generated files found
[ ! -d "generated/" ] && yarn build

# Bring up db
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

# Start indexer and gateway
docker-compose up -d indexer
docker-compose up -d hydra-indexer-gateway

# Start processor and graphql server
docker-compose up -d processor
docker-compose up -d graphql-server

