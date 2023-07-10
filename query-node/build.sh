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
cp mappings/src/queryTemplates.ts generated/graphql-server/src/
yarn typegen # if this fails try to run this command outside of yarn workspaces

################################################

# We run yarn again to ensure graphql-server dependencies are installed
# and are inline with root workspace resolutions
yarn

# Add missing typeorm binary symlink
ln -s ../../../../../node_modules/typeorm/cli.js ./generated/graphql-server/node_modules/.bin/typeorm

yarn workspace query-node codegen

yarn workspace query-node build

yarn workspace query-node-mappings build

################################################
# temporary patche TODO: create proper solution

# Add command to run Query Node's Graphql server with Opentelemetry instrumentation
sed -i '' -e '/"start:prod": "WARTHOG_ENV=production yarn dotenv:generate && node dist\/src\/index.js"/a \
   "start:prod:with-instrumentation": "OTEL_APPLICATION=query-node WARTHOG_ENV=production yarn dotenv:generate && node --require @joystream/opentelemetry dist/src/index.js",' ./generated/graphql-server/package.json

# Add @joystream/opentelemetry dependency symlink, as it is not specified in generated/graphql-server/package.json dependencies
mkdir -p ./generated/graphql-server/node_modules/@joystream
ln -s ../../../../../node_modules/@joystream/opentelemetry ./generated/graphql-server/node_modules/@joystream/opentelemetry
