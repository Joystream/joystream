#!/usr/bin/env bash

export WASM_BUILD_TOOLCHAIN=nightly-2021-02-20

FEATURES=
if [[ "$RUNTIME_PROFILE" == "TESTING" ]]; then
  FEATURES="testing_runtime"
fi

if [[ "$RUNTIME_PROFILE" == "STAGING" ]]; then
  FEATURES="staging_runtime"
fi

if [[ "$RUNTIME_PROFILE" == "PLAYGROUND" ]]; then
  FEATURES="playground_runtime"
fi

cargo +nightly-2021-02-20 build --release --features "${FEATURES}"