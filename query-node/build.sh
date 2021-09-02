#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Load and export variables from root .env file into shell environment
set -a
. ../.env
set +a

yarn clean

# Install hydra codegen in separate dir to avoid dependency clashes
cd ./codegen
yarn
cd ..

# Generate types and server code
TYPEGEN_WS_URI="${TYPEGEN_WS_URI:-ws://localhost:9944}" yarn typegen:configure
yarn typegen
yarn codegen:noinstall
yarn format

# We run yarn again to ensure graphql-server dependencies are installed
# and are inline with root workspace resolutions
yarn

yarn workspace query-node codegen
yarn workspace query-node build:prod
#yarn workspace query-node build:dev

yarn workspace query-node-mappings build
