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

# Build indexer customizing DB name
DB_NAME=${INDEXER_DB_NAME} yarn codegen:indexer

# Build graphql-server customizing DB name
DB_NAME=${PROCESSOR_DB_NAME} yarn codegen:server

# We run yarn again to ensure processor and indexer dependencies are installed
# and are inline with root workspace resolutions
yarn

ln -s ../../../../../node_modules/typeorm/cli.js generated/graphql-server/node_modules/.bin/typeorm || :

yarn tsc --build tsconfig.json
