#!/usr/bin/env bash

set -e

if ! command -v docker-compose &> /dev/null
then
  echo "docker-compose not found. Skipping docker image builds."
  exit 0
fi

# Build processor/graphql-server docker image
docker-compose build graphql-server

# Build colossus docker image
echo "Building colossus docker image..."
docker-compose build colossus

# Build distributor docker image
echo "Building distributor docker image..."
docker-compose build distributor-node

# Build the pioneer docker image
echo "Building pioneer docker image"
docker-compose build pioneer
