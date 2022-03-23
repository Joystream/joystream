#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

source features.sh

export WASM_BUILD_TOOLCHAIN=nightly-2021-02-20

cargo +nightly-2021-02-20 build --release --features "${FEATURES}"