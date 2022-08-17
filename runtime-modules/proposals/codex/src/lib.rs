//! # Proposals codex module
//! Proposals `codex` module for the Joystream platform.
//! Component of the proposals frame_system. It contains preset proposal types.
//!
//! ## Overview
//!
//! The proposals codex module serves as a facade and entry point of the proposals frame_system. It uses
//! proposals `engine` module to maintain a lifecycle of the proposal and to execute proposals.
//! During the proposal creation, `codex` also create a discussion thread using the `discussion`
//! proposals module. `Codex` uses predefined parameters (eg.:`voting_period`) for each proposal and
//! encodes extrinsic calls from dependency modules in order to create proposals inside the `engine`
//! module.
//!
//! To create a proposal you need to call the extrinsic `create_proposal` with the `ProposalDetails` variant
//! corresponding to the proposal you want to create. [See the possible details with their proposal](./enum.ProposalDetails.html)
//!
//! ## Extrinsics
//!
//! - [create_proposal](./struct.Module.html#method.create_proposal) - creates proposal
//!
//! ### Dependencies:
//! - [proposals engine](../substrate_proposals_engine_module/index.html)
//! - [proposals discussion](../substrate_proposals_discussion_module/index.html)
//! - [membership](../substrate_membership_module/index.html)
//! - [council](../substrate_council_module/index.html)
//! - [common](../substrate_common_module/index.html)
//! - [staking](../substrate_staking_module/index.html)
//! - [working_group](../substrate_working_group_module/index.html)
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
#![allow(clippy::unused_unit)]

mod types;

#[cfg(test)]
mod tests;

mod benchmarking;
pub mod weights;
pub use weights::WeightInfo;

use frame_support::dispatch::DispatchResult;
use frame_support::traits::Get;
use frame_support::weights::Weight;
use frame_support::{decl_error, decl_event, decl_module, decl_storage, ensure};
use sp_arithmetic::traits::Zero;
use sp_runtime::SaturatedConversion;
use sp_std::clone::Clone;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::convert::TryInto;

use common::membership::MemberOriginValidator;
use common::working_group::*;
use common::MemberId;
use frame_support::traits::Instance;
use proposals_discussion::ThreadMode;
use proposals_engine::{
    BalanceOf, ProposalCreationParameters, ProposalObserver, ProposalParameters,
};
pub use types::{
    CreateOpeningParameters, FillOpeningParameters, GeneralProposalParams, ProposalDetails,
    ProposalDetailsOf, ProposalEncoder, TerminateRoleParameters,
};
use working_group::{ApplicationId, OpeningId, OpeningType, WorkerId};

type WeightInfoCodex<T> = <T as Config>::WeightInfo;

// The forum working group instance alias.
pub type ForumWorkingGroupInstance = working_group::Instance1;

// The storage working group instance alias.
pub type StorageWorkingGroupInstance = working_group::Instance2;

// The content directory working group instance alias.
pub type ContentWorkingGroupInstance = working_group::Instance3;

// The builder working group instance alias.
pub type OperationsWorkingGroupInstanceAlpha = working_group::Instance4;

// The gateway working group instance alias.
pub type GatewayWorkingGroupInstance = working_group::Instance5;

// The membership working group instance alias.
pub type MembershipWorkingGroupInstance = working_group::Instance6;

// The builder working group instance alias.
pub type OperationsWorkingGroupInstanceBeta = working_group::Instance7;

// The builder working group instance alias.
pub type OperationsWorkingGroupInstanceGamma = working_group::Instance8;

// The distribution working group instance alias.
pub type DistributionWorkingGroupInstance = working_group::Instance9;

