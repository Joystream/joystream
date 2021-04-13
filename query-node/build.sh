#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Load and export variables from root .env file into shell environment
set -a
. ../.env
set +a

# only use this when new Hydra releases and contents of `generated/` folder needs to be refreshed
#yarn clean
#yarn codegen:noinstall
#yarn codegen:typegen # if this fails try to run this command outside of yarn workspaces

yarn query-node:build
yarn mappings:build
ln ../types/augment/all/defs.json mappings/lib/generated/types/typedefs.json

# We run yarn again to ensure graphql-server dependencies are installed
# and are inline with root workspace resolutions
yarn
