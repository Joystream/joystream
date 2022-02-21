//! # Proposals engine module
//! Proposals `engine` module for the Joystream platform.
//! The main component of the proposals frame_system. Provides methods and extrinsics to create and
//! vote for proposals, inspired by Parity **Democracy module**.
//!
//! ## Overview
//! Proposals `engine` module provides an abstract mechanism to work with proposals: creation,
//! voting, execution, canceling, etc. Proposal execution demands serialized _Dispatchable_ proposal
//! code. It could be any _Dispatchable_ + _Parameter_ type, but most likely, it would be serialized
//! (via Parity _codec_ crate) extrisic call. A proposal stage can be described by
//! its [status](./enum.ProposalStatus.html).
//!
//! ## Proposal lifecycle
//! When a proposal passes
//! [checks](./struct.Module.html#method.ensure_create_proposal_parameters_are_valid)
//! for its [parameters](./struct.ProposalParameters.html) -
//! it can be [created](./struct.Module.html#method.create_proposal).
//! The newly created proposal has _Active_ status. The proposal can be voted on, vetoed or
//! canceled during its _voting period_. Votes can be [different](./enum.VoteKind.html). When the
//! proposal gets enough votes to be approved - the proposal becomes _PendingExecution_ or
//! _PendingConstitutionality_. The proposal could also be slashed or rejected. If the _voting
//! period_ ends with no decision it becomes expired. If the proposal got approved
//! and _grace period_ passed - the  `engine` module tries to execute the proposal.
//!
//! ### Notes
//!
//! - The proposal can be [vetoed](./struct.Module.html#method.veto_proposal)
//! anytime before the proposal execution by the _sudo_.
//! - If the _council_ got reelected during the proposal _voting period_ the external handler calls
//! [reject_active_proposals](./struct.Module.html#method.reject_active_proposals) function and
//! all active proposals got rejected and it also calls
//! [reactivate_pending_constitutionality_proposals](./struct.Module.html#method.reactivate_pending_constitutionality_proposals)
//! and proposals with pending constitutionality become active again.
//! - There are different fees to apply for slashed, rejected, expired or cancelled proposals.
//! - On runtime upgrade the proposals code could be obsolete, so we cancel all active proposals
//! with statuses: Active, PendingExecution, PendingConstitutionality using this function
//! [cancel_active_and_pending_proposals](./struct.Module.html#method.cancel_active_and_pending_proposals).
//!
//! ### Important abstract types to be implemented
//! Proposals `engine` module has several abstractions to be implemented in order to work correctly.
//! - _VoterOriginValidator_ - ensure valid voter identity. Voters should have permissions to vote:
//! they should be council members.
//! - [VotersParameters](./trait.VotersParameters.html) - defines total voter number, which is
//! the council size
//! - _ProposerOriginValidator_ - ensure valid proposer identity. Proposers should have permissions
//! to create a proposal: they should be members of the Joystream.
//! - StakingHandler - defines an interface for the staking.
//!
//! A full list of the abstractions can be found [here](./trait.Trait.html).
//!
//! ### Supported extrinsics
//! - [vote](./struct.Module.html#method.vote) - registers a vote for the proposal
//! - [cancel_proposal](./struct.Module.html#method.cancel_proposal) - cancels the proposal
//! (can be canceled only by owner)
//! - [veto_proposal](./struct.Module.html#method.veto_proposal) - vetoes the proposal
//!
//! ### Public API
//! - [create_proposal](./struct.Module.html#method.create_proposal) - creates proposal using
//! provided parameters
//! - [ensure_create_proposal_parameters_are_valid](./struct.Module.html#method.ensure_create_proposal_parameters_are_valid) -
//! ensures that we can create the proposal
//! - [reject_active_proposals](./struct.Module.html#method.reject_active_proposals) - rejects all
//! active proposals.
//! - [reactivate_pending_constitutionality_proposals](./struct.Module.html#method.reactivate_pending_constitutionality_proposals) -
//! reactivate proposals with pending constitutionality.
//! - [cancel_active_and_pending_proposals](./struct.Module.html#method.cancel_active_and_pending_proposals) -
//! cancels all active proposals.
//!
//! ## Usage
//!
//! ```
//! use frame_support::{decl_module, print};
//! use frame_system::ensure_signed;
//! use codec::Encode;
//! use pallet_proposals_engine::{self as engine, ProposalParameters, ProposalCreationParameters};
//!
//! pub trait Trait: engine::Trait + common::membership::MembershipTypes {}
//!
//! decl_module! {
//!     pub struct Module<T: Trait> for enum Call where origin: T::Origin {
//!         #[weight = 10_000_000]
//!         fn executable_proposal(origin) {
//!             print("executed!");
//!         }
//!
//!         #[weight = 10_000_000]
//!         pub fn create_spending_proposal(
//!             origin,
//!             proposer_id: T::MemberId,
//!         ) {
//!             let account_id = ensure_signed(origin)?;
//!             let parameters = ProposalParameters::default();
//!             let title = b"Spending proposal".to_vec();
//!             let description = b"We need to spend some tokens to support the working group lead."
//!                 .to_vec();
//!             let encoded_proposal_code = <Call<T>>::executable_proposal().encode();
//!
//!             <engine::Module<T>>::ensure_create_proposal_parameters_are_valid(
//!                 &parameters,
//!                 &title,
//!                 &description,
//!                 None,
//!                 None,
//!                 proposer_id,
//!             )?;
//!
//!             let creation_parameters = ProposalCreationParameters {
//!                 account_id,
//!                 proposer_id,
//!                 proposal_parameters : parameters,
//!                 title,
//!                 description,
//!                 staking_account_id: None,
//!                 encoded_dispatchable_call_code: encoded_proposal_code,
//!                 exact_execution_block: None,
//!             };
//!
//!             <engine::Module<T>>::create_proposal(creation_parameters)?;
//!         }
//!     }
//! }
//! # fn main() {}
//! ```

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use types::ProposalOf;

