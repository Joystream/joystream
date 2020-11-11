//! # Proposals codex module
//! Proposals `codex` module for the Joystream platform. Version 3.
//! Component of the proposals system. It contains preset proposal types.
//!
//! ## Overview
//!
//! The proposals codex module serves as a facade and entry point of the proposals system. It uses
//! proposals `engine` module to maintain a lifecycle of the proposal and to execute proposals.
//! During the proposal creation, `codex` also create a discussion thread using the `discussion`
//! proposals module. `Codex` uses predefined parameters (eg.:`voting_period`) for each proposal and
//! encodes extrinsic calls from dependency modules in order to create proposals inside the `engine`
//! module. For each proposal, [its crucial details](./enum.ProposalDetails.html) are saved to the
//! `ProposalDetailsByProposalId` map.
//!
//! ### General proposals
//! - [create_text_proposal](./struct.Module.html#method.create_text_proposal)
//! - [create_runtime_upgrade_proposal](./struct.Module.html#method.create_runtime_upgrade_proposal)
//! - [create_set_validator_count_proposal](./struct.Module.html#method.create_set_validator_count_proposal)
//!
//! ### Council and election proposals
//! - [create_set_election_parameters_proposal](./struct.Module.html#method.create_set_election_parameters_proposal)
//! - [create_spending_proposal](./struct.Module.html#method.create_spending_proposal)
//!
//! ### Working group proposals
//! - [create_add_working_group_leader_opening_proposal](./struct.Module.html#method.create_add_working_group_leader_opening_proposal)
//! - [create_begin_review_working_group_leader_applications_proposal](./struct.Module.html#method.create_begin_review_working_group_leader_applications_proposal)
//! - [create_fill_working_group_leader_opening_proposal](./struct.Module.html#method.create_fill_working_group_leader_opening_proposal)
//! - [create_set_working_group_mint_capacity_proposal](./struct.Module.html#method.create_set_working_group_mint_capacity_proposal)
//! - [create_decrease_working_group_leader_stake_proposal](./struct.Module.html#method.create_decrease_working_group_leader_stake_proposal)
//! - [create_slash_working_group_leader_stake_proposal](./struct.Module.html#method.create_slash_working_group_leader_stake_proposal)
//! - [create_set_working_group_leader_reward_proposal](./struct.Module.html#method.create_set_working_group_leader_reward_proposal)
//! - [create_terminate_working_group_leader_role_proposal](./struct.Module.html#method.create_terminate_working_group_leader_role_proposal)
//!
//! ### Proposal implementations of this module
//! - execute_text_proposal - prints the proposal to the log
//! - execute_runtime_upgrade_proposal - sets the runtime code
//!
//! ### Dependencies:
//! - [proposals engine](../substrate_proposals_engine_module/index.html)
//! - [proposals discussion](../substrate_proposals_discussion_module/index.html)
//! - [membership](../substrate_membership_module/index.html)
//! - [governance](../substrate_governance_module/index.html)
//! - [content_working_group](../substrate_content_working_group_module/index.html)
//!
//! ### Notes
//! The module uses [ProposalEncoder](./trait.ProposalEncoder.html) to encode the proposal using
//! its details. Encoded byte vector is passed to the _proposals engine_ as serialized executable code.

// `decl_module!` does a lot of recursion and requires us to increase the limit to 256.
#![recursion_limit = "256"]
// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
// Disable this lint warning because Substrate generates function without an alias for the ProposalDetailsOf type.
#![allow(clippy::too_many_arguments)]

// Do not delete! Cannot be uncommented by default, because of Parity decl_module! issue.
// #![warn(missing_docs)]

mod proposal_types;

#[cfg(test)]
mod tests;

use frame_support::dispatch::DispatchResult;
use frame_support::traits::{Currency, Get};
use frame_support::{decl_error, decl_module, decl_storage, ensure, print, StorageValue};
use sp_arithmetic::traits::Zero;
use sp_std::clone::Clone;
use sp_std::str::from_utf8;
use sp_std::vec::Vec;
use system::ensure_root;

