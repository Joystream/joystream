#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

joystream-cli api:setUri ws://localhost:9944
echo "creating 1 channel"
joystream-cli content:createChannel --input=./assets/TestChannel.json
echo "adding 1 video to the above channel"
joystream-cli content:createVideo -c 0 --input=./assets/TestVideo.json
