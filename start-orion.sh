#!/usr/bin/env bash
set -e

docker-compose up -d orion-db
docker-compose up -d orion-processor
docker-compose up -d orion-graphql-api
docker-compose up -d orion-auth-api
