#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

echo 'running rust-fmt'
cargo fmt --all -- --check

source ./features.sh

export WASM_BUILD_TOOLCHAIN=nightly-2022-05-11

echo 'running clippy (rust linter)'
# When custom build.rs triggers wasm-build-runner-impl to build we get error:
# "Rust WASM toolchain not installed, please install it!"
# So we skip building the WASM binary by setting BUILD_DUMMY_WASM_BINARY=1
# Aggressive linting
echo 'running cargo clippy'
BUILD_DUMMY_WASM_BINARY=1 cargo "+$WASM_BUILD_TOOLCHAIN" clippy --release --all -- -D warnings

echo 'running cargo unit tests'
cargo "+$WASM_BUILD_TOOLCHAIN" test --release --all --features "${FEATURES}"