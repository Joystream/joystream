#!/usr/bin/env bash

export WASM_BUILD_TOOLCHAIN=nightly-2021-03-24

# Build release binary
cargo build --release

# Purge existing local chain
yes | cargo run --release -- purge-chain --dev

# Run local development chain -
# No need to specify `-p joystream-node` it is the default bin crate in the cargo workspace
cargo run --release -- --dev --log runtime
