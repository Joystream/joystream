#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# verify existence of the three new groups
yarn joystream-cli working-groups:overview --group=operationsAlpha
yarn joystream-cli working-groups:overview --group=operationsBeta
yarn joystream-cli working-groups:overview --group=operationsGamma
yarn joystream-cli working-groups:overview --group=curators

