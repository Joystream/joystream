#!/usr/bin/env bash

echo "Initialising webassembly build environment..."
./init-wasm.sh 2>/dev/null >/dev/null

./build.sh

echo "Building node..."
cargo build --release