use common::origin::ActorOriginValidator;
use common::working_group::WorkingGroup;
use governance::election_params::ElectionParameters;
use proposals_discussion::ThreadMode;
use proposals_engine::{
    BalanceOf, ProposalCreationParameters, ProposalObserver, ProposalParameters,
};

pub use crate::proposal_types::{
    AddOpeningParameters, FillOpeningParameters, ProposalsConfigParameters, TerminateRoleParameters,
};
pub use proposal_types::{ProposalDetails, ProposalDetailsOf, ProposalEncoder};

// 'Set working group mint capacity' proposal limit
const WORKING_GROUP_MINT_CAPACITY_MAX_VALUE: u32 = 5_000_000;
// Max allowed value for 'spending' proposal
const MAX_SPENDING_PROPOSAL_VALUE: u32 = 5_000_000_u32;
// Max validator count for the 'set validator count' proposal
const MAX_VALIDATOR_COUNT: u32 = 100;

// Data container struct to fix linter warning 'too many arguments for the function' for the
// create_proposal() function.
struct CreateProposalParameters<T: Trait> {
    pub origin: T::Origin,
    pub member_id: MemberId<T>,
    pub title: Vec<u8>,
    pub description: Vec<u8>,
    pub staking_account_id: Option<T::AccountId>,
    pub proposal_code: Vec<u8>,
    pub proposal_parameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>,
    pub proposal_details: ProposalDetailsOf<T>,
    pub exact_execution_block: Option<T::BlockNumber>,
}

/// 'Proposals codex' substrate module Trait
pub trait Trait:
    system::Trait
    + proposals_engine::Trait
    + proposals_discussion::Trait
    + membership::Trait
    + governance::election::Trait
    + hiring::Trait
    + staking::Trait
{
    /// Defines max allowed text proposal length.
    type TextProposalMaxLength: Get<u32>;

    /// Defines max wasm code length of the runtime upgrade proposal.
    type RuntimeUpgradeWasmProposalMaxLength: Get<u32>;

    /// Validates member id and origin combination
    type MembershipOriginValidator: ActorOriginValidator<
        Self::Origin,
        MemberId<Self>,
        Self::AccountId,
    >;

    /// Encodes the proposal usint its details
    type ProposalEncoder: ProposalEncoder<Self>;

    /// 'Set validator count' proposal parameters
    type SetValidatorCountProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;
}

/// Balance alias for GovernanceCurrency from `common` module. TODO: replace with BalanceOf
pub type BalanceOfGovernanceCurrency<T> =
    <<T as common::currency::GovernanceCurrency>::Currency as Currency<
        <T as system::Trait>::AccountId,
    >>::Balance;

/// Balance alias for token mint balance from `token mint` module. TODO: replace with BalanceOf
pub type BalanceOfMint<T> =
    <<T as minting::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

type MemberId<T> = <T as membership::Trait>::MemberId;