/// 'Proposals codex' substrate module Trait
pub trait Config:
    frame_system::Config
    + proposals_engine::Config
    + proposals_discussion::Config
    + common::membership::MembershipTypes
    + staking::Config
    + proposals_engine::Config
    + working_group::Config<ForumWorkingGroupInstance>
    + working_group::Config<StorageWorkingGroupInstance>
    + working_group::Config<ContentWorkingGroupInstance>
    + working_group::Config<OperationsWorkingGroupInstanceAlpha>
    + working_group::Config<GatewayWorkingGroupInstance>
    + working_group::Config<MembershipWorkingGroupInstance>
    + working_group::Config<OperationsWorkingGroupInstanceBeta>
    + working_group::Config<OperationsWorkingGroupInstanceGamma>
    + working_group::Config<DistributionWorkingGroupInstance>
{
    /// Proposal Codex module event type.
    type Event: From<Event<Self>> + Into<<Self as frame_system::Config>::Event>;

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

    /// `Veto Proposal` proposal parameters
    type VetoProposalProposalParameters: Get<ProposalParameters<Self::BlockNumber, BalanceOf<Self>>>;

    /// `Update Nft limit` proposal parameters
    type UpdateGlobalNftLimitProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// `Update Channel Payouts` proposal parameters
    type UpdateChannelPayoutsProposalParameters: Get<
        ProposalParameters<Self::BlockNumber, BalanceOf<Self>>,
    >;

    /// Max amount in funding request proposal (per account)
    type FundingRequestProposalMaxAmount: Get<BalanceOf<Self>>;

    /// Max number of accounts per funding request proposal
    type FundingRequestProposalMaxAccounts: Get<u32>;

    /// Max allowed number of validators in set max validator count proposal
    type SetMaxValidatorCountProposalMaxValidators: Get<u32>;
}

/// Specialized alias of GeneralProposalParams
pub type GeneralProposalParameters<T> = GeneralProposalParams<
    MemberId<T>,
    <T as frame_system::Config>::AccountId,
    <T as frame_system::Config>::BlockNumber,
>;

decl_event! {
    pub enum Event<T> where
        GeneralProposalParameters = GeneralProposalParameters<T>,
        ProposalDetailsOf = ProposalDetailsOf<T>,
        <T as proposals_engine::Config>::ProposalId,
        <T as proposals_discussion::Config>::ThreadId
    {
        /// A proposal was created
        /// Params:
        /// - Id of a newly created proposal after it was saved in storage.
        /// - General proposal parameter. Parameters shared by all proposals
        /// - Proposal Details. Parameter of proposal with a variant for each kind of proposal
        /// - Id of a newly created proposal thread
        ProposalCreated(ProposalId, GeneralProposalParameters, ProposalDetailsOf, ThreadId),
    }
}

decl_error! {
    /// Codex module predefined errors
    pub enum Error for Module<T: Config> {
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

        /// Invalid number of accounts recieving funding request for 'Funding Request' proposal.
        InvalidFundingRequestProposalNumberOfAccount,

        /// Repeated account in 'Funding Request' proposal.
        InvalidFundingRequestProposalRepeatedAccount,

        /// The specified min channel cashout is greater than the specified max channel cashout in `Update Channel Payouts` proposal.
        InvalidChannelPayoutsProposalMinCashoutExceedsMaxCashout,

        /// Provided lead worker id is not valid
        InvalidLeadWorkerId,

        /// Provided lead opening id is not valid
        InvalidLeadOpeningId,

        /// Provided lead application id is not valid
        InvalidLeadApplicationId,

        /// Provided proposal id is not valid
        InvalidProposalId,
    }
}

// Storage for the proposals codex module
decl_storage! {
    pub trait Store for Module<T: Config> as ProposalsCodex {
        /// Map proposal id to its discussion thread id
        pub ThreadIdByProposalId get(fn thread_id_by_proposal_id):
            map hasher(blake2_128_concat) T::ProposalId => T::ThreadId;
    }
}

