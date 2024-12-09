#!/usr/bin/env bash
set -e

SCRIPT_PATH=`dirname "${BASH_SOURCE[0]}"`
cd $SCRIPT_PATH

# pass the scenario name without .ts extension
SCENARIO=$1
# fallback if scenario not specified
SCENARIO=${SCENARIO:="full"}

# Execute the scenario and optional arguments after following scenario name
time DEBUG=integration-tests:* yarn workspace network-tests \
    node-ts-strict src/scenarios/${SCENARIO}.ts $2 $3 $4 $5
