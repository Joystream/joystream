#!/usr/bin/env bash
set -e

docker-compose up -d orion-db
docker-compose up -d orion-processor
docker-compose up -d orion-graphql-api
docker-compose up -d orion-auth-api
docker-compose up -d squid-archive-ingest
docker-compose up -d squid-archive-db
docker-compose up -d squid-archive-gateway
docker-compose up -d squid-archive-explorer
