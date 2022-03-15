#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Load and export variables from root .env file into shell environment
set -a
. ../.env
set +a

# Install codegen tools (outside of workspaces to avoid @polkadot/api conflicts)
yarn --cwd codegen install

yarn clean
yarn codegen:noinstall
cp mappings/queryTemplates.ts generated/graphql-server/src/
yarn typegen # if this fails try to run this command outside of yarn workspaces

# We run yarn again to ensure graphql-server dependencies are installed
# and are inline with root workspace resolutions
yarn

# Add missing typeorm binary symlink
ln -s ../../../../../node_modules/typeorm/cli.js ./generated/graphql-server/node_modules/.bin/typeorm

yarn workspace query-node codegen
yarn workspace query-node build

yarn workspace query-node-mappings build


