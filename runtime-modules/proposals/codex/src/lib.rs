//! # Proposals codex module
//! Proposals `codex` module for the Joystream platform.
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
//! - [create_set_working_group_budget_capacity_proposal](./struct.Module.html#method.create_set_working_group_budget_capacity_proposal)
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
//! - [council](../substrate_council_module/index.html)
//!
//! ### Notes
//! The module uses [ProposalEncoder](./trait.ProposalEncoder.html) to encode the proposal using its
//! details. Encoded byte vector is passed to the _proposals engine_ as serialized executable code.

// `decl_module!` does a lot of recursion and requires us to increase the limit to 256.
#![recursion_limit = "256"]
// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
// Disable this lint warning because Substrate generates function without an alias for
// the ProposalDetailsOf type.
#![allow(clippy::too_many_arguments)]

mod types;

#[cfg(test)]
mod tests;

use frame_support::dispatch::DispatchResult;
use frame_support::traits::Get;
use frame_support::{decl_error, decl_module, decl_storage, ensure, print};
use frame_system::ensure_root;
use sp_arithmetic::traits::Zero;
use sp_std::clone::Clone;
use sp_std::vec::Vec;

pub use crate::types::{
    AddOpeningParameters, FillOpeningParameters, GeneralProposalParams, ProposalDetails,
    ProposalDetailsOf, ProposalEncoder, TerminateRoleParameters,
};
use common::origin::MemberOriginValidator;
use common::MemberId;
use proposals_discussion::ThreadMode;
use proposals_engine::{
    BalanceOf, ProposalCreationParameters, ProposalObserver, ProposalParameters,
};

// 'Set working group budget capacity' proposal limit
const WORKING_GROUP_BUDGET_CAPACITY_MAX_VALUE: u32 = 5_000_000;
// Max allowed value for 'spending' proposal
const MAX_SPENDING_PROPOSAL_VALUE: u32 = 5_000_000_u32;
// Max validator count for the 'set validator count' proposal
const MAX_VALIDATOR_COUNT: u32 = 100;

/// 'Proposals codex' substrate module Trait
pub trait Trait:
    frame_system::Trait
    + proposals_engine::Trait
    + proposals_discussion::Trait
    + common::Trait
    + staking::Trait
{
    /// Validates member id and origin combination.
    type MembershipOriginValidator: MemberOriginValidator<
        Self::Origin,
        MemberId<Self>,
        Self::AccountId,
    >;

    /// Encodes the proposal usint its details.
    type ProposalEncoder: ProposalEncoder<Self>;

    /// 'Set validator count' proposal parameters.
    type SetValidatorCountProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Runtime upgrade' proposal parameters.
    type RuntimeUpgradeProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Text' proposal parameters.
    type TextProposalParameters: Get<ProposalParameters<Self::BlockNumber, BalanceOf<Self>>>;

    /// 'Spending' proposal parameters.
    type SpendingProposalParameters: Get<ProposalParameters<Self::BlockNumber, BalanceOf<Self>>>;

    /// 'Add working group opening' proposal parameters.
    type AddWorkingGroupOpeningProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Fill working group opening' proposal parameters.
    type FillWorkingGroupOpeningProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Set working group budget capacity' proposal parameters.
    type SetWorkingGroupBudgetCapacityProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Decrease working group leader stake' proposal parameters.
    type DecreaseWorkingGroupLeaderStakeProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Slash working group leader stake' proposal parameters.
    type SlashWorkingGroupLeaderStakeProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Set working group leader reward' proposal parameters.
    type SetWorkingGroupLeaderRewardProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Terminate working group leader role' proposal parameters.
    type TerminateWorkingGroupLeaderRoleProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Amend constitution' proposal parameters.
    type AmendConstitutionProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;
}

/// Specialized alias of GeneralProposalParams
pub type GeneralProposalParameters<T> = GeneralProposalParams<
    MemberId<T>,
    <T as frame_system::Trait>::AccountId,
    <T as frame_system::Trait>::BlockNumber,
>;

