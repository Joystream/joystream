#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

function cleanup() {
    docker logs query-node_processor_1 --tail 15
    docker-compose down -v
}

trap cleanup EXIT

yarn db:up
yarn db:migrate
yarn docker:up

# Run tests
ATTACH_TO_NETWORK=query-node_default ../tests/network-tests/run-tests.sh content-directory