decl_error! {
    /// Codex module predefined errors
    pub enum Error for Module<T: Trait> {
        /// The size of the provided text for text proposal exceeded the limit
        TextProposalSizeExceeded,

        /// Provided text for text proposal is empty
        TextProposalIsEmpty,

        /// The size of the provided WASM code for the runtime upgrade proposal exceeded the limit
        RuntimeProposalSizeExceeded,

        /// Provided WASM code for the runtime upgrade proposal is empty
        RuntimeProposalIsEmpty,

        /// Invalid balance value for the spending proposal
        InvalidSpendingProposalBalance,

        /// Invalid validator count for the 'set validator count' proposal
        InvalidValidatorCount,

        /// Require root origin in extrinsics
        RequireRootOrigin,

        /// Invalid council election parameter - council_size
        InvalidCouncilElectionParameterCouncilSize,

        /// Invalid council election parameter - candidacy-limit
        InvalidCouncilElectionParameterCandidacyLimit,

        /// Invalid council election parameter - min-voting_stake
        InvalidCouncilElectionParameterMinVotingStake,

        /// Invalid council election parameter - new_term_duration
        InvalidCouncilElectionParameterNewTermDuration,

        /// Invalid council election parameter - min_council_stake
        InvalidCouncilElectionParameterMinCouncilStake,

        /// Invalid council election parameter - revealing_period
        InvalidCouncilElectionParameterRevealingPeriod,

        /// Invalid council election parameter - voting_period
        InvalidCouncilElectionParameterVotingPeriod,

        /// Invalid council election parameter - announcing_period
        InvalidCouncilElectionParameterAnnouncingPeriod,

        /// Invalid content working group mint capacity parameter
        InvalidContentWorkingGroupMintCapacity,

        /// Invalid working group mint capacity parameter
        InvalidWorkingGroupMintCapacity,

        /// Invalid 'set lead proposal' parameter - proposed lead cannot be a councilor
        InvalidSetLeadParameterCannotBeCouncilor,

        /// Invalid 'slash stake proposal' parameter - cannot slash by zero balance.
        SlashingStakeIsZero,

        /// Invalid 'decrease stake proposal' parameter - cannot decrease by zero balance.
        DecreasingStakeIsZero,
    }
}

