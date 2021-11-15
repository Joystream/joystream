#!/usr/bin/env bash

set -e

if ! command -v docker-compose &> /dev/null
then
  echo "docker-compose not found. Skipping docker image builds."
  exit 0
fi

# Build colossus docker image
echo "Building colossus docker image..."
docker-compose build colossus-1

# Build distributor docker image
echo "Building distributor docker image..."
docker-compose build distributor-1
