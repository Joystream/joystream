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
    BalanceKind, CreateOpeningParameters, FillOpeningParameters, GeneralProposalParams,
    ProposalDetails, ProposalDetailsOf, ProposalEncoder, TerminateRoleParameters,
};
use common::origin::MemberOriginValidator;
use common::MemberId;
use proposals_discussion::ThreadMode;
use proposals_engine::{
    BalanceOf, ProposalCreationParameters, ProposalObserver, ProposalParameters,
};

use common::working_group::WorkingGroup;

// Max allowed value for 'Funding Request' proposal
const MAX_SPENDING_PROPOSAL_VALUE: u32 = 5_000_000_u32;
// Max validator count for the 'Set Max Validator Count' proposal
const MAX_VALIDATOR_COUNT: u32 = 100;

/// 'Proposals codex' substrate module Trait
pub trait Trait:
    frame_system::Trait
    + proposals_engine::Trait
    + proposals_discussion::Trait
    + common::Trait
    + council::Trait
    + staking::Trait
    + working_group::Trait<ForumWorkingGroupInstance>
    + working_group::Trait<StorageWorkingGroupInstance>
    + working_group::Trait<ContentDirectoryWorkingGroupInstance>
    + working_group::Trait<MembershipWorkingGroupInstance>
{
    /// Validates member id and origin combination.
    type MembershipOriginValidator: MemberOriginValidator<
        Self::Origin,
        MemberId<Self>,
        Self::AccountId,
    >;

    /// Encodes the proposal usint its details.
    type ProposalEncoder: ProposalEncoder<Self>;

    /// 'Set Max Validator Count' proposal parameters.
    type SetMaxValidatorCountProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Runtime Upgrade' proposal parameters.
    type RuntimeUpgradeProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Signal' proposal parameters.
    type SignalProposalParameters: Get<ProposalParameters<Self::BlockNumber, BalanceOf<Self>>>;

    /// 'Funding Request' proposal parameters.
    type FundingRequestProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Create Working Group Lead Opening' proposal parameters.
    type CreateWorkingGroupLeadOpeningProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Fill Working Group Lead Opening' proposal parameters.
    type FillWorkingGroupLeadOpeningProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Update Working Group Budget' proposal parameters.
    type UpdateWorkingGroupBudgetProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Decrease Working Group Lead Stake' proposal parameters.
    type DecreaseWorkingGroupLeadStakeProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Slash Working Group Lead Stake' proposal parameters.
    type SlashWorkingGroupLeadProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Set Working Group Lead Reward' proposal parameters.
    type SetWorkingGroupLeadRewardProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Terminate Working Group Lead' proposal parameters.
    type TerminateWorkingGroupLeadProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// 'Amend Constitution' proposal parameters.
    type AmendConstitutionProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// `Cancel Working Group Lead Opening` proposal parameters.
    type CancelWorkingGroupLeadOpeningProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// `Set Membership Price Parameters` proposal parameters.
    type SetMembershipPriceProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// `Set Council Budget Increment` proposal parameters.
    type SetCouncilBudgetIncrementProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// `Set Councilor Reward` proposal parameters
    type SetCouncilorRewardProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    type SetInitialInvitationBalanceProposalParameters: Get<
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
        SignalProposalIsEmpty,

        /// Provided WASM code for the runtime upgrade proposal is empty
        RuntimeProposalIsEmpty,

        /// Invalid balance value for the spending proposal
        InvalidFundingRequestProposalBalance,

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

        /// Exports 'Set Max Validator Count' proposal parameters.
        const SetMaxValidatorCountProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::SetMaxValidatorCountProposalParameters::get();

        /// Exports 'Runtime Upgrade' proposal parameters.
        const RuntimeUpgradeProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::RuntimeUpgradeProposalParameters::get();

        /// Exports 'Signal' proposal parameters.
        const SignalProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::SignalProposalParameters::get();

        /// Exports 'Funding Request' proposal parameters.
        const FundingRequestProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::FundingRequestProposalParameters::get();

        /// Exports 'Create Working Group Lead Opening' proposal parameters.
        const CreateWorkingGroupLeadOpeningProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::CreateWorkingGroupLeadOpeningProposalParameters::get();

        /// Exports 'Fill Working Group Lead Opening' proposal parameters.
        const FillWorkingGroupOpeningProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::FillWorkingGroupLeadOpeningProposalParameters::get();

        /// Exports 'Update Working Group Budget' proposal parameters.
        const UpdateWorkingGroupBudgetProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::UpdateWorkingGroupBudgetProposalParameters::get();

        /// Exports 'Decrease Working Group Lead Stake' proposal parameters.
        const DecreaseWorkingGroupLeadStakeProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::DecreaseWorkingGroupLeadStakeProposalParameters::get();

        /// Exports 'Slash Working Group Lead' proposal parameters.
        const SlashWorkingGroupLeadProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::SlashWorkingGroupLeadProposalParameters::get();

        /// Exports 'Set Working Group Lead Reward' proposal parameters.
        const SetWorkingGroupLeadRewardProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::SetWorkingGroupLeadRewardProposalParameters::get();

        /// Exports 'Terminate Working Group Lead' proposal parameters.
        const TerminateWorkingGroupLeadProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::TerminateWorkingGroupLeadProposalParameters::get();

        /// Exports 'Amend Constitution' proposal parameters.
        const AmendConstitutionProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::AmendConstitutionProposalParameters::get();

        /// Exports 'Cancel Working Group Lead Opening' proposal parameters.
        const CancelWorkingGroupLeadOpeningProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::CancelWorkingGroupLeadOpeningProposalParameters::get();

        /// Exports 'Set Membership Price' proposal parameters.
        const SetMembershipPriceProposalParameters: ProposalParameters<T::BlockNumber, BalanceOf<T>>
            = T::SetMembershipPriceProposalParameters::get();

        /// Exports `Set Council Budget Increment` proposal parameters.
        const SetCouncilBudgetIncrementProposalParameters:
            ProposalParameters<T::BlockNumber, BalanceOf<T>> = T::SetCouncilBudgetIncrementProposalParameters::get();

        /// Exports `Set Councilor Reward Proposal Parameters` proposal parameters.
        const SetCouncilorRewardProposalParameters:
            ProposalParameters<T::BlockNumber, BalanceOf<T>> = T::SetCouncilorRewardProposalParameters::get();

        /// Exports `Set Initial Invitation Balance` proposal parameters.
        const SetInitialInvitationBalanceProposalParameters:
            ProposalParameters<T::BlockNumber, BalanceOf<T>> = T::SetInitialInvitationBalanceProposalParameters::get();

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
        pub fn execute_signal_proposal(
            origin,
            signal: Vec<u8>,
        ) {
            ensure_root(origin)?;

            // Signal proposal stub: no code implied.
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

        /// Update working group budget
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_working_group_budget(
            origin,
            working_group: WorkingGroup,
            amount: BalanceOf<T>,
            balance_kind: BalanceKind,
        ) {
            ensure_root(origin.clone())?;

            // TODO: Discount from council

            match working_group {
                WorkingGroup::Forum =>  working_group::Module::<T, ForumWorkingGroupInstance>::set_budget(origin, amount)?,
                WorkingGroup::Storage => working_group::Module::<T, StorageWorkingGroupInstance>::set_budget(origin, amount)?,
                WorkingGroup::Content => working_group::Module::<T, ContentDirectoryWorkingGroupInstance>::set_budget(origin, amount)?,
                WorkingGroup::Membership => working_group::Module::<T, MembershipWorkingGroupInstance>::set_budget(origin, amount)?,
            };

        }

    }
}

