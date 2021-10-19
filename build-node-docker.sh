#!/usr/bin/env bash

set -e

if ! command -v docker-compose &> /dev/null
then
  echo "docker-compose not found. Skipping docker image builds."
  exit 0
fi

# Fetch a cached joystream/node image if one is found matching code shasum instead of building
CODE_HASH=`scripts/runtime-code-shasum.sh`
IMAGE=joystream/node:${CODE_HASH}
echo "Trying to fetch cached ${IMAGE} image"
docker pull ${IMAGE} || :

if ! docker inspect ${IMAGE} > /dev/null;
then
  echo "Fetch failed, building image locally"
  docker-compose build joystream-node
else
  echo "Tagging cached image as 'latest'"
  docker image tag ${IMAGE} joystream/node:latest
fi
