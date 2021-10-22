#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

echo "importing accounts"
yarn joystream-cli account:import ./test-data/initial-members.json
echo "creating 1 channel with 1 video in it"
yarn joystream-cli content:createChannel -i ./assets/TestChannel.json
yarn joystream-cli content:createChannel -c 0 -i ./assets/TestVideo.json
