#!/usr/bin/env bash

# Executes and replaces all benchmarks with the new weights

SCRIPT_DIR=`dirname "${BASH_SOURCE[0]}"`

STEPS=${1:-50}
REPEAT=${2:-20}

$SCRIPT_DIR/../target/release/joystream-node purge-chain --chain prod-test -y

substrate_pallet_benchmark() {
  echo "Generating weights for $1..."
  start=`date +%s`
  ERROR=$($SCRIPT_DIR/../target/release/joystream-node benchmark pallet \
      --pallet=$1 \
      --extrinsic=* \
      --chain=prod-test \
      --steps=$STEPS \
      --repeat=$REPEAT \
      --execution=wasm \
      --template=$SCRIPT_DIR/../devops/frame-weight-template.hbs \
      --output=$SCRIPT_DIR/../runtime/src/weights/$1.rs 2>&1 > /dev/null)

  if [[ $ERROR != *"Error"* ]]; then
      end=`date +%s`
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
      --chain=prod-test \
      --steps=$STEPS \
      --repeat=$REPEAT \
      --execution=wasm \
      --template=$SCRIPT_DIR/../devops/joystream-pallet-weight-template.hbs \
      --output=$SCRIPT_DIR/../runtime-modules/$2/src/weights.rs 2>&1 > /dev/null)

  if [[ $ERROR != *"Error"* ]]; then
      end=`date +%s`
      echo "Weights generated successfully for $1"
      echo "It took $((end-start)) seconds"
  else
      >&2 echo "$ERROR"
      >&2 echo "There was a problem generating the weights for $1, check the error above"
      exit 1
  fi
}

overhead_benchmarks() {
  echo "Generating core weights"
  start=`date +%s`
  ERROR=$($SCRIPT_DIR/../target/release/joystream-node benchmark overhead \
      --chain=prod-test \
      --execution=wasm \
      --warmup=10 \
      --repeat=100 \
      --weight-path=$SCRIPT_DIR/../runtime/src/weights)

  if [[ $ERROR != *"Error"* ]]; then
      end=`date +%s`
      echo "Core weights generated successfully"
      echo "It took $((end-start)) seconds"
  else
      >&2 echo "$ERROR"
      >&2 echo "There was a problem generating core weights check the error above"
      exit 1
  fi
}

storage_benchmarks() {
  echo "Generating storage weights"
  start=`date +%s`
  ERROR=$($SCRIPT_DIR/../target/release/joystream-node benchmark storage \
      --chain=prod-test \
      --warmups=100 \
      --weight-path=$SCRIPT_DIR/../runtime/src/weights/ \
      --state-version 1)

  if [[ $ERROR != *"Error"* ]]; then
      end=`date +%s`
      echo "Storage weights generated successfully"
      echo "It took $((end-start)) seconds"
  else
      >&2 echo "$ERROR"
      >&2 echo "There was a problem generating storage weights check the error above"
      exit 1
  fi
}

# RocksDb Weights
storage_benchmarks

# Generate core weights -> BlockExecutionWeight and ExtrinsicBaseWeight
overhead_benchmarks

# FRAME benchmarks
substrate_pallet_benchmark frame_system
substrate_pallet_benchmark substrate_utility
substrate_pallet_benchmark pallet_session
substrate_pallet_benchmark pallet_timestamp
substrate_pallet_benchmark pallet_vesting
substrate_pallet_benchmark pallet_multisig
substrate_pallet_benchmark pallet_bags_list
substrate_pallet_benchmark pallet_election_provider_multi_phase
# substrate_pallet_benchmark pallet_election_provider_support_benchmarking
substrate_pallet_benchmark pallet_staking
substrate_pallet_benchmark pallet_balances
substrate_pallet_benchmark pallet_im_online

# Joystrem benchmarks
joystream_pallet_benchmark proposals_discussion proposals/discussion
joystream_pallet_benchmark proposals_engine proposals/engine
joystream_pallet_benchmark proposals_codex proposals/codex
joystream_pallet_benchmark pallet_constitution constitution
joystream_pallet_benchmark working_group working-group
joystream_pallet_benchmark council council
joystream_pallet_benchmark referendum referendum
joystream_pallet_benchmark forum forum
joystream_pallet_benchmark membership membership
joystream_pallet_benchmark bounty bounty
joystream_pallet_benchmark joystream_utility utility
joystream_pallet_benchmark storage storage
joystream_pallet_benchmark content content
joystream_pallet_benchmark project_token project-token
