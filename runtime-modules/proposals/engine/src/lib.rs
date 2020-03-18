//! Proposals engine module for the Joystream platform. Version 2.
//! Provides methods and extrinsics to create and vote for proposals,
//! inspired by Parity **Democracy module**.
//!
//! Supported extrinsics:
//! - vote - registers a vote for the proposal
//! - cancel_proposal - cancels the proposal (can be canceled only by owner)
//! - veto_proposal - vetoes the proposal
//!
//! Public API (requires root origin):
//! - create_proposal - creates proposal using provided parameters
//!

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

// Do not delete! Cannot be uncommented by default, because of Parity decl_module! issue.
//#![warn(missing_docs)]

// TODO: Test module after the https://github.com/Joystream/substrate-runtime-joystream/issues/161
// issue will be fixed: "Fix stake module and allow slashing and unstaking in the same block."
// TODO: Test cancellation, rejection fees
// TODO: Test StakingEventHandler
// TODO: Test refund_proposal_stake()

pub use types::CouncilManager;
use types::FinalizedProposalData;
use types::ProposalStakeManager;
pub use types::{
    ApprovedProposalStatus, FinalizationData, Proposal, ProposalDecisionStatus, ProposalParameters,
    ProposalStatus, StakeData, StakingEventsHandler, VotingResults,
};
pub use types::{BalanceOf, CurrencyOf, NegativeImbalance};
pub use types::{DefaultStakeHandlerProvider, StakeHandler, StakeHandlerProvider};
pub use types::{ProposalCodeDecoder, ProposalExecutable};
pub use types::{VoteKind, VotersParameters};

pub(crate) mod types;

#[cfg(test)]
mod tests;

use codec::Decode;
use rstd::prelude::*;
use sr_primitives::traits::{DispatchResult, Zero};
use srml_support::traits::{Currency, Get};
use srml_support::{
    decl_error, decl_event, decl_module, decl_storage, ensure, Parameter, StorageDoubleMap,
};
use system::{ensure_root, RawOrigin};

use common::origin_validator::ActorOriginValidator;
use membership::origin_validator::MemberId;
use srml_support::dispatch::Dispatchable;

/// Proposals engine trait.
pub trait Trait:
    system::Trait
    + timestamp::Trait
    + stake::Trait
    + membership::members::Trait
    + governance::council::Trait
{
    /// Engine event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    /// Validates proposer id and origin combination
    type ProposerOriginValidator: ActorOriginValidator<
        Self::Origin,
        MemberId<Self>,
        Self::AccountId,
    >;

    /// Validates voter id and origin combination
    type VoterOriginValidator: ActorOriginValidator<Self::Origin, MemberId<Self>, Self::AccountId>;

    /// Provides data for voting. Defines maximum voters count for the proposal.
    type TotalVotersCounter: VotersParameters;

    /// Proposal Id type
    type ProposalId: From<u32> + Parameter + Default + Copy;

    /// Provides stake logic implementation. Can be used to mock stake logic.
    type StakeHandlerProvider: StakeHandlerProvider<Self>;

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
    type ProposalCode: Parameter + Dispatchable<Origin = Self::Origin> + Default;
}

decl_event!(
    /// Proposals engine events
    pub enum Event<T>
    where
        <T as Trait>::ProposalId,
        MemberId = MemberId<T>,
        <T as system::Trait>::BlockNumber,
    {
    	/// Emits on proposal creation.
        /// Params:
        /// - Member id of a proposer.
        /// - Id of a newly created proposal after it was saved in storage.
        ProposalCreated(MemberId, ProposalId),

        /// Emits on proposal status change.
        /// Params:
        /// - Id of a updated proposal.
        /// - New proposal status
        ProposalStatusUpdated(ProposalId, ProposalStatus<BlockNumber>),

        /// Emits on voting for the proposal
        /// Params:
        /// - Voter - member id of a voter.
        /// - Id of a proposal.
        /// - Kind of vote.
        Voted(MemberId, ProposalId, VoteKind),
    }
);

decl_error! {
    pub enum Error {
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

        /// Require signed origin in extrinsics
        RequireSignedOrigin,

        /// Require root origin in extrinsics
        RequireRootOrigin,
    }
}