decl_error! {
    /// Codex module predefined errors
    pub enum Error for Module<T: Trait> {
        /// Provided text for text proposal is empty
        TextProposalIsEmpty,

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

        /// Invalid working group budget capacity parameter
        InvalidWorkingGroupBudgetCapacity,

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
    pub trait Store for Module<T: Trait> as ProposalCodex {
        /// Map proposal id to its discussion thread id
        pub ThreadIdByProposalId get(fn thread_id_by_proposal_id):
            map hasher(blake2_128_concat) T::ProposalId => T::ThreadId;

        /// Map proposal id to proposal details
        pub ProposalDetailsByProposalId: map hasher(blake2_128_concat) T::ProposalId => ProposalDetailsOf<T>;
    }
}

decl_module! {
    /// Proposal codex substrate module Call
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        /// Exports 'Set validator count' proposal parameters.
        const SetValidatorCountProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::SetValidatorCountProposalParameters::get();

        /// Exports 'Runtime upgrade' proposal parameters.
        const RuntimeUpgradeProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::RuntimeUpgradeProposalParameters::get();

        /// Exports 'Text' proposal parameters.
        const TextProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::TextProposalParameters::get();

        /// Exports 'Spending' proposal parameters.
        const SpendingProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::SpendingProposalParameters::get();

        /// Exports 'Add working group opening' proposal parameters.
        const AddWorkingGroupOpeningProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::AddWorkingGroupOpeningProposalParameters::get();

        /// Exports 'Fill working group opening' proposal parameters.
        const FillWorkingGroupOpeningProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::FillWorkingGroupOpeningProposalParameters::get();

        /// Exports 'Set working group budget capacity' proposal parameters.
        const SetWorkingGroupBudgetCapacityProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::SetWorkingGroupBudgetCapacityProposalParameters::get();

        /// Exports 'Decrease working group leader stake' proposal parameters.
        const DecreaseWorkingGroupLeaderStakeProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::DecreaseWorkingGroupLeaderStakeProposalParameters::get();

        /// Exports 'Slash working group leader stake' proposal parameters.
        const SlashWorkingGroupLeaderStakeProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::SlashWorkingGroupLeaderStakeProposalParameters::get();

        /// Exports 'Set working group leader reward' proposal parameters.
        const SetWorkingGroupLeaderRewardProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::SetWorkingGroupLeaderRewardProposalParameters::get();

        /// Exports 'Terminate working group leader role' proposal parameters.
        const TerminateWorkingGroupLeaderRoleProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::TerminateWorkingGroupLeaderRoleProposalParameters::get();

        /// Exports 'Amend constitution' proposal parameters.
        const AmendConstitutionProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::AmendConstitutionProposalParameters::get();

        /// Create a proposal, the type of proposal depends on the `proposal_details` variant
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_proposal(
            origin,
            general_proposal_parameters: GeneralProposalParameters<T>,
            proposal_details: ProposalDetailsOf<T>,
        ) {
            Self::ensure_details_checks(&proposal_details)?;

            let proposal_parameters = Self::get_proposal_parameters(&proposal_details);
            let proposal_code = T::ProposalEncoder::encode_proposal(proposal_details.clone());

            let account_id =
                T::MembershipOriginValidator::ensure_member_controller_account_origin(
                    origin,
                    general_proposal_parameters.member_id
                )?;

            <proposals_engine::Module<T>>::ensure_create_proposal_parameters_are_valid(
                &proposal_parameters,
                &general_proposal_parameters.title,
                &general_proposal_parameters.description,
                general_proposal_parameters.staking_account_id.clone(),
                general_proposal_parameters.exact_execution_block,
            )?;

            let initial_thread_mode = ThreadMode::Open;
            <proposals_discussion::Module<T>>::ensure_can_create_thread(&initial_thread_mode)?;

            let discussion_thread_id = <proposals_discussion::Module<T>>::create_thread(
                general_proposal_parameters.member_id,
                initial_thread_mode,
            )?;

            let proposal_creation_params = ProposalCreationParameters {
                account_id,
                proposer_id: general_proposal_parameters.member_id,
                proposal_parameters,
                title: general_proposal_parameters.title,
                description: general_proposal_parameters.description,
                staking_account_id: general_proposal_parameters.staking_account_id,
                encoded_dispatchable_call_code: proposal_code,
                exact_execution_block: general_proposal_parameters.exact_execution_block,
            };

            let proposal_id =
                <proposals_engine::Module<T>>::create_proposal(proposal_creation_params)?;

            <ThreadIdByProposalId<T>>::insert(proposal_id, discussion_thread_id);
            <ProposalDetailsByProposalId<T>>::insert(proposal_id, proposal_details);
        }

// *************** Extrinsic to execute

        /// Text proposal extrinsic.
        /// Should be used as callable object to pass to the `engine` module.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn execute_text_proposal(
            origin,
            text: Vec<u8>,
        ) {
            ensure_root(origin)?;

            // Text proposal stub: no code implied.
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

            <frame_system::Module<T>>::set_code(origin, wasm)?;

            print("Runtime upgrade proposal execution finished.");
        }
    }
}

