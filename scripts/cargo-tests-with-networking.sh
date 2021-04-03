#!/bin/sh
set -e

export WASM_BUILD_TOOLCHAIN=nightly-2021-03-24

echo 'running all cargo tests'
cargo test --release --all -- --ignored
