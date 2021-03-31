#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Load and export variables from root .env file into shell environment
set -a
. ../.env
set +a

yarn clean

# Build graphql-server customizing DB name
yarn codegen

echo "Building mappings..."
(cd mappings && yarn build)

# Copy joy types
cp ../types/augment/all/defs.json ./mappings/lib/mappings/generated/types/typedefs.json

# We run yarn again to ensure processor and indexer dependencies are installed
# and are inline with root workspace resolutions
yarn

ln -s ../../../../../node_modules/typeorm/cli.js generated/graphql-server/node_modules/.bin/typeorm || :
