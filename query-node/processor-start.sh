#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

set -a
. ../.env
set +a

export TYPEORM_DATABASE=${PROCESSOR_DB_NAME}

cd ./generated/indexer
yarn
DEBUG=${DEBUG} yarn start:processor --env ../../../.env