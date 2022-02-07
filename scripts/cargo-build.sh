#!/usr/bin/env bash

export WASM_BUILD_TOOLCHAIN=nightly-2021-02-20

cargo +nightly-2021-02-20 build --release --features runtime-benchmarks
