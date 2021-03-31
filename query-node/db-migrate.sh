#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

set -a
. ../.env
set +a

yarn workspace query-node-root db:schema:migrate
yarn hydra-processor migrate --env=../.env

yarn workspace query-node-root db:init
