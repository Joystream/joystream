#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

#echo "importing accounts"
#yarn joystream-cli account:import ./test-data/initial-members.json
echo "creating 1 channel"
yarn joystream-cli content:createChannel --input=./assets/TestChannel.json --context=Member
echo "adding 1 video to the above channel"
yarn joystream-cli content:createVideo -c 0 --input=./assets/TestVideo.json
