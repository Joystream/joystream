#!/usr/bin/env bash
set -e

script_path="$(dirname "${BASH_SOURCE[0]}")"

# stop prior run and clear volumes
docker-compose -f ${script_path}/compose/devchain-and-ipfs-node/docker-compose.yaml down -v
