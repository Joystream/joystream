#!/usr/bin/env bash

set -e

# Looks for a cached joystream/node image matching code shasum.
# Search order: local repo then dockerhub. If no cached image is found we build it.

CODE_HASH=`scripts/runtime-code-shasum.sh`
IMAGE=joystream/node:${CODE_HASH}

FEATURES=
if [[ "$RUNTIME_PROFILE" == "TESTING" ]]; then
  FEATURES="testing_runtime"
fi

if [[ "$RUNTIME_PROFILE" == "STAGING" ]]; then
  FEATURES="staging_runtime"
fi

if [[ "$RUNTIME_PROFILE" == "PLAYGROUND" ]]; then
  FEATURES="playground_runtime"
fi

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
    docker build . --file joystream-node.Dockerfile \
      --tag ${IMAGE} \
	    --build-arg CARGO_FEATURES=${FEATURES}
  fi
else
  echo "Found ${IMAGE} in local repo"
fi
