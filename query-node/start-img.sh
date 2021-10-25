#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

set -a
. ../.env
set +a

# Bring up db
docker-compose up -d db

# Setup the db
docker run --rm --env-file ../.env --network joystream_default joystream/apps workspace query-node-root db:prepare
docker run --rm --env-file ../.env --network joystream_default joystream/apps workspace query-node-root db:migrate

# Start processor and graphql server
docker-compose up -d processor
docker-compose up -d graphql-server
