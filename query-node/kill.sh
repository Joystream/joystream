#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Only remove query-node related services
docker-compose -f ../docker-compose.yml rm -vsf processor
docker-compose -f ../docker-compose.yml rm -vsf graphql-server
docker-compose -f ../docker-compose.yml rm -vsf indexer
docker-compose -f ../docker-compose.yml rm -vsf hydra-indexer-gateway
docker-compose -f ../docker-compose.yml rm -vsf redis
docker-compose -f ../docker-compose.yml rm -vsf db
