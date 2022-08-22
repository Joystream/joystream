#!/usr/bin/env bash

# Executes and replaces all benchmarks with the new weights

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")

STEPS=${1:-50}
REPEAT=${2:-20}

substrate_pallet_benchmark() {
  echo "Generating weights for $1..."
  start=`date +%s`
  ERROR=$($SCRIPT_DIR/../target/release/joystream-node benchmark pallet \
      --pallet=$1 \
      --extrinsic=* \
      --chain=dev \
      --steps=$STEPS \
      --repeat=$REPEAT \
      --execution=native \
      --template=$SCRIPT_DIR/../devops/frame-weight-template.hbs \
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

# $1 pallet name
# $2 folder name under runtime-modules/ of the pallet crate where weight.rs
# will be copied to
joystream_pallet_benchmark() {
  echo "Generating weights for $1..."
  start=`date +%s`
  ERROR=$($SCRIPT_DIR/../target/release/joystream-node benchmark pallet \
      --pallet=$1 \
      --extrinsic=* \
      --chain=dev \
      --steps=$STEPS \
      --repeat=$REPEAT \
      --execution=native \
      --template=$SCRIPT_DIR/../devops/joystream-pallet-weight-template.hbs \
      --output=. 2>&1 > /dev/null)

  if [[ $ERROR != *"Error"* ]]; then
      end=`date +%s`
      mv $SCRIPT_DIR/../$1.rs $SCRIPT_DIR/../runtime-modules/$2/src/weights.rs
      echo "Weights generated successfully for $1"
      echo "It took $((end-start)) seconds"
  else
      >&2 echo "$ERROR"
      >&2 echo "There was a problem generating the weights for $1, check the error above"
      exit 1
  fi
}

# FRAME benchmarks
# substrate_pallet_benchmark frame_system
# substrate_pallet_benchmark substrate_utility
# substrate_pallet_benchmark pallet_session
# substrate_pallet_benchmark pallet_timestamp
# substrate_pallet_benchmark pallet_vesting

# # Module staking benchmarking takes too long.
# substrate_pallet_benchmark pallet_staking

# # Benchmark should be run on the reference machine because it affects the fee model (transfer fee).
# substrate_pallet_benchmark pallet_balances

# # This benchmark takes too long with 50 steps and 20 repeats in a normal laptop.
# # Will have it commented out until we test it in the reference machine. If there
# # it still takes too long we will get rid of this benchmark for good and use always
# # the default weights.
# substrate_pallet_benchmark pallet_im_online

# # Joystrem benchmarks
# joystream_pallet_benchmark proposals_discussion proposals/discussion
# joystream_pallet_benchmark proposals_engine proposals/engine
# joystream_pallet_benchmark proposals_codex proposals/codex
# joystream_pallet_benchmark pallet_constitution constitution
# joystream_pallet_benchmark working_group working-group
# joystream_pallet_benchmark council council
# joystream_pallet_benchmark referendum referendum
# joystream_pallet_benchmark forum forum
# joystream_pallet_benchmark membership membership
# # Disabled until we merge new bounty module
# # joystream_pallet_benchmark bounty bounty
# joystream_pallet_benchmark joystream_utility utility
# joystream_pallet_benchmark storage storage
joystream_pallet_benchmark content content
# joystream_pallet_benchmark project_token project-token
