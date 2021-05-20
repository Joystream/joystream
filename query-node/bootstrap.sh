#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Load and export variables from root .env file into shell environment
set -a
. ../.env
. ./generated/graphql-server/.env
set +a

BOOTSTRAP_DATA_FOLDER=`pwd`/mappings/bootstrap/data node ./mappings/lib/mappings/bootstrap/index.js
