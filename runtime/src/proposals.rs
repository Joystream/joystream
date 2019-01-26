use srml_support::{StorageValue, StorageMap, dispatch::Result};
use runtime_primitives::traits::{As, Hash, CheckedAdd};
use runtime_io::print;
use {balances, system::{self, ensure_signed}};
use rstd::prelude::*;

const VOTING_PERIOD_IN_DAYS: u64 = 10;
const VOTING_PERIOD_IN_SECS: u64 = VOTING_PERIOD_IN_DAYS * 24 * 60 * 60;

pub type ProposalId = u32;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Clone, PartialEq, Eq)]
pub enum ProposalStatus {
    /// A new proposal that is available for voting.
    Pending,
    /// If cancelled by a proposer.
    Cancelled,
    /// Not enough votes and voting period expired.
    Expired,
    /// To clear the quorum requirement, the percentage of council members with revealed votes 
    /// must be no less than the quorum value for the given proposal type.
    Approved,
    Rejected,
    /// If all revealed votes are slashes, then the proposal is rejected, 
    /// and the proposal stake is slashed.
    Slashed,
}

impl Default for ProposalStatus {
    fn default() -> Self { 
        ProposalStatus::Pending // TODO use another *special* value as default?
    }
}

use self::ProposalStatus::*;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Clone, PartialEq, Eq)]
pub enum VoteKind {
    /// Signals presence, but unwillingness to cast judgment on substance of vote.
    Abstention,
    /// Pass, an alternative or a ranking, for binary, multiple choice 
    /// and ranked choice propositions, respectively.
    Approve,
    /// Against proposal.
    Reject,
    /// Against the proposal, and slash proposal stake.
    Slash,
}

impl Default for VoteKind {
    fn default() -> Self { 
        VoteKind::Abstention // TODO use another *special* value as default?
    }
}

use self::VoteKind::*;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
/// Proposal for node runtime update.
pub struct Proposal<AccountId, Balance, BlockNumber> {
    id: ProposalId,
    proposer: AccountId,
    stake: Balance,
    name: Vec<u8>,
    description: Vec<u8>,
    wasm_code: Vec<u8>, // TODO store code w/ proposal or just its hash?
    // wasm_hash: Hash,
    proposed_on: BlockNumber,
    status: ProposalStatus,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct TallyResult<BlockNumber> {
    proposal_id: ProposalId,
    abstentions: u32,
    approvals: u32,
    rejections: u32,
    slashes: u32,
    status: ProposalStatus,
    finalized_on: BlockNumber,
}

pub trait Trait: balances::Trait + timestamp::Trait {
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_event!(
	pub enum Event<T>
    where
        <T as system::Trait>::Hash,
        <T as system::Trait>::BlockNumber,
        <T as system::Trait>::AccountId
    {
        // New events

        /// Params:
        /// * Account id of a member who proposed.
        /// * Id of a newly created proposal after it was saved in storage.
        ProposalCreated(AccountId, ProposalId),
        ProposalCanceled(AccountId, ProposalId),
        ProposalStatusUpdated(ProposalId, ProposalStatus),

        /// Params:
        /// * Voter - an account id of a councilor.
        /// * Id of a proposal.
        /// * Kind of vote.
        Voted(AccountId, ProposalId, VoteKind),

        TallyFinalized(TallyResult<BlockNumber>),

        /// * Hash - hash of wasm code of runtime update.
        RuntimeUpdated(ProposalId, Hash),
	}
);

decl_storage! {
    trait Store for Module<T: Trait> as Proposals {

        // Parameters (defaut values could be exported to config):

        /// The percentage (up to 100) of the council participants
        /// which must vote affirmatively in order for it to pass.
        ApprovalQuorum get(approval_quorum): u32 = 60;

        /// Minimum balance amount to be staked in order to make a proposal.
        MinimumStake get(minimum_stake): T::Balance = T::Balance::sa(100);

        /// A fee to be slashed (burn) in case a proposer decides to cancel a proposal.
        CancellationFee get(cancellation_fee): T::Balance = T::Balance::sa(5);

        /// A fee to be slashed (burn) in case a proposal was rejected.
        RejectionFee get(rejection_fee): T::Balance = T::Balance::sa(10);

        /// Max duration of proposal in blocks until it will be expired if not enough votes.
        VotingPeriod get(voting_period): T::BlockNumber = T::BlockNumber::sa(
            VOTING_PERIOD_IN_SECS / <timestamp::Module<T>>::block_period().as_()
        );

        // Persistent state (always relevant, changes constantly):

        ProposalCount get(proposal_count): ProposalId;

        Proposals get(proposal): map ProposalId => Proposal<T::AccountId, T::Balance, T::BlockNumber>;

        PendingProposalIds get(pending_proposal_ids): Vec<ProposalId> = vec![];

        VotesByProposal get(votes_by_proposal): map ProposalId => Vec<(T::AccountId, VoteKind)>;

        // TODO Rethink: this can be replaced with: votes_by_proposal.find(|vote| vote.0 == proposer)
        VoteByAccountAndProposal get(vote_by_account_and_proposal): map (T::AccountId, ProposalId) => VoteKind;

        TallyResults get(tally_results): map ProposalId => TallyResult<T::BlockNumber>;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn deposit_event<T>() = default;

        /// Use next code to create a proposal from Substrate UI's web console:
        /// ```js
        /// post({ sender: runtime.indices.ss58Decode('F7Gh'), call: calls.proposals.createProposal(2500, "0x" + "Cool Proposal #1".toString("hex"), "0x" + "New features and bug fixes. For more info, see the latest CHANGELOG.md joystream-node repo on GitHub.".toString("hex"), "0x" + "...TODO some wasm code goes here...".toString("hex")) }).tie(console.log)
        /// ```
        fn create_proposal(
            origin,
            stake: T::Balance,
            name: Vec<u8>,
            description: Vec<u8>,
            // wasm_hash: T::Hash,
            wasm_code: Vec<u8>
        ) -> Result {

            let proposer = ensure_signed(origin)?;
            ensure!(Self::is_member(proposer.clone()), "Only members can make a proposal");
            ensure!(stake >= Self::minimum_stake(), "Stake is too small");

            // TODO ensure that name is not blank
            // TODO ensure that description is not blank
            // TODO ensure that wasm_code is valid

            // Lock proposer's stake:
            <balances::Module<T>>::reserve(&proposer, stake)
				.map_err(|_| "Proposer's balance is too low to be staked")?;

            let proposal_id = Self::proposal_count() + 1;
            <ProposalCount<T>>::put(proposal_id);

            let new_proposal = Proposal {
                id: proposal_id,
                proposer: proposer.clone(),
                stake,
                name,
                description,
                wasm_code,
                proposed_on: Self::current_block(),
                status: Pending
            };

            <Proposals<T>>::insert(proposal_id, new_proposal);
            <PendingProposalIds<T>>::mutate(|ids| ids.push(proposal_id));

            Self::deposit_event(RawEvent::ProposalCreated(proposer.clone(), proposal_id));

            Ok(())
        }

        /// Use next code to create a proposal from Substrate UI's web console:
        /// ```js
        /// post({ sender: runtime.indices.ss58Decode('F7Gh'), call: calls.proposals.voteForProposal(1, { option: "Approve", _type: "VoteKind" }) }).tie(console.log)
        /// ```
        fn vote_on_proposal(origin, proposal_id: ProposalId, vote: VoteKind) -> Result {
            let voter = ensure_signed(origin)?;
            ensure!(Self::is_council_member(voter.clone()), "Only council members can vote on proposals");

            ensure!(<Proposals<T>>::exists(proposal_id), "This proposal does not exist");
            let proposal = Self::proposal(proposal_id);

            ensure!(voter != proposal.proposer, "You cannot vote on your proposals");
            ensure!(proposal.status == Pending, "Proposal is finalized already");

            let not_expired = !Self::is_voting_period_expired(proposal.proposed_on);
            ensure!(not_expired, "Voting period is expired for this proposal");

            let did_not_vote_before = !<VoteByAccountAndProposal<T>>::exists((voter.clone(), proposal_id));
            ensure!(did_not_vote_before, "You have already voted for this proposal");

            // Append a new vote to other votes on this proposal:
            let new_vote = (voter.clone(), vote.clone());
            if <VotesByProposal<T>>::exists(proposal_id) {
                <VotesByProposal<T>>::mutate(proposal_id, |votes| votes.push(new_vote));
            } else {
                <VotesByProposal<T>>::insert(proposal_id, vec![new_vote]);
            }
            <VoteByAccountAndProposal<T>>::insert((voter.clone(), proposal_id), &vote);

            Self::deposit_event(RawEvent::Voted(voter, proposal_id, vote));

            Ok(())
        }

        /// Cancel a proposal by its original proposer. Some fee will be withdrawn from his balance.
        fn cancel_proposal(origin, proposal_id: ProposalId) -> Result {
            let proposer = ensure_signed(origin)?;

            ensure!(<Proposals<T>>::exists(proposal_id), "This proposal does not exist");
            let proposal = Self::proposal(proposal_id);

            ensure!(proposer == proposal.proposer, "You do not own this proposal");
            ensure!(proposal.status == Pending, "Proposal is finalized already");

            // Spend some minimum fee on proposer's balance for canceling a proposal
            let fee = Self::cancellation_fee();
			let _ = <balances::Module<T>>::slash_reserved(&proposer, fee);

            // Return unspent part of remaining staked deposit (after taking some fee)
            let left_stake = proposal.stake - fee;
			let _ = <balances::Module<T>>::unreserve(&proposer, left_stake);

            Self::_update_proposal_status(proposal_id, Cancelled)?;
            Self::deposit_event(RawEvent::ProposalCanceled(proposer, proposal_id));

            Ok(())
        }

		// fn update_runtime(origin, proposal_id: ProposalId, wasm_code: Vec<u8>) -> Result {
        //     ensure!(<Proposals<T>>::exists(proposal_id), "This proposal does not exist");
        //     let proposal = Self::proposal(proposal_id);

        //     ensure!(proposal.status == Approved, "Proposal is not approved");

        //     Self::_update_runtime(proposal_id)?
        // }

        // Called on every block
        fn on_finalise(n: T::BlockNumber) {
			if let Err(e) = Self::end_block(n) {
				print(e);
			}
		}
    }
}

impl<T: Trait> Module<T> {

    pub fn current_block() -> T::BlockNumber {
        <system::Module<T>>::block_number()
    }

    pub fn is_member(sender: T::AccountId) -> bool {
        // TODO This method should be implemented in Membership module.
        true
    }

    pub fn is_council_member(sender: T::AccountId) -> bool {
        // TODO This method should be implemented in Council module.
        true
    }

    pub fn council_members_count() -> u32 {
        // TODO This method should be implemented in Council module.
        10
    }

    pub fn is_voting_period_expired(proposed_on: T::BlockNumber) -> bool {
        Self::current_block() > proposed_on + Self::voting_period()
    }

    fn end_block(now: T::BlockNumber) -> Result {

        // TODO iterate over not expired proposals and tally

           Self::tally()?;
            // TODO approve or reject a proposal

        // TODO finish

        Ok(())
    }

    /// Get the voters for the current proposal.
    pub fn tally(/* proposal_id: ProposalId */) -> Result {
        let councilors = Self::council_members_count();
        let quorum = (Self::approval_quorum() * councilors) / 100;

        for proposal_id in Self::pending_proposal_ids() {
            let proposal = Self::proposal(proposal_id);
            let is_expired = Self::is_voting_period_expired(proposal.proposed_on);
            let votes = Self::votes_by_proposal(proposal_id);
            let all_councilors_voted = votes.len() as u32 == councilors;
            
            let mut abstentions = 0;
            let mut approvals = 0;
            let mut rejections = 0;
            let mut slashes = 0;

            for (_, vote) in votes.iter() {
                match vote {
                    Abstention => abstentions += 1,
                    Approve => approvals += 1,
                    Reject => rejections += 1,
                    Slash => slashes += 1,
                }
            }

            let new_status: Option<ProposalStatus> = 
                if slashes == councilors {
                    Some(Slashed)
                } else if approvals >= quorum {
                    Some(Approved)
                } else if all_councilors_voted { 
                    // All councilors voted but an approval quorum was not reached.
                    Some(Rejected)
                } else if is_expired { 
                    // Proposal has been expired and quorum not reached.
                    Some(Expired)
                } else {
                    None
                };

            // TODO move next block outside of tally to 'end_block'
            if let Some(status) = new_status {
                Self::_update_proposal_status(proposal_id, status.clone())?;
                let tally_result = TallyResult {
                    proposal_id,
                    abstentions,
                    approvals,
                    rejections,
                    slashes,
                    status,
                    finalized_on: Self::current_block(),
                };
                <TallyResults<T>>::insert(proposal_id, &tally_result);
                Self::deposit_event(RawEvent::TallyFinalized(tally_result));
            }
        }

        Ok(())
    }

