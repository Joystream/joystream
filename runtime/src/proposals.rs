use parity_codec::Encode;
use srml_support::{StorageValue, StorageMap, dispatch::Result};
use runtime_primitives::traits::{As, Hash, Zero, CheckedAdd};
use runtime_io::print;
use {balances, system::{self, ensure_signed}};
use rstd::prelude::*;
use rstd::cmp;

const VOTING_PERIOD_IN_DAYS: u64 = 10;
const VOTING_PERIOD_IN_SECS: u64 = VOTING_PERIOD_IN_DAYS * 24 * 60 * 60;

// TODO use this type instead of T::Hash
pub type ProposalId = u32;
pub type Count = usize;

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

/// TODO delete deprecated
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Proposal<Hash, Balance> {
    id: Hash,
    name: Vec<u8>,
    dna: Hash,
    price: Balance,
    gen: u64,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct RuntimeUpdateProposal<AccountId, Balance, Hash, BlockNumber> {
    id: Hash,
    proposer: AccountId,
    stake: Balance,
    name: Vec<u8>,
    description: Vec<u8>,
    // wasm_code: Vec<u8>, // TODO store code w/ proposal?
    wasm_hash: Hash,
    proposed_on: BlockNumber,
    // TODO add 'status: ProposalStatus',
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct TallyResult<Hash, BlockNumber> {
    proposal_id: Hash,
    abstentions: Count,
    approvals: Count,
    rejections: Count,
    slashes: Count,
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
        <T as system::Trait>::AccountId,
        <T as balances::Trait>::Balance
    {
        // New events

        /// Params:
        /// * Account id of a member who proposed.
        /// * Id of a newly created proposal after it was saved in storage.
        ProposalCreated(AccountId, Hash),
        ProposalCanceled(AccountId, Hash),
        ProposalApproved(Hash),
        ProposalStatusUpdated(Hash, ProposalStatus),

        TallyFinalized(TallyResult<Hash, BlockNumber>),

        /// Params:
        /// * Account id of a council member.
        /// * Id of a proposal.
        // TODO Add vote_kind: Approve, Reject, ...
        Voted(AccountId, Hash, VoteKind),

        // TODO delete next events (copied from kitties)

        PriceSet(AccountId, Hash, Balance),
        Transferred(AccountId, AccountId, Hash),
        Bought(AccountId, AccountId, Hash, Balance),
	}
);

decl_storage! {
    trait Store for Module<T: Trait> as Proposals {

        // Parameters:

        /// The percentage (up to 100) of the council participants
        /// which must vote affirmatively in order for it to pass.
        ApprovalQuorum get(approval_quorum): usize = 60;

        /// Minimum balance amount to be staked in order to make a proposal.
        MinimumStake get(minimum_stake): T::Balance = T::Balance::sa(100);

        /// A fee to be slashed (burn) in case a proposer decides to cancel a proposal.
        CancellationFee get(cancellation_fee): T::Balance = T::Balance::sa(10);

        /// A fee to be slashed (burn) in case a proposal was rejected.
        RejectionFee get(rejection_fee): T::Balance = T::Balance::sa(5);

        /// Max duration of proposal in blocks until it will be expired if not enough votes.
        VotingPeriod get(voting_period): T::BlockNumber = T::BlockNumber::sa(
            VOTING_PERIOD_IN_SECS / <timestamp::Module<T>>::block_period().as_()
        );

        // Persistent state (always relevant, changes constantly):

        Proposals get(proposal): map T::Hash => Proposal<T::Hash, T::Balance>;
        ProposalOwner get(owner_of): map T::Hash => Option<T::AccountId>;

        PendingProposalIds get(pending_proposal_ids): Vec<T::Hash> = vec![];

        // TODO use this?
        AllProposalIds get(finalized_proposal_ids): Vec<T::Hash> = vec![];

        // TODO rethink
        ProposalStatusMap get(proposal_status): map T::Hash => Option<ProposalStatus>;

        AllProposalsArray get(proposal_by_index): map u64 => T::Hash;
        AllProposalsCount get(all_proposals_count): u64;
        AllProposalsIndex: map T::Hash => u64;

        OwnedProposalsArray get(proposal_of_owner_by_index): map (T::AccountId, u64) => T::Hash;
        OwnedProposalsCount get(owned_proposal_count): map T::AccountId => u64;
        OwnedProposalsIndex: map T::Hash => u64;

        VotesByProposal get(votes_by_proposal): map T::Hash => Vec<(T::AccountId, VoteKind)>;
        VoteByAccountAndProposal get(vote_by_account_and_proposal): map (T::AccountId, T::Hash) => VoteKind;

        TallyResults get(tally_results): map T::Hash => TallyResult<T::Hash, T::BlockNumber>;

        // TODO impl pending proposals, finished (talled) proposals...

        // TODO get rid of nonce? yes
        Nonce: u64;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn deposit_event<T>() = default;

        // TODO see srml/democracy/src/lib.rs:92
        fn create_proposal(
            origin,
            stake: T::Balance,
            name: Vec<u8>,
            description: Vec<u8>,
            wasm_hash: T::Hash
        ) -> Result {

            let proposer = ensure_signed(origin)?;
            ensure!(Self::is_council_member(proposer.clone()), "Only council members can make a proposal");
            ensure!(stake >= Self::minimum_stake(), "Stake is too small");

            let nonce = <Nonce<T>>::get();

            // TODO use incremented idx for proposal, see srml/democracy/src/lib.rs:103
            // TODO or this: srml/treasury/src/lib.rs:86
            let random_hash = (<system::Module<T>>::random_seed(), &proposer, nonce)
                .using_encoded(<T as system::Trait>::Hashing::hash);

            let new_proposal = Proposal {
                id: random_hash,
                name: name,
                dna: random_hash,
                price: <T::Balance as As<u64>>::sa(0),
                gen: 0,
            };

            <balances::Module<T>>::reserve(&proposer, stake)
				.map_err(|_| "Proposer's balance is too low to be staked")?;

            Self::deposit_event(RawEvent::ProposalCreated(proposer.clone(), random_hash));

            // TODO throw event: StakeLocked ?

            Self::_create_proposal(proposer, random_hash, new_proposal)?;

            <Nonce<T>>::mutate(|n| *n += 1);

            Ok(())
        }

        // DONE
        fn vote_for_proposal(origin, proposal_id: T::Hash, vote: VoteKind) -> Result {
            let voter = ensure_signed(origin)?;
            ensure!(Self::is_council_member(voter.clone()), "Only council members can vote on proposals");
            ensure!(<Proposals<T>>::exists(proposal_id), "This proposal does not exist");

            let proposal = Self::proposal(proposal_id);
            // TODO check voting period:
            // ensure!(!Self::is_voting_period_expired(proposal.proposed_on), "Voting period is expired for this proposal");

            let did_not_vote_before = !<VoteByAccountAndProposal<T>>::exists((voter.clone(), proposal_id));
            ensure!(did_not_vote_before, "You have already voted for this proposal");

            // Append a new vote to proposal votes casted by other councilors:
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
        fn cancel_proposal(origin, proposal_id: T::Hash) -> Result {
            let sender = ensure_signed(origin)?;

            ensure!(<Proposals<T>>::exists(proposal_id), "This proposal does not exist");

            let proposal = Self::proposal(proposal_id);
            // let proposer = proposal.proposer;
            // ensure!(proposer == sender, "You do not own this proposal");

            // TODO check that sender created this proposal

            // TODO delete proposal or mark it as canceled.

            // TODO spend some minimum fee on proposer's balance for canceling a proposal
            // TODO uncomment when using new type for Runtime Update proposals:
            let fee = Self::cancellation_fee();
//			let _ = <balances::Module<T>>::slash_reserved(&proposer, fee);

            // TODO return unspent part of remaining staked deposit (after taking some fee)
            // TODO uncomment when using new type for Runtime Update proposals:
//            let left_stake = proposal.stake - cancellation_fee;
//			let _ = <balances::Module<T>>::unreserve(&proposer, left_stake);

            Self::_update_proposal_status(proposal_id, ProposalStatus::Cancelled)?;

            // TODO don't delete proposal from storage for historical reasons, but rather mark it as cancelled.
            <Proposals<T>>::remove(proposal_id);
            <VotesByProposal<T>>::remove(proposal_id);
            // TODO Clean up other storage related to this proposal.
            
            Self::deposit_event(RawEvent::ProposalCanceled(sender, proposal_id));

            Ok(())
        }

		fn update_runtime(origin, proposal_id: T::Hash, wasm_code: Vec<u8>) -> Result {

            // TODO compare hash of wasm code with a hash from approved proposal.
            // See in substrate repo @ srml/contract/src/wasm/code_cache.rs:73
            let code_hash = T::Hashing::hash(&wasm_code);

            // TODO run software update here

            // TODO throw event: RuntimeUpdated(proposal_id, wasm_hash)

            // TODO return locked stake to proposer's balance

            // TODO throw event: StakeUnlocked

            Ok(())
        }

        fn on_finalise(n: T::BlockNumber) {
			if let Err(e) = Self::end_block(n) {
				print(e);
			}
		}

        // TODO copy-pasted
        fn buy_proposal(origin, proposal_id: T::Hash, max_price: T::Balance) -> Result {
            let sender = ensure_signed(origin)?;

            ensure!(<Proposals<T>>::exists(proposal_id), "This proposal does not exist");

            let owner = match Self::owner_of(proposal_id) {
                Some(o) => o,
                None => return Err("No owner for this proposal"),
            };
            ensure!(owner != sender, "You can't buy your own proposal");

            let mut proposal = Self::proposal(proposal_id);

            let proposal_price = proposal.price;
            ensure!(!proposal_price.is_zero(), "The proposal you want to buy is not for sale");
            ensure!(proposal_price <= max_price, "The proposal you want to buy costs more than your max price");

            // TODO: This payment logic needs to be updated
            <balances::Module<T>>::decrease_free_balance(&sender, proposal_price)?;
            <balances::Module<T>>::increase_free_balance_creating(&owner, proposal_price);

            Self::_transfer_from(owner.clone(), sender.clone(), proposal_id)?;

            proposal.price = <T::Balance as As<u64>>::sa(0);
            <Proposals<T>>::insert(proposal_id, proposal);

            Self::deposit_event(RawEvent::Bought(sender, owner, proposal_id, proposal_price));

            Ok(())
        }
    }
}

impl<T: Trait> Module<T> {

    pub fn is_council_member(sender: T::AccountId) -> bool {
        // TODO impl: this method should be in Council module.
        true // TODO stub
    }

    pub fn council_members_count() -> usize {
        // TODO impl: this method should be in Council module.
        10 // TODO stub
    }

    pub fn is_proposal_approved(proposal_id: T::Hash) -> bool {
        Self::proposal_status(proposal_id) == Some(ProposalStatus::Approved)
    }

    pub fn is_proposal_rejected(proposal_id: T::Hash) -> bool {
        Self::proposal_status(proposal_id) == Some(ProposalStatus::Rejected)
    }

    pub fn is_proposal_slashed(proposal_id: T::Hash) -> bool {
        Self::proposal_status(proposal_id) == Some(ProposalStatus::Slashed)
    }

    pub fn is_voting_period_expired(proposed_on: T::BlockNumber) -> bool {
        <system::Module<T>>::block_number() > proposed_on + Self::voting_period()
    }

    fn end_block(now: T::BlockNumber) -> Result {

        // TODO iterate over not expired proposals and tally

           Self::tally()?;
            // TODO approve or reject a proposal

        // TODO finish

        Ok(())
    }

    /// Get the voters for the current proposal.
    pub fn tally(/* proposal_id: T::Hash */) -> Result {
        let councilors: usize = Self::council_members_count();
        let quorum: usize = ((Self::approval_quorum() as u32 * councilors as u32) / 100) as usize;

        for proposal_id in Self::pending_proposal_ids() {
            let proposal = Self::proposal(proposal_id);

            // TODO uncomment when using new type for proposals
            // let is_expired = Self::is_voting_period_expired(proposal.proposed_on);
            let is_expired = false; // TODO stub

            let mut abstentions = 0;
            let mut approvals = 0;
            let mut rejections = 0;
            let mut slashes = 0;

            let votes = Self::votes_by_proposal(proposal_id);
            for (_, vote) in votes.iter() {
                match vote {
                    VoteKind::Abstention => abstentions += 1,
                    VoteKind::Approve => approvals += 1,
                    VoteKind::Reject => rejections += 1,
                    VoteKind::Slash => slashes += 1,
                }
            }

            let new_status: Option<ProposalStatus> = 
                if slashes == councilors {
                    Self::_slash_proposal(proposal_id);
                    Some(ProposalStatus::Slashed)
                } else if approvals >= quorum {
                    // TODO Run runtime update
                    Self::_approve_proposal(proposal_id);
                    Some(ProposalStatus::Approved)
                } else if votes.len() == councilors || is_expired { 
                    // All councilors voted but no approval quorum reached or proposal expired.
                    Self::_reject_proposal(proposal_id);
                    Some(ProposalStatus::Rejected)
                } else {
                    None
                };

            // TODO move next block outside of tally to 'end_block'
            if let Some(status) = new_status {
                // TODO store proposal's tally results (slashes, approvals, rejections...)
                Self::_update_proposal_status(proposal_id, status.clone())?;

                let tally_result = TallyResult {
                    proposal_id,
                    abstentions,
                    approvals,
                    rejections,
                    slashes,
                    status,
                    finalized_on: <system::Module<T>>::block_number(),
                };
                <TallyResults<T>>::insert(proposal_id, &tally_result);

                // TODO send only TallyFinalized(proposal_id, tally_result_id)
                Self::deposit_event(RawEvent::TallyFinalized(tally_result));
            }
        }

        Ok(())
    }

    fn _update_proposal_status(proposal_id: T::Hash, new_status: ProposalStatus) -> Result {
        // TODO check that it's internall call?

        let all_pendings = Self::pending_proposal_ids();
        let all_len = all_pendings.len();
        let other_pendings: Vec<T::Hash> = all_pendings
            .into_iter()
            .filter(|&id| id != proposal_id)
            .collect()
            ;
        
        let not_found_in_pendings = other_pendings.len() == all_len;
        if not_found_in_pendings {
            // Seems like this proposal's status has been updated and removed from pendings.
            Err("Proposal status has been updated already")
        } else {
            <PendingProposalIds<T>>::put(other_pendings);
            // TODO update struct's field 'status' instead:
            <ProposalStatusMap<T>>::insert(proposal_id, &new_status);
            Self::deposit_event(RawEvent::ProposalStatusUpdated(proposal_id, new_status));
            Ok(())
        }
    }

    /// Slash a proposal. The staked deposit will be slashed.
    fn _slash_proposal(proposal_id: T::Hash) {
        let proposal = Self::proposal(proposal_id);

        // TODO uncomment when using new type for Runtime Update proposals:
        // Slash proposer's stake:
		// let _ = <balances::Module<T>>::slash_reserved(&proposal.proposer, proposal.stake);
    }

    /// Reject a proposal. The staked deposit will be returned to a proposer.
    fn _reject_proposal(proposal_id: T::Hash) {
        let proposal = Self::proposal(proposal_id);

        // Spend some minimum fee on proposer's balance to prevent spamming attacks:
        // TODO uncomment when using new type for Runtime Update proposals:
        let fee = Self::rejection_fee();
		// let _ = <balances::Module<T>>::slash_reserved(&proposer, fee);

        // Return unspent part of remaining staked deposit (after taking some fee):
        // TODO uncomment when using new type for Runtime Update proposals:
        // let left_stake = proposal.stake - fee;
	    // let _ = <balances::Module<T>>::unreserve(&proposer, left_stake);
    }

    /// Approve a proposal. The staked deposit will be returned.
    fn _approve_proposal(proposal_id: T::Hash) {
        let proposal = Self::proposal(proposal_id);

        // TODO think on this line (copied from Substrate)
//			<Approvals<T>>::mutate(|v| v.push(proposal_id));

        // Return staked deposit to proposer:
        // TODO uncomment when using new type for Runtime Update proposals:
        // let _ = <balances::Module<T>>::unreserve(&proposal.proposer, proposal.stake);

        // TODO Self::update_runtime(...)
    }

    fn _create_proposal(to: T::AccountId, proposal_id: T::Hash, new_proposal: Proposal<T::Hash, T::Balance>) -> Result {
        ensure!(!<ProposalOwner<T>>::exists(proposal_id), "Proposal already exists");

        let owned_proposal_count = Self::owned_proposal_count(&to);

        let new_owned_proposal_count = match owned_proposal_count.checked_add(1) {
            Some(c) => c,
            None => return Err("Overflow adding a new proposal to account balance"),
        };

        let all_proposals_count = Self::all_proposals_count();

        let new_all_proposals_count = match all_proposals_count.checked_add(1) {
            Some (c) => c,
            None => return Err("Overflow adding a new proposal to total supply"),
        };

        <Proposals<T>>::insert(proposal_id, new_proposal);
        <ProposalOwner<T>>::insert(proposal_id, &to);

        <AllProposalsArray<T>>::insert(all_proposals_count, proposal_id);
        <AllProposalsCount<T>>::put(new_all_proposals_count);
        <AllProposalsIndex<T>>::insert(proposal_id, all_proposals_count);

        <OwnedProposalsArray<T>>::insert((to.clone(), owned_proposal_count), proposal_id);
        <OwnedProposalsCount<T>>::insert(&to, new_owned_proposal_count);
        <OwnedProposalsIndex<T>>::insert(proposal_id, owned_proposal_count);


        // NEW GOOD PART :)

        <PendingProposalIds<T>>::mutate(|ids| ids.push(proposal_id));

        Self::deposit_event(RawEvent::ProposalCreated(to, proposal_id));

        Ok(())
    }

    fn _transfer_from(from: T::AccountId, to: T::AccountId, proposal_id: T::Hash) -> Result {
        let owner = match Self::owner_of(proposal_id) {
            Some(c) => c,
            None => return Err("No owner for this proposal"),
        };

        ensure!(owner == from, "'from' account does not own this proposal");

        let owned_proposal_count_from = Self::owned_proposal_count(&from);
        let owned_proposal_count_to = Self::owned_proposal_count(&to);

        let new_owned_proposal_count_to = match owned_proposal_count_to.checked_add(1) {
            Some(c) => c,
            None => return Err("Transfer causes overflow of 'to' proposal balance"),
        };

        let new_owned_proposal_count_from = match owned_proposal_count_from.checked_sub(1) {
            Some (c) => c,
            None => return Err("Transfer causes underflow of 'from' proposal balance"),
        };

        // "Swap and pop"
        let proposal_index = <OwnedProposalsIndex<T>>::get(proposal_id);
        if proposal_index != new_owned_proposal_count_from {
            let last_proposal_id = <OwnedProposalsArray<T>>::get((from.clone(), new_owned_proposal_count_from));
            <OwnedProposalsArray<T>>::insert((from.clone(), proposal_index), last_proposal_id);
            <OwnedProposalsIndex<T>>::insert(last_proposal_id, proposal_index);
        }

        <ProposalOwner<T>>::insert(&proposal_id, &to);
        <OwnedProposalsIndex<T>>::insert(proposal_id, owned_proposal_count_to);

        <OwnedProposalsArray<T>>::remove((from.clone(), new_owned_proposal_count_from));
        <OwnedProposalsArray<T>>::insert((to.clone(), owned_proposal_count_to), proposal_id);

        <OwnedProposalsCount<T>>::insert(&from, new_owned_proposal_count_from);
        <OwnedProposalsCount<T>>::insert(&to, new_owned_proposal_count_to);

        Self::deposit_event(RawEvent::Transferred(from, to, proposal_id));

        Ok(())
    }
}
