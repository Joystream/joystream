#!/usr/bin/env bash

# Executes and replaces all benchmarks with the new weights

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")

STEPS=${1:-50}
REPEAT=${2:-20}

benchmark() {
  echo "Generating weights for $1..."
  start=`date +%s`
  ERROR=$($SCRIPT_DIR/../target/release/joystream-node benchmark \
      --pallet=$1 \
      --extrinsic=* \
      --chain=dev \
      --steps=$STEPS \
      --repeat=$REPEAT \
      --execution=wasm \
      --output=. 2>&1 > /dev/null)


  if [[ $ERROR != *"Error"* ]]; then
      end=`date +%s`
      mv $SCRIPT_DIR/../*.rs $SCRIPT_DIR/../runtime/src/weights/
      echo "Weights generated successfully for $1"
      echo "It took $((end-start)) seconds"
  else
      >&2 echo "$ERROR"
      >&2 echo "There was a problem generating the weights for $1, check the error above"
      exit 1
  fi
}

# FRAME benchmarks
# Some FRAME pallets are commented out since the parameter's in some of the extrinsic's
# benchmarking are being discarded and we can't adjust the trait since it's part of
# Substrate. This problem has been fixed in this PR: https://github.com/paritytech/substrate/pull/7233
# So uncomment this when we move to a version that contains that PR.
# See issue: #1979
benchmark frame_system
benchmark substrate_utility
benchmark pallet_session
benchmark pallet_timestamp

# Pallet staking benchmarking takes too long.
# benchmark pallet_staking

# Benchmark should be run on the reference machine because it affects the fee model (transfer fee).
# benchmark pallet_balances

# This benchmark takes too long with 50 steps and 20 repeats in a normal laptop.
# Will have it commented out until we test it in the reference machine. If there
# it still takes too long we will get rid of this benchmark for good and use always
# the default weights.
# benchmark pallet_im_online

# Joystrem benchmarks
benchmark proposals_discussion
benchmark proposals_engine
benchmark proposals_codex
benchmark pallet_constitution
benchmark working_group
benchmark council
benchmark referendum
benchmark forum
benchmark membership
benchmark bounty
benchmark blog
benchmark joystream_utility
#benchmark storage
