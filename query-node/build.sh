#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

yarn clean
yarn codegen:all
yarn
ln -s ../../../../../node_modules/typeorm/cli.js generated/graphql-server/node_modules/.bin/typeorm || :
yarn tsc --build tsconfig.json