pub use types::{
    ApprovedProposalDecision, BalanceOf, ExecutionStatus, Proposal, ProposalCodeDecoder,
    ProposalCreationParameters, ProposalDecision, ProposalExecutable, ProposalParameters,
    ProposalStatus, VoteKind, VotersParameters, VotingResults,
};

pub(crate) mod types;

mod benchmarking;

#[cfg(test)]
mod tests;

use codec::Decode;
use frame_support::dispatch::{DispatchError, DispatchResult, UnfilteredDispatchable};
use frame_support::storage::IterableStorageMap;
use frame_support::traits::{Get, LockIdentifier};
use frame_support::weights::{GetDispatchInfo, Weight};
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage, ensure, Parameter, StorageDoubleMap,
};
use frame_system::{ensure_root, RawOrigin};
use sp_arithmetic::traits::{SaturatedConversion, Saturating, Zero};
use sp_std::vec::Vec;

use common::council::CouncilOriginValidator;
use common::membership::MemberOriginValidator;
use common::{MemberId, StakingAccountValidator};
use staking_handler::StakingHandler;

/// Proposals engine WeightInfo.
/// Note: This was auto generated through the benchmark CLI using the `--weight-trait` flag
pub trait WeightInfo {
    fn vote(i: u32) -> Weight;
    fn cancel_proposal() -> Weight;
    fn veto_proposal() -> Weight;
    fn on_initialize_immediate_execution_decode_fails(i: u32) -> Weight;
    fn on_initialize_pending_execution_decode_fails(i: u32) -> Weight;
    fn on_initialize_approved_pending_constitutionality(i: u32) -> Weight;
    fn on_initialize_rejected(i: u32) -> Weight;
    fn on_initialize_slashed(i: u32) -> Weight;
    fn cancel_active_and_pending_proposals(i: u32) -> Weight;
    fn proposer_remark() -> Weight;
}

type WeightInfoEngine<T> = <T as Trait>::WeightInfo;

/// Proposals engine trait.
pub trait Trait:
    frame_system::Trait
    + pallet_timestamp::Trait
    + common::membership::MembershipTypes
    + balances::Trait
{
    /// Engine event type.
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    /// Validates proposer id and origin combination
    type ProposerOriginValidator: MemberOriginValidator<
        Self::Origin,
        MemberId<Self>,
        Self::AccountId,
    >;

    /// Validates voter id and origin combination
    type CouncilOriginValidator: CouncilOriginValidator<
        Self::Origin,
        MemberId<Self>,
        Self::AccountId,
    >;

    /// Provides data for voting. Defines maximum voters count for the proposal.
    type TotalVotersCounter: VotersParameters;

    /// Proposal Id type
    type ProposalId: From<u32> + Parameter + Default + Copy;

    /// Provides stake logic implementation.
    type StakingHandler: StakingHandler<
        Self::AccountId,
        BalanceOf<Self>,
        MemberId<Self>,
        LockIdentifier,
    >;

    /// The fee is applied when cancel the proposal. A fee would be slashed (burned).
    type CancellationFee: Get<BalanceOf<Self>>;

    /// The fee is applied when the proposal gets rejected. A fee would be slashed (burned).
    type RejectionFee: Get<BalanceOf<Self>>;

    /// Defines max allowed proposal title length.
    type TitleMaxLength: Get<u32>;

    /// Defines max allowed proposal description length.
    type DescriptionMaxLength: Get<u32>;

    /// Defines max simultaneous active proposals number.
    type MaxActiveProposalLimit: Get<u32>;

    /// Proposals executable code. Can be instantiated by external module Call enum members.
    type DispatchableCallCode: Parameter
        + UnfilteredDispatchable<Origin = Self::Origin>
        + GetDispatchInfo
        + Default;

    /// Proposal state change observer.
    type ProposalObserver: ProposalObserver<Self>;

    /// Weight information for extrinsics in this pallet.
    type WeightInfo: WeightInfo;

    /// Validates staking account ownership for a member.
    type StakingAccountValidator: common::StakingAccountValidator<Self>;
}

