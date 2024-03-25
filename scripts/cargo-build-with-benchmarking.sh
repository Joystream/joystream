#!/usr/bin/env bash
set -e

SCRIPT_PATH=`dirname "${BASH_SOURCE[0]}"`
cd $SCRIPT_PATH

export WASM_BUILD_TOOLCHAIN=nightly-2022-11-15

cargo +nightly-2022-11-15 build --release --features runtime-benchmarks
