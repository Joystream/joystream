//! Proposals engine module for the Joystream platform. Version 2.
//! Provides methods and extrinsics to create and vote for proposals.
//!
//! Supported extrinsics:
//! - vote
//! - cancel_proposal
//! - veto_proposal
//!
//! Public API (requires root origin):
//! - create_proposal
//!

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

// Do not delete! Cannot be uncommented by default, because of Parity decl_module! issue.
//#![warn(missing_docs)]

use types::FinalizedProposalData;
pub use types::VotingResults;
pub use types::{Proposal, ProposalParameters, ProposalStatus};
pub use types::{ProposalCodeDecoder, ProposalExecutable};
pub use types::{VoteKind, VotersParameters};

pub use rstd::collections::btree_set::BTreeSet; //TODO change to linked_map

mod errors;
mod types;

#[cfg(test)]
mod tests;

use rstd::prelude::*;

use runtime_primitives::traits::EnsureOrigin;
use srml_support::{
    decl_event, decl_module, decl_storage, dispatch, ensure, Parameter, StorageDoubleMap,
};
use system::ensure_root;

// TODO: add maximum allowed active proposals
// TODO: update proposal.finalized_at - update on all proposal finalization points.

// Max allowed proposal title length. Can be used if config value is not filled.
const DEFAULT_TITLE_MAX_LEN: u32 = 100;
// Max allowed proposal body length. Can be used if config value is not filled.
const DEFAULT_BODY_MAX_LEN: u32 = 10_000;

// TODO add to config
// Max simultaneous active proposals number.
const MAX_ACTIVE_PROPOSALS_NUMBER: u32 = 100;

/// Proposals engine trait.
pub trait Trait: system::Trait + timestamp::Trait + stake::Trait {
    /// Engine event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    /// Origin from which proposals must come.
    type ProposalOrigin: EnsureOrigin<Self::Origin, Success = Self::AccountId>;

    /// Origin from which votes must come.
    type VoteOrigin: EnsureOrigin<Self::Origin, Success = Self::AccountId>;

    /// Provides data for voting. Defines maximum voters count for the proposal.
    type TotalVotersCounter: VotersParameters;

    /// Converts proposal code binary to executable representation

    type ProposalCodeDecoder: ProposalCodeDecoder<Self>;

    /// Proposal Id type
    type ProposalId: From<u32> + Parameter + Default + Copy;

    /// Type for the proposer id. Should be authenticated by account id.
    type ProposerId: From<Self::AccountId> + Parameter + Default;

    /// Type for the voter id. Should be authenticated by account id.
    type VoterId: From<Self::AccountId> + Parameter + Default + Clone;
}

decl_event!(
    /// Proposals engine events
    pub enum Event<T>
    where
        <T as Trait>::ProposalId,
        <T as Trait>::ProposerId,
        <T as Trait>::VoterId,
    {
    	/// Emits on proposal creation.
        /// Params:
        /// * Account id of a proposer.
        /// * Id of a newly created proposal after it was saved in storage.
        ProposalCreated(ProposerId, ProposalId),

        /// Emits on proposal cancellation.
        /// Params:
        /// * Account id of a proposer.
        /// * Id of a cancelled proposal.
        ProposalCanceled(ProposerId, ProposalId),

        /// Emits on proposal veto.
        /// Params:
        /// * Id of a vetoed proposal.
        ProposalVetoed(ProposalId),

        /// Emits on proposal status change.
        /// Params:
        /// * Id of a updated proposal.
        /// * New proposal status
        ProposalStatusUpdated(ProposalId, ProposalStatus),

        /// Emits on voting for the proposal
        /// Params:
        /// * Voter - an account id of a voter.
        /// * Id of a proposal.
        /// * Kind of vote.
        Voted(VoterId, ProposalId, VoteKind),
    }
);

// Storage for the proposals engine module
decl_storage! {
    pub trait Store for Module<T: Trait> as ProposalEngine{
        /// Map proposal by its id.
        pub Proposals get(fn proposals): map T::ProposalId => Proposal<T::BlockNumber, T::ProposerId, types::BalanceOf<T>>;

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
            double_map T::ProposalId, twox_256(T::VoterId) => VoteKind;

        /// Defines max allowed proposal title length. Can be configured.
        pub TitleMaxLen get(title_max_len) config(): u32 = DEFAULT_TITLE_MAX_LEN;

        /// Defines max allowed proposal body length. Can be configured.
        pub BodyMaxLen get(body_max_len) config(): u32 = DEFAULT_BODY_MAX_LEN;
    }
}