/// Proposal state change observer.
pub trait ProposalObserver<T: Trait> {
    /// Should be called on proposal removing.
    fn proposal_removed(proposal_id: &T::ProposalId);
}

/// Nesting implementation.
impl<T: Trait, X: ProposalObserver<T>, Y: ProposalObserver<T>> ProposalObserver<T> for (X, Y) {
    fn proposal_removed(proposal_id: &<T as Trait>::ProposalId) {
        X::proposal_removed(proposal_id);
        Y::proposal_removed(proposal_id);
    }
}

decl_event!(
    /// Proposals engine events
    pub enum Event<T>
    where
        <T as Trait>::ProposalId,
        MemberId = MemberId<T>,
        <T as frame_system::Trait>::BlockNumber,
    {

        /// Emits on proposal creation.
        /// Params:
        /// - Id of a proposal.
        /// - New proposal status.
        ProposalStatusUpdated(ProposalId, ProposalStatus<BlockNumber>),

        /// Emits on getting a proposal status decision.
        /// Params:
        /// - Id of a proposal.
        /// - Proposal decision
        ProposalDecisionMade(ProposalId, ProposalDecision),

        /// Emits on proposal execution.
        /// Params:
        /// - Id of a updated proposal.
        /// - Proposal execution status.
        ProposalExecuted(ProposalId, ExecutionStatus),

        /// Emits on voting for the proposal
        /// Params:
        /// - Voter - member id of a voter.
        /// - Id of a proposal.
        /// - Kind of vote.
        /// - Rationale.
        Voted(MemberId, ProposalId, VoteKind, Vec<u8>),

        /// Emits on a proposal being cancelled
        /// Params:
        /// - Member Id of the proposer
        /// - Id of the proposal
        ProposalCancelled(MemberId, ProposalId),

        /// Emits on proposer making a remark
        /// - proposer id
        /// - proposal id
        /// - message
        ProposerRemarked(MemberId, ProposalId, Vec<u8>),
    }
);

decl_error! {
    /// Engine module predefined errors
    pub enum Error for Module<T: Trait>{
        /// Proposal cannot have an empty title"
        EmptyTitleProvided,

        /// Proposal cannot have an empty body
        EmptyDescriptionProvided,

        /// Title is too long
        TitleIsTooLong,

        /// Description is too long
        DescriptionIsTooLong,

        /// The proposal does not exist
        ProposalNotFound,

        /// Proposal is finalized already
        ProposalFinalized,

        /// The proposal have been already voted on
        AlreadyVoted,

        /// Not an author
        NotAuthor,

        /// Max active proposals number exceeded
        MaxActiveProposalNumberExceeded,

        /// Stake cannot be empty with this proposal
        EmptyStake,

        /// Stake should be empty for this proposal
        StakeShouldBeEmpty,

        /// Stake differs from the proposal requirements
        StakeDiffersFromRequired,

        /// Approval threshold cannot be zero
        InvalidParameterApprovalThreshold,

        /// Slashing threshold cannot be zero
        InvalidParameterSlashingThreshold,

        /// Require root origin in extrinsics
        RequireRootOrigin,

        /// Disallow to cancel the proposal if there are any votes on it.
        ProposalHasVotes,

        /// Exact execution block cannot be zero.
        ZeroExactExecutionBlock,

        /// Exact execution block cannot be less than current_block.
        InvalidExactExecutionBlock,

        /// There is not enough balance for a stake.
        InsufficientBalanceForStake,

        /// The conflicting stake discovered. Cannot stake.
        ConflictingStakes,

        /// Staking account doesn't belong to a member.
        InvalidStakingAccountForMember,
    }
}

