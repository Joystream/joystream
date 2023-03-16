#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

echo 'running rust-fmt'
cargo fmt --all -- --check

source ./features.sh

export WASM_BUILD_TOOLCHAIN=nightly-2022-11-15

# When custom build.rs triggers wasm-build-runner-impl to build we get error:
# "Rust WASM toolchain not installed, please install it!"
# So we skip building the WASM binary by setting BUILD_DUMMY_WASM_BINARY=1
# Aggressive linting
echo 'running cargo clippy'
#cargo "+$WASM_BUILD_TOOLCHAIN" clippy --release --all --features "${FEATURES}" -- -D warnings
cargo "+$WASM_BUILD_TOOLCHAIN" clippy --release --all --features runtime-benchmarks,"${FEATURES}"

echo 'running cargo unit tests'
cargo "+$WASM_BUILD_TOOLCHAIN" test --release --all --features runtime-benchmarks,"${FEATURES}"
