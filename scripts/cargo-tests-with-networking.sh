#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

source features.sh

export WASM_BUILD_TOOLCHAIN=nightly-2022-05-11

echo 'running all cargo tests'
cargo +nightly-2022-05-11 test --release --features "${FEATURES}" --all -- --ignored
