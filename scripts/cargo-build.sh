#!/usr/bin/env bash

export WASM_BUILD_TOOLCHAIN=nightly-2021-03-24

cargo +nightly-2021-03-24 build --release
