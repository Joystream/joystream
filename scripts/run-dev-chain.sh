#!/usr/bin/env bash

# Build release binary
cargo +nightly build --release -p joystream-node

# Purge existing local chain
yes | cargo +nightly run --release -p joystream-node -- purge-chain --dev

# Run local development chain
cargo +nightly run --release -p joystream-node -- --dev