// Storage for the proposals engine module
decl_storage! {
    pub trait Store for Module<T: Trait> as ProposalEngine{
        /// Map proposal by its id.
        pub Proposals get(fn proposals): map hasher(blake2_128_concat)
            T::ProposalId => ProposalOf<T>;

        /// Count of all proposals that have been created.
        pub ProposalCount get(fn proposal_count): u32;

        /// Map proposal executable code by proposal id.
        pub DispatchableCallCode get(fn proposal_codes): map hasher(blake2_128_concat)
            T::ProposalId => Vec<u8>;

        /// Count of active proposals.
        pub ActiveProposalCount get(fn active_proposal_count): u32;

        /// Double map for preventing duplicate votes. Should be cleaned after usage.
        pub VoteExistsByProposalByVoter get(fn vote_by_proposal_by_voter):
            double_map hasher(blake2_128_concat) T::ProposalId, hasher(blake2_128_concat) MemberId<T> => VoteKind;
    }
}

decl_module! {
    /// 'Proposal engine' substrate module
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        /// Emits an event. Default substrate implementation.
        fn deposit_event() = default;

        /// Exports const - the fee is applied when cancel the proposal. A fee would be slashed (burned).
        const CancellationFee: BalanceOf<T> = T::CancellationFee::get();

        /// Exports const -  the fee is applied when the proposal gets rejected. A fee would
        /// be slashed (burned).
        const RejectionFee: BalanceOf<T> = T::RejectionFee::get();

        /// Exports const -  max allowed proposal title length.
        const TitleMaxLength: u32 = T::TitleMaxLength::get();

        /// Exports const -  max allowed proposal description length.
        const DescriptionMaxLength: u32 = T::DescriptionMaxLength::get();

        /// Exports const -  max simultaneous active proposals number.
        const MaxActiveProposalLimit: u32 = T::MaxActiveProposalLimit::get();

        /// Exports const - staking handler lock id.
        const StakingHandlerLockId: LockIdentifier = T::StakingHandler::lock_id();

        /// Block Initialization. Perform voting period check, vote result tally, approved proposals
        /// grace period checks, and proposal execution.
        /// # <weight>
        ///
        /// ## Weight
        /// `O (P + I)` where:
        /// - `P` is the weight of all executed proposals
        /// - `I` is the weight of the worst branch for anything else in `on_initialize`
        /// - DB:
        ///    - O(1) doesn't depend on the state
        /// # </weight>
        fn on_initialize() -> Weight {
            // `process_proposal` returns the weight of the executed proposals. The weight of the
            // executed proposals doesn't include any access to the store or calculation that
            // `on_initialize` does. Therefore, to get the total weight of `on_initialize` we need
            // to add the weight of the execution of `on_intialize` to the weight returned by
            // `process_proposal`.
            // To be safe, we use the worst possible case for `on_initialize`, meaning that there
            // are as many proposals active as possible and they all take the worst possible branch.

            // Maximum Weight of all possible worst case scenarios
            let maximum_branch_weight = Self::weight_of_worst_on_initialize_branch();

            // Weight of the executed proposals
            let executed_proposals_weight = Self::process_proposals();

            // total_weight = executed_proposals_weight + maximum_branch_weight
            executed_proposals_weight.saturating_add(maximum_branch_weight)
        }

        /// Vote extrinsic. Conditions:  origin must allow votes.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (R)` where:
        /// - `R` is the length of `rationale`
        /// - DB:
        ///    - O(1) doesn't depend on the state or paraemters
        /// # </weight>
        #[weight = WeightInfoEngine::<T>::vote(rationale.len().saturated_into())]
        pub fn vote(
            origin,
            voter_id: MemberId<T>,
            proposal_id: T::ProposalId,
            vote: VoteKind,
            rationale: Vec<u8>, // we use it on the query node side.
        ) {
            T::CouncilOriginValidator::ensure_member_consulate(origin, voter_id)?;

            ensure!(<Proposals<T>>::contains_key(proposal_id), Error::<T>::ProposalNotFound);
            let mut proposal = Self::proposals(proposal_id);

            ensure!(
                matches!(proposal.status, ProposalStatus::Active{..}),
                Error::<T>::ProposalFinalized
            );

            let did_not_vote_before = !<VoteExistsByProposalByVoter<T>>::contains_key(
                proposal_id,
                voter_id,
            );

            ensure!(did_not_vote_before, Error::<T>::AlreadyVoted);

            proposal.voting_results.add_vote(vote.clone());

            //
            // == MUTATION SAFE ==
            //

            <Proposals<T>>::insert(proposal_id, proposal);
            <VoteExistsByProposalByVoter<T>>::insert(proposal_id, voter_id, vote.clone());
            Self::deposit_event(RawEvent::Voted(voter_id, proposal_id, vote, rationale));
        }

        /// Cancel a proposal by its original proposer.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (L)` where:
        /// - `L` is the total number of locks in `Balances`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoEngine::<T>::cancel_proposal()]
        pub fn cancel_proposal(origin, proposer_id: MemberId<T>, proposal_id: T::ProposalId) {
            T::ProposerOriginValidator::ensure_member_controller_account_origin(origin, proposer_id)?;

            ensure!(<Proposals<T>>::contains_key(proposal_id), Error::<T>::ProposalNotFound);
            let proposal = Self::proposals(proposal_id);

            ensure!(proposer_id == proposal.proposer_id, Error::<T>::NotAuthor);
            ensure!(
                matches!(proposal.status, ProposalStatus::Active{..}),
                Error::<T>::ProposalFinalized
            );
            ensure!(proposal.voting_results.no_votes_yet(), Error::<T>::ProposalHasVotes);

            //
            // == MUTATION SAFE ==
            //

            Self::finalize_proposal(proposal_id, proposal, ProposalDecision::Canceled);
            Self::deposit_event(RawEvent::ProposalCancelled(proposer_id, proposal_id));
        }

        /// Veto a proposal. Must be root.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)` doesn't depend on the state or parameters
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoEngine::<T>::veto_proposal()]
        pub fn veto_proposal(origin, proposal_id: T::ProposalId) {
            ensure_root(origin)?;

            ensure!(<Proposals<T>>::contains_key(proposal_id), Error::<T>::ProposalNotFound);
            let proposal = Self::proposals(proposal_id);

            // Note: we don't need to check if the proposal is active pending execution or
            // or pending constitutionality since if it in the storage `Proposals` it follows
            // that it is in one of those states.
            //
            // == MUTATION SAFE ==
            //

            Self::finalize_proposal(proposal_id, proposal, ProposalDecision::Vetoed);
        }

        /// Proposer Remark
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)` doesn't depend on the state or parameters
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoEngine::<T>::proposer_remark()]
        pub fn proposer_remark(
            origin,
            proposal_id: T::ProposalId,
            proposer_id: MemberId<T>,
            msg: Vec<u8>,
        ) {
            T::ProposerOriginValidator::ensure_member_controller_account_origin(origin, proposer_id)?;

            ensure!(<Proposals<T>>::contains_key(proposal_id), Error::<T>::ProposalNotFound);
            let proposal = Self::proposals(proposal_id);

            ensure!(proposer_id == proposal.proposer_id, Error::<T>::NotAuthor);

            Self::deposit_event(RawEvent::ProposerRemarked(proposer_id, proposal_id, msg));
        }
    }
}

impl<T: Trait> Module<T> {
    /// Create proposal. Requires 'proposal origin' membership.
    pub fn create_proposal(
        creation_params: ProposalCreationParameters<
            T::BlockNumber,
            BalanceOf<T>,
            MemberId<T>,
            T::AccountId,
        >,
    ) -> Result<T::ProposalId, DispatchError> {
        Self::ensure_create_proposal_parameters_are_valid(
            &creation_params.proposal_parameters,
            &creation_params.title,
            &creation_params.description,
            creation_params.staking_account_id.clone(),
            creation_params.exact_execution_block,
            creation_params.proposer_id,
        )?;

        //
        // == MUTATION SAFE ==
        //

        let next_proposal_count_value = Self::proposal_count() + 1;
        let new_proposal_id = next_proposal_count_value;
        let proposal_id = T::ProposalId::from(new_proposal_id);

        // Lock stake balance for proposal if the stake is required.
        if let Some(stake_balance) = creation_params.proposal_parameters.required_stake {
            if let Some(staking_account_id) = creation_params.staking_account_id.clone() {
                T::StakingHandler::lock(&staking_account_id, stake_balance);
            }
        }

        let new_proposal = Proposal {
            activated_at: Self::current_block(),
            parameters: creation_params.proposal_parameters,
            proposer_id: creation_params.proposer_id,
            status: ProposalStatus::Active,
            voting_results: VotingResults::default(),
            exact_execution_block: creation_params.exact_execution_block,
            nr_of_council_confirmations: 0,
            staking_account_id: creation_params.staking_account_id,
        };

        <Proposals<T>>::insert(proposal_id, new_proposal);
        <DispatchableCallCode<T>>::insert(
            proposal_id,
            creation_params.encoded_dispatchable_call_code,
        );
        ProposalCount::put(next_proposal_count_value);
        Self::increase_active_proposal_counter();

        Ok(proposal_id)
    }

    /// Performs all checks for the proposal creation:
    /// - title, body lengths
    /// - max active proposal
    /// - provided parameters: approval_threshold_percentage and slashing_threshold_percentage > 0
    /// - provided stake balance and parameters.required_stake are valid
    pub fn ensure_create_proposal_parameters_are_valid(
        parameters: &ProposalParameters<T::BlockNumber, BalanceOf<T>>,
        title: &[u8],
        description: &[u8],
        staking_account_id: Option<T::AccountId>,
        exact_execution_block: Option<T::BlockNumber>,
        member_id: T::MemberId,
    ) -> DispatchResult {
        ensure!(!title.is_empty(), Error::<T>::EmptyTitleProvided);
        ensure!(
            title.len() as u32 <= T::TitleMaxLength::get(),
            Error::<T>::TitleIsTooLong
        );

        ensure!(
            !description.is_empty(),
            Error::<T>::EmptyDescriptionProvided
        );
        ensure!(
            description.len() as u32 <= T::DescriptionMaxLength::get(),
            Error::<T>::DescriptionIsTooLong
        );

        ensure!(
            (Self::active_proposal_count()) < T::MaxActiveProposalLimit::get(),
            Error::<T>::MaxActiveProposalNumberExceeded
        );

        ensure!(
            parameters.approval_threshold_percentage > 0,
            Error::<T>::InvalidParameterApprovalThreshold
        );

        ensure!(
            parameters.slashing_threshold_percentage > 0,
            Error::<T>::InvalidParameterSlashingThreshold
        );

        // Check stake parameters.
        if staking_account_id.is_some() && parameters.required_stake.is_none() {
            return Err(Error::<T>::StakeShouldBeEmpty.into());
        }

        if let Some(stake_balance) = parameters.required_stake {
            if let Some(staking_account_id) = staking_account_id {
                ensure!(
                    T::StakingAccountValidator::is_member_staking_account(
                        &member_id,
                        &staking_account_id
                    ),
                    Error::<T>::InvalidStakingAccountForMember
                );

                ensure!(
                    T::StakingHandler::is_account_free_of_conflicting_stakes(&staking_account_id),
                    Error::<T>::ConflictingStakes
                );

                ensure!(
                    T::StakingHandler::is_enough_balance_for_stake(
                        &staking_account_id,
                        stake_balance
                    ),
                    Error::<T>::InsufficientBalanceForStake
                );
            } else {
                return Err(Error::<T>::EmptyStake.into());
            }
        }

        // Check execution block.
        if let Some(execution_block) = exact_execution_block {
            if execution_block == Zero::zero() {
                return Err(Error::<T>::ZeroExactExecutionBlock.into());
            }

            let now = Self::current_block();
            if execution_block < now + parameters.grace_period + parameters.voting_period {
                return Err(Error::<T>::InvalidExactExecutionBlock.into());
            }
        }

        Ok(())
    }

    /// Rejects all active proposals.
    /// Possible application includes new council elections.
    pub fn reject_active_proposals() {
        // Filter active proposals and reject them.
        <Proposals<T>>::iter()
            .filter_map(|(proposal_id, proposal)| {
                if proposal.status.is_active_proposal() {
                    return Some((proposal_id, proposal));
                }

                None
            })
            .for_each(|(proposal_id, proposal)| {
                Self::finalize_proposal(proposal_id, proposal, ProposalDecision::Rejected);
            });
    }

    /// Cancels all active, pending execution and pending constitutionality proposals.
    /// No fee applies.Possible application includes the runtime upgrade.
    pub fn cancel_active_and_pending_proposals() -> Weight {
        let active_proposal_count = Self::active_proposal_count();

        // Filter active proposals and reject them.
        <Proposals<T>>::iter()
            .filter_map(|(proposal_id, proposal)| {
                if proposal.status.is_active_or_pending_execution()
                    || proposal.status.is_pending_constitutionality_proposal()
                {
                    return Some((proposal_id, proposal));
                }

                None
            })
            .for_each(|(proposal_id, proposal)| {
                Self::finalize_proposal(proposal_id, proposal, ProposalDecision::CanceledByRuntime);
            });

        <WeightInfoEngine<T>>::cancel_active_and_pending_proposals(
            active_proposal_count.saturated_into(),
        )
    }

    /// Reactivate proposals with pending constitutionality.
    /// Possible application includes new council elections.
    pub fn reactivate_pending_constitutionality_proposals() {
        // Filter pending constitutionality proposals, calculate new proposals and update the state.
        <Proposals<T>>::iter()
            .filter_map(|(proposal_id, mut proposal)| {
                if proposal.status.is_pending_constitutionality_proposal() {
                    proposal.activated_at = Self::current_block();
                    proposal.status = ProposalStatus::Active;
                    // Resets votes for a proposal.
                    proposal.reset_proposal_votes();

                    return Some((proposal_id, proposal));
                }

                None
            })
            .for_each(|(proposal_id, proposal)| {
                <VoteExistsByProposalByVoter<T>>::remove_prefix(&proposal_id);
                <Proposals<T>>::insert(proposal_id, proposal.clone());

                // fire the proposal status update event
                Self::deposit_event(RawEvent::ProposalStatusUpdated(
                    proposal_id,
                    proposal.status,
                ));
            });
    }
}

impl<T: Trait> Module<T> {
    // Helper to calculate the weight of the worst `on_initialize` branch
    fn weight_of_worst_on_initialize_branch() -> Weight {
        let max_active_proposals = T::MaxActiveProposalLimit::get();

        // Weight when all the proposals are immediatly approved and executed
        let immediate_execution_branch_weight =
            WeightInfoEngine::<T>::on_initialize_immediate_execution_decode_fails(
                max_active_proposals,
            );

        let pending_execution_branch_weight =
            WeightInfoEngine::<T>::on_initialize_pending_execution_decode_fails(
                max_active_proposals,
            );

        // Weight when all the proposals are approved and pending constitutionality
        let approved_pending_constitutionality_branch_weight =
            WeightInfoEngine::<T>::on_initialize_approved_pending_constitutionality(
                max_active_proposals,
            );

        // Weight when all proposals are rejected
        let rejected_branch_weight =
            WeightInfoEngine::<T>::on_initialize_rejected(max_active_proposals);

        // Weight when all proposals are slashed
        let slashed_branch_weight =
            WeightInfoEngine::<T>::on_initialize_slashed(max_active_proposals);

        // Maximum Weight of all possible worst case scenarios
        immediate_execution_branch_weight
            .max(pending_execution_branch_weight)
            .max(approved_pending_constitutionality_branch_weight)
            .max(rejected_branch_weight)
            .max(slashed_branch_weight)
    }

    // Wrapper-function over System::block_number()
    fn current_block() -> T::BlockNumber {
        <frame_system::Module<T>>::block_number()
    }

    // Executes proposal code.
    // Returns the weight of the proposal(wether execution failed or not) or 0 if the proposal
    // couldn't be decoded.
    fn execute_proposal(proposal_id: T::ProposalId) -> Weight {
        let proposal_code = Self::proposal_codes(proposal_id);

        let proposal_code_result = T::DispatchableCallCode::decode(&mut &proposal_code[..]);

        let mut execution_code_weight = 0;

        let execution_status = match proposal_code_result {
            Ok(proposal_code) => {
                execution_code_weight = proposal_code.get_dispatch_info().weight;

                if let Err(dispatch_error) =
                    proposal_code.dispatch_bypass_filter(T::Origin::from(RawOrigin::Root))
                {
                    ExecutionStatus::failed_execution(Self::parse_dispatch_error(
                        dispatch_error.error,
                    ))
                } else {
                    ExecutionStatus::Executed
                }
            }
            Err(_) => ExecutionStatus::failed_execution("Decoding error"),
        };

        Self::deposit_event(RawEvent::ProposalExecuted(proposal_id, execution_status));

        Self::remove_proposal_data(&proposal_id);

        execution_code_weight
    }

    // Computes a finalized proposal:
    // - update proposal status fields (status, finalized_at),
    // - increment constitutionality level of the proposal.
    // Performs all side-effect actions on proposal finalization:
    // - slash and unstake proposal stake if stake exists,
    // - fire an event,
    // - update or delete proposal state.
    // Executes the proposal if it ready.
    // If proposal was executed returns its weight otherwise it returns 0.
    fn finalize_proposal(
        proposal_id: T::ProposalId,
        proposal: ProposalOf<T>,
        proposal_decision: ProposalDecision,
    ) -> Weight {
        // fire the proposal decision event
        Self::deposit_event(RawEvent::ProposalDecisionMade(
            proposal_id,
            proposal_decision.clone(),
        ));

        let mut executed_weight = 0;

        // deal with stakes if necessary
        if proposal_decision
            != ProposalDecision::Approved(ApprovedProposalDecision::PendingConstitutionality)
        {
            let slash_balance =
                Self::calculate_slash_balance(&proposal_decision, &proposal.parameters);
            Self::slash_and_unstake(proposal.staking_account_id.clone(), slash_balance);
        }

        // update approved proposal or remove otherwise
        if let ProposalDecision::Approved(approved_proposal_decision) = proposal_decision {
            let now = Self::current_block();

            let mut finalized_proposal = proposal;

            finalized_proposal.increase_constitutionality_level();
            finalized_proposal.status = ProposalStatus::approved(approved_proposal_decision, now);

            // fire the proposal status update event
            Self::deposit_event(RawEvent::ProposalStatusUpdated(
                proposal_id,
                finalized_proposal.status.clone(),
            ));

            // immediately execute proposal if it ready for execution or save it for the future otherwise.
            if finalized_proposal.is_ready_for_execution(now) {
                executed_weight = Self::execute_proposal(proposal_id);
            } else {
                <Proposals<T>>::insert(proposal_id, finalized_proposal);
            }
        } else {
            Self::remove_proposal_data(&proposal_id);
        }

        executed_weight
    }

    // Slashes the stake and perform unstake only in case of existing stake.
    fn slash_and_unstake(staking_account_id: Option<T::AccountId>, slash_balance: BalanceOf<T>) {
        // only if stake exists
        if let Some(staking_account_id) = staking_account_id {
            if !slash_balance.is_zero() {
                T::StakingHandler::slash(&staking_account_id, Some(slash_balance));
            }

            T::StakingHandler::unlock(&staking_account_id);
        }
    }

    // Calculates required slash based on finalization ProposalDecisionStatus and proposal parameters.
    // Method visibility allows testing.
    pub(crate) fn calculate_slash_balance(
        proposal_decision: &ProposalDecision,
        proposal_parameters: &ProposalParameters<T::BlockNumber, BalanceOf<T>>,
    ) -> BalanceOf<T> {
        match proposal_decision {
            ProposalDecision::Rejected | ProposalDecision::Expired => T::RejectionFee::get(),
            ProposalDecision::Approved { .. }
            | ProposalDecision::Vetoed
            | ProposalDecision::CanceledByRuntime => BalanceOf::<T>::zero(),
            ProposalDecision::Canceled => T::CancellationFee::get(),
            ProposalDecision::Slashed => proposal_parameters
                .required_stake
                .clone()
                .unwrap_or_else(BalanceOf::<T>::zero), // stake if set or zero
        }
    }

    // Increases active proposal counter.
    fn increase_active_proposal_counter() {
        let next_active_proposal_count_value = Self::active_proposal_count() + 1;
        ActiveProposalCount::put(next_active_proposal_count_value);
    }

    // Decreases active proposal counter down to zero. Decreasing below zero has no effect.
    fn decrease_active_proposal_counter() {
        let current_active_proposal_counter = Self::active_proposal_count();

        if current_active_proposal_counter > 0 {
            let next_active_proposal_count_value = current_active_proposal_counter - 1;
            ActiveProposalCount::put(next_active_proposal_count_value);
        };
    }

    // Parse dispatchable execution result.
    fn parse_dispatch_error(error: DispatchError) -> &'static str {
        match error {
            DispatchError::BadOrigin => error.into(),
            DispatchError::Other(msg) => msg,
            DispatchError::CannotLookup => error.into(),
            DispatchError::Module {
                index: _,
                error: _,
                message: msg,
            } => msg.unwrap_or("Dispatch error."),
        }
    }

    // Clean proposal data. Remove proposal, votes from the storage.
    fn remove_proposal_data(proposal_id: &T::ProposalId) {
        <Proposals<T>>::remove(proposal_id);
        <DispatchableCallCode<T>>::remove(proposal_id);
        <VoteExistsByProposalByVoter<T>>::remove_prefix(&proposal_id);
        Self::decrease_active_proposal_counter();

        T::ProposalObserver::proposal_removed(proposal_id);
    }

    /// Perform voting period check, vote result tally, approved proposals
    /// grace period checks, and proposal execution.
    /// Returns the total weight of all the executed proposals or 0 if none was executed.
    fn process_proposals() -> Weight {
        // Collect all proposals.
        let proposals = <Proposals<T>>::iter().collect::<Vec<_>>();
        let now = Self::current_block();

        let mut executed_weight = 0;

        for (proposal_id, proposal) in proposals {
            match proposal.status {
                // Try to determine a decision for an active proposal.
                ProposalStatus::Active => {
                    let decision_status = proposal
                        .define_proposal_decision(T::TotalVotersCounter::total_voters_count(), now);

                    // If decision is calculated for a proposal - finalize it.
                    if let Some(decision_status) = decision_status {
                        executed_weight.saturating_add(Self::finalize_proposal(
                            proposal_id,
                            proposal,
                            decision_status,
                        ));
                    }
                }
                // Execute the proposal code if the proposal is ready for execution.
                ProposalStatus::PendingExecution(_) => {
                    if proposal.is_ready_for_execution(now) {
                        executed_weight =
                            executed_weight.saturating_add(Self::execute_proposal(proposal_id));
                    }
                }
                // Skip the proposal until it gets reactivated.
                ProposalStatus::PendingConstitutionality => {}
            }
        }

        executed_weight
    }
}
