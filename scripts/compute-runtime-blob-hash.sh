#!/usr/bin/env bash

# The script computes the b2sum of the wasm blob in a pre-built joystream/node image
# Assumes b2sum is already instally on the host machine.

# Create a non running container from joystream/node
docker create --name temp-container-joystream-node joystream/node

# Copy the compiled wasm blob from the docker container to our host
docker cp temp-container-joystream-node:/joystream/runtime.compact.wasm joystream_runtime.wasm
docker rm temp-container-joystream-node

# compute blake2_256 hash of the wasm blob - this should match the hash computed when the runtime file is
# used to create a runtime upgrade proposal.
# osx with: brew install b2sum; b2sum -b blake2b -l 256 joystream_runtime.wasm
# ubuntu 17.0+ with: apt-get install coreutils; b2sum -l 256 joystream_runtime.wasm
# TODO: add install of b2sum to setup.sh
b2sum -l 256 joystream_runtime.wasm
b2sum -l 512 joystream_runtime.wasm
rm joystream_runtime.wasm