decl_module! {
    /// Proposal codex substrate module Call
    pub struct Module<T: Config> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        fn deposit_event() = default;

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

        const VetoProposalProposalParameters:
            ProposalParameters<T::BlockNumber, BalanceOf<T>> = T::VetoProposalProposalParameters::get();

        const UpdateGlobalNftLimitProposalParameters:
            ProposalParameters<T::BlockNumber, BalanceOf<T>> = T::UpdateGlobalNftLimitProposalParameters::get();

        const UpdateChannelPayoutsProposalParameters:
            ProposalParameters<T::BlockNumber, BalanceOf<T>> = T::UpdateChannelPayoutsProposalParameters::get();

        /// Max amount in funding request proposal (per account)
        const FundingRequestProposalMaxAmount: BalanceOf<T> =
            T::FundingRequestProposalMaxAmount::get();

        /// Max number of accounts per funding request proposal
        const FundingRequestProposalMaxAccounts: u32 =
            T::FundingRequestProposalMaxAccounts::get();

        /// Max allowed number of validators in set max validator count proposal
        const SetMaxValidatorCountProposalMaxValidators: u32 =
            T::SetMaxValidatorCountProposalMaxValidators::get();


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
        #[weight = Module::<T>::get_create_proposal_weight(
                general_proposal_parameters,
                proposal_details
            )
        ]
        pub fn create_proposal(
            origin,
            general_proposal_parameters: GeneralProposalParameters<T>,
            proposal_details: ProposalDetailsOf<T>,
        ) {
            Self::ensure_details_checks(&proposal_details)?;

            let proposal_parameters = Self::get_proposal_parameters(&proposal_details);
            // TODO: encode_proposal could take a reference instead of moving to prevent cloning
            // since the encode trait takes a reference to `self`.
            // (Note: this is an useful change since this could be a ~3MB copy in the case of
            // a Runtime Upgrade). See: https://github.com/Joystream/joystream/issues/2161
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
                general_proposal_parameters.member_id,
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
                title: general_proposal_parameters.title.clone(),
                description: general_proposal_parameters.description.clone(),
                staking_account_id: general_proposal_parameters.staking_account_id.clone(),
                encoded_dispatchable_call_code: proposal_code,
                exact_execution_block: general_proposal_parameters.exact_execution_block,
            };

            let proposal_id =
                <proposals_engine::Module<T>>::create_proposal(proposal_creation_params)?;

            <ThreadIdByProposalId<T>>::insert(proposal_id, discussion_thread_id);

            Self::deposit_event(RawEvent::ProposalCreated(proposal_id, general_proposal_parameters, proposal_details, discussion_thread_id));
        }
    }
}

impl<T: Config> Module<T> {
    fn is_lead_worker_id<I: Instance>(worker_id: &WorkerId<T>) -> bool
    where
        T: working_group::Config<I>,
    {
        working_group::Module::<T, I>::current_lead()
            .map(|id| id == *worker_id)
            .unwrap_or(false)
    }

    // Ensure worker exists in given working group
    fn ensure_valid_lead_worker_id(wg: &WorkingGroup, worker_id: &WorkerId<T>) -> DispatchResult {
        let is_lead_id_valid = match wg {
            WorkingGroup::Forum => Self::is_lead_worker_id::<ForumWorkingGroupInstance>(worker_id),
            WorkingGroup::Storage => {
                Self::is_lead_worker_id::<StorageWorkingGroupInstance>(worker_id)
            }
            WorkingGroup::Content => {
                Self::is_lead_worker_id::<ContentWorkingGroupInstance>(worker_id)
            }
            WorkingGroup::OperationsAlpha => {
                Self::is_lead_worker_id::<OperationsWorkingGroupInstanceAlpha>(worker_id)
            }
            WorkingGroup::Gateway => {
                Self::is_lead_worker_id::<GatewayWorkingGroupInstance>(worker_id)
            }
            WorkingGroup::Membership => {
                Self::is_lead_worker_id::<MembershipWorkingGroupInstance>(worker_id)
            }
            WorkingGroup::OperationsBeta => {
                Self::is_lead_worker_id::<OperationsWorkingGroupInstanceBeta>(worker_id)
            }
            WorkingGroup::OperationsGamma => {
                Self::is_lead_worker_id::<OperationsWorkingGroupInstanceGamma>(worker_id)
            }
            WorkingGroup::Distribution => {
                Self::is_lead_worker_id::<DistributionWorkingGroupInstance>(worker_id)
            }
        };
        ensure!(is_lead_id_valid, Error::<T>::InvalidLeadWorkerId);
        Ok(())
    }

