#!/usr/bin/env bash

export WASM_BUILD_TOOLCHAIN=nightly-2020-05-23

# Build release binary
cargo build --release -p joystream-node

# Purge existing local chain
yes | cargo run --release -p joystream-node -- purge-chain --dev

# Run local development chain
cargo run --release -p joystream-node -- --dev