impl<T: Trait> Module<T> {
    // Ensure that the proposal details respects all the checks
    fn ensure_details_checks(details: &ProposalDetailsOf<T>) -> DispatchResult {
        match details {
            ProposalDetails::Text(ref text) => {
                ensure!(!text.is_empty(), Error::<T>::TextProposalIsEmpty);
            }
            ProposalDetails::RuntimeUpgrade(ref wasm) => {
                ensure!(!wasm.is_empty(), Error::<T>::RuntimeProposalIsEmpty);
            }
            ProposalDetails::Spending(ref balance, _) => {
                ensure!(
                    *balance != BalanceOf::<T>::zero(),
                    Error::<T>::InvalidSpendingProposalBalance
                );
                ensure!(
                    *balance <= <BalanceOf<T>>::from(MAX_SPENDING_PROPOSAL_VALUE),
                    Error::<T>::InvalidSpendingProposalBalance
                );
            }
            ProposalDetails::SetValidatorCount(ref new_validator_count) => {
                ensure!(
                    *new_validator_count >= <staking::Module<T>>::minimum_validator_count(),
                    Error::<T>::InvalidValidatorCount
                );

                ensure!(
                    *new_validator_count <= MAX_VALIDATOR_COUNT,
                    Error::<T>::InvalidValidatorCount
                );
            }
            ProposalDetails::AddWorkingGroupLeaderOpening(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::FillWorkingGroupLeaderOpening(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::SetWorkingGroupBudgetCapacity(ref mint_balance, _) => {
                ensure!(
                    *mint_balance <= <BalanceOf<T>>::from(WORKING_GROUP_BUDGET_CAPACITY_MAX_VALUE),
                    Error::<T>::InvalidWorkingGroupBudgetCapacity
                );
            }
            ProposalDetails::DecreaseWorkingGroupLeaderStake(_, ref decreasing_stake, _) => {
                ensure!(
                    *decreasing_stake != Zero::zero(),
                    Error::<T>::DecreasingStakeIsZero
                );
            }
            ProposalDetails::SlashWorkingGroupLeaderStake(_, ref penalty, _) => {
                ensure!(
                    penalty.slashing_amount != Zero::zero(),
                    Error::<T>::SlashingStakeIsZero
                );
            }
            ProposalDetails::SetWorkingGroupLeaderReward(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::TerminateWorkingGroupLeaderRole(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::AmendConstitution(..) => {
                // Note: No checks for this proposal for now
            }
        }

        Ok(())
    }

    // Returns the proposal parameters according to ProposalDetials
    fn get_proposal_parameters(
        details: &ProposalDetailsOf<T>,
    ) -> ProposalParameters<T::BlockNumber, BalanceOf<T>> {
        match details {
            ProposalDetailsOf::<T>::Text(..) => T::TextProposalParameters::get(),
            ProposalDetailsOf::<T>::RuntimeUpgrade(..) => {
                T::RuntimeUpgradeProposalParameters::get()
            }
            ProposalDetailsOf::<T>::Spending(..) => T::SpendingProposalParameters::get(),
            ProposalDetailsOf::<T>::SetValidatorCount(..) => {
                T::SetValidatorCountProposalParameters::get()
            }
            ProposalDetailsOf::<T>::AddWorkingGroupLeaderOpening(..) => {
                T::AddWorkingGroupOpeningProposalParameters::get()
            }
            ProposalDetailsOf::<T>::FillWorkingGroupLeaderOpening(..) => {
                T::FillWorkingGroupOpeningProposalParameters::get()
            }
            ProposalDetailsOf::<T>::SetWorkingGroupBudgetCapacity(..) => {
                T::SetWorkingGroupBudgetCapacityProposalParameters::get()
            }
            ProposalDetailsOf::<T>::DecreaseWorkingGroupLeaderStake(..) => {
                T::DecreaseWorkingGroupLeaderStakeProposalParameters::get()
            }
            ProposalDetailsOf::<T>::SlashWorkingGroupLeaderStake(..) => {
                T::SlashWorkingGroupLeaderStakeProposalParameters::get()
            }
            ProposalDetailsOf::<T>::SetWorkingGroupLeaderReward(..) => {
                T::SetWorkingGroupLeaderRewardProposalParameters::get()
            }
            ProposalDetailsOf::<T>::TerminateWorkingGroupLeaderRole(..) => {
                T::TerminateWorkingGroupLeaderRoleProposalParameters::get()
            }
            ProposalDetailsOf::<T>::AmendConstitution(..) => {
                T::AmendConstitutionProposalParameters::get()
            }
        }
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
