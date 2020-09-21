#!/bin/bash

export WASM_BUILD_TOOLCHAIN=nightly-2020-05-23

mkdir -p .tmp
cargo run --release -p joystream-node build-spec --chain dev > .tmp/chainspec.json
perl -i -pe's/"setValidatorCountProposalGracePeriod":.*/"setValidatorCountProposalGracePeriod": 0,/' .tmp/chainspec.json
perl -i -pe's/"runtimeUpgradeProposalGracePeriod":.*/"runtimeUpgradeProposalGracePeriod": 0,/' .tmp/chainspec.json
perl -i -pe's/"setElectionParametersProposalGracePeriod":.*/"setElectionParametersProposalGracePeriod": 0,/' .tmp/chainspec.json
perl -i -pe's/"textProposalGracePeriod":.*/"textProposalGracePeriod": 0,/' .tmp/chainspec.json
perl -i -pe's/"setContentWorkingGroupMintCapacityProposalGracePeriod":.*/"setContentWorkingGroupMintCapacityProposalGracePeriod": 0,/' .tmp/chainspec.json
perl -i -pe's/"setLeadProposalGracePeriod":.*/"setLeadProposalGracePeriod": 0,/' .tmp/chainspec.json
perl -i -pe's/"spendingProposalGracePeriod":.*/"spendingProposalGracePeriod": 0,/' .tmp/chainspec.json
perl -i -pe's/"evictStorageProviderProposalGracePeriod":.*/"evictStorageProviderProposalGracePeriod": 0,/' .tmp/chainspec.json
perl -i -pe's/"beginReviewWorkingGroupLeaderApplicationsProposalGracePeriod":.*/"beginReviewWorkingGroupLeaderApplicationsProposalGracePeriod": 0,/' .tmp/chainspec.json
perl -i -pe's/"setStorageRoleParametersProposalGracePeriod":.*/"setStorageRoleParametersProposalGracePeriod": 0,/' .tmp/chainspec.json