decl_module! {
    /// 'Proposal engine' substrate module
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        /// Emits an event. Default substrate implementation.
        fn deposit_event() = default;

        /// Vote extrinsic. Conditions:  origin must allow votes.
        pub fn vote(origin, proposal_id: T::ProposalId, vote: VoteKind)  {
            let account_id = T::VoteOrigin::ensure_origin(origin)?;
            let voter_id = T::VoterId::from(account_id);

            ensure!(<Proposals<T>>::exists(proposal_id), errors::MSG_PROPOSAL_NOT_FOUND);
            let mut proposal = Self::proposals(proposal_id);

            ensure!(proposal.status == ProposalStatus::Active, errors::MSG_PROPOSAL_FINALIZED);

            let did_not_vote_before = !<VoteExistsByProposalByVoter<T>>::exists(
                proposal_id,
                voter_id.clone(),
            );

            ensure!(did_not_vote_before, errors::MSG_YOU_ALREADY_VOTED);

            proposal.voting_results.add_vote(vote.clone());

            // mutation

            <Proposals<T>>::insert(proposal_id, proposal);
            <VoteExistsByProposalByVoter<T>>::insert( proposal_id, voter_id.clone(), vote.clone());
            Self::deposit_event(RawEvent::Voted(voter_id, proposal_id, vote));
        }

        /// Cancel a proposal by its original proposer.
        pub fn cancel_proposal(origin, proposal_id: T::ProposalId) {
            let account_id = T::ProposalOrigin::ensure_origin(origin)?;
            let proposer_id = T::ProposerId::from(account_id);

            ensure!(<Proposals<T>>::exists(proposal_id), errors::MSG_PROPOSAL_NOT_FOUND);
            let proposal = Self::proposals(proposal_id);

            ensure!(proposer_id == proposal.proposer_id, errors::MSG_YOU_DONT_OWN_THIS_PROPOSAL);
            ensure!(proposal.status == ProposalStatus::Active, errors::MSG_PROPOSAL_FINALIZED);

            // mutation

            Self::update_proposal_status(proposal_id, ProposalStatus::Canceled);
            Self::deposit_event(RawEvent::ProposalCanceled(proposer_id, proposal_id));
        }

        /// Veto a proposal. Must be root.
        pub fn veto_proposal(origin, proposal_id: T::ProposalId) {
            ensure_root(origin)?;

            ensure!(<Proposals<T>>::exists(proposal_id), errors::MSG_PROPOSAL_NOT_FOUND);
            let proposal = Self::proposals(proposal_id);

            ensure!(proposal.status == ProposalStatus::Active, errors::MSG_PROPOSAL_FINALIZED);

            // mutation

            Self::update_proposal_status(proposal_id, ProposalStatus::Vetoed);
            Self::deposit_event(RawEvent::ProposalVetoed(proposal_id));
        }

        /// Block finalization. Perform voting period check, vote result tally, approved proposals
        /// grace period checks, and proposal execution.
        fn on_finalize(_n: T::BlockNumber) {
            let executable_proposal_ids =
                Self::get_approved_proposal_with_expired_grace_period_ids();
            let finalized_proposals_data = Self::get_finalized_proposals_data();

            // mutation

            // Check vote results
            for  proposal_data in finalized_proposals_data {
                <Proposals<T>>::insert(proposal_data.proposal_id, proposal_data.proposal);
                Self::update_proposal_status(proposal_data.proposal_id, proposal_data.status);
            }

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
        parameters: ProposalParameters<T::BlockNumber, types::BalanceOf<T>>,
        title: Vec<u8>,
        body: Vec<u8>,
        proposal_type: u32,
        proposal_code: Vec<u8>,
    ) -> dispatch::Result {
        let account_id = T::ProposalOrigin::ensure_origin(origin)?;
        let proposer_id = T::ProposerId::from(account_id);

        ensure!(!title.is_empty(), errors::MSG_EMPTY_TITLE_PROVIDED);
        ensure!(
            title.len() as u32 <= Self::title_max_len(),
            errors::MSG_TOO_LONG_TITLE
        );

        ensure!(!body.is_empty(), errors::MSG_EMPTY_BODY_PROVIDED);
        ensure!(
            body.len() as u32 <= Self::body_max_len(),
            errors::MSG_TOO_LONG_BODY
        );

        ensure!(
            (Self::active_proposal_count()) < MAX_ACTIVE_PROPOSALS_NUMBER,
            errors::MSG_MAX_ACTIVE_PROPOSAL_NUMBER_EXCEEDED
        );

        let next_proposal_count_value = Self::proposal_count() + 1;
        let new_proposal_id = next_proposal_count_value;

        let new_proposal = Proposal {
            created_at: Self::current_block(),
            parameters,
            title,
            body,
            proposer_id: proposer_id.clone(),
            proposal_type,
            status: ProposalStatus::Active,
            approved_at: None,
            voting_results: VotingResults::default(),
            finalized_at: None,
        };

        // mutation
        let proposal_id = T::ProposalId::from(new_proposal_id);
        <Proposals<T>>::insert(proposal_id, new_proposal);
        <ProposalCode<T>>::insert(proposal_id, proposal_code);
        <ActiveProposalIds<T>>::insert(proposal_id, ());
        ProposalCount::put(next_proposal_count_value);
        Self::increase_active_proposal_counter();

        Self::deposit_event(RawEvent::ProposalCreated(proposer_id, proposal_id));

        Ok(())
    }
}

