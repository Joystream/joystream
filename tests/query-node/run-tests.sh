#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH
mkdir -p hydra-test/
cd hydra-test

npx @dzlzv/hydra-cli scaffold --wsProviderUrl=ws://joystream-node:9944/ --projectName=Test

cp ../../../types/augment/all/defs.json ./mappings/typedefs.json
# cp ../../../query-node/mappings/* ./mappings/
# cp ../../../query-node/schema.graphql ./

# might be good idea to add a typedefs.json as empty `{}` json at root, in hydra scaffold templates
# Add a line in Dockerfile to copy typedefs into image (there are no volumes config in compose file)
#   COPY typedefs.json /home/hydra

# Sneak the typedefs file into this location to avoid need to modify the Dockerfile ;)
export TYPES_JSON=../../mappings/typedefs.json

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


