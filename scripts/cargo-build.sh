#!/bin/sh

export WASM_BUILD_TOOLCHAIN=nightly-2020-05-23

cargo build --release
