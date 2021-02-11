#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# set +a
# . ../.env
# export TYPEORM_DATABASE=${PROCESSOR_DB_NAME}

export TYPEORM_DATABASE=${PROCESSOR_DB_NAME:=query_node_processor}

cd ./generated/hydra-processor

DEBUG=* node ./lib/index.js run \
  --mappings ../../../lib/mappings \
  --env ../../../.env \
  --entities ../../../lib/generated/graphql-server/src/modules/**/*.model.js
