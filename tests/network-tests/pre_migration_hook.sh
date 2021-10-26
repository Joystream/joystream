#!/usr/bin/env bash
set -e

# SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
# cd $SCRIPT_PATH

export AUTO_CONFIRM=true

sleep 5 # needed otherwise docker image won't be ready yet
echo "creating 1 channel"
joystream-cli content:createChannel --input=./assets/TestChannel.json --context=Member || true
echo "adding 1 video to the above channel"
joystream-cli content:createVideo -c 1 --input=./assets/TestVideo.json || true