impl From<system::Error> for Error {
    fn from(error: system::Error) -> Self {
        match error {
            system::Error::Other(msg) => Error::Other(msg),
            system::Error::CannotLookup => Error::Other("CannotLookup"),
            system::Error::BadSignature => Error::Other("BadSignature"),
            system::Error::BlockFull => Error::Other("BlockFull"),
            system::Error::RequireSignedOrigin => Error::RequireSignedOrigin,
            system::Error::RequireRootOrigin => Error::RequireRootOrigin,
            system::Error::RequireNoOrigin => Error::Other("RequireNoOrigin"),
        }
    }
}

// Storage for the proposals engine module
decl_storage! {
    pub trait Store for Module<T: Trait> as ProposalEngine{
        /// Map proposal by its id.
        pub Proposals get(fn proposals): map T::ProposalId => ProposalObject<T>;

        /// Count of all proposals that have been created.
        pub ProposalCount get(fn proposal_count): u32;

        /// Map proposal executable code by proposal id.
        pub ProposalCode get(fn proposal_codes): map T::ProposalId =>  Vec<u8>;

        /// Count of active proposals.
        pub ActiveProposalCount get(fn active_proposal_count): u32;

        /// Ids of proposals that are open for voting (have not been finalized yet).
        pub ActiveProposalIds get(fn active_proposal_ids): linked_map T::ProposalId=> ();

        /// Ids of proposals that were approved and theirs grace period was not expired.
        pub PendingExecutionProposalIds get(fn pending_proposal_ids): linked_map T::ProposalId=> ();

        /// Double map for preventing duplicate votes. Should be cleaned after usage.
        pub VoteExistsByProposalByVoter get(fn vote_by_proposal_by_voter):
            double_map T::ProposalId, twox_256(MemberId<T>) => VoteKind;

        /// Map proposal id by stake id. Required by StakingEventsHandler callback call
        pub StakesProposals get(fn stakes_proposals): map T::StakeId =>  T::ProposalId;
    }
}

decl_module! {
    /// 'Proposal engine' substrate module
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error;

        /// Emits an event. Default substrate implementation.
        fn deposit_event() = default;

        /// Vote extrinsic. Conditions:  origin must allow votes.
        pub fn vote(origin, voter_id: MemberId<T>, proposal_id: T::ProposalId, vote: VoteKind)  {
            T::VoterOriginValidator::ensure_actor_origin(
                origin,
                voter_id.clone(),
            )?;

            ensure!(<Proposals<T>>::exists(proposal_id), Error::ProposalNotFound);
            let mut proposal = Self::proposals(proposal_id);

            ensure!(proposal.status == ProposalStatus::Active, Error::ProposalFinalized);

            let did_not_vote_before = !<VoteExistsByProposalByVoter<T>>::exists(
                proposal_id,
                voter_id.clone(),
            );

            ensure!(did_not_vote_before, Error::AlreadyVoted);

            proposal.voting_results.add_vote(vote.clone());

            // mutation

            <Proposals<T>>::insert(proposal_id, proposal);
            <VoteExistsByProposalByVoter<T>>::insert( proposal_id, voter_id.clone(), vote.clone());
            Self::deposit_event(RawEvent::Voted(voter_id, proposal_id, vote));
        }

        /// Cancel a proposal by its original proposer.
        pub fn cancel_proposal(origin, proposer_id: MemberId<T>, proposal_id: T::ProposalId) {
            T::ProposerOriginValidator::ensure_actor_origin(
                origin,
                proposer_id.clone(),
            )?;

            ensure!(<Proposals<T>>::exists(proposal_id), Error::ProposalNotFound);
            let proposal = Self::proposals(proposal_id);

            ensure!(proposer_id == proposal.proposer_id, Error::NotAuthor);
            ensure!(proposal.status == ProposalStatus::Active, Error::ProposalFinalized);

            // mutation

            Self::finalize_proposal(proposal_id, ProposalDecisionStatus::Canceled);
        }

        /// Veto a proposal. Must be root.
        pub fn veto_proposal(origin, proposal_id: T::ProposalId) {
            ensure_root(origin)?;

            ensure!(<Proposals<T>>::exists(proposal_id), Error::ProposalNotFound);
            let proposal = Self::proposals(proposal_id);

            ensure!(proposal.status == ProposalStatus::Active, Error::ProposalFinalized);

            // mutation

            Self::finalize_proposal(proposal_id, ProposalDecisionStatus::Vetoed);
        }

        /// Block finalization. Perform voting period check, vote result tally, approved proposals
        /// grace period checks, and proposal execution.
        fn on_finalize(_n: T::BlockNumber) {
            let finalized_proposals = Self::get_finalized_proposals();

            // mutation

            // Check vote results. Approved proposals with zero grace period will be
            // transitioned to the PendingExecution status.
            for  proposal_data in finalized_proposals {
                <Proposals<T>>::insert(proposal_data.proposal_id, proposal_data.proposal);
                Self::finalize_proposal(proposal_data.proposal_id, proposal_data.status);
            }

            let executable_proposal_ids =
                Self::get_approved_proposal_with_expired_grace_period_ids();

            // Execute approved proposals with expired grace period
            for  proposal_id in executable_proposal_ids {
                Self::execute_proposal(proposal_id);
            }
        }
    }
}

