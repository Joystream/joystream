#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# pass the scenario name without .ts extension
SCENARIO=$1
# fallback if scenario if not specified
SCENARIO=${SCENARIO:=full}

# Execute the tests
time DEBUG=* yarn workspace integration-tests node-ts-strict src/scenarios/${SCENARIO}.ts
