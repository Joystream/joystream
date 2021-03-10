#!/usr/bin/env bash

set -e

if ! command -v docker-compose &> /dev/null
then
  echo "docker-compose not found. Skipping docker image builds."
  exit 0
fi

# Build joystream/apps docker image
echo "Building 'joystream/apps' docker image..."
docker-compose build colossus

# Build the pioneer docker image
echo "Building pioneer docker image"
docker-compose build pioneer

if [[ "$SKIP_JOYSTREAM_NODE" = 1 || "$SKIP_JOYSTREAM_NODE" = "true" ]]; then
  echo "Skipping build of joystream/node docker image."
else
  # TODO: Try to fetch a cached joystream/node image
  # if one is found matching code shasum instead of building
  docker-compose build joystream-node
fi
