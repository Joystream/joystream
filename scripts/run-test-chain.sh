#!/bin/bash
cargo run --release -p joystream-node build-spec --chain dev > chainspec.json
sed -i 's/"setValidatorCountProposalGracePeriod":.*/"setValidatorCountProposalGracePeriod": 0,/' chainspec.json
sed -i 's/"runtimeUpgradeProposalGracePeriod":.*/"runtimeUpgradeProposalGracePeriod": 0,/' chainspec.json
sed -i 's/"setElectionParametersProposalGracePeriod":.*/"setElectionParametersProposalGracePeriod": 0,/' chainspec.json
sed -i 's/"textProposalGracePeriod":.*/"textProposalGracePeriod": 0,/' chainspec.json
sed -i 's/"setContentWorkingGroupMintCapacityProposalGracePeriod":.*/"setContentWorkingGroupMintCapacityProposalGracePeriod": 0,/' chainspec.json
sed -i 's/"setLeadProposalGracePeriod":.*/"setLeadProposalGracePeriod": 0,/' chainspec.json
sed -i 's/"spendingProposalGracePeriod":.*/"spendingProposalGracePeriod": 0,/' chainspec.json
sed -i 's/"evictStorageProviderProposalGracePeriod":.*/"evictStorageProviderProposalGracePeriod": 0,/' chainspec.json
sed -i 's/"setStorageRoleParametersProposalGracePeriod":.*/"setStorageRoleParametersProposalGracePeriod": 0/' chainspec.json
yes | cargo run --release -p joystream-node -- purge-chain --dev
cargo run --release -p joystream-node -- --chain=chainspec.json --alice --validator