// Storage for the proposals codex module
decl_storage! {
    pub trait Store for Module<T: Trait> as ProposalCodex{
        /// Map proposal id to its discussion thread id
        pub ThreadIdByProposalId get(fn thread_id_by_proposal_id):
            map hasher(blake2_128_concat) T::ProposalId => T::ThreadId;

        /// Map proposal id to proposal details
        pub ProposalDetailsByProposalId get(fn proposal_details_by_proposal_id):
            map hasher(blake2_128_concat) T::ProposalId => ProposalDetailsOf<T>;

        /// Voting period for the 'runtime upgrade' proposal
        pub RuntimeUpgradeProposalVotingPeriod get(fn runtime_upgrade_proposal_voting_period)
            config(): T::BlockNumber;

        /// Grace period for the 'runtime upgrade' proposal
        pub RuntimeUpgradeProposalGracePeriod get(fn runtime_upgrade_proposal_grace_period)
            config(): T::BlockNumber;

        /// Voting period for the 'text' proposal
        pub TextProposalVotingPeriod get(fn text_proposal_voting_period) config(): T::BlockNumber;

        /// Grace period for the 'text' proposal
        pub TextProposalGracePeriod get(fn text_proposal_grace_period) config(): T::BlockNumber;

        /// Voting period for the 'spending' proposal
        pub SpendingProposalVotingPeriod get(fn spending_proposal_voting_period) config(): T::BlockNumber;

        /// Grace period for the 'spending' proposal
        pub SpendingProposalGracePeriod get(fn spending_proposal_grace_period) config(): T::BlockNumber;

        /// Voting period for the 'add working group opening' proposal
        pub AddWorkingGroupOpeningProposalVotingPeriod get(fn add_working_group_opening_proposal_voting_period) config(): T::BlockNumber;

        /// Grace period for the 'add working group opening' proposal
        pub AddWorkingGroupOpeningProposalGracePeriod get(fn add_working_group_opening_proposal_grace_period) config(): T::BlockNumber;

        /// Voting period for the 'begin review working group leader applications' proposal
        pub BeginReviewWorkingGroupLeaderApplicationsProposalVotingPeriod get(fn begin_review_working_group_leader_applications_proposal_voting_period) config(): T::BlockNumber;

        /// Grace period for the 'begin review working group leader applications' proposal
        pub BeginReviewWorkingGroupLeaderApplicationsProposalGracePeriod get(fn begin_review_working_group_leader_applications_proposal_grace_period) config(): T::BlockNumber;

        /// Voting period for the 'fill working group leader opening' proposal
        pub FillWorkingGroupLeaderOpeningProposalVotingPeriod get(fn fill_working_group_leader_opening_proposal_voting_period) config(): T::BlockNumber;

        /// Grace period for the 'fill working group leader opening' proposal
        pub FillWorkingGroupLeaderOpeningProposalGracePeriod get(fn fill_working_group_leader_opening_proposal_grace_period) config(): T::BlockNumber;

        /// Voting period for the 'set working group mint capacity' proposal
        pub SetWorkingGroupMintCapacityProposalVotingPeriod get(fn set_working_group_mint_capacity_proposal_voting_period)
            config(): T::BlockNumber;

        /// Grace period for the 'set working group mint capacity' proposal
        pub SetWorkingGroupMintCapacityProposalGracePeriod get(fn set_working_group_mint_capacity_proposal_grace_period)
            config(): T::BlockNumber;

        /// Voting period for the 'decrease working group leader stake' proposal
        pub DecreaseWorkingGroupLeaderStakeProposalVotingPeriod get(fn decrease_working_group_leader_stake_proposal_voting_period)
            config(): T::BlockNumber;

        /// Grace period for the 'decrease working group leader stake' proposal
        pub DecreaseWorkingGroupLeaderStakeProposalGracePeriod get(fn decrease_working_group_leader_stake_proposal_grace_period)
            config(): T::BlockNumber;

        /// Voting period for the 'slash working group leader stake' proposal
        pub SlashWorkingGroupLeaderStakeProposalVotingPeriod get(fn slash_working_group_leader_stake_proposal_voting_period)
            config(): T::BlockNumber;

        /// Grace period for the 'slash working group leader stake' proposal
        pub SlashWorkingGroupLeaderStakeProposalGracePeriod get(fn slash_working_group_leader_stake_proposal_grace_period)
            config(): T::BlockNumber;

        /// Voting period for the 'set working group leader reward' proposal
        pub SetWorkingGroupLeaderRewardProposalVotingPeriod get(fn set_working_group_leader_reward_proposal_voting_period)
            config(): T::BlockNumber;

        /// Grace period for the 'set working group leader reward' proposal
        pub SetWorkingGroupLeaderRewardProposalGracePeriod get(fn set_working_group_leader_reward_proposal_grace_period)
            config(): T::BlockNumber;

        /// Voting period for the 'terminate working group leader role' proposal
        pub TerminateWorkingGroupLeaderRoleProposalVotingPeriod get(fn terminate_working_group_leader_role_proposal_voting_period)
            config(): T::BlockNumber;

        /// Grace period for the 'terminate working group leader role' proposal
        pub TerminateWorkingGroupLeaderRoleProposalGracePeriod get(fn terminate_working_group_leader_role_proposal_grace_period)
            config(): T::BlockNumber;

        /// Voting period for the 'amend constitution' proposal
        pub AmendConstitutionProposalVotingPeriod get(fn amend_constitution_proposal_voting_period)
            config(): T::BlockNumber;

        /// Grace period for the 'amend constitution' proposal
        pub AmendConstitutionProposalGracePeriod get(fn amend_constitution_proposal_grace_period)
            config(): T::BlockNumber;
    }
}

