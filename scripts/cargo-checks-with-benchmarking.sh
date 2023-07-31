#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

echo 'running rust-fmt'
cargo fmt --all -- --check

export WASM_BUILD_TOOLCHAIN=nightly-2022-11-15

echo 'running cargo clippy'
cargo "+$WASM_BUILD_TOOLCHAIN" clippy --release --all --features runtime-benchmarks -- -D warnings

echo 'running all cargo tests'
cargo +nightly-2022-11-15 test --release --features runtime-benchmarks --all
