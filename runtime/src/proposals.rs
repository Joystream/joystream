use parity_codec::Encode;
use srml_support::{StorageValue, StorageMap, dispatch::Result};
use runtime_primitives::traits::{As, Hash, Zero, CheckedAdd};
use runtime_io::print;
use {balances, system::{self, ensure_signed}};
use rstd::prelude::*;
use rstd::cmp;

const VOTING_PERIOD_IN_DAYS: u64 = 10;
const VOTING_PERIOD_IN_SECS: u64 = VOTING_PERIOD_IN_DAYS * 24 * 60 * 60;

// TODO delete deprecated
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
    wasm_hash: Hash,
    proposed_on: BlockNumber,
}

pub trait Trait: balances::Trait + timestamp::Trait {
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_event!(
	pub enum Event<T>
    where
        <T as system::Trait>::AccountId,
        <T as system::Trait>::Hash,
        <T as balances::Trait>::Balance
    {
        // New events

        /// Params:
        /// * Account id of a member who proposed.
        /// * Id of a newly created proposal after it was saved in storage.
        ProposalCreated(AccountId, Hash),
        ProposalCanceled(AccountId, Hash),
        ProposalApproved(Hash),

        /// Params:
        /// * Account id of a council member.
        /// * Id of a proposal.
        // TODO Add vote_kind: Approve, Reject, ...
        Voted(AccountId, Hash),

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
        ApprovalQuorum get(approval_quorum): u32 = 60;

        /// Minimum balance amount to be staked in order to make a proposal.
        MinimumStake get(minimum_stake): T::Balance = T::Balance::sa(100);

        /// A fee to be slashed (burn) in case a proposer decides to cancel a proposal.
        CancellationFee get(cancellation_fee): T::Balance = T::Balance::sa(10);

        /// Max duration of proposal in blocks until it will be expired if not enough votes.
        VotingPeriod get(voting_period): T::BlockNumber = T::BlockNumber::sa(
            VOTING_PERIOD_IN_SECS / <timestamp::Module<T>>::block_period().as_()
        );

        // Persistent state (always relevant, changes constantly):

        Proposals get(proposal): map T::Hash => Proposal<T::Hash, T::Balance>;
        ProposalOwner get(owner_of): map T::Hash => Option<T::AccountId>;

        AllProposalsArray get(proposal_by_index): map u64 => T::Hash;
        AllProposalsCount get(all_proposals_count): u64;
        AllProposalsIndex: map T::Hash => u64;

        OwnedProposalsArray get(proposal_of_owner_by_index): map (T::AccountId, u64) => T::Hash;
        OwnedProposalsCount get(owned_proposal_count): map T::AccountId => u64;
        OwnedProposalsIndex: map T::Hash => u64;

        // TODO add Votes. see democracy module

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

            let sender = ensure_signed(origin)?;
            let nonce = <Nonce<T>>::get();

            ensure!(stake >= Self::minimum_stake(), "Stake is too small");

            // TODO use incremented idx for proposal, see srml/democracy/src/lib.rs:103
            // TODO or this: srml/treasury/src/lib.rs:86
            let random_hash = (<system::Module<T>>::random_seed(), &sender, nonce)
                .using_encoded(<T as system::Trait>::Hashing::hash);

            let new_proposal = Proposal {
                id: random_hash,
                name: name,
                dna: random_hash,
                price: <T::Balance as As<u64>>::sa(0),
                gen: 0,
            };

            <balances::Module<T>>::reserve(&sender, stake)
				.map_err(|_| "Proposer's balance too low")?;

            Self::deposit_event(RawEvent::ProposalCreated(sender.clone(), random_hash));

            // TODO throw event: StakeLocked ?

            Self::_create_proposal(sender, random_hash, new_proposal)?;

            <Nonce<T>>::mutate(|n| *n += 1);

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

            Self::deposit_event(RawEvent::ProposalCanceled(sender, proposal_id));

            Ok(())
        }

        /// Reject a proposal. The staked deposit will be slashed.
		fn _reject_proposal(proposal_id: T::Hash) {
		    ensure!(<Proposals<T>>::exists(proposal_id), "No proposal at that index");
			let proposal = Self::proposal(proposal_id);

			// TODO uncomment when using new type for Runtime Update proposals:
//			let _ = <balances::Module<T>>::slash_reserved(&proposal.proposer, proposal.stake);
		}

		/// Approve a proposal. The staked deposit will be returned.
		fn _approve_proposal(proposal_id: T::Hash) {
			ensure!(<Proposals<T>>::exists(proposal_id), "No proposal at that index");
			let proposal = Self::proposal(proposal_id);

			// TODO think on this line (copied from Substrate)
//			<Approvals<T>>::mutate(|v| v.push(proposal_id));

			// Return staked deposit
			// TODO uncomment when using new type for Runtime Update proposals:
//            let _ = <balances::Module<T>>::unreserve(&proposal.proposer, proposal.stake);
		}

		fn run_update(origin, proposal_id: T::Hash, wasm_code: Vec<u8>) -> Result {

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

    pub fn is_expired(proposed_on: T::BlockNumber) -> bool {
        // TODO print("...")
        <system::Module<T>>::block_number() > proposed_on + Self::voting_period()
    }

    pub fn is_member(sender: T::AccountId) -> bool {
        // TODO impl
        // TODO print("...")
        true
    }

    /// Get the voters for the current proposal.
    pub fn tally(proposal_id: T::Hash) -> Result {

        // TODO finish

        Ok(())
    }

    fn end_block(now: T::BlockNumber) -> Result {

        // TODO iterate over not expired proposals and tally

//            Self::tally();
            // TODO approve or reject a proposal

        // TODO finish

        Ok(())
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
