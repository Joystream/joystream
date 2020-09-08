#!/usr/bin/env bash

# Run this script from the crago workspace root

# Cross compiles release build of joystream-node
# for Raspberry Pi - using docker

# joystream/rust-raspberry image was built from:
# https://github.com/mnaamani/rust-on-raspberry-docker/commit/8536508b743d55c8573043c4082c62da3b4fd3e2

docker run \
    --volume ${PWD}/:/home/cross/project \
    --volume ${HOME}/.cargo/registry:/home/cross/.cargo/registry \
    joystream/rust-raspberry \
    build --release -p joystream-node

# artifacts will be relative to the working directory:
# target/arm-unknown-linux-gnueabihf/joystream-node
