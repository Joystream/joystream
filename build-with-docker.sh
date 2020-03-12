#!/bin/bash

# Build the toolchain image - contains only the compiler environmet for building runtime
# This is then pushed to docker hub: https://cloud.docker.com/repository/docker/mokhtargz/wasm-toolchain/general
# docker build --tag mokhtargz/wasm-toolchain --file ./wasm_dockerfile .

# Build the runtime in a new image
docker build --tag runtime-build --file ./runtime_dockerfile .

# Create a non running container from the runtime build image
docker create --name runtime-container runtime-build
# Copy the compiled wasm blob from the docker container to our host
docker cp runtime-container:/runtime/target/release/wbuild/joystream-node-runtime/joystream_node_runtime.compact.wasm joystream_runtime.wasm
docker rm runtime-container

# compute blake2_256 hash of the wasm blob - this should match the hash computed when the runtime file is
# used to create a runtime upgrade proposal.
# osx with: brew install b2sum; b2sum -b blake2b -l 256 joystream_runtime.wasm
# ubuntu 17.0+ with: apt-get install coreutils; b2sum -l 256 joystream_runtime.wasm
b2sum -l 256 joystream_runtime.wasm
