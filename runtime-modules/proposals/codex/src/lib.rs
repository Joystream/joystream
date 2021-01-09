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

mod benchmarking;

use frame_support::dispatch::DispatchResult;
use frame_support::traits::Get;
use frame_support::weights::{DispatchClass, Weight};
use frame_support::{decl_error, decl_module, decl_storage, ensure, print};
use frame_system::ensure_root;
use sp_arithmetic::traits::Zero;
use sp_runtime::traits::Saturating;
use sp_runtime::SaturatedConversion;
use sp_std::clone::Clone;
use sp_std::vec::Vec;

pub use crate::types::{
    BalanceKind, CreateOpeningParameters, FillOpeningParameters, GeneralProposalParams,
    ProposalDetails, ProposalDetailsOf, ProposalEncoder, TerminateRoleParameters,
};
use common::origin::MemberOriginValidator;
use common::MemberId;
use council::Module as Council;
use proposals_discussion::ThreadMode;
use proposals_engine::{
    BalanceOf, ProposalCreationParameters, ProposalObserver, ProposalParameters,
};

use common::working_group::WorkingGroup;

// Max allowed value for 'Funding Request' proposal
const MAX_SPENDING_PROPOSAL_VALUE: u32 = 5_000_000_u32;
// Max validator count for the 'Set Max Validator Count' proposal
const MAX_VALIDATOR_COUNT: u32 = 100;

/// Proposal codex WeightInfo.
/// Note: This was auto generated through the benchmark CLI using the `--weight-trait` flag
pub trait WeightInfo {
    fn execute_signal_proposal(i: u32) -> Weight;
    fn create_proposal_signal(i: u32, t: u32, d: u32) -> Weight;
    fn create_proposal_runtime_upgrade(i: u32, t: u32) -> Weight;
    fn create_proposal_funding_request() -> Weight;
    fn create_proposal_set_max_validator_count() -> Weight;
    fn create_proposal_create_working_group_lead_opening(i: u32, t: u32) -> Weight;
    fn create_proposal_fill_working_group_lead_opening() -> Weight;
    fn create_proposal_update_working_group_budget(t: u32, d: u32) -> Weight;
    fn create_proposal_decrease_working_group_lead_stake(d: u32) -> Weight;
    fn create_proposal_slash_working_group_lead() -> Weight;
    fn create_proposal_set_working_group_lead_reward(t: u32) -> Weight;
    fn create_proposal_terminate_working_group_lead(t: u32) -> Weight;
    fn create_proposal_amend_constitution(i: u32, t: u32) -> Weight;
    fn create_proposal_cancel_working_group_lead_opening(d: u32) -> Weight;
    fn create_proposal_set_membership_price(t: u32, d: u32) -> Weight;
    fn create_proposal_set_council_budget_increment(t: u32, d: u32) -> Weight;
    fn create_proposal_set_councilor_reward(d: u32) -> Weight;
    fn create_proposal_set_initial_invitation_balance(d: u32) -> Weight;
    fn create_proposal_set_initial_invitation_count(t: u32, d: u32) -> Weight;
    fn create_proposal_set_membership_lead_invitation_quota() -> Weight;
    fn create_proposal_set_referral_cut(t: u32) -> Weight;
    fn update_working_group_budget_positive_forum() -> Weight;
    fn update_working_group_budget_negative_forum() -> Weight;
    fn update_working_group_budget_positive_storage() -> Weight;
    fn update_working_group_budget_negative_storage() -> Weight;
    fn update_working_group_budget_positive_content() -> Weight;
    fn update_working_group_budget_negative_content() -> Weight;
    fn update_working_group_budget_positive_membership() -> Weight;
    fn update_working_group_budget_negative_membership() -> Weight;
}

type WeightInfoCodex<T> = <T as Trait>::WeightInfo;

