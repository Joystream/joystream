#!/usr/bin/env bash
set -e

# Looks for a cached joystream/node image matching code shasum.
# Search order: local repo then dockerhub. If no cached image is found we build it.

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

source scripts/features.sh

CODE_SHASUM=`scripts/runtime-code-shasum.sh`
IMAGE=joystream/node:${CODE_SHASUM}

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
      --build-arg CARGO_FEATURES=${FEATURES} \
      --build-arg GIT_COMMIT_HASH=$(git rev-parse --short=11 HEAD) \
      --build-arg CODE_SHASUM=${CODE_SHASUM}
  fi
else
  echo "Found ${IMAGE} in local repo"
fi
