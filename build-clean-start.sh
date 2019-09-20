#!/usr/bin/env bash

cargo build
cargo run -- purge-chain --dev
cargo run -- --dev
