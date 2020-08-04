#!/bin/bash
sh ./scripts/create-test-chainspec.sh
yes | cargo run --release -p joystream-node -- purge-chain --dev
cargo run --release -p joystream-node -- --chain=.tmp/chainspec.json --alice --validator