decl_module! {
    /// Proposal codex substrate module Call
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        /// Exports max allowed text proposal length const.
        const TextProposalMaxLength: u32 = T::TextProposalMaxLength::get();

        /// Exports max wasm code length of the runtime upgrade proposal const.
        const RuntimeUpgradeWasmProposalMaxLength: u32 = T::RuntimeUpgradeWasmProposalMaxLength::get();

        // Runtime upgrade summary:
        //  - add values for the new 'amend constitution' proposal.
        fn on_runtime_upgrade() -> frame_support::weights::Weight {
            <AmendConstitutionProposalVotingPeriod<T>>::put::<T::BlockNumber>(72_000u32.into());
            <AmendConstitutionProposalGracePeriod<T>>::put::<T::BlockNumber>(0u32.into());

            10_000_000u64 // TODO: adjust weight
        }

        /// Create 'Text (signal)' proposal type.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_text_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            staking_account_id: Option<T::AccountId>,
            text: Vec<u8>,
            exact_execution_block: Option<T::BlockNumber>,
        ) {
            ensure!(!text.is_empty(), Error::<T>::TextProposalIsEmpty);
            ensure!(text.len() as u32 <=  T::TextProposalMaxLength::get(),
                Error::<T>::TextProposalSizeExceeded);

            let proposal_details = ProposalDetails::Text(text);
            let params = CreateProposalParameters{
                origin,
                member_id,
                title,
                description,
                staking_account_id,
                proposal_details: proposal_details.clone(),
                proposal_parameters: proposal_types::parameters::text_proposal::<T>(),
                proposal_code: T::ProposalEncoder::encode_proposal(proposal_details),
                exact_execution_block
            };

            Self::create_proposal(params)?;
        }

        /// Create 'Runtime upgrade' proposal type. Runtime upgrade can be initiated only by
        /// members from the hardcoded list `RuntimeUpgradeProposalAllowedProposers`
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_runtime_upgrade_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            staking_account_id: Option<T::AccountId>,
            wasm: Vec<u8>,
            exact_execution_block: Option<T::BlockNumber>,
        ) {
            ensure!(!wasm.is_empty(), Error::<T>::RuntimeProposalIsEmpty);
            ensure!(wasm.len() as u32 <= T::RuntimeUpgradeWasmProposalMaxLength::get(),
                Error::<T>::RuntimeProposalSizeExceeded);

            let proposal_details = ProposalDetails::RuntimeUpgrade(wasm);
            let params = CreateProposalParameters{
                origin,
                member_id,
                title,
                description,
                staking_account_id,
                proposal_details: proposal_details.clone(),
                proposal_parameters: proposal_types::parameters::runtime_upgrade_proposal::<T>(),
                proposal_code: T::ProposalEncoder::encode_proposal(proposal_details),
                exact_execution_block,
            };

            Self::create_proposal(params)?;
        }

        /// Create 'Spending' proposal type.
        /// This proposal uses `spend_from_council_mint()` extrinsic from the `governance::council`  module.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_spending_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            staking_account_id: Option<T::AccountId>,
            balance: BalanceOfMint<T>,
            destination: T::AccountId,
            exact_execution_block: Option<T::BlockNumber>,
        ) {
            ensure!(balance != BalanceOfMint::<T>::zero(), Error::<T>::InvalidSpendingProposalBalance);
            ensure!(
                balance <= <BalanceOfMint<T>>::from(MAX_SPENDING_PROPOSAL_VALUE),
                Error::<T>::InvalidSpendingProposalBalance
            );

            let proposal_details = ProposalDetails::Spending(balance, destination);
            let params = CreateProposalParameters{
                origin,
                member_id,
                title,
                description,
                staking_account_id,
                proposal_details: proposal_details.clone(),
                proposal_parameters: proposal_types::parameters::spending_proposal::<T>(),
                proposal_code: T::ProposalEncoder::encode_proposal(proposal_details),
                exact_execution_block,
            };

            Self::create_proposal(params)?;
        }

        /// Create 'Evict storage provider' proposal type.
        /// This proposal uses `set_validator_count()` extrinsic from the Substrate `staking`  module.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_set_validator_count_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            staking_account_id: Option<T::AccountId>,
            new_validator_count: u32,
            exact_execution_block: Option<T::BlockNumber>,
        ) {
            ensure!(
                new_validator_count >= <staking::Module<T>>::minimum_validator_count(),
                Error::<T>::InvalidValidatorCount
            );

            ensure!(
                new_validator_count <= MAX_VALIDATOR_COUNT,
                Error::<T>::InvalidValidatorCount
            );

            let proposal_details = ProposalDetails::SetValidatorCount(new_validator_count);
            let params = CreateProposalParameters{
                origin,
                member_id,
                title,
                description,
                staking_account_id,
                proposal_details: proposal_details.clone(),
                proposal_parameters: T::SetValidatorCountProposalParameters::get(),
                proposal_code: T::ProposalEncoder::encode_proposal(proposal_details),
                exact_execution_block,
            };

            Self::create_proposal(params)?;
        }

        /// Create 'Add working group leader opening' proposal type.
        /// This proposal uses `add_opening()` extrinsic from the Joystream `working group` module.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_add_working_group_leader_opening_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            staking_account_id: Option<T::AccountId>,
            add_opening_parameters: AddOpeningParameters<T::BlockNumber, BalanceOfGovernanceCurrency<T>>,
            exact_execution_block: Option<T::BlockNumber>,
        ) {
            let proposal_details = ProposalDetails::AddWorkingGroupLeaderOpening(add_opening_parameters);
            let params = CreateProposalParameters{
                origin,
                member_id,
                title,
                description,
                staking_account_id,
                proposal_details: proposal_details.clone(),
                proposal_parameters: proposal_types::parameters::add_working_group_leader_opening_proposal::<T>(),
                proposal_code: T::ProposalEncoder::encode_proposal(proposal_details),
                exact_execution_block,
            };

            Self::create_proposal(params)?;
        }

        /// Create 'Begin review working group leader applications' proposal type.
        /// This proposal uses `begin_applicant_review()` extrinsic from the Joystream `working group` module.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_begin_review_working_group_leader_applications_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            staking_account_id: Option<T::AccountId>,
            opening_id: working_group::OpeningId<T>,
            working_group: WorkingGroup,
            exact_execution_block: Option<T::BlockNumber>,
        ) {
            let proposal_details = ProposalDetails::BeginReviewWorkingGroupLeaderApplications(opening_id, working_group);
            let params = CreateProposalParameters{
                origin,
                member_id,
                title,
                description,
                staking_account_id,
                proposal_details: proposal_details.clone(),
                proposal_parameters: proposal_types::parameters::begin_review_working_group_leader_applications_proposal::<T>(),
                proposal_code: T::ProposalEncoder::encode_proposal(proposal_details),
                exact_execution_block,
            };

            Self::create_proposal(params)?;
        }

        /// Create 'Fill working group leader opening' proposal type.
        /// This proposal uses `fill_opening()` extrinsic from the Joystream `working group` module.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_fill_working_group_leader_opening_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            staking_account_id: Option<T::AccountId>,
            fill_opening_parameters: FillOpeningParameters<
                T::BlockNumber,
                BalanceOfMint<T>,
                working_group::OpeningId<T>,
                working_group::ApplicationId<T>
            >,
            exact_execution_block: Option<T::BlockNumber>,
        ) {
            let proposal_details = ProposalDetails::FillWorkingGroupLeaderOpening(fill_opening_parameters);
            let params = CreateProposalParameters{
                origin,
                member_id,
                title,
                description,
                staking_account_id,
                proposal_details: proposal_details.clone(),
                proposal_parameters: proposal_types::parameters::fill_working_group_leader_opening_proposal::<T>(),
                proposal_code: T::ProposalEncoder::encode_proposal(proposal_details),
                exact_execution_block,
            };

            Self::create_proposal(params)?;
        }

        /// Create 'Set working group mint capacity' proposal type.
        /// This proposal uses `set_mint_capacity()` extrinsic from the `working-group`  module.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_set_working_group_mint_capacity_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            staking_account_id: Option<T::AccountId>,
            mint_balance: BalanceOfMint<T>,
            working_group: WorkingGroup,
            exact_execution_block: Option<T::BlockNumber>,
        ) {
            ensure!(
                mint_balance <= <BalanceOfMint<T>>::from(WORKING_GROUP_MINT_CAPACITY_MAX_VALUE),
                Error::<T>::InvalidWorkingGroupMintCapacity
            );

            let proposal_details = ProposalDetails::SetWorkingGroupMintCapacity(mint_balance, working_group);
            let params = CreateProposalParameters{
                origin,
                member_id,
                title,
                description,
                staking_account_id,
                proposal_details: proposal_details.clone(),
                proposal_parameters: proposal_types::parameters::set_working_group_mint_capacity_proposal::<T>(),
                proposal_code: T::ProposalEncoder::encode_proposal(proposal_details),
                exact_execution_block,
            };

            Self::create_proposal(params)?;
        }

        /// Create 'decrease working group leader stake' proposal type.
        /// This proposal uses `decrease_stake()` extrinsic from the `working-group`  module.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_decrease_working_group_leader_stake_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            staking_account_id: Option<T::AccountId>,
            worker_id: working_group::WorkerId<T>,
            decreasing_stake: BalanceOf<T>,
            working_group: WorkingGroup,
            exact_execution_block: Option<T::BlockNumber>,
        ) {
            ensure!(decreasing_stake != Zero::zero(), Error::<T>::DecreasingStakeIsZero);

            let proposal_details = ProposalDetails::DecreaseWorkingGroupLeaderStake(
                worker_id,
                decreasing_stake,
                working_group
            );

            let params = CreateProposalParameters{
                origin,
                member_id,
                title,
                description,
                staking_account_id,
                proposal_details: proposal_details.clone(),
                proposal_parameters: proposal_types::parameters::decrease_working_group_leader_stake_proposal::<T>(),
                proposal_code: T::ProposalEncoder::encode_proposal(proposal_details),
                exact_execution_block,
            };

            Self::create_proposal(params)?;
        }

        /// Create 'slash working group leader stake' proposal type.
        /// This proposal uses `slash_stake()` extrinsic from the `working-group`  module.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_slash_working_group_leader_stake_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            staking_account_id: Option<T::AccountId>,
            worker_id: working_group::WorkerId<T>,
            slashing_stake: BalanceOf<T>,
            working_group: WorkingGroup,
            exact_execution_block: Option<T::BlockNumber>,
        ) {
            ensure!(slashing_stake != Zero::zero(), Error::<T>::SlashingStakeIsZero);

            let proposal_details = ProposalDetails::SlashWorkingGroupLeaderStake(
                worker_id,
                slashing_stake,
                working_group
            );

            let params = CreateProposalParameters{
                origin,
                member_id,
                title,
                description,
                staking_account_id,
                proposal_details: proposal_details.clone(),
                proposal_parameters: proposal_types::parameters::slash_working_group_leader_stake_proposal::<T>(),
                proposal_code: T::ProposalEncoder::encode_proposal(proposal_details),
                exact_execution_block,
            };

            Self::create_proposal(params)?;
        }

        /// Create 'set working group leader reward' proposal type.
        /// This proposal uses `update_reward_amount()` extrinsic from the `working-group`  module.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_set_working_group_leader_reward_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            staking_account_id: Option<T::AccountId>,
            worker_id: working_group::WorkerId<T>,
            reward_amount: BalanceOfMint<T>,
            working_group: WorkingGroup,
            exact_execution_block: Option<T::BlockNumber>,
        ) {
            let proposal_details = ProposalDetails::SetWorkingGroupLeaderReward(
                worker_id,
                reward_amount,
                working_group
            );

            let params = CreateProposalParameters{
                origin,
                member_id,
                title,
                description,
                staking_account_id,
                proposal_details: proposal_details.clone(),
                proposal_parameters: proposal_types::parameters::set_working_group_leader_reward_proposal::<T>(),
                proposal_code: T::ProposalEncoder::encode_proposal(proposal_details),
                exact_execution_block,
            };

            Self::create_proposal(params)?;
        }

        /// Create 'terminate working group leader role' proposal type.
        /// This proposal uses `terminate_role()` extrinsic from the `working-group`  module.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_terminate_working_group_leader_role_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            staking_account_id: Option<T::AccountId>,
            terminate_role_parameters: TerminateRoleParameters<working_group::WorkerId<T>>,
            exact_execution_block: Option<T::BlockNumber>,
        ) {
            let proposal_details = ProposalDetails::TerminateWorkingGroupLeaderRole(terminate_role_parameters);

            let params = CreateProposalParameters{
                origin,
                member_id,
                title,
                description,
                staking_account_id,
                proposal_details: proposal_details.clone(),
                proposal_parameters: proposal_types::parameters::terminate_working_group_leader_role_proposal::<T>(),
                proposal_code: T::ProposalEncoder::encode_proposal(proposal_details),
                exact_execution_block,
            };

            Self::create_proposal(params)?;
        }

        /// Create 'amend constitution' proposal type.
        /// This proposal uses `amend_constitution()` extrinsic from the `constitution`  module.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_amend_constitution_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            staking_account_id: Option<T::AccountId>,
            constitution_text: Vec<u8>,
            exact_execution_block: Option<T::BlockNumber>,
        ) {
            let proposal_details = ProposalDetails::AmendConstitution(constitution_text);

            let params = CreateProposalParameters{
                origin,
                member_id,
                title,
                description,
                staking_account_id,
                proposal_details: proposal_details.clone(),
                proposal_parameters: proposal_types::parameters::amend_constitution_proposal::<T>(),
                proposal_code: T::ProposalEncoder::encode_proposal(proposal_details),
                exact_execution_block,
            };

            Self::create_proposal(params)?;
        }


