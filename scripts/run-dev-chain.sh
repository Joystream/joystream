#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

source features.sh

export WASM_BUILD_TOOLCHAIN=nightly-2021-02-20

# Build release binary
cargo +nightly-2021-02-20 build --release --features "${FEATURES}"

# Purge existing local chain
yes | cargo +nightly-2021-02-20 run --release --features "${FEATURES}" -- purge-chain --dev

# Run local development chain -
# No need to specify `-p joystream-node` it is the default bin crate in the cargo workspace
cargo +nightly-2021-02-20 run --release --features "${FEATURES}" -- --dev --log runtime
