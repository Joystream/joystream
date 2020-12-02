#!/usr/bin/env bash

# Executes and replaces all benchmarks with the new weights

echo "Benchmarking proposals_discussion..."
./target/release/joystream-node benchmark --pallet=proposals_discussion --extrinsic=* --chain=dev --steps=50 --repeat=20 --execution=wasm --output=. > /dev/null
mv proposals_discussion.rs runtime/src/weights/
echo "proposals_discussion benchmarked"

echo "Benchmarking proposals_engine..."
./target/release/joystream-node benchmark --pallet=proposals_engine --extrinsic=* --chain=dev --steps=50 --repeat=20 --execution=wasm --output=. > /dev/null
mv proposals_engine.rs runtime/src/weights/
echo "proposals_engine benchmarked"

echo "Benchmarking pallet_constitution..."
./target/release/joystream-node benchmark --pallet=pallet_constitution --extrinsic=* --chain=dev --steps=50 --repeat=20 --execution=wasm --output=. > /dev/null
mv pallet_constitution.rs runtime/src/weights/
echo "pallet_constitution benchmarked"
