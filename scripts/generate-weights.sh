#!/usr/bin/env bash

# Executes and replaces all benchmarks with the new weights


SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")

benchmark() {
  echo "Generating weights for $1..."
  start=`date +%s`
  $SCRIPT_DIR/../target/release/joystream-node benchmark \
      --pallet=$1 \
      --extrinsic=* \
      --chain=dev \
      --steps=5 \
      --repeat=2 \
      --execution=wasm \
      --output=.  > /dev/null

  end=`date +%s`

  if [ $? -eq 0 ]; then
      mv $SCRIPT_DIR/../*.rs $SCRIPT_DIR/../runtime/src/weights/
      echo "Weights generated successfully for $1"
      echo "It took $((end-start)) seconds"
  else
      echo "There was a problem generating the weights for $1, check the error above"
  fi
}

# FRAME benchmarks
benchmark frame_system
benchmark pallet_utility
benchmark pallet_timestamp
benchmark pallet_session
benchmark pallet_im_online

# Joystrem benchmarks
benchmark proposals_discussion
benchmark proposals_engine
benchmark pallet_constitution
benchmark working_group
