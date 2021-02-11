#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Load and export variables from root .env file into shell environment
set -a
. ../.env
set +a

yarn clean

# We generate the code for each service separately to be able to specify
# separate database names.

# Build graphql-server customizing DB name
DB_NAME=${PROCESSOR_DB_NAME} yarn codegen:server

# We run yarn again to ensure processor and indexer dependencies are installed
# and are inline with root workspace resolutions
yarn

ln -s ../../../../../node_modules/typeorm/cli.js generated/graphql-server/node_modules/.bin/typeorm || :

yarn tsc --build tsconfig.json

# NOTE: hydra-processor will be updated! if it fail which means it is not updated yet so please manually edit 
# generated/hydra-processor/tsconfig.json by update hydra-processor tsconfig file by setting include = ["index.js"] and root="." 
(cd ./generated/hydra-processor && rm -rf lib && yarn tsc --build tsconfig.json)
