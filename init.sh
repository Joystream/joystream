#!/usr/bin/env bash

echo "Initialising webassembly build environment..."
./init-wasm.sh 2>/dev/null >/dev/null

./build-runtime.sh

./build-node.sh
