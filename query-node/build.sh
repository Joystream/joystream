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
yarn typegen # if this fails try to run this command outside of yarn workspaces

# TS4 useUnknownInCatchVariables is not compatible with auto-generated code
sed -i '/\"compilerOptions\"\:\ {/a \ \ \ \ "useUnknownInCatchVariables": false,' ./generated/graphql-server/tsconfig.json
# Type assertions are no longer needed for createTypeUnsafe in @polkadot/api 5.9.1 (and they break the build)
# Here we're relpacing createTypeUnsafe<Assertions>(...params) to createTypeUnsafe(...params) in all generated types:
find ./mappings/generated -type f -print0 | xargs -0 sed -ri 's/createTypeUnsafe<[^(]+[(]/createTypeUnsafe(/g'

# We run yarn again to ensure graphql-server dependencies are installed
# and are inline with root workspace resolutions
yarn

yarn workspace query-node codegen
yarn workspace query-node build

yarn workspace query-node-mappings build