impl<T: Trait> Module<T> {
    /// Create proposal. Requires 'proposal origin' membership.
    pub fn create_proposal(
        origin: T::Origin,
        proposer_id: MemberId<T>,
        parameters: ProposalParameters<T::BlockNumber, types::BalanceOf<T>>,
        title: Vec<u8>,
        description: Vec<u8>,
        stake_balance: Option<types::BalanceOf<T>>,
        proposal_code: Vec<u8>,
    ) -> Result<T::ProposalId, &'static str> {
        let account_id =
            T::ProposerOriginValidator::ensure_actor_origin(origin, proposer_id.clone())?;

        Self::ensure_create_proposal_parameters_are_valid(
            &parameters,
            &title,
            &description,
            stake_balance,
        )?;

        // checks passed
        // mutation

        let next_proposal_count_value = Self::proposal_count() + 1;
        let new_proposal_id = next_proposal_count_value;
        let proposal_id = T::ProposalId::from(new_proposal_id);

        // Check stake_balance for value and create stake if value exists, else take None
        // If create_stake() returns error - return error from extrinsic
        let stake_id_result = stake_balance
            .map(|stake_amount| {
                ProposalStakeManager::<T>::create_stake(stake_amount, account_id.clone())
            })
            .transpose()?;

        let mut stake_data = None;
        if let Some(stake_id) = stake_id_result {
            stake_data = Some(StakeData {
                stake_id,
                source_account_id: account_id,
            });

            <StakesProposals<T>>::insert(stake_id, proposal_id);
        }

        let new_proposal = Proposal {
            created_at: Self::current_block(),
            parameters,
            title,
            description,
            proposer_id: proposer_id.clone(),
            status: ProposalStatus::Active,
            voting_results: VotingResults::default(),
            stake_data,
        };

        <Proposals<T>>::insert(proposal_id, new_proposal);
        <ProposalCode<T>>::insert(proposal_id, proposal_code);
        <ActiveProposalIds<T>>::insert(proposal_id, ());
        ProposalCount::put(next_proposal_count_value);
        Self::increase_active_proposal_counter();

        Self::deposit_event(RawEvent::ProposalCreated(proposer_id, proposal_id));

        Ok(proposal_id)
    }
}

impl<T: Trait> Module<T> {
    // Wrapper-function over system::block_number()
    fn current_block() -> T::BlockNumber {
        <system::Module<T>>::block_number()
    }

    // Enumerates through active proposals. Tally Voting results.
    // Returns proposals with finalized status and id
    fn get_finalized_proposals() -> Vec<FinalizedProposal<T>> {
        // Enumerate active proposals id and gather finalization data.
        // Skip proposals with unfinished voting.
        <ActiveProposalIds<T>>::enumerate()
            .filter_map(|(proposal_id, _)| {
                // load current proposal
                let proposal = Self::proposals(proposal_id);

                // Calculates votes, takes in account voting period expiration.
                // If voting process is in progress, then decision status is None.
                let decision_status = proposal.define_proposal_decision_status(
                    T::TotalVotersCounter::total_voters_count(),
                    Self::current_block(),
                );

                // map to FinalizedProposalData if decision for the proposal is made or return None
                decision_status.map(|status| FinalizedProposalData {
                    proposal_id,
                    proposal,
                    status,
                    finalized_at: Self::current_block(),
                })
            })
            .collect() // compose output vector
    }

