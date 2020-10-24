#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH
mkdir -p hydra-test && cd hydra-test

npx @dzlzv/hydra-cli@v0.0.16 scaffold --wsProviderUrl=ws://joystream-node:9944/ --projectName=Test

cp ../../../types/augment/all/defs.json ./typedefs.json
export TYPES_JSON=../../typedefs.json

# Joystream mappings and graphsql schema
# cp ../../../query-node/mappings/src/* ./mappings
# cp ../../../query-node/schema.graphql ./

function cleanup() {
    docker logs hydra-test_processor_1 --tail 15
    docker-compose down -v
}

trap cleanup EXIT

yarn docker:db:up
yarn docker:build
yarn docker:db:migrate
yarn docker:up

# Run tests
ATTACH_TO_NETWORK=hydra-test_default ../../network-tests/run-tests.sh content-directory


