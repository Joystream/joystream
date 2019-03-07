#!/usr/bin/env bash

./build-runtime.sh
cargo build
cargo run -- purge-chain --dev
cargo run -- --dev