    // Executes approved proposal code
    fn execute_proposal(proposal_id: T::ProposalId) {
        let mut proposal = Self::proposals(proposal_id);

        // Execute only proposals with correct status
        if let ProposalStatus::Finalized(finalized_status) = proposal.status.clone() {
            let proposal_code = Self::proposal_codes(proposal_id);

            let proposal_code_result = T::ProposalCode::decode(&mut &proposal_code[..]);

            let approved_proposal_status = match proposal_code_result {
                Ok(proposal_code) => {
                    if let Err(error) = proposal_code.dispatch(T::Origin::from(RawOrigin::Root)) {
                        ApprovedProposalStatus::failed_execution(
                            error.into().message.unwrap_or("Dispatch error"),
                        )
                    } else {
                        ApprovedProposalStatus::Executed
                    }
                }
                Err(error) => ApprovedProposalStatus::failed_execution(error.what()),
            };

            let proposal_execution_status =
                finalized_status.create_approved_proposal_status(approved_proposal_status);

            proposal.status = proposal_execution_status.clone();
            <Proposals<T>>::insert(proposal_id, proposal);

            Self::deposit_event(RawEvent::ProposalStatusUpdated(
                proposal_id,
                proposal_execution_status,
            ));
        }

        // Remove proposals from the 'pending execution' queue even in case of not finalized status
        // to prevent eternal cycles.
        <PendingExecutionProposalIds<T>>::remove(&proposal_id);
    }

    // Performs all actions on proposal finalization:
    // - clean active proposal cache
    // - update proposal status fields (status, finalized_at)
    // - add to pending execution proposal cache if approved
    // - slash and unstake proposal stake if stake exists
    // - fire an event
    fn finalize_proposal(proposal_id: T::ProposalId, decision_status: ProposalDecisionStatus) {
        Self::decrease_active_proposal_counter();
        <ActiveProposalIds<T>>::remove(&proposal_id.clone());

        let mut proposal = Self::proposals(proposal_id);

        if let ProposalDecisionStatus::Approved { .. } = decision_status {
            <PendingExecutionProposalIds<T>>::insert(proposal_id, ());
        }

        // deal with stakes if necessary
        let slash_balance = Self::calculate_slash_balance(&decision_status, &proposal.parameters);
        let slash_and_unstake_result =
            Self::slash_and_unstake(proposal.stake_data.clone(), slash_balance);

        //TODO: leave stake data as is?
        if slash_and_unstake_result.is_ok() {
            proposal.stake_data = None;
        }

        // create finalized proposal status with error if any
        let new_proposal_status = //TODO rename without an error
            ProposalStatus::finalized_with_error(decision_status, slash_and_unstake_result.err(), Self::current_block());

        proposal.status = new_proposal_status.clone();
        <Proposals<T>>::insert(proposal_id, proposal);

        Self::deposit_event(RawEvent::ProposalStatusUpdated(
            proposal_id,
            new_proposal_status,
        ));
    }

    // Slashes the stake and perform unstake only in case of existing stake
    fn slash_and_unstake(
        current_stake_data: Option<StakeData<T::StakeId, T::AccountId>>,
        slash_balance: BalanceOf<T>,
    ) -> Result<(), &'static str> {
        // only if stake exists
        if let Some(stake_data) = current_stake_data {
            if !slash_balance.is_zero() {
                ProposalStakeManager::<T>::slash(stake_data.stake_id, slash_balance)?;
            }

            ProposalStakeManager::<T>::remove_stake(stake_data.stake_id)?;
        }

