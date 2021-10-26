#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

echo "verify existence of the 5 new groups"
yarn joystream-cli working-groups:overview --group=operationsAlpha
yarn joystream-cli working-groups:overview --group=operationsBeta
yarn joystream-cli working-groups:overview --group=operationsGamma
yarn joystream-cli working-groups:overview --group=curators
yarn joystream-cli working-groups:overview --group=distributors

echo "verify video by id map and channel by id map are cleared"
yarn joystream-cli content:channel 1
yarn joystream-cli content:videos 1

