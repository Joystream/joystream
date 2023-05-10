#!/usr/bin/env bash
set -e

docker-compose up -d db
docker-compose exec db psql -U postgres -c "CREATE DATABASE orion;"
docker-compose up -d squid-archive
docker-compose up -d squid-archive-gateway
docker-compose up -d orion-processor
docker-compose up -d orion-api