    fn is_lead_opening_id<I: Instance>(opening_id: &OpeningId) -> bool
    where
        T: working_group::Config<I>,
    {
        working_group::OpeningById::<T, I>::contains_key(opening_id)
            && working_group::OpeningById::<T, I>::get(opening_id).opening_type
                == OpeningType::Leader
    }

    // Ensure lead opening exists in given working group
    fn ensure_valid_lead_opening_id(wg: &WorkingGroup, opening_id: &OpeningId) -> DispatchResult {
        let is_opening_id_valid = match wg {
            WorkingGroup::Forum => {
                Self::is_lead_opening_id::<ForumWorkingGroupInstance>(opening_id)
            }
            WorkingGroup::Storage => {
                Self::is_lead_opening_id::<StorageWorkingGroupInstance>(opening_id)
            }
            WorkingGroup::Content => {
                Self::is_lead_opening_id::<ContentWorkingGroupInstance>(opening_id)
            }
            WorkingGroup::OperationsAlpha => {
                Self::is_lead_opening_id::<OperationsWorkingGroupInstanceAlpha>(opening_id)
            }
            WorkingGroup::Gateway => {
                Self::is_lead_opening_id::<GatewayWorkingGroupInstance>(opening_id)
            }
            WorkingGroup::Membership => {
                Self::is_lead_opening_id::<MembershipWorkingGroupInstance>(opening_id)
            }
            WorkingGroup::OperationsBeta => {
                Self::is_lead_opening_id::<OperationsWorkingGroupInstanceBeta>(opening_id)
            }
            WorkingGroup::OperationsGamma => {
                Self::is_lead_opening_id::<OperationsWorkingGroupInstanceGamma>(opening_id)
            }
            WorkingGroup::Distribution => {
                Self::is_lead_opening_id::<DistributionWorkingGroupInstance>(opening_id)
            }
        };
        ensure!(is_opening_id_valid, Error::<T>::InvalidLeadOpeningId);
        Ok(())
    }

    fn is_lead_application_id<I: Instance>(application_id: &ApplicationId) -> bool
    where
        T: working_group::Config<I>,
    {
        if let Some(application) = working_group::ApplicationById::<T, I>::get(application_id) {
            working_group::ApplicationById::<T, I>::contains_key(application_id)
                && working_group::OpeningById::<T, I>::get(application.opening_id).opening_type
                    == OpeningType::Leader
        } else {
            false
        }
    }

    // Ensure lead application exists in given working group
    fn ensure_valid_lead_application_id(
        wg: &WorkingGroup,
        application_id: &ApplicationId,
    ) -> DispatchResult {
        let is_application_id_valid = match wg {
            WorkingGroup::Forum => {
                Self::is_lead_application_id::<ForumWorkingGroupInstance>(application_id)
            }
            WorkingGroup::Storage => {
                Self::is_lead_application_id::<StorageWorkingGroupInstance>(application_id)
            }
            WorkingGroup::Content => {
                Self::is_lead_application_id::<ContentWorkingGroupInstance>(application_id)
            }
            WorkingGroup::OperationsAlpha => {
                Self::is_lead_application_id::<OperationsWorkingGroupInstanceAlpha>(application_id)
            }
            WorkingGroup::Gateway => {
                Self::is_lead_application_id::<GatewayWorkingGroupInstance>(application_id)
            }
            WorkingGroup::Membership => {
                Self::is_lead_application_id::<MembershipWorkingGroupInstance>(application_id)
            }
            WorkingGroup::OperationsBeta => {
                Self::is_lead_application_id::<OperationsWorkingGroupInstanceBeta>(application_id)
            }
            WorkingGroup::OperationsGamma => {
                Self::is_lead_application_id::<OperationsWorkingGroupInstanceGamma>(application_id)
            }
            WorkingGroup::Distribution => {
                Self::is_lead_application_id::<DistributionWorkingGroupInstance>(application_id)
            }
        };
        ensure!(
            is_application_id_valid,
            Error::<T>::InvalidLeadApplicationId
        );
        Ok(())
    }

