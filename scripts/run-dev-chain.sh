#!/usr/bin/env bash

# Build release binary
cargo build --release -p joystream-node

# Purge existing local chain
yes | cargo run --release -p joystream-node -- purge-chain --dev

# Run local development chain
cargo run --release -p joystream-node -- --dev