// *************** Extrinsic to execute

        /// Text proposal extrinsic. Should be used as callable object to pass to the `engine` module.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn execute_text_proposal(
            origin,
            text: Vec<u8>,
        ) {
            ensure_root(origin)?;
            print("Text proposal: ");
            let text_string_result = from_utf8(text.as_slice());
            if let Ok(text_string) = text_string_result{
                print(text_string);
            }
        }

        /// Runtime upgrade proposal extrinsic.
        /// Should be used as callable object to pass to the `engine` module.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn execute_runtime_upgrade_proposal(
            origin,
            wasm: Vec<u8>,
        ) {
            ensure_root(origin.clone())?;

            print("Runtime upgrade proposal execution started.");

            <system::Module<T>>::set_code(origin, wasm)?;

            print("Runtime upgrade proposal execution finished.");
        }
    }
}

impl<T: Trait> Module<T> {
    // Generic template proposal builder
    fn create_proposal(params: CreateProposalParameters<T>) -> DispatchResult {
        let account_id =
            T::MembershipOriginValidator::ensure_actor_origin(params.origin, params.member_id)?;

        <proposals_engine::Module<T>>::ensure_create_proposal_parameters_are_valid(
            &params.proposal_parameters,
            &params.title,
            &params.description,
            params.staking_account_id.clone(),
            params.exact_execution_block,
        )?;

        let initial_thread_mode = ThreadMode::Open;
        <proposals_discussion::Module<T>>::ensure_can_create_thread(&initial_thread_mode)?;

        let discussion_thread_id = <proposals_discussion::Module<T>>::create_thread(
            params.member_id,
            initial_thread_mode,
        )?;

        let proposal_creation_params = ProposalCreationParameters {
            account_id,
            proposer_id: params.member_id,
            proposal_parameters: params.proposal_parameters,
            title: params.title,
            description: params.description,
            staking_account_id: params.staking_account_id,
            encoded_dispatchable_call_code: params.proposal_code,
            exact_execution_block: params.exact_execution_block,
        };

        let proposal_id = <proposals_engine::Module<T>>::create_proposal(proposal_creation_params)?;

        <ThreadIdByProposalId<T>>::insert(proposal_id, discussion_thread_id);
        <ProposalDetailsByProposalId<T>>::insert(proposal_id, params.proposal_details);

        Ok(())
    }
}

impl<T: Trait> ProposalObserver<T> for Module<T> {
    fn proposal_removed(proposal_id: &<T as proposals_engine::Trait>::ProposalId) {
        <ThreadIdByProposalId<T>>::remove(proposal_id);
        <ProposalDetailsByProposalId<T>>::remove(proposal_id);

        let thread_id = Self::thread_id_by_proposal_id(proposal_id);

        proposals_discussion::ThreadById::<T>::remove(thread_id);
        proposals_discussion::PostThreadIdByPostId::<T>::remove_prefix(thread_id);
    }
}
