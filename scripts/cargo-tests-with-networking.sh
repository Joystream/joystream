#!/bin/sh
set -e

export WASM_BUILD_TOOLCHAIN=nightly-2021-02-20

echo 'running all cargo tests'
cargo +nightly-2021-02-20 test --release --all -- --ignored
