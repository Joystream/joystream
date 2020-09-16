#!/bin/bash

export WASM_BUILD_TOOLCHAIN=nightly-2020-05-23

sh ./scripts/create-test-chainspec.sh
yes | cargo run --release -p joystream-node -- purge-chain --dev
cargo run --release -p joystream-node -- --chain=.tmp/chainspec.json --alice --validator