        Ok(())
    }

    // Calculates required slash based on finalization ProposalDecisionStatus and proposal parameters.
    fn calculate_slash_balance(
        decision_status: &ProposalDecisionStatus,
        proposal_parameters: &ProposalParameters<T::BlockNumber, types::BalanceOf<T>>,
    ) -> types::BalanceOf<T> {
        match decision_status {
            ProposalDecisionStatus::Rejected | ProposalDecisionStatus::Expired => {
                T::RejectionFee::get()
            }
            ProposalDecisionStatus::Approved { .. } | ProposalDecisionStatus::Vetoed => {
                BalanceOf::<T>::zero()
            }
            ProposalDecisionStatus::Canceled => T::CancellationFee::get(),
            ProposalDecisionStatus::Slashed => proposal_parameters
                .required_stake
                .clone()
                .unwrap_or_else(BalanceOf::<T>::zero), // stake if set or zero
        }
    }

    // Enumerates approved proposals and checks their grace period expiration
    fn get_approved_proposal_with_expired_grace_period_ids() -> Vec<T::ProposalId> {
        <PendingExecutionProposalIds<T>>::enumerate()
            .filter_map(|(proposal_id, _)| {
                let proposal = Self::proposals(proposal_id);

                if proposal.is_grace_period_expired(Self::current_block()) {
                    Some(proposal_id)
                } else {
                    None
                }
            })
            .collect()
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

    // Performs all checks for the proposal creation:
    // - title, body lengths
    // - mac active proposal
    // - provided parameters: approval_threshold_percentage and slashing_threshold_percentage > 0
    // - provided stake balance and parameters.required_stake are valid
    fn ensure_create_proposal_parameters_are_valid(
        parameters: &ProposalParameters<T::BlockNumber, types::BalanceOf<T>>,
        title: &[u8],
        description: &[u8],
        stake_balance: Option<types::BalanceOf<T>>,
    ) -> DispatchResult<Error> {
        ensure!(!title.is_empty(), Error::EmptyTitleProvided);
        ensure!(
            title.len() as u32 <= T::TitleMaxLength::get(),
            Error::TitleIsTooLong
        );

        ensure!(!description.is_empty(), Error::EmptyDescriptionProvided);
        ensure!(
            description.len() as u32 <= T::DescriptionMaxLength::get(),
            Error::DescriptionIsTooLong
        );

        ensure!(
            (Self::active_proposal_count()) < T::MaxActiveProposalLimit::get(),
            Error::MaxActiveProposalNumberExceeded
        );

        ensure!(
            parameters.approval_threshold_percentage > 0,
            Error::InvalidParameterApprovalThreshold
        );

        ensure!(
            parameters.slashing_threshold_percentage > 0,
            Error::InvalidParameterSlashingThreshold
        );

        // check stake parameters
        if let Some(required_stake) = parameters.required_stake {
            if let Some(staked_balance) = stake_balance {
                ensure!(
                    required_stake == staked_balance,
                    Error::StakeDiffersFromRequired
                );
            } else {
                return Err(Error::EmptyStake);
            }
        }

        if stake_balance.is_some() && parameters.required_stake.is_none() {
            return Err(Error::StakeShouldBeEmpty);
        }

        Ok(())
    }

    //TODO: candidate for invariant break or error saving to the state
    /// Callback from StakingEventsHandler. Refunds unstaked imbalance back to the source account
    pub(crate) fn refund_proposal_stake(stake_id: T::StakeId, imbalance: NegativeImbalance<T>) {
        if <StakesProposals<T>>::exists(stake_id) {
            //TODO: handle non existence

            let proposal_id = Self::stakes_proposals(stake_id);

            if <Proposals<T>>::exists(proposal_id) {
                let proposal = Self::proposals(proposal_id);

                if let Some(stake_data) = proposal.stake_data {
                    //TODO: handle the result
                    let _ = CurrencyOf::<T>::resolve_into_existing(
                        &stake_data.source_account_id,
                        imbalance,
                    );
                }
            }
        }
    }
}

// Simplification of the 'FinalizedProposalData' type
type FinalizedProposal<T> = FinalizedProposalData<
    <T as Trait>::ProposalId,
    <T as system::Trait>::BlockNumber,
    MemberId<T>,
    types::BalanceOf<T>,
    <T as stake::Trait>::StakeId,
    <T as system::Trait>::AccountId,
>;

// Simplification of the 'Proposal' type
type ProposalObject<T> = Proposal<
    <T as system::Trait>::BlockNumber,
    MemberId<T>,
    types::BalanceOf<T>,
    <T as stake::Trait>::StakeId,
    <T as system::Trait>::AccountId,
>;
