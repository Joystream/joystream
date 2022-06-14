#!/usr/bin/env bash

# TODO: Check for valid JSON in ALL_PROPOSALS_PARAMETERS_JSON ?

export WASM_BUILD_TOOLCHAIN=nightly-2021-02-20

cargo +nightly-2021-02-20 build --release