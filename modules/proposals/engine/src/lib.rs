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

pub use types::TallyResult;
pub use types::{Proposal, ProposalParameters, ProposalStatus};
pub use types::{ProposalCodeDecoder, ProposalExecutable};
pub use types::{Vote, VoteKind, VotersParameters};

mod errors;
mod types;

#[cfg(test)]
mod tests;

use rstd::collections::btree_set::BTreeSet;
use rstd::prelude::*;
use runtime_primitives::traits::EnsureOrigin;
use srml_support::{decl_event, decl_module, decl_storage, dispatch, ensure, StorageDoubleMap};
use system::ensure_root;

const DEFAULT_TITLE_MAX_LEN: u32 = 100;
const DEFAULT_BODY_MAX_LEN: u32 = 10_000;

/// Proposals engine trait.
pub trait Trait: system::Trait + timestamp::Trait + stake::Trait{
    /// Engine event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    /// Origin from which proposals must come.
    type ProposalOrigin: EnsureOrigin<Self::Origin, Success = Self::AccountId>;

    /// Origin from which votes must come.
    type VoteOrigin: EnsureOrigin<Self::Origin, Success = Self::AccountId>;

    /// Provides data for voting. Defines maximum voters count for the proposal.
    type TotalVotersCounter: VotersParameters;

    /// Converts proposal code binary to executable representation
    type ProposalCodeDecoder: ProposalCodeDecoder;
}

decl_event!(
    /// Proposals engine events
    pub enum Event<T>
    where
        <T as system::Trait>::AccountId
    {
    	/// Emits on proposal creation.
        /// Params:
        /// * Account id of a proposer.
        /// * Id of a newly created proposal after it was saved in storage.
        ProposalCreated(AccountId, u32),

        /// Emits on proposal cancellation.
        /// Params:
        /// * Account id of a proposer.
        /// * Id of a cancelled proposal.
        ProposalCanceled(AccountId, u32),

        /// Emits on proposal veto.
        /// Params:
        /// * Id of a vetoed proposal.
        ProposalVetoed(u32),

        /// Emits on proposal status change.
        /// Params:
        /// * Id of a updated proposal.
        /// * New proposal status
        ProposalStatusUpdated(u32, ProposalStatus),

        /// Emits on voting for the proposal
        /// Params:
        /// * Voter - an account id of a voter.
        /// * Id of a proposal.
        /// * Kind of vote.
        Voted(AccountId, u32, VoteKind),
    }
);

// Storage for the proposals module
decl_storage! {
    pub trait Store for Module<T: Trait> as ProposalsEngine{
        /// Map proposal by its id.
        pub Proposals get(fn proposals): map u32 => Proposal<T::BlockNumber, T::AccountId, types::BalanceOf<T>>;

        /// Count of all proposals that have been created.
        pub ProposalCount get(fn proposal_count): u32;

        /// Map proposal executable code by proposal id.
        pub ProposalCode get(fn proposal_codes): map u32 =>  Vec<u8>;

        /// Map votes by proposal id.
        pub VotesByProposalId get(fn votes_by_proposal): map u32 => Vec<Vote<T::AccountId>>;

        /// Ids of proposals that are open for voting (have not been finalized yet).
        pub ActiveProposalIds get(fn active_proposal_ids): BTreeSet<u32>;

        /// Ids of proposals that were approved and theirs grace period was not expired.
        pub PendingExecutionProposalIds get(fn pending_proposal_ids): BTreeSet<u32>;

        /// Proposal tally results map
        pub TallyResults get(fn tally_results): map u32 => TallyResult<T::BlockNumber>;

        /// Double map for preventing duplicate votes
        pub VoteExistsByAccountByProposal get(fn vote_by_proposal_by_account):
            double_map T::AccountId, twox_256(u32) => ();


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
        pub fn vote(origin, proposal_id: u32, vote: VoteKind)  {
            let voter_id = T::VoteOrigin::ensure_origin(origin)?;

            ensure!(<Proposals<T>>::exists(proposal_id), errors::MSG_PROPOSAL_NOT_FOUND);
            let proposal = Self::proposals(proposal_id);

            let not_expired = !proposal.is_voting_period_expired(Self::current_block());
            ensure!(not_expired, errors::MSG_PROPOSAL_EXPIRED);

            ensure!(proposal.status == ProposalStatus::Active, errors::MSG_PROPOSAL_FINALIZED);

            let did_not_vote_before = !<VoteExistsByAccountByProposal<T>>::exists(
                voter_id.clone(),
                proposal_id
            );

            ensure!(did_not_vote_before, errors::MSG_YOU_ALREADY_VOTED);

            let new_vote = Vote {
                voter_id: voter_id.clone(),
                vote_kind: vote.clone(),
            };

            // mutation

            <VotesByProposalId<T>>::mutate(proposal_id, |votes| votes.push(new_vote));
            <VoteExistsByAccountByProposal<T>>::insert(voter_id.clone(), proposal_id, ());
            Self::deposit_event(RawEvent::Voted(voter_id, proposal_id, vote));
        }

        /// Cancel a proposal by its original proposer.
        pub fn cancel_proposal(origin, proposal_id: u32) {
            let proposer_id = T::ProposalOrigin::ensure_origin(origin)?;

            ensure!(<Proposals<T>>::exists(proposal_id), errors::MSG_PROPOSAL_NOT_FOUND);
            let proposal = Self::proposals(proposal_id);

            ensure!(proposer_id == proposal.proposer_id, errors::MSG_YOU_DONT_OWN_THIS_PROPOSAL);
            ensure!(proposal.status == ProposalStatus::Active, errors::MSG_PROPOSAL_FINALIZED);

            // mutation

            Self::update_proposal_status(proposal_id, ProposalStatus::Canceled);
            Self::deposit_event(RawEvent::ProposalCanceled(proposer_id, proposal_id));
        }

        /// Veto a proposal. Must be root.
        pub fn veto_proposal(origin, proposal_id: u32) {
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
            let tally_results = Self::tally();
            let executable_proposal_ids =
                Self::get_approved_proposal_with_expired_grace_period_ids();

            // mutation

            // Check vote results
            for  tally_result in tally_results {
                <TallyResults<T>>::insert(tally_result.proposal_id, &tally_result);

                Self::update_proposal_status(tally_result.proposal_id, tally_result.status);
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
        let proposer_id = T::ProposalOrigin::ensure_origin(origin)?;

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
        };

        // mutation

        // Lock proposer's stake:
        //        T::Currency::reserve(&proposer_id, stake)
        //            .map_err(|_| errors::MSG_STAKE_IS_GREATER_THAN_BALANCE)?;

        <Proposals<T>>::insert(new_proposal_id, new_proposal);
        <ProposalCode>::insert(new_proposal_id, proposal_code);
        ActiveProposalIds::mutate(|ids| ids.insert(new_proposal_id));
        ProposalCount::put(next_proposal_count_value);

        Self::deposit_event(RawEvent::ProposalCreated(proposer_id, new_proposal_id));

        Ok(())
    }
}

impl<T: Trait> Module<T> {}

impl<T: Trait> Module<T> {
    // Wrapper-function over system::block_number()
    fn current_block() -> T::BlockNumber {
        <system::Module<T>>::block_number()
    }

    // Executes approved proposal code
    fn execute_proposal(proposal_id: u32) {
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

    /// Voting results tally.
    /// Returns proposals with changed status and tally results
    fn tally() -> Vec<TallyResult<T::BlockNumber>> {
        let mut results = Vec::new();
        for &proposal_id in Self::active_proposal_ids().iter() {
            let votes = Self::votes_by_proposal(proposal_id);
            let proposal = Self::proposals(proposal_id);

            if let Some(tally_result) = proposal.tally_results(
                proposal_id,
                votes,
                T::TotalVotersCounter::total_voters_count(),
                Self::current_block(),
            ) {
                results.push(tally_result);
            }
        }

        results
    }

    /// Updates proposal status and removes proposal id from active id set.
    fn update_proposal_status(proposal_id: u32, new_status: ProposalStatus) {
        <Proposals<T>>::mutate(proposal_id, |p| p.status = new_status.clone());
        ActiveProposalIds::mutate(|ids| ids.remove(&proposal_id));

        Self::deposit_event(RawEvent::ProposalStatusUpdated(
            proposal_id,
            new_status.clone(),
        ));

        match new_status {
            ProposalStatus::Rejected | ProposalStatus::Expired => {
                Self::reject_proposal(proposal_id)
            }
            ProposalStatus::Approved => Self::approve_proposal(proposal_id),
            ProposalStatus::Active => {
                // restore active proposal id
                ActiveProposalIds::mutate(|ids| ids.insert(proposal_id));
            }
            ProposalStatus::PendingExecution => {
                let proposal = Self::proposals(proposal_id);

                // immediate execution
                // grace period from proposal parameters was set to zero
                if proposal.is_grace_period_expired(Self::current_block()) {
                    Self::execute_proposal(proposal_id);
                }
            }
            ProposalStatus::Executed | ProposalStatus::Failed { .. } => {
                PendingExecutionProposalIds::mutate(|ids| ids.remove(&proposal_id));
            }
            ProposalStatus::Vetoed | ProposalStatus::Canceled => {} // do nothing
        }
    }

    /// Reject a proposal. The staked deposit will be returned to a proposer.
    fn reject_proposal(_proposal_id: u32) {}

    /// Approve a proposal. The staked deposit will be returned.
    fn approve_proposal(proposal_id: u32) {
        <Proposals<T>>::mutate(proposal_id, |p| p.approved_at = Some(Self::current_block()));
        PendingExecutionProposalIds::mutate(|ids| ids.insert(proposal_id));
        Self::update_proposal_status(proposal_id, ProposalStatus::PendingExecution);
    }

    fn get_approved_proposal_with_expired_grace_period_ids() -> Vec<u32> {
        PendingExecutionProposalIds::get()
            .iter()
            .filter(|proposal_id| {
                let proposal = Self::proposals(proposal_id);

                proposal.is_grace_period_expired(Self::current_block())
            })
            .map(|proposal_id| *proposal_id)
            .collect()
    }
}