    /// Updates proposal status and removes proposal from pending ids. 
    fn _update_proposal_status(proposal_id: ProposalId, new_status: ProposalStatus) -> Result {
        // TODO check that this is an internall call?

        let all_pendings = Self::pending_proposal_ids();
        let all_len = all_pendings.len();
        let other_pendings: Vec<ProposalId> = all_pendings
            .into_iter()
            .filter(|&id| id != proposal_id)
            .collect()
            ;
        
        let not_found_in_pendings = other_pendings.len() == all_len;
        if not_found_in_pendings {
            // Seems like this proposal's status has been updated and removed from pendings.
            Err("Proposal status has been updated already")
        } else {
            let pid = proposal_id.clone();
            match new_status {
                Slashed => Self::_slash_proposal(pid)?,
                Rejected | Expired => Self::_reject_proposal(pid)?,
                Approved => Self::_approve_proposal(pid)?,
                Pending | Cancelled => { /* nothing */ },
            }
            <PendingProposalIds<T>>::put(other_pendings);
            <Proposals<T>>::mutate(proposal_id, |p| p.status = new_status.clone());
            Self::deposit_event(RawEvent::ProposalStatusUpdated(proposal_id, new_status));
            Ok(())
        }
    }

    /// Slash a proposal. The staked deposit will be slashed.
    fn _slash_proposal(proposal_id: ProposalId) -> Result {
        let proposal = Self::proposal(proposal_id);

        // Slash proposer's stake:
		let _ = <balances::Module<T>>::slash_reserved(&proposal.proposer, proposal.stake);

        Ok(())
    }

    /// Reject a proposal. The staked deposit will be returned to a proposer.
    fn _reject_proposal(proposal_id: ProposalId) -> Result {
        let proposal = Self::proposal(proposal_id);
        let proposer = proposal.proposer;

        // Spend some minimum fee on proposer's balance to prevent spamming attacks:
        let fee = Self::rejection_fee();
		let _ = <balances::Module<T>>::slash_reserved(&proposer, fee);

        // Return unspent part of remaining staked deposit (after taking some fee):
        let left_stake = proposal.stake - fee;
	    let _ = <balances::Module<T>>::unreserve(&proposer, left_stake);

        Ok(())
    }

    /// Approve a proposal. The staked deposit will be returned.
    fn _approve_proposal(proposal_id: ProposalId) -> Result {
        let proposal = Self::proposal(proposal_id);
        
        // Return staked deposit to proposer:
        let _ = <balances::Module<T>>::unreserve(&proposal.proposer, proposal.stake);

        // Update wasm code of node's runtime:
        <consensus::Module<T>>::set_code(proposal.wasm_code.clone());

        // See in substrate repo @ srml/contract/src/wasm/code_cache.rs:73
        let wasm_hash = T::Hashing::hash(&proposal.wasm_code);
        Self::deposit_event(RawEvent::RuntimeUpdated(proposal_id, wasm_hash));

        Ok(())
    }
}
