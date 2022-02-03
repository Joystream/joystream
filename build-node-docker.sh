#!/usr/bin/env bash

set -e

# Looks for a cached joystream/node image matching code shasum.
# Search order: local repo then dockerhub. If no cached image is found we build it.
# Finally image is tagged as "latest"

CODE_HASH=`scripts/runtime-code-shasum.sh`
IMAGE=joystream/node:${CODE_HASH}
LATEST=joystream/node:latest

# Look for image locally
if ! docker inspect ${IMAGE} > /dev/null;
then
  # Not found, try to fetch from remote repo
  echo "Trying to fetch cached ${IMAGE} image"
  docker pull ${IMAGE} || :

  # If we didn't find it, build it
  if ! docker inspect ${IMAGE} > /dev/null;
  then
    echo "Building ${IMAGE}.."
    docker build . --file joystream-node.Dockerfile --tag ${IMAGE} --build-arg TEST_NODE=${TEST_NODE}
  fi
else
  echo "Found ${IMAGE} in local repo"
fi

# At this point image should be in local repo
# echo "Tagging ${IMAGE} as ${LATEST}"
# docker image tag ${IMAGE} ${LATEST}