// TODO: This code is repeated from runtime, see if there's somewhere to extract this that makes
// sense
// The forum working group instance alias.
type ForumWorkingGroupInstance = working_group::Instance1;

// The storage working group instance alias.
type StorageWorkingGroupInstance = working_group::Instance2;

// The content directory working group instance alias.
type ContentDirectoryWorkingGroupInstance = working_group::Instance3;

// The membership working group instance alias.
pub type MembershipWorkingGroupInstance = working_group::Instance4;

impl<T: Trait> Module<T> {
    // Ensure that the proposal details respects all the checks
    fn ensure_details_checks(details: &ProposalDetailsOf<T>) -> DispatchResult {
        match details {
            ProposalDetails::Signal(ref signal) => {
                ensure!(!signal.is_empty(), Error::<T>::SignalProposalIsEmpty);
            }
            ProposalDetails::RuntimeUpgrade(ref blob) => {
                ensure!(!blob.is_empty(), Error::<T>::RuntimeProposalIsEmpty);
            }
            ProposalDetails::FundingRequest(ref amount, _) => {
                ensure!(
                    *amount != BalanceOf::<T>::zero(),
                    Error::<T>::InvalidFundingRequestProposalBalance
                );
                ensure!(
                    *amount <= <BalanceOf<T>>::from(MAX_SPENDING_PROPOSAL_VALUE),
                    Error::<T>::InvalidFundingRequestProposalBalance
                );
            }
            ProposalDetails::SetMaxValidatorCount(ref new_validator_count) => {
                ensure!(
                    // TODO: Should this be replaced by a const MIN_VALIDATOR_COUNT?
                    *new_validator_count >= <staking::Module<T>>::minimum_validator_count(),
                    Error::<T>::InvalidValidatorCount
                );

                ensure!(
                    *new_validator_count <= MAX_VALIDATOR_COUNT,
                    Error::<T>::InvalidValidatorCount
                );
            }
            ProposalDetails::CreateWorkingGroupLeadOpening(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::FillWorkingGroupLeadOpening(..) => {
                // Note: No checks for this proposal for now
                // TODO: shouldn't we check that it exists?
            }
            ProposalDetails::UpdateWorkingGroupBudget(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::DecreaseWorkingGroupLeadStake(_, ref stake_amount, _) => {
                ensure!(
                    *stake_amount != Zero::zero(),
                    Error::<T>::DecreasingStakeIsZero
                );
            }
            ProposalDetails::SlashWorkingGroupLead(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::SetWorkingGroupLeadReward(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::TerminateWorkingGroupLead(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::AmendConstitution(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::CancelWorkingGroupLeadOpening(..) => {
                // Note: No checks for this proposal for now
                // TODO: Shouldn't we check that it exists?
            }
            ProposalDetails::SetMembershipPrice(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::SetCouncilBudgetIncrement(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::SetCouncilorReward(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::SetInitialInvitationBalance(..) => {
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
            ProposalDetails::Signal(..) => T::SignalProposalParameters::get(),
            ProposalDetails::RuntimeUpgrade(..) => T::RuntimeUpgradeProposalParameters::get(),
            ProposalDetails::FundingRequest(..) => T::FundingRequestProposalParameters::get(),
            ProposalDetails::SetMaxValidatorCount(..) => {
                T::SetMaxValidatorCountProposalParameters::get()
            }
            ProposalDetails::FillWorkingGroupLeadOpening(..) => {
                T::FillWorkingGroupLeadOpeningProposalParameters::get()
            }
            ProposalDetails::UpdateWorkingGroupBudget(..) => {
                T::UpdateWorkingGroupBudgetProposalParameters::get()
            }
            ProposalDetails::DecreaseWorkingGroupLeadStake(..) => {
                T::DecreaseWorkingGroupLeadStakeProposalParameters::get()
            }
            ProposalDetails::SlashWorkingGroupLead(..) => {
                T::SlashWorkingGroupLeadProposalParameters::get()
            }
            ProposalDetails::SetWorkingGroupLeadReward(..) => {
                T::SetWorkingGroupLeadRewardProposalParameters::get()
            }
            ProposalDetails::TerminateWorkingGroupLead(..) => {
                T::TerminateWorkingGroupLeadProposalParameters::get()
            }
            ProposalDetails::CreateWorkingGroupLeadOpening(..) => {
                T::CreateWorkingGroupLeadOpeningProposalParameters::get()
            }
            ProposalDetails::AmendConstitution(..) => T::AmendConstitutionProposalParameters::get(),
            ProposalDetails::SetMembershipPrice(..) => {
                T::SetMembershipPriceProposalParameters::get()
            }
            ProposalDetails::CancelWorkingGroupLeadOpening(..) => {
                T::CancelWorkingGroupLeadOpeningProposalParameters::get()
            }
            ProposalDetails::SetCouncilBudgetIncrement(..) => {
                T::SetCouncilBudgetIncrementProposalParameters::get()
            }
            ProposalDetails::SetCouncilorReward(..) => {
                T::SetCouncilorRewardProposalParameters::get()
            }
            ProposalDetails::SetInitialInvitationBalance(..) => {
                T::SetInitialInvitationBalanceProposalParameters::get()
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