    // Ensure proposal id is valid
    fn ensure_valid_proposal_id(
        proposal_id: &<T as proposals_engine::Config>::ProposalId,
    ) -> DispatchResult {
        ensure!(
            proposals_engine::Proposals::<T>::contains_key(proposal_id),
            Error::<T>::InvalidProposalId
        );
        Ok(())
    }

    // Ensure that the proposal details respects all the checks
    fn ensure_details_checks(details: &ProposalDetailsOf<T>) -> DispatchResult {
        match details {
            ProposalDetails::Signal(ref signal) => {
                ensure!(!signal.is_empty(), Error::<T>::SignalProposalIsEmpty);
            }
            ProposalDetails::RuntimeUpgrade(ref blob) => {
                ensure!(!blob.is_empty(), Error::<T>::RuntimeProposalIsEmpty);
            }
            ProposalDetails::FundingRequest(ref funding_requests) => {
                ensure!(
                    !funding_requests.is_empty(),
                    Error::<T>::InvalidFundingRequestProposalNumberOfAccount
                );

                ensure!(
                    funding_requests.len() <= T::FundingRequestProposalMaxAccounts::get() as usize,
                    Error::<T>::InvalidFundingRequestProposalNumberOfAccount
                );

                // Ideally we would use hashset but it's not available in substrate
                let mut visited_accounts = BTreeSet::new();

                for funding_request in funding_requests {
                    let account = &funding_request.account;

                    ensure!(
                        !visited_accounts.contains(&account),
                        Error::<T>::InvalidFundingRequestProposalRepeatedAccount
                    );

                    ensure!(
                        funding_request.amount != Zero::zero(),
                        Error::<T>::InvalidFundingRequestProposalBalance
                    );

                    ensure!(
                        funding_request.amount <= T::FundingRequestProposalMaxAmount::get(),
                        Error::<T>::InvalidFundingRequestProposalBalance
                    );

                    visited_accounts.insert(account);
                }
            }
            ProposalDetails::SetMaxValidatorCount(ref new_validator_count) => {
                // Since `set_validator_count` doesn't check that `new_validator_count`
                // isn't less than `minimum_validator_count` we need to do this here.
                // We shouldn't access the storage for creation checks but we do it here for the
                // reasons just explained **as an exception**.
                ensure!(
                    *new_validator_count >= <staking::Pallet<T>>::minimum_validator_count(),
                    Error::<T>::InvalidValidatorCount
                );

                ensure!(
                    *new_validator_count <= T::SetMaxValidatorCountProposalMaxValidators::get(),
                    Error::<T>::InvalidValidatorCount
                );
            }
            ProposalDetails::CreateWorkingGroupLeadOpening(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::FillWorkingGroupLeadOpening(params) => {
                Self::ensure_valid_lead_opening_id(&params.working_group, &params.opening_id)?;
                Self::ensure_valid_lead_application_id(
                    &params.working_group,
                    &params.application_id,
                )?;
            }
            ProposalDetails::UpdateWorkingGroupBudget(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::DecreaseWorkingGroupLeadStake(worker_id, ref stake_amount, wg) => {
                Self::ensure_valid_lead_worker_id(wg, worker_id)?;
                ensure!(
                    *stake_amount != Zero::zero(),
                    Error::<T>::DecreasingStakeIsZero
                );
            }
            ProposalDetails::SlashWorkingGroupLead(worker_id, _, wg) => {
                Self::ensure_valid_lead_worker_id(wg, worker_id)?;
            }
            ProposalDetails::SetWorkingGroupLeadReward(worker_id, _, wg) => {
                Self::ensure_valid_lead_worker_id(wg, worker_id)?;
            }
            ProposalDetails::TerminateWorkingGroupLead(params) => {
                Self::ensure_valid_lead_worker_id(&params.group, &params.worker_id)?;
            }
            ProposalDetails::AmendConstitution(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::CancelWorkingGroupLeadOpening(opening_id, wg) => {
                Self::ensure_valid_lead_opening_id(wg, opening_id)?;
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
            ProposalDetails::VetoProposal(proposal_id) => {
                Self::ensure_valid_proposal_id(proposal_id)?;
            }
            ProposalDetails::UpdateGlobalNftLimit(..) => {
                // Note: No checks for this proposal for now
            }
            ProposalDetails::UpdateChannelPayouts(params) => {
                if params.min_cashout_allowed.is_some() && params.max_cashout_allowed.is_some() {
                    ensure!(
                        params.max_cashout_allowed.unwrap() >= params.min_cashout_allowed.unwrap(),
                        Error::<T>::InvalidChannelPayoutsProposalMinCashoutExceedsMaxCashout
                    );
                }
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
            ProposalDetails::VetoProposal(..) => T::VetoProposalProposalParameters::get(),
            ProposalDetails::UpdateGlobalNftLimit(..) => {
                T::UpdateGlobalNftLimitProposalParameters::get()
            }
            ProposalDetails::UpdateChannelPayouts(..) => {
                T::UpdateChannelPayoutsProposalParameters::get()
            }
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
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::FundingRequest(params) => {
                WeightInfoCodex::<T>::create_proposal_funding_request(
                    params.len().saturated_into(),
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::SetMaxValidatorCount(..) => {
                WeightInfoCodex::<T>::create_proposal_set_max_validator_count(
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::CreateWorkingGroupLeadOpening(opening_params) => {
                WeightInfoCodex::<T>::create_proposal_create_working_group_lead_opening(
                    opening_params.description.len().saturated_into(),
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::FillWorkingGroupLeadOpening(..) => {
                WeightInfoCodex::<T>::create_proposal_fill_working_group_lead_opening(
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::UpdateWorkingGroupBudget(..) => {
                WeightInfoCodex::<T>::create_proposal_update_working_group_budget(
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::DecreaseWorkingGroupLeadStake(..) => {
                WeightInfoCodex::<T>::create_proposal_decrease_working_group_lead_stake(
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::SlashWorkingGroupLead(..) => {
                WeightInfoCodex::<T>::create_proposal_slash_working_group_lead(
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::SetWorkingGroupLeadReward(..) => {
                WeightInfoCodex::<T>::create_proposal_set_working_group_lead_reward(
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::TerminateWorkingGroupLead(..) => {
                WeightInfoCodex::<T>::create_proposal_terminate_working_group_lead(
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::AmendConstitution(new_constitution) => {
                WeightInfoCodex::<T>::create_proposal_amend_constitution(
                    new_constitution.len().saturated_into(),
                    title_length.saturated_into(),
                    description_length.saturated_into(),
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
                    title_length.saturated_into(),
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
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::SetInitialInvitationBalance(..) => {
                WeightInfoCodex::<T>::create_proposal_set_initial_invitation_balance(
                    title_length.saturated_into(),
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
                WeightInfoCodex::<T>::create_proposal_set_membership_lead_invitation_quota(
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::SetReferralCut(..) => {
                WeightInfoCodex::<T>::create_proposal_set_referral_cut(
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
            }
            ProposalDetails::VetoProposal(..) => {
                WeightInfoCodex::<T>::create_proposal_veto_proposal(
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
                .saturated_into()
            }
            ProposalDetails::UpdateGlobalNftLimit(..) => {
                WeightInfoCodex::<T>::create_proposal_update_global_nft_limit(
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
                .saturated_into()
            }
            ProposalDetails::UpdateChannelPayouts(params) => {
                WeightInfoCodex::<T>::create_proposal_update_channel_payouts(
                    params
                        .payload
                        .as_ref()
                        .map_or(0, |p| p.object_creation_params.ipfs_content_id.len() as u32),
                    title_length.saturated_into(),
                    description_length.saturated_into(),
                )
                .saturated_into()
            }
        }
    }
}

impl<T: Config> ProposalObserver<T> for Module<T> {
    fn proposal_removed(proposal_id: &<T as proposals_engine::Config>::ProposalId) {
        <ThreadIdByProposalId<T>>::remove(proposal_id);

        let thread_id = Self::thread_id_by_proposal_id(proposal_id);

        proposals_discussion::ThreadById::<T>::remove(thread_id);
    }
}
