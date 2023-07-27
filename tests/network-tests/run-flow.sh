#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Execute the flow scenario
time DEBUG=integration-tests:* yarn workspace network-tests \
    node-ts-strict src/scenarios/flow.ts $1
