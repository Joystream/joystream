#!/usr/bin/env bash

set -e

yarn
yarn workspace @joystream/types build
yarn workspace @joystream/cd-schemas generate:all
yarn workspace @joystream/cd-schemas build
yarn workspace @joystream/cli build
yarn workspace query-node-root build
yarn workspace storage-node build
# Not strictly needed during development, we run "yarn workspace pioneer start" to start
# a dev instance, but will show highlight build issues
yarn workspace pioneer build

if ! command -v docker-compose &> /dev/null
  # Build or fetch cached joystream/node docker image
  if [[ "$SKIP_JOYSTREAM_NODE" = 1 || "$SKIP_JOYSTREAM_NODE" = "true" ]]; then
    echo "Skipping build of joystream/node docker image."
  else
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
  fi

  # Build joystream/apps docker image
  echo "Building 'joystream/apps' docker image..."
  docker-compose build colossus
then
  echo "docker-compose not found. Skipping docker image builds."
fi

# Build cargo crates: native binaries joystream/node, wasm runtime, and chainspec builder.
if [[ "$SKIP_JOYSTREAM_NODE" = 1 || "$SKIP_JOYSTREAM_NODE" = "true" ]]; then
  echo "Skipping cargo build"
else
  yarn cargo-checks
  yarn cargo-build
fi
