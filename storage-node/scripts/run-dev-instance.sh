#!/usr/bin/env bash
set -e

script_path="$(dirname "${BASH_SOURCE[0]}")"

# stop prior run and clear volumes
docker-compose -f ${script_path}/compose/devchain-and-ipfs-node/docker-compose.yaml down -v

# Run a development joystream-node chain and ipfs daemon in the background
# Will use latest joystream/node images,
# and will fetch from dockerhub if not found, so build them locally if
# you need the version from the current branch
docker-compose -f ${script_path}/compose/devchain-and-ipfs-node/docker-compose.yaml up -d

# configure the dev chain
DEBUG=joystream:storage-cli:dev yarn storage-cli dev-init
DEBUG=joystream:storage-cli:dev yarn storage-cli dev-check

# Run the server
DEBUG=* yarn colossus dev-server
