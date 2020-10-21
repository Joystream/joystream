#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH
mkdir -p hydra-test/
cd hydra-test

npx @dzlzv/hydra-cli scaffold --wsProviderUrl=ws://joystream-node:9944/ --projectName=Test

cp ../../../types/augment/all/defs.json ./mappings/typedefs.json
export TYPES_JSON=../../mappings/typedefs.json

# Joystream mappings and graphsql schema
# cp ../../../query-node/mappings/* ./mappings/
# cp ../../../query-node/schema.graphql ./

npx @dzlzv/hydra-cli codegen

# Setup the postgres database
docker-compose up $1 -d db

function cleanup() {
    docker-compose down -v
}

trap cleanup EXIT

yarn db:migrate

# Bring up remaining services
docker-compose up $1 -d

# Run tests
ATTACH_TO_NETWORK=hydra-test_default ../../network-tests/run-tests.sh content-directory