/// 'Proposals codex' substrate module Trait
pub trait Trait:
    frame_system::Trait
    + proposals_engine::Trait
    + proposals_discussion::Trait
    + common::Trait
    + council::Trait
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

    /// Weight information for extrinsics in this pallet.
    type WeightInfo: WeightInfo;

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

    /// `Set Initial Invitation Balance` proposal parameters
    type SetInitialInvitationBalanceProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// `Set Invitation Count` proposal parameters
    type SetInvitationCountProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// `Set Membership Lead Invitaiton Quota` proposal parameters
    type SetMembershipLeadInvitationQuotaProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// `Set Referral Cut` proposal parameters
    type SetReferralCutProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// Gets the budget of the given WorkingGroup
    fn get_working_group_budget(working_group: WorkingGroup) -> BalanceOf<Self>;

    /// Sets the budget for the given WorkingGroup
    fn set_working_group_budget(working_group: WorkingGroup, budget: BalanceOf<Self>);
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

        /// Insufficient funds for 'Update Working Group Budget' proposal execution
        InsufficientFundsForBudgetUpdate,
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

        const SetInvitationCountProposalParameters:
            ProposalParameters<T::BlockNumber, BalanceOf<T>> = T::SetInvitationCountProposalParameters::get();

        const SetMembershipLeadInvitationQuotaProposalParameters:
            ProposalParameters<T::BlockNumber, BalanceOf<T>> = T::SetMembershipLeadInvitationQuotaProposalParameters::get();

        const SetReferralCutProposalParameters:
            ProposalParameters<T::BlockNumber, BalanceOf<T>> = T::SetReferralCutProposalParameters::get();

        /// Create a proposal, the type of proposal depends on the `proposal_details` variant
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (T + D + I)` where:
        /// - `T` is the length of the title
        /// - `D` is the length of the description
        /// - `I` is the length of any parameter in `proposal_details`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = Module::<T>::get_create_proposal_weight(&general_proposal_parameters, &proposal_details)]
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

        /// Signal proposal extrinsic. Should be used as callable object to pass to the `engine` module.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (S)` where:
        /// - `S` is the length of the signal
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoCodex::<T>::execute_signal_proposal(signal.len().saturated_into())]
        pub fn execute_signal_proposal(
            origin,
            signal: Vec<u8>,
        ) {
            ensure_root(origin)?;

            // Signal proposal stub: no code implied.
        }

        /// Runtime upgrade proposal extrinsic.
        /// Should be used as callable object to pass to the `engine` module.
        /// <weight>
        ///
        /// ## Weight
        /// `O (C)` where:
        /// - `C` is the length of `wasm`
        /// However, we treat this as a full block as `frame_system::Module::set_code` does
        /// # </weight>
        #[weight = (T::MaximumBlockWeight::get(), DispatchClass::Operational)]
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
        #[weight = Module::<T>::get_update_working_group_budget_weight(&working_group, &balance_kind)]
        pub fn update_working_group_budget(
            origin,
            working_group: WorkingGroup,
            amount: BalanceOf<T>,
            balance_kind: BalanceKind,
        ) {
            ensure_root(origin.clone())?;


            let wg_budget = T::get_working_group_budget(working_group);
            let current_budget = Council::<T>::budget();

            match balance_kind {
                BalanceKind::Positive => {
                    ensure!(amount<=current_budget, Error::<T>::InsufficientFundsForBudgetUpdate);

                    T::set_working_group_budget(working_group, wg_budget.saturating_add(amount));
                    Council::<T>::set_budget(origin, current_budget - amount)?;
                },
                BalanceKind::Negative => {
                    ensure!(amount <= wg_budget, Error::<T>::InsufficientFundsForBudgetUpdate);

                    T::set_working_group_budget(working_group, wg_budget - amount);
                    Council::<T>::set_budget(origin, current_budget.saturating_add(amount))?;
                }
            }
        }

    }
}

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
            ProposalDetails::SetInitialInvitationCount(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::SetMembershipLeadInvitationQuota(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::SetReferralCut(..) => {
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
            ProposalDetails::SetInitialInvitationCount(..) => {
                T::SetInvitationCountProposalParameters::get()
            }
            ProposalDetails::SetMembershipLeadInvitationQuota(..) => {
                T::SetMembershipLeadInvitationQuotaProposalParameters::get()
            }
            ProposalDetails::SetReferralCut(..) => T::SetReferralCutProposalParameters::get(),
        }
    }

    // Returns the weigt for update_working_group_budget extrinsic according to parameters
    fn get_update_working_group_budget_weight(
        group: &WorkingGroup,
        balance_kind: &BalanceKind,
    ) -> Weight {
        match balance_kind {
            BalanceKind::Positive => match group {
                WorkingGroup::Forum => {
                    WeightInfoCodex::<T>::update_working_group_budget_positive_forum()
                }
                WorkingGroup::Storage => {
                    WeightInfoCodex::<T>::update_working_group_budget_positive_storage()
                }
                WorkingGroup::Content => {
                    WeightInfoCodex::<T>::update_working_group_budget_positive_content()
                }
                WorkingGroup::Membership => {
                    WeightInfoCodex::<T>::update_working_group_budget_positive_membership()
                }
            },
            BalanceKind::Negative => match group {
                WorkingGroup::Forum => {
                    WeightInfoCodex::<T>::update_working_group_budget_negative_forum()
                }
                WorkingGroup::Storage => {
                    WeightInfoCodex::<T>::update_working_group_budget_negative_storage()
                }
                WorkingGroup::Membership => {
                    WeightInfoCodex::<T>::update_working_group_budget_negative_membership()
                }
                WorkingGroup::Content => {
                    WeightInfoCodex::<T>::update_working_group_budget_negative_content()
                }
            },
        }
    }

    // Returns weight for the proposal creation according to parameters
    fn get_create_proposal_weight(
        general: &GeneralProposalParameters<T>,
        details: &ProposalDetailsOf<T>,
    ) -> Weight {
        let title_length = general.title.len();
        let description_length = general.description.len();
        match details {
            ProposalDetails::Signal(signal) => WeightInfoCodex::<T>::create_proposal_signal(
                signal.len().saturated_into(),
                title_length.saturated_into(),
                description_length.saturated_into(),
            ),
            ProposalDetails::RuntimeUpgrade(blob) => {
                WeightInfoCodex::<T>::create_proposal_runtime_upgrade(
                    blob.len().saturated_into(),
                    title_length.saturated_into(),
                )
            }
            ProposalDetails::FundingRequest(..) => {
                WeightInfoCodex::<T>::create_proposal_funding_request()
            }
            ProposalDetails::SetMaxValidatorCount(..) => {
                WeightInfoCodex::<T>::create_proposal_set_max_validator_count()
            }
            ProposalDetails::CreateWorkingGroupLeadOpening(opening_params) => {
                WeightInfoCodex::<T>::create_proposal_create_working_group_lead_opening(
                    opening_params.description.len().saturated_into(),
                    title_length.saturated_into(),
                )
            }
            ProposalDetails::FillWorkingGroupLeadOpening(..) => {
                WeightInfoCodex::<T>::create_proposal_fill_working_group_lead_opening()
            }
            ProposalDetails::UpdateWorkingGroupBudget(..) => {
                WeightInfoCodex::<T>::create_proposal_update_working_group_budget(
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::DecreaseWorkingGroupLeadStake(..) => {
                WeightInfoCodex::<T>::create_proposal_decrease_working_group_lead_stake(
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::SlashWorkingGroupLead(..) => {
                WeightInfoCodex::<T>::create_proposal_slash_working_group_lead()
            }
            ProposalDetails::SetWorkingGroupLeadReward(..) => {
                WeightInfoCodex::<T>::create_proposal_set_working_group_lead_reward(
                    title_length.saturated_into(),
                )
            }
            ProposalDetails::TerminateWorkingGroupLead(..) => {
                WeightInfoCodex::<T>::create_proposal_terminate_working_group_lead(
                    title_length.saturated_into(),
                )
            }
            ProposalDetails::AmendConstitution(new_constitution) => {
                WeightInfoCodex::<T>::create_proposal_amend_constitution(
                    new_constitution.len().saturated_into(),
                    title_length.saturated_into(),
                )
            }
            ProposalDetails::SetMembershipPrice(..) => {
                WeightInfoCodex::<T>::create_proposal_set_membership_price(
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::CancelWorkingGroupLeadOpening(..) => {
                WeightInfoCodex::<T>::create_proposal_cancel_working_group_lead_opening(
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::SetCouncilBudgetIncrement(..) => {
                WeightInfoCodex::<T>::create_proposal_set_council_budget_increment(
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::SetCouncilorReward(..) => {
                WeightInfoCodex::<T>::create_proposal_set_councilor_reward(
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::SetInitialInvitationBalance(..) => {
                WeightInfoCodex::<T>::create_proposal_set_initial_invitation_balance(
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::SetInitialInvitationCount(..) => {
                WeightInfoCodex::<T>::create_proposal_set_initial_invitation_count(
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::SetMembershipLeadInvitationQuota(..) => {
                WeightInfoCodex::<T>::create_proposal_set_membership_lead_invitation_quota()
            }
            ProposalDetails::SetReferralCut(..) => {
                WeightInfoCodex::<T>::create_proposal_set_referral_cut(
                    title_length.saturated_into(),
                )
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
