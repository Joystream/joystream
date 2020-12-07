#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# set +a
# . ../.env
# export TYPEORM_DATABASE=${PROCESSOR_DB_NAME}

export TYPEORM_DATABASE=${PROCESSOR_DB_NAME:=query_node_processor}

cd ./generated/indexer
yarn
DEBUG=${DEBUG} yarn start:processor --env ../../../.env