#!/usr/bin/env bash
set -e

# Avoid pulling joystream/node from docker hub. It is most likely
# not the version that we want to work with. Either you should
# build it locally or pull it down manually.
if ! docker inspect joystream/node:latest > /dev/null 2>&1;
then
  echo "Didn't find local joystream/node:latest docker image."
  exit 1
fi

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# stop prior run and clear volumes
# docker-compose down -v

function down()
{
    # Stop containers and clear volumes
    docker-compose down -v
}

# Run a development joystream-node chain and ipfs daemon in the background
docker-compose up -d ipfs
docker-compose up -d joystream-node

trap down EXIT

# configure the dev chain
DEBUG=joystream:storage-cli:dev yarn storage-cli dev-init

# Run the tests
# Tests sometimes fail, so skip for now
# yarn workspace storage-node test

# Start Colossus storage-node
DEBUG=joystream:* yarn colossus --dev
