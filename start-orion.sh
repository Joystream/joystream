#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

docker-compose up -d orion-db
docker-compose up -d squid-archive
docker-compose up -d squid-archive-gateway
docker-compose up -d orion-processor
docker-compose up -d orion-api