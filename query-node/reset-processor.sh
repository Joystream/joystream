#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

docker-compose -f ../docker-compose.yml rm -vsf processor
docker-compose -f ../docker-compose.yml rm -vsf graphql-server
docker exec db psql -U postgres -c "DROP DATABASE query_node_processor;"
./start.sh