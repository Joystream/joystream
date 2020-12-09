#!/usr/bin/env bash

# Executes and replaces all benchmarks with the new weights

echo "Generating weights..."

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
$SCRIPT_DIR/../target/release/joystream-node benchmark \
    --pallet=* \
    --extrinsic=* \
    --chain=dev \
    --steps=50 \
    --repeat=20 \
    --execution=wasm \
    --output=.  > /dev/null

if [ $? -eq 0 ]; then
    mv $SCRIPT_DIR/../*.rs $SCRIPT_DIR/../runtime/src/weights/
    echo "Weights generated successfully"
else
    echo "There was a problem generating the new weights, check the error above"
fi
