#!/usr/bin/env bash

# Cross compiles release build of joystream-node
# for Raspberry Pi - using docker

# joystream/rust-raspberry image was built from:
# https://github.com/mnaamani/rust-on-raspberry-docker/tree/add-wasm-toolchain-and-clang

export WORKSPACE_ROOT=`cargo metadata --offline --no-deps --format-version 1 | jq .workspace_root -r`

docker run \
    -e WASM_BUILD_TOOLCHAIN=nightly-2021-03-24 \
    --volume ${WORKSPACE_ROOT}/:/home/cross/project \
    --volume ${HOME}/.cargo/registry:/home/cross/.cargo/registry \
    joystream/rust-raspberry \
    build --release -p joystream-node

ls -l target/arm-unknown-linux-gnueabihf/joystream-node
