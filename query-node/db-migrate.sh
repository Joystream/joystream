#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

set -a
. ../.env
set +a

yarn workspace query-node-root db:indexer:migrate
yarn workspace query-node-root db:schema:migrate
TYPEORM_DATABASE=${PROCESSOR_DB_NAME} yarn workspace query-node-root db:indexer:migrate
