#!/usr/bin/env bash
set -e

SCRIPT_PATH=`dirname "${BASH_SOURCE[0]}"`
cd $SCRIPT_PATH

echo 'running rust-fmt'
cargo fmt --all -- --check

FEATURES=`./features.sh`

export WASM_BUILD_TOOLCHAIN=nightly-2022-11-15

echo 'running cargo unit tests'
cargo "+$WASM_BUILD_TOOLCHAIN" test --release --all --features "${FEATURES}" -- --ignored