impl<T: Trait> Module<T> {
    // Wrapper-function over system::block_number()
    fn current_block() -> T::BlockNumber {
        <system::Module<T>>::block_number()
    }

    // Executes approved proposal code
    fn execute_proposal(proposal_id: T::ProposalId) {
        let proposal = Self::proposals(proposal_id);
        let proposal_code = Self::proposal_codes(proposal_id);

        let proposal_code_result =
            T::ProposalCodeDecoder::decode_proposal(proposal.proposal_type, proposal_code);

        let new_proposal_status = match proposal_code_result {
            Ok(proposal_code) => {
                if let Err(error) = proposal_code.execute() {
                    ProposalStatus::Failed {
                        error: error.as_bytes().to_vec(),
                    }
                } else {
                    ProposalStatus::Executed
                }
            }
            Err(error) => ProposalStatus::Failed {
                error: error.as_bytes().to_vec(),
            },
        };

        Self::update_proposal_status(proposal_id, new_proposal_status)
    }

    /// Enumerates through active proposals. Tally Voting results.
    /// Returns proposals with finalized status and id
    fn get_finalized_proposals_data(
    ) -> Vec<FinalizedProposalData<T::ProposalId, T::BlockNumber, T::ProposerId, types::BalanceOf<T>>>
    {
        // enumerate active proposals id and gather finalization data
        <ActiveProposalIds<T>>::enumerate()
            .filter_map(|(proposal_id, _)| {
                // load current proposal
                let proposal = Self::proposals(proposal_id);

                let decision_status = proposal.define_proposal_decision_status(
                    T::TotalVotersCounter::total_voters_count(),
                    Self::current_block(),
                );

                if let Some(status) = decision_status {
                    Some(FinalizedProposalData {
                        proposal_id,
                        proposal,
                        status,
                        finalized_at: Self::current_block(),
                    })
                } else {
                    None
                }
            })
            .collect() // compose output vector
    }

    // TODO: update proposal.finalized_at
    // TODO: to be refactored or removed after introducing stakes. Events should be fired on actions
    // such as 'rejected' or 'approved'.
    /// Updates proposal status and removes proposal id from active id set.
    fn update_proposal_status(proposal_id: T::ProposalId, new_status: ProposalStatus) {
        if new_status != ProposalStatus::Active {
            <ActiveProposalIds<T>>::remove(&proposal_id);
        }
        <Proposals<T>>::mutate(proposal_id, |p| p.status = new_status.clone());

        Self::deposit_event(RawEvent::ProposalStatusUpdated(
            proposal_id,
            new_status.clone(),
        ));

        if new_status.is_decision_status() {
            Self::decrease_active_proposal_counter();
        }

        match new_status {
            ProposalStatus::Rejected | ProposalStatus::Expired => {
                Self::reject_proposal(proposal_id)
            }
            ProposalStatus::Approved => Self::approve_proposal(proposal_id),
            ProposalStatus::Active => {}
            ProposalStatus::PendingExecution => {
                let proposal = Self::proposals(proposal_id);

                // immediate execution
                // grace period from proposal parameters was set to zero
                if proposal.is_grace_period_expired(Self::current_block()) {
                    Self::execute_proposal(proposal_id);
                }
            }
            ProposalStatus::Executed | ProposalStatus::Failed { .. } => {
                <PendingExecutionProposalIds<T>>::remove(&proposal_id);
            }
            ProposalStatus::Vetoed | ProposalStatus::Canceled => {} // do nothing
        }
    }

    /// Reject a proposal. The staked deposit will be returned to a proposer.
    fn reject_proposal(_proposal_id: T::ProposalId) {}

    /// Approve a proposal. The staked deposit will be returned.
    fn approve_proposal(proposal_id: T::ProposalId) {
        <Proposals<T>>::mutate(proposal_id, |p| p.approved_at = Some(Self::current_block()));
        <PendingExecutionProposalIds<T>>::insert(proposal_id, ());
        Self::update_proposal_status(proposal_id, ProposalStatus::PendingExecution);
    }

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

    /// Increases active proposal counter.
    fn increase_active_proposal_counter() {
        let next_active_proposal_count_value = Self::active_proposal_count() + 1;
        ActiveProposalCount::put(next_active_proposal_count_value);
    }

    /// Decreases active proposal counter down to zero. Decreasing below zero has no effect.
    fn decrease_active_proposal_counter() {
        let current_active_proposal_counter = Self::active_proposal_count();

        if current_active_proposal_counter > 0 {
            let next_active_proposal_count_value =  current_active_proposal_counter - 1;
            ActiveProposalCount::put(next_active_proposal_count_value);
        };
    }
}
