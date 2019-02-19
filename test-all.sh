#!/usr/bin/env bash

# Save current directory.
pushd . >/dev/null

echo "Run all runtime tests..."
cd ./runtime
cargo test --all

# Restore initial directory.
popd >/dev/null
