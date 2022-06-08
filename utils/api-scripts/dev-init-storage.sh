#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

export GROUP="storageWorkingGroup"
export WORKER_ROLE_URI="//Colossus"
export INITIAL_WORKER_BALANCE_TOP_UP="10000"

yarn initialize-lead
yarn initialize-worker
