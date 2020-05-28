#!/bin/bash
cargo run --release -p joystream-node build-spec --chain dev > chainspec.json
perl -i -pe's/"setValidatorCountProposalGracePeriod":.*/"setValidatorCountProposalGracePeriod": 0,/' chainspec.json
perl -i -pe's/"runtimeUpgradeProposalGracePeriod":.*/"runtimeUpgradeProposalGracePeriod": 0,/' chainspec.json
perl -i -pe's/"setElectionParametersProposalGracePeriod":.*/"setElectionParametersProposalGracePeriod": 0,/' chainspec.json
perl -i -pe's/"textProposalGracePeriod":.*/"textProposalGracePeriod": 0,/' chainspec.json
perl -i -pe's/"setContentWorkingGroupMintCapacityProposalGracePeriod":.*/"setContentWorkingGroupMintCapacityProposalGracePeriod": 0,/' chainspec.json
perl -i -pe's/"setLeadProposalGracePeriod":.*/"setLeadProposalGracePeriod": 0,/' chainspec.json
perl -i -pe's/"spendingProposalGracePeriod":.*/"spendingProposalGracePeriod": 0,/' chainspec.json
perl -i -pe's/"evictStorageProviderProposalGracePeriod":.*/"evictStorageProviderProposalGracePeriod": 0,/' chainspec.json
perl -i -pe's/"setStorageRoleParametersProposalGracePeriod":.*/"setStorageRoleParametersProposalGracePeriod": 0/' chainspec.json
yes | cargo run --release -p joystream-node -- purge-chain --dev
cargo run --release -p joystream-node -- --chain=chainspec.json --alice --validator
