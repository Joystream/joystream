use codec::{Decode, Encode};
use rstd::prelude::*;
use sr_primitives::{
    print,
    traits::{Hash, SaturatedConversion, Zero},
};
use srml_support::traits::{Currency, Get, ReservableCurrency};
use srml_support::{decl_event, decl_module, decl_storage, dispatch, ensure};
use system::{self, ensure_root, ensure_signed};

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

#[cfg(test)]
use primitives::storage::well_known_keys;

use super::council;
pub use common::currency::{BalanceOf, GovernanceCurrency};

const DEFAULT_APPROVAL_QUORUM: u32 = 60;
const DEFAULT_MIN_STAKE: u32 = 100;
const DEFAULT_CANCELLATION_FEE: u32 = 5;
const DEFAULT_REJECTION_FEE: u32 = 10;

const DEFAULT_VOTING_PERIOD_IN_DAYS: u32 = 10;
const DEFAULT_VOTING_PERIOD_IN_SECS: u32 = DEFAULT_VOTING_PERIOD_IN_DAYS * 24 * 60 * 60;

const DEFAULT_NAME_MAX_LEN: u32 = 100;
const DEFAULT_DESCRIPTION_MAX_LEN: u32 = 10_000;
const DEFAULT_WASM_CODE_MAX_LEN: u32 = 2_000_000;

const MSG_STAKE_IS_TOO_LOW: &str = "Stake is too low";
const MSG_STAKE_IS_GREATER_THAN_BALANCE: &str = "Balance is too low to be staked";
const MSG_ONLY_MEMBERS_CAN_PROPOSE: &str = "Only members can make a proposal";
const MSG_ONLY_COUNCILORS_CAN_VOTE: &str = "Only councilors can vote on proposals";
const MSG_PROPOSAL_NOT_FOUND: &str = "This proposal does not exist";
const MSG_PROPOSAL_EXPIRED: &str = "Voting period is expired for this proposal";
const MSG_PROPOSAL_FINALIZED: &str = "Proposal is finalized already";
const MSG_YOU_ALREADY_VOTED: &str = "You have already voted on this proposal";
const MSG_YOU_DONT_OWN_THIS_PROPOSAL: &str = "You do not own this proposal";
const MSG_PROPOSAL_STATUS_ALREADY_UPDATED: &str = "Proposal status has been updated already";
const MSG_EMPTY_NAME_PROVIDED: &str = "Proposal cannot have an empty name";
const MSG_EMPTY_DESCRIPTION_PROVIDED: &str = "Proposal cannot have an empty description";
const MSG_EMPTY_WASM_CODE_PROVIDED: &str = "Proposal cannot have an empty WASM code";
const MSG_TOO_LONG_NAME: &str = "Name is too long";
const MSG_TOO_LONG_DESCRIPTION: &str = "Description is too long";
const MSG_TOO_LONG_WASM_CODE: &str = "WASM code is too big";

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Clone, PartialEq, Eq)]
pub enum ProposalStatus {
    /// A new proposal that is available for voting.
    Active,
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
        ProposalStatus::Active
    }
}

use self::ProposalStatus::*;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum VoteKind {
    /// Signals presence, but unwillingness to cast judgment on substance of vote.
    Abstain,
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
        VoteKind::Abstain
    }
}

use self::VoteKind::*;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
/// Proposal for node runtime update.
pub struct RuntimeUpgradeProposal<AccountId, Balance, BlockNumber, Hash> {
    id: u32,
    proposer: AccountId,
    stake: Balance,
    name: Vec<u8>,
    description: Vec<u8>,
    wasm_hash: Hash,
    proposed_at: BlockNumber,
    status: ProposalStatus,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct TallyResult<BlockNumber> {
    proposal_id: u32,
    abstentions: u32,
    approvals: u32,
    rejections: u32,
    slashes: u32,
    status: ProposalStatus,
    finalized_at: BlockNumber,
}

pub trait Trait:
    timestamp::Trait + council::Trait + GovernanceCurrency + membership::members::Trait
{
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
        ProposalCreated(AccountId, u32),
        ProposalCanceled(AccountId, u32),
        ProposalStatusUpdated(u32, ProposalStatus),

        /// Params:
        /// * Voter - an account id of a councilor.
        /// * Id of a proposal.
        /// * Kind of vote.
        Voted(AccountId, u32, VoteKind),

        TallyFinalized(TallyResult<BlockNumber>),

        /// * Hash - hash of wasm code of runtime update.
        RuntimeUpdated(u32, Hash),

        /// Root cancelled proposal
        ProposalVetoed(u32),
    }
);

decl_storage! {
    trait Store for Module<T: Trait> as Proposals {

        // Parameters (defaut values could be exported to config):

        // TODO rename 'approval_quorum' -> 'quorum_percent' ?!
        /// A percent (up to 100) of the council participants
        /// that must vote affirmatively in order to pass.
        ApprovalQuorum get(approval_quorum) config(): u32 = DEFAULT_APPROVAL_QUORUM;

        /// Minimum amount of a balance to be staked in order to make a proposal.
        MinStake get(min_stake) config(): BalanceOf<T> =
            BalanceOf::<T>::from(DEFAULT_MIN_STAKE);

        /// A fee to be slashed (burn) in case a proposer decides to cancel a proposal.
        CancellationFee get(cancellation_fee) config(): BalanceOf<T> =
            BalanceOf::<T>::from(DEFAULT_CANCELLATION_FEE);

        /// A fee to be slashed (burn) in case a proposal was rejected.
        RejectionFee get(rejection_fee) config(): BalanceOf<T> =
            BalanceOf::<T>::from(DEFAULT_REJECTION_FEE);

        /// Max duration of proposal in blocks until it will be expired if not enough votes.
        VotingPeriod get(voting_period) config(): T::BlockNumber =
            T::BlockNumber::from(DEFAULT_VOTING_PERIOD_IN_SECS /
            (<T as timestamp::Trait>::MinimumPeriod::get().saturated_into::<u32>() * 2));

        NameMaxLen get(name_max_len) config(): u32 = DEFAULT_NAME_MAX_LEN;
        DescriptionMaxLen get(description_max_len) config(): u32 = DEFAULT_DESCRIPTION_MAX_LEN;
        WasmCodeMaxLen get(wasm_code_max_len) config(): u32 = DEFAULT_WASM_CODE_MAX_LEN;

        // Persistent state (always relevant, changes constantly):

        /// Count of all proposals that have been created.
        ProposalCount get(proposal_count): u32;

        /// Get proposal details by its id.
        Proposals get(proposals): map u32 => RuntimeUpgradeProposal<T::AccountId, BalanceOf<T>, T::BlockNumber, T::Hash>;

        /// Ids of proposals that are open for voting (have not been finalized yet).
        ActiveProposalIds get(active_proposal_ids): Vec<u32> = vec![];

        /// Get WASM code of runtime upgrade by hash of its content.
        WasmCodeByHash get(wasm_code_by_hash): map T::Hash => Vec<u8>;

        VotesByProposal get(votes_by_proposal): map u32 => Vec<(T::AccountId, VoteKind)>;

        // TODO Rethink: this can be replaced with: votes_by_proposal.find(|vote| vote.0 == proposer)
        VoteByAccountAndProposal get(vote_by_account_and_proposal): map (T::AccountId, u32) => VoteKind;

        TallyResults get(tally_results): map u32 => TallyResult<T::BlockNumber>;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn deposit_event() = default;

        /// Use next code to create a proposal from Substrate UI's web console:
        /// ```js
        /// post({ sender: runtime.indices.ss58Decode('F7Gh'), call: calls.proposals.createProposal(2500, "0x123", "0x456", "0x789") }).tie(console.log)
        /// ```
        fn create_proposal(
            origin,
            stake: BalanceOf<T>,
            name: Vec<u8>,
            description: Vec<u8>,
            wasm_code: Vec<u8>
        ) {

            let proposer = ensure_signed(origin)?;
            ensure!(Self::can_participate(&proposer), MSG_ONLY_MEMBERS_CAN_PROPOSE);
            ensure!(stake >= Self::min_stake(), MSG_STAKE_IS_TOO_LOW);

            ensure!(!name.is_empty(), MSG_EMPTY_NAME_PROVIDED);
            ensure!(name.len() as u32 <= Self::name_max_len(), MSG_TOO_LONG_NAME);

            ensure!(!description.is_empty(), MSG_EMPTY_DESCRIPTION_PROVIDED);
            ensure!(description.len() as u32 <= Self::description_max_len(), MSG_TOO_LONG_DESCRIPTION);

            ensure!(!wasm_code.is_empty(), MSG_EMPTY_WASM_CODE_PROVIDED);
            ensure!(wasm_code.len() as u32 <= Self::wasm_code_max_len(), MSG_TOO_LONG_WASM_CODE);

            // Lock proposer's stake:
            T::Currency::reserve(&proposer, stake)
                .map_err(|_| MSG_STAKE_IS_GREATER_THAN_BALANCE)?;

            let proposal_id = Self::proposal_count() + 1;
            ProposalCount::put(proposal_id);

            // See in substrate repo @ srml/contract/src/wasm/code_cache.rs:73
            let wasm_hash = T::Hashing::hash(&wasm_code);

            let new_proposal = RuntimeUpgradeProposal {
                id: proposal_id,
                proposer: proposer.clone(),
                stake,
                name,
                description,
                wasm_hash,
                proposed_at: Self::current_block(),
                status: Active
            };

            if !<WasmCodeByHash<T>>::exists(wasm_hash) {
              <WasmCodeByHash<T>>::insert(wasm_hash, wasm_code);
            }
            <Proposals<T>>::insert(proposal_id, new_proposal);
            ActiveProposalIds::mutate(|ids| ids.push(proposal_id));
            Self::deposit_event(RawEvent::ProposalCreated(proposer.clone(), proposal_id));

            // Auto-vote with Approve if proposer is a councilor:
            if Self::is_councilor(&proposer) {
                Self::_process_vote(proposer, proposal_id, Approve)?;
            }
        }

        /// Use next code to create a proposal from Substrate UI's web console:
        /// ```js
        /// post({ sender: runtime.indices.ss58Decode('F7Gh'), call: calls.proposals.voteOnProposal(1, { option: "Approve", _type: "VoteKind" }) }).tie(console.log)
        /// ```
        fn vote_on_proposal(origin, proposal_id: u32, vote: VoteKind) {
            let voter = ensure_signed(origin)?;
            ensure!(Self::is_councilor(&voter), MSG_ONLY_COUNCILORS_CAN_VOTE);

            ensure!(<Proposals<T>>::exists(proposal_id), MSG_PROPOSAL_NOT_FOUND);
            let proposal = Self::proposals(proposal_id);

            ensure!(proposal.status == Active, MSG_PROPOSAL_FINALIZED);

            let not_expired = !Self::is_voting_period_expired(proposal.proposed_at);
            ensure!(not_expired, MSG_PROPOSAL_EXPIRED);

            let did_not_vote_before = !<VoteByAccountAndProposal<T>>::exists((voter.clone(), proposal_id));
            ensure!(did_not_vote_before, MSG_YOU_ALREADY_VOTED);

            Self::_process_vote(voter, proposal_id, vote)?;
        }

        // TODO add 'reason' why a proposer wants to cancel (UX + feedback)?
        /// Cancel a proposal by its original proposer. Some fee will be withdrawn from his balance.
        fn cancel_proposal(origin, proposal_id: u32) {
            let proposer = ensure_signed(origin)?;

            ensure!(<Proposals<T>>::exists(proposal_id), MSG_PROPOSAL_NOT_FOUND);
            let proposal = Self::proposals(proposal_id);

            ensure!(proposer == proposal.proposer, MSG_YOU_DONT_OWN_THIS_PROPOSAL);
            ensure!(proposal.status == Active, MSG_PROPOSAL_FINALIZED);

            // Spend some minimum fee on proposer's balance for canceling a proposal
            let fee = Self::cancellation_fee();
            let _ = T::Currency::slash_reserved(&proposer, fee);

            // Return unspent part of remaining staked deposit (after taking some fee)
            let left_stake = proposal.stake - fee;
            let _ = T::Currency::unreserve(&proposer, left_stake);

            Self::_update_proposal_status(proposal_id, Cancelled)?;
            Self::deposit_event(RawEvent::ProposalCanceled(proposer, proposal_id));
        }

        // Called on every block
        fn on_finalize(n: T::BlockNumber) {
            if let Err(e) = Self::end_block(n) {
                print(e);
            }
        }

        /// Cancel a proposal and return stake without slashing
        fn veto_proposal(origin, proposal_id: u32) {
            ensure_root(origin)?;
            ensure!(<Proposals<T>>::exists(proposal_id), MSG_PROPOSAL_NOT_FOUND);
            let proposal = Self::proposals(proposal_id);
            ensure!(proposal.status == Active, MSG_PROPOSAL_FINALIZED);

            let _ = T::Currency::unreserve(&proposal.proposer, proposal.stake);

            Self::_update_proposal_status(proposal_id, Cancelled)?;

            Self::deposit_event(RawEvent::ProposalVetoed(proposal_id));
        }

        fn set_approval_quorum(origin, new_value: u32) {
            ensure_root(origin)?;
            ensure!(new_value > 0, "approval quorom must be greater than zero");
            ApprovalQuorum::put(new_value);
        }
    }
}

impl<T: Trait> Module<T> {
    fn current_block() -> T::BlockNumber {
        <system::Module<T>>::block_number()
    }

    fn can_participate(sender: &T::AccountId) -> bool {
        !T::Currency::free_balance(sender).is_zero()
            && <membership::members::Module<T>>::is_member_account(sender)
    }

    fn is_councilor(sender: &T::AccountId) -> bool {
        <council::Module<T>>::is_councilor(sender)
    }

    fn councilors_count() -> u32 {
        <council::Module<T>>::active_council().len() as u32
    }

    fn approval_quorum_seats() -> u32 {
        (Self::approval_quorum() * Self::councilors_count()) / 100
    }

    fn is_voting_period_expired(proposed_at: T::BlockNumber) -> bool {
        Self::current_block() >= proposed_at + Self::voting_period()
    }

    fn _process_vote(voter: T::AccountId, proposal_id: u32, vote: VoteKind) -> dispatch::Result {
        let new_vote = (voter.clone(), vote.clone());
        if <VotesByProposal<T>>::exists(proposal_id) {
            // Append a new vote to other votes on this proposal:
            <VotesByProposal<T>>::mutate(proposal_id, |votes| votes.push(new_vote));
        } else {
            // This is the first vote on this proposal:
            <VotesByProposal<T>>::insert(proposal_id, vec![new_vote]);
        }
        <VoteByAccountAndProposal<T>>::insert((voter.clone(), proposal_id), &vote);
        Self::deposit_event(RawEvent::Voted(voter, proposal_id, vote));
        Ok(())
    }

    fn end_block(_now: T::BlockNumber) -> dispatch::Result {
        // TODO refactor this method

        // TODO iterate over not expired proposals and tally

        Self::tally()?;
        // TODO approve or reject a proposal

        Ok(())
    }

    /// Get the voters for the current proposal.
    pub fn tally() -> dispatch::Result {
        let councilors: u32 = Self::councilors_count();
        let quorum: u32 = Self::approval_quorum_seats();

        for &proposal_id in Self::active_proposal_ids().iter() {
            let votes = Self::votes_by_proposal(proposal_id);
            let mut abstentions: u32 = 0;
            let mut approvals: u32 = 0;
            let mut rejections: u32 = 0;
            let mut slashes: u32 = 0;

            for (_, vote) in votes.iter() {
                match vote {
                    Abstain => abstentions += 1,
                    Approve => approvals += 1,
                    Reject => rejections += 1,
                    Slash => slashes += 1,
                }
            }

            let proposal = Self::proposals(proposal_id);
            let is_expired = Self::is_voting_period_expired(proposal.proposed_at);

            // We need to check that the council is not empty because otherwise,
            // if there is no votes on a proposal it will be counted as if
            // all 100% (zero) councilors voted on the proposal and should be approved.

            let non_empty_council = councilors > 0;
            let all_councilors_voted = non_empty_council && votes.len() as u32 == councilors;
            let all_councilors_slashed = non_empty_council && slashes == councilors;
            let quorum_reached = quorum > 0 && approvals >= quorum;

            // Don't approve a proposal right after quorum reached
            // if not all councilors casted their votes.
            // Instead let other councilors cast their vote
            // up until the proposal's expired.

            let new_status: Option<ProposalStatus> = if all_councilors_slashed {
                Some(Slashed)
            } else if all_councilors_voted {
                if quorum_reached {
                    Some(Approved)
                } else {
                    Some(Rejected)
                }
            } else if is_expired {
                if quorum_reached {
                    Some(Approved)
                } else {
                    // Proposal has been expired and quorum not reached.
                    Some(Expired)
                }
            } else {
                // Councilors still have time to vote on this proposal.
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
                    finalized_at: Self::current_block(),
                };
                <TallyResults<T>>::insert(proposal_id, &tally_result);
                Self::deposit_event(RawEvent::TallyFinalized(tally_result));
            }
        }

        Ok(())
    }

    /// Updates proposal status and removes proposal from active ids.
    fn _update_proposal_status(proposal_id: u32, new_status: ProposalStatus) -> dispatch::Result {
        let all_active_ids = Self::active_proposal_ids();
        let all_len = all_active_ids.len();
        let other_active_ids: Vec<u32> = all_active_ids
            .into_iter()
            .filter(|&id| id != proposal_id)
            .collect();

        let not_found_in_active = other_active_ids.len() == all_len;
        if not_found_in_active {
            // Seems like this proposal's status has been updated and removed from active.
            Err(MSG_PROPOSAL_STATUS_ALREADY_UPDATED)
        } else {
            let pid = proposal_id.clone();
            match new_status {
                Slashed => Self::_slash_proposal(pid)?,
                Rejected | Expired => Self::_reject_proposal(pid)?,
                Approved => Self::_approve_proposal(pid)?,
                Active | Cancelled => { /* nothing */ }
            }
            ActiveProposalIds::put(other_active_ids);
            <Proposals<T>>::mutate(proposal_id, |p| p.status = new_status.clone());
            Self::deposit_event(RawEvent::ProposalStatusUpdated(proposal_id, new_status));
            Ok(())
        }
    }

    /// Slash a proposal. The staked deposit will be slashed.
    fn _slash_proposal(proposal_id: u32) -> dispatch::Result {
        let proposal = Self::proposals(proposal_id);

        // Slash proposer's stake:
        let _ = T::Currency::slash_reserved(&proposal.proposer, proposal.stake);

        Ok(())
    }

    /// Reject a proposal. The staked deposit will be returned to a proposer.
    fn _reject_proposal(proposal_id: u32) -> dispatch::Result {
        let proposal = Self::proposals(proposal_id);
        let proposer = proposal.proposer;

        // Spend some minimum fee on proposer's balance to prevent spamming attacks:
        let fee = Self::rejection_fee();
        let _ = T::Currency::slash_reserved(&proposer, fee);

        // Return unspent part of remaining staked deposit (after taking some fee):
        let left_stake = proposal.stake - fee;
        let _ = T::Currency::unreserve(&proposer, left_stake);

        Ok(())
    }

    /// Approve a proposal. The staked deposit will be returned.
    fn _approve_proposal(proposal_id: u32) -> dispatch::Result {
        let proposal = Self::proposals(proposal_id);
        let wasm_code = Self::wasm_code_by_hash(proposal.wasm_hash);

        // Return staked deposit to proposer:
        let _ = T::Currency::unreserve(&proposal.proposer, proposal.stake);

        // Update wasm code of node's runtime:
        <system::Module<T>>::set_code(system::RawOrigin::Root.into(), wasm_code)?;

        Self::deposit_event(RawEvent::RuntimeUpdated(proposal_id, proposal.wasm_hash));

        Ok(())
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    use primitives::H256;
    // The testing primitives are very useful for avoiding having to work with signatures
    // or public keys. `u64` is used as the `AccountId` and no `Signature`s are requried.
    use sr_primitives::{
        testing::Header,
        traits::{BlakeTwo256, IdentityLookup},
        Perbill,
    };
    use srml_support::*;

    impl_outer_origin! {
        pub enum Origin for Test {}
    }

    // Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
    #[derive(Clone, PartialEq, Eq, Debug)]
    pub struct Test;

    parameter_types! {
        pub const BlockHashCount: u64 = 250;
        pub const MaximumBlockWeight: u32 = 1024;
        pub const MaximumBlockLength: u32 = 2 * 1024;
        pub const AvailableBlockRatio: Perbill = Perbill::one();
        pub const MinimumPeriod: u64 = 5;
    }

    impl system::Trait for Test {
        type Origin = Origin;
        type Index = u64;
        type BlockNumber = u64;
        type Call = ();
        type Hash = H256;
        type Hashing = BlakeTwo256;
        type AccountId = u64;
        type Lookup = IdentityLookup<Self::AccountId>;
        type Header = Header;
        type Event = ();
        type BlockHashCount = BlockHashCount;
        type MaximumBlockWeight = MaximumBlockWeight;
        type MaximumBlockLength = MaximumBlockLength;
        type AvailableBlockRatio = AvailableBlockRatio;
        type Version = ();
    }

    impl timestamp::Trait for Test {
        type Moment = u64;
        type OnTimestampSet = ();
        type MinimumPeriod = MinimumPeriod;
    }

    parameter_types! {
        pub const ExistentialDeposit: u32 = 0;
        pub const TransferFee: u32 = 0;
        pub const CreationFee: u32 = 0;
        pub const TransactionBaseFee: u32 = 1;
        pub const TransactionByteFee: u32 = 0;
        pub const InitialMembersBalance: u32 = 0;
    }

    impl balances::Trait for Test {
        /// The type for recording an account's balance.
        type Balance = u64;
        /// What to do if an account's free balance gets zeroed.
        type OnFreeBalanceZero = ();
        /// What to do if a new account is created.
        type OnNewAccount = ();
        /// The ubiquitous event type.
        type Event = ();

        type DustRemoval = ();
        type TransferPayment = ();
        type ExistentialDeposit = ExistentialDeposit;
        type TransferFee = TransferFee;
        type CreationFee = CreationFee;
    }

    impl council::Trait for Test {
        type Event = ();
        type CouncilTermEnded = ();
    }

    impl GovernanceCurrency for Test {
        type Currency = balances::Module<Self>;
    }

    impl membership::members::Trait for Test {
        type Event = ();
        type MemberId = u32;
        type PaidTermId = u32;
        type SubscriptionId = u32;
        type ActorId = u32;
        type InitialMembersBalance = InitialMembersBalance;
    }

    impl Trait for Test {
        type Event = ();
    }

    type System = system::Module<Test>;
    type Balances = balances::Module<Test>;
    type Proposals = Module<Test>;

    const COUNCILOR1: u64 = 1;
    const COUNCILOR2: u64 = 2;
    const COUNCILOR3: u64 = 3;
    const COUNCILOR4: u64 = 4;
    const COUNCILOR5: u64 = 5;

    const PROPOSER1: u64 = 11;
    const PROPOSER2: u64 = 12;

    const NOT_COUNCILOR: u64 = 22;

    const ALL_COUNCILORS: [u64; 5] = [COUNCILOR1, COUNCILOR2, COUNCILOR3, COUNCILOR4, COUNCILOR5];

    // TODO Figure out how to test Events in test... (low priority)
    // mod proposals {
    //     pub use ::Event;
    // }
    // impl_outer_event!{
    //     pub enum TestEvent for Test {
    //         balances<T>,system<T>,proposals<T>,
    //     }
    // }

    // This function basically just builds a genesis storage key/value store according to
    // our desired mockup.
    fn new_test_ext() -> runtime_io::TestExternalities {
        let mut t = system::GenesisConfig::default()
            .build_storage::<Test>()
            .unwrap();

        // We use default for brevity, but you can configure as desired if needed.
        balances::GenesisConfig::<Test>::default()
            .assimilate_storage(&mut t)
            .unwrap();

        let council_mock: council::Seats<u64, u64> = ALL_COUNCILORS
            .iter()
            .map(|&c| council::Seat {
                member: c,
                stake: 0u64,
                backers: vec![],
            })
            .collect();

        council::GenesisConfig::<Test> {
            active_council: council_mock,
            term_ends_at: 0,
        }
        .assimilate_storage(&mut t)
        .unwrap();

        membership::members::GenesisConfig::<Test> {
            default_paid_membership_fee: 0,
            members: vec![
                (PROPOSER1, "alice".into(), "".into(), "".into()),
                (PROPOSER2, "bobby".into(), "".into(), "".into()),
                (COUNCILOR1, "councilor1".into(), "".into(), "".into()),
                (COUNCILOR2, "councilor2".into(), "".into(), "".into()),
                (COUNCILOR3, "councilor3".into(), "".into(), "".into()),
                (COUNCILOR4, "councilor4".into(), "".into(), "".into()),
                (COUNCILOR5, "councilor5".into(), "".into(), "".into()),
            ],
        }
        .assimilate_storage(&mut t)
        .unwrap();
        // t.extend(GenesisConfig::<Test>{
        //     // Here we can override defaults.
        // }.build_storage().unwrap().0);

        t.into()
    }

    /// A shortcut to get minimum stake in tests.
    fn min_stake() -> u64 {
        Proposals::min_stake()
    }

    /// A shortcut to get cancellation fee in tests.
    fn cancellation_fee() -> u64 {
        Proposals::cancellation_fee()
    }

    /// A shortcut to get rejection fee in tests.
    fn rejection_fee() -> u64 {
        Proposals::rejection_fee()
    }

    /// Initial balance of Proposer 1.
    fn initial_balance() -> u64 {
        (min_stake() as f64 * 2.5) as u64
    }

    fn name() -> Vec<u8> {
        b"Proposal Name".to_vec()
    }

    fn description() -> Vec<u8> {
        b"Proposal Description".to_vec()
    }

    fn wasm_code() -> Vec<u8> {
        b"Proposal Wasm Code".to_vec()
    }

    fn _create_default_proposal() -> dispatch::Result {
        _create_proposal(None, None, None, None, None)
    }

    fn _create_proposal(
        origin: Option<u64>,
        stake: Option<u64>,
        name: Option<Vec<u8>>,
        description: Option<Vec<u8>>,
        wasm_code: Option<Vec<u8>>,
    ) -> dispatch::Result {
        Proposals::create_proposal(
            Origin::signed(origin.unwrap_or(PROPOSER1)),
            stake.unwrap_or(min_stake()),
            name.unwrap_or(self::name()),
            description.unwrap_or(self::description()),
            wasm_code.unwrap_or(self::wasm_code()),
        )
    }

    fn get_runtime_code() -> Option<Vec<u8>> {
        storage::unhashed::get_raw(well_known_keys::CODE)
    }

    macro_rules! assert_runtime_code_empty {
        () => {
            assert_eq!(get_runtime_code(), Some(vec![]))
        };
    }

    macro_rules! assert_runtime_code {
        ($code:expr) => {
            assert_eq!(get_runtime_code(), Some($code))
        };
    }

    #[test]
    fn check_default_values() {
        new_test_ext().execute_with(|| {
            assert_eq!(Proposals::approval_quorum(), DEFAULT_APPROVAL_QUORUM);
            assert_eq!(
                Proposals::min_stake(),
                BalanceOf::<Test>::from(DEFAULT_MIN_STAKE)
            );
            assert_eq!(
                Proposals::cancellation_fee(),
                BalanceOf::<Test>::from(DEFAULT_CANCELLATION_FEE)
            );
            assert_eq!(
                Proposals::rejection_fee(),
                BalanceOf::<Test>::from(DEFAULT_REJECTION_FEE)
            );
            assert_eq!(Proposals::name_max_len(), DEFAULT_NAME_MAX_LEN);
            assert_eq!(
                Proposals::description_max_len(),
                DEFAULT_DESCRIPTION_MAX_LEN
            );
            assert_eq!(Proposals::wasm_code_max_len(), DEFAULT_WASM_CODE_MAX_LEN);
            assert_eq!(Proposals::proposal_count(), 0);
            assert!(Proposals::active_proposal_ids().is_empty());
        });
    }

    #[test]
    fn member_create_proposal() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            assert_ok!(_create_default_proposal());
            assert_eq!(Proposals::active_proposal_ids().len(), 1);
            assert_eq!(Proposals::active_proposal_ids()[0], 1);

            let wasm_hash = BlakeTwo256::hash(&wasm_code());
            let expected_proposal = RuntimeUpgradeProposal {
                id: 1,
                proposer: PROPOSER1,
                stake: min_stake(),
                name: name(),
                description: description(),
                wasm_hash,
                proposed_at: 1,
                status: Active,
            };
            assert_eq!(Proposals::proposals(1), expected_proposal);

            // Check that stake amount has been locked on proposer's balance:
            assert_eq!(
                Balances::free_balance(PROPOSER1),
                initial_balance() - min_stake()
            );
            assert_eq!(Balances::reserved_balance(PROPOSER1), min_stake());

            // TODO expect event ProposalCreated(AccountId, u32)
        });
    }

    #[test]
    fn not_member_cannot_create_proposal() {
        new_test_ext().execute_with(|| {
            // In this test a proposer has an empty balance
            // thus he is not considered as a member.
            assert_eq!(
                _create_default_proposal(),
                Err(MSG_ONLY_MEMBERS_CAN_PROPOSE)
            );
        });
    }

    #[test]
    fn cannot_create_proposal_with_small_stake() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            assert_eq!(
                _create_proposal(None, Some(min_stake() - 1), None, None, None),
                Err(MSG_STAKE_IS_TOO_LOW)
            );

            // Check that balances remain unchanged afer a failed attempt to create a proposal:
            assert_eq!(Balances::free_balance(PROPOSER1), initial_balance());
            assert_eq!(Balances::reserved_balance(PROPOSER1), 0);
        });
    }

    #[test]
    fn cannot_create_proposal_when_stake_is_greater_than_balance() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            assert_eq!(
                _create_proposal(None, Some(initial_balance() + 1), None, None, None),
                Err(MSG_STAKE_IS_GREATER_THAN_BALANCE)
            );

            // Check that balances remain unchanged afer a failed attempt to create a proposal:
            assert_eq!(Balances::free_balance(PROPOSER1), initial_balance());
            assert_eq!(Balances::reserved_balance(PROPOSER1), 0);
        });
    }

    #[test]
    fn cannot_create_proposal_with_empty_values() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            // Empty name:
            assert_eq!(
                _create_proposal(None, None, Some(vec![]), None, None),
                Err(MSG_EMPTY_NAME_PROVIDED)
            );

            // Empty description:
            assert_eq!(
                _create_proposal(None, None, None, Some(vec![]), None),
                Err(MSG_EMPTY_DESCRIPTION_PROVIDED)
            );

            // Empty WASM code:
            assert_eq!(
                _create_proposal(None, None, None, None, Some(vec![])),
                Err(MSG_EMPTY_WASM_CODE_PROVIDED)
            );
        });
    }

    #[test]
    fn cannot_create_proposal_with_too_long_values() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            // Too long name:
            assert_eq!(
                _create_proposal(None, None, Some(too_long_name()), None, None),
                Err(MSG_TOO_LONG_NAME)
            );

            // Too long description:
            assert_eq!(
                _create_proposal(None, None, None, Some(too_long_description()), None),
                Err(MSG_TOO_LONG_DESCRIPTION)
            );

            // Too long WASM code:
            assert_eq!(
                _create_proposal(None, None, None, None, Some(too_long_wasm_code())),
                Err(MSG_TOO_LONG_WASM_CODE)
            );
        });
    }

    fn too_long_name() -> Vec<u8> {
        vec![65; Proposals::name_max_len() as usize + 1]
    }

    fn too_long_description() -> Vec<u8> {
        vec![65; Proposals::description_max_len() as usize + 1]
    }

    fn too_long_wasm_code() -> Vec<u8> {
        vec![65; Proposals::wasm_code_max_len() as usize + 1]
    }

    // -------------------------------------------------------------------
    // Cancellation

    #[test]
    fn owner_cancel_proposal() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            assert_ok!(_create_default_proposal());
            assert_ok!(Proposals::cancel_proposal(Origin::signed(PROPOSER1), 1));
            assert_eq!(Proposals::proposals(1).status, Cancelled);
            assert!(Proposals::active_proposal_ids().is_empty());

            // Check that proposer's balance reduced by cancellation fee and other part of his stake returned to his balance:
            assert_eq!(
                Balances::free_balance(PROPOSER1),
                initial_balance() - cancellation_fee()
            );
            assert_eq!(Balances::reserved_balance(PROPOSER1), 0);

            // TODO expect event ProposalCancelled(AccountId, u32)
        });
    }

    #[test]
    fn owner_cannot_cancel_proposal_if_its_finalized() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            assert_ok!(_create_default_proposal());
            assert_ok!(Proposals::cancel_proposal(Origin::signed(PROPOSER1), 1));
            assert_eq!(Proposals::proposals(1).status, Cancelled);

            // Get balances updated after cancelling a proposal:
            let updated_free_balance = Balances::free_balance(PROPOSER1);
            let updated_reserved_balance = Balances::reserved_balance(PROPOSER1);

            assert_eq!(
                Proposals::cancel_proposal(Origin::signed(PROPOSER1), 1),
                Err(MSG_PROPOSAL_FINALIZED)
            );

            // Check that proposer's balance and locked stake haven't been changed:
            assert_eq!(Balances::free_balance(PROPOSER1), updated_free_balance);
            assert_eq!(
                Balances::reserved_balance(PROPOSER1),
                updated_reserved_balance
            );
        });
    }

    #[test]
    fn not_owner_cannot_cancel_proposal() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());
            let _ = Balances::deposit_creating(&PROPOSER2, initial_balance());
            assert_ok!(_create_default_proposal());
            assert_eq!(
                Proposals::cancel_proposal(Origin::signed(PROPOSER2), 1),
                Err(MSG_YOU_DONT_OWN_THIS_PROPOSAL)
            );
        });
    }

    // -------------------------------------------------------------------
    // Voting

    #[test]
    fn councilor_vote_on_proposal() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            assert_ok!(_create_default_proposal());

            assert_ok!(Proposals::vote_on_proposal(
                Origin::signed(COUNCILOR1),
                1,
                Approve
            ));

            // Check that a vote has been saved:
            assert_eq!(Proposals::votes_by_proposal(1), vec![(COUNCILOR1, Approve)]);
            assert_eq!(
                Proposals::vote_by_account_and_proposal((COUNCILOR1, 1)),
                Approve
            );

            // TODO expect event Voted(PROPOSER1, 1, Approve)
        });
    }

    #[test]
    fn councilor_cannot_vote_on_proposal_twice() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            assert_ok!(_create_default_proposal());

            assert_ok!(Proposals::vote_on_proposal(
                Origin::signed(COUNCILOR1),
                1,
                Approve
            ));
            assert_eq!(
                Proposals::vote_on_proposal(Origin::signed(COUNCILOR1), 1, Approve),
                Err(MSG_YOU_ALREADY_VOTED)
            );
        });
    }

    #[test]
    fn autovote_with_approve_when_councilor_creates_proposal() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&COUNCILOR1, initial_balance());

            assert_ok!(_create_proposal(Some(COUNCILOR1), None, None, None, None));

            // Check that a vote has been sent automatically,
            // such as the proposer is a councilor:
            assert_eq!(Proposals::votes_by_proposal(1), vec![(COUNCILOR1, Approve)]);
            assert_eq!(
                Proposals::vote_by_account_and_proposal((COUNCILOR1, 1)),
                Approve
            );
        });
    }

    #[test]
    fn not_councilor_cannot_vote_on_proposal() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            assert_ok!(_create_default_proposal());
            assert_eq!(
                Proposals::vote_on_proposal(Origin::signed(NOT_COUNCILOR), 1, Approve),
                Err(MSG_ONLY_COUNCILORS_CAN_VOTE)
            );
        });
    }

    #[test]
    fn councilor_cannot_vote_on_proposal_if_it_has_been_cancelled() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            assert_ok!(_create_default_proposal());
            assert_ok!(Proposals::cancel_proposal(Origin::signed(PROPOSER1), 1));
            assert_eq!(
                Proposals::vote_on_proposal(Origin::signed(COUNCILOR1), 1, Approve),
                Err(MSG_PROPOSAL_FINALIZED)
            );
        });
    }

    #[test]
    fn councilor_cannot_vote_on_proposal_if_tally_has_been_finalized() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            assert_ok!(_create_default_proposal());

            // All councilors vote with 'Approve' on proposal:
            let mut expected_votes: Vec<(u64, VoteKind)> = vec![];
            for &councilor in ALL_COUNCILORS.iter() {
                expected_votes.push((councilor, Approve));
                assert_ok!(Proposals::vote_on_proposal(
                    Origin::signed(councilor),
                    1,
                    Approve
                ));
                assert_eq!(
                    Proposals::vote_by_account_and_proposal((councilor, 1)),
                    Approve
                );
            }
            assert_eq!(Proposals::votes_by_proposal(1), expected_votes);

            System::set_block_number(2);
            let _ = Proposals::end_block(2);

            assert!(Proposals::active_proposal_ids().is_empty());
            assert_eq!(Proposals::proposals(1).status, Approved);

            // Try to vote on finalized proposal:
            assert_eq!(
                Proposals::vote_on_proposal(Origin::signed(COUNCILOR1), 1, Reject),
                Err(MSG_PROPOSAL_FINALIZED)
            );
        });
    }

    // -------------------------------------------------------------------
    // Tally + Outcome:

    #[test]
    fn approve_proposal_when_all_councilors_approved_it() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            assert_ok!(_create_default_proposal());

            // All councilors approved:
            let mut expected_votes: Vec<(u64, VoteKind)> = vec![];
            for &councilor in ALL_COUNCILORS.iter() {
                expected_votes.push((councilor, Approve));
                assert_ok!(Proposals::vote_on_proposal(
                    Origin::signed(councilor),
                    1,
                    Approve
                ));
                assert_eq!(
                    Proposals::vote_by_account_and_proposal((councilor, 1)),
                    Approve
                );
            }
            assert_eq!(Proposals::votes_by_proposal(1), expected_votes);

            assert_runtime_code_empty!();

            System::set_block_number(2);
            let _ = Proposals::end_block(2);

            // Check that runtime code has been updated after proposal approved.
            assert_runtime_code!(wasm_code());

            assert!(Proposals::active_proposal_ids().is_empty());
            assert_eq!(Proposals::proposals(1).status, Approved);
            assert_eq!(
                Proposals::tally_results(1),
                TallyResult {
                    proposal_id: 1,
                    abstentions: 0,
                    approvals: ALL_COUNCILORS.len() as u32,
                    rejections: 0,
                    slashes: 0,
                    status: Approved,
                    finalized_at: 2
                }
            );

            // Check that proposer's stake has been added back to his balance:
            assert_eq!(Balances::free_balance(PROPOSER1), initial_balance());
            assert_eq!(Balances::reserved_balance(PROPOSER1), 0);

            // TODO expect event ProposalStatusUpdated(1, Approved)
        });
    }

    #[test]
    fn approve_proposal_when_all_councilors_voted_and_only_quorum_approved() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            assert_ok!(_create_default_proposal());

            // Only a quorum of councilors approved, others rejected:
            let councilors = Proposals::councilors_count();
            let approvals = Proposals::approval_quorum_seats();
            let rejections = councilors - approvals;
            for i in 0..councilors as usize {
                let vote = if (i as u32) < approvals {
                    Approve
                } else {
                    Reject
                };
                assert_ok!(Proposals::vote_on_proposal(
                    Origin::signed(ALL_COUNCILORS[i]),
                    1,
                    vote
                ));
            }
            assert_eq!(Proposals::votes_by_proposal(1).len() as u32, councilors);

            assert_runtime_code_empty!();

            System::set_block_number(2);
            let _ = Proposals::end_block(2);

            // Check that runtime code has been updated after proposal approved.
            assert_runtime_code!(wasm_code());

            assert!(Proposals::active_proposal_ids().is_empty());
            assert_eq!(Proposals::proposals(1).status, Approved);
            assert_eq!(
                Proposals::tally_results(1),
                TallyResult {
                    proposal_id: 1,
                    abstentions: 0,
                    approvals: approvals,
                    rejections: rejections,
                    slashes: 0,
                    status: Approved,
                    finalized_at: 2
                }
            );

            // Check that proposer's stake has been added back to his balance:
            assert_eq!(Balances::free_balance(PROPOSER1), initial_balance());
            assert_eq!(Balances::reserved_balance(PROPOSER1), 0);

            // TODO expect event ProposalStatusUpdated(1, Approved)
        });
    }

    #[test]
    fn approve_proposal_when_voting_period_expired_if_only_quorum_voted() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            assert_ok!(_create_default_proposal());

            // Only quorum of councilors approved, other councilors didn't vote:
            let approvals = Proposals::approval_quorum_seats();
            for i in 0..approvals as usize {
                let vote = if (i as u32) < approvals {
                    Approve
                } else {
                    Slash
                };
                assert_ok!(Proposals::vote_on_proposal(
                    Origin::signed(ALL_COUNCILORS[i]),
                    1,
                    vote
                ));
            }
            assert_eq!(Proposals::votes_by_proposal(1).len() as u32, approvals);

            assert_runtime_code_empty!();

            let expiration_block = System::block_number() + Proposals::voting_period();
            System::set_block_number(2);
            let _ = Proposals::end_block(2);

            // Check that runtime code has NOT been updated yet,
            // because not all councilors voted and voting period is not expired yet.
            assert_runtime_code_empty!();

            System::set_block_number(expiration_block);
            let _ = Proposals::end_block(expiration_block);

            // Check that runtime code has been updated after proposal approved.
            assert_runtime_code!(wasm_code());

            assert!(Proposals::active_proposal_ids().is_empty());
            assert_eq!(Proposals::proposals(1).status, Approved);
            assert_eq!(
                Proposals::tally_results(1),
                TallyResult {
                    proposal_id: 1,
                    abstentions: 0,
                    approvals: approvals,
                    rejections: 0,
                    slashes: 0,
                    status: Approved,
                    finalized_at: expiration_block
                }
            );

            // Check that proposer's stake has been added back to his balance:
            assert_eq!(Balances::free_balance(PROPOSER1), initial_balance());
            assert_eq!(Balances::reserved_balance(PROPOSER1), 0);

            // TODO expect event ProposalStatusUpdated(1, Approved)
        });
    }

    #[test]
    fn reject_proposal_when_all_councilors_voted_and_quorum_not_reached() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            assert_ok!(_create_default_proposal());

            // Less than a quorum of councilors approved, while others abstained:
            let councilors = Proposals::councilors_count();
            let approvals = Proposals::approval_quorum_seats() - 1;
            let abstentions = councilors - approvals;
            for i in 0..councilors as usize {
                let vote = if (i as u32) < approvals {
                    Approve
                } else {
                    Abstain
                };
                assert_ok!(Proposals::vote_on_proposal(
                    Origin::signed(ALL_COUNCILORS[i]),
                    1,
                    vote
                ));
            }
            assert_eq!(Proposals::votes_by_proposal(1).len() as u32, councilors);

            assert_runtime_code_empty!();

            System::set_block_number(2);
            let _ = Proposals::end_block(2);

            // Check that runtime code has NOT been updated after proposal slashed.
            assert_runtime_code_empty!();

            assert!(Proposals::active_proposal_ids().is_empty());
            assert_eq!(Proposals::proposals(1).status, Rejected);
            assert_eq!(
                Proposals::tally_results(1),
                TallyResult {
                    proposal_id: 1,
                    abstentions: abstentions,
                    approvals: approvals,
                    rejections: 0,
                    slashes: 0,
                    status: Rejected,
                    finalized_at: 2
                }
            );

            // Check that proposer's balance reduced by burnt stake:
            assert_eq!(
                Balances::free_balance(PROPOSER1),
                initial_balance() - rejection_fee()
            );
            assert_eq!(Balances::reserved_balance(PROPOSER1), 0);

            // TODO expect event ProposalStatusUpdated(1, Rejected)
        });
    }

    #[test]
    fn reject_proposal_when_all_councilors_rejected_it() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            assert_ok!(_create_default_proposal());

            // All councilors rejected:
            let mut expected_votes: Vec<(u64, VoteKind)> = vec![];
            for &councilor in ALL_COUNCILORS.iter() {
                expected_votes.push((councilor, Reject));
                assert_ok!(Proposals::vote_on_proposal(
                    Origin::signed(councilor),
                    1,
                    Reject
                ));
                assert_eq!(
                    Proposals::vote_by_account_and_proposal((councilor, 1)),
                    Reject
                );
            }
            assert_eq!(Proposals::votes_by_proposal(1), expected_votes);

            assert_runtime_code_empty!();

            System::set_block_number(2);
            let _ = Proposals::end_block(2);

            // Check that runtime code has NOT been updated after proposal rejected.
            assert_runtime_code_empty!();

            assert!(Proposals::active_proposal_ids().is_empty());
            assert_eq!(Proposals::proposals(1).status, Rejected);
            assert_eq!(
                Proposals::tally_results(1),
                TallyResult {
                    proposal_id: 1,
                    abstentions: 0,
                    approvals: 0,
                    rejections: ALL_COUNCILORS.len() as u32,
                    slashes: 0,
                    status: Rejected,
                    finalized_at: 2
                }
            );

            // Check that proposer's balance reduced by burnt stake:
            assert_eq!(
                Balances::free_balance(PROPOSER1),
                initial_balance() - rejection_fee()
            );
            assert_eq!(Balances::reserved_balance(PROPOSER1), 0);

            // TODO expect event ProposalStatusUpdated(1, Rejected)
        });
    }

    #[test]
    fn slash_proposal_when_all_councilors_slashed_it() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            assert_ok!(_create_default_proposal());

            // All councilors slashed:
            let mut expected_votes: Vec<(u64, VoteKind)> = vec![];
            for &councilor in ALL_COUNCILORS.iter() {
                expected_votes.push((councilor, Slash));
                assert_ok!(Proposals::vote_on_proposal(
                    Origin::signed(councilor),
                    1,
                    Slash
                ));
                assert_eq!(
                    Proposals::vote_by_account_and_proposal((councilor, 1)),
                    Slash
                );
            }
            assert_eq!(Proposals::votes_by_proposal(1), expected_votes);

            assert_runtime_code_empty!();

            System::set_block_number(2);
            let _ = Proposals::end_block(2);

            // Check that runtime code has NOT been updated after proposal slashed.
            assert_runtime_code_empty!();

            assert!(Proposals::active_proposal_ids().is_empty());
            assert_eq!(Proposals::proposals(1).status, Slashed);
            assert_eq!(
                Proposals::tally_results(1),
                TallyResult {
                    proposal_id: 1,
                    abstentions: 0,
                    approvals: 0,
                    rejections: 0,
                    slashes: ALL_COUNCILORS.len() as u32,
                    status: Slashed,
                    finalized_at: 2
                }
            );

            // Check that proposer's balance reduced by burnt stake:
            assert_eq!(
                Balances::free_balance(PROPOSER1),
                initial_balance() - min_stake()
            );
            assert_eq!(Balances::reserved_balance(PROPOSER1), 0);

            // TODO expect event ProposalStatusUpdated(1, Slashed)
            // TODO fix: event log assertion doesn't work and return empty event in every record
            // assert_eq!(*System::events().last().unwrap(),
            //     EventRecord {
            //         phase: Phase::ApplyExtrinsic(0),
            //         event: RawEvent::ProposalStatusUpdated(1, Slashed),
            //     }
            // );
        });
    }

    // In this case a proposal will be marked as 'Expired'
    // and it will be processed in the same way as if it has been rejected.
    #[test]
    fn expire_proposal_when_not_all_councilors_voted_and_quorum_not_reached() {
        new_test_ext().execute_with(|| {
            let _ = Balances::deposit_creating(&PROPOSER1, initial_balance());

            assert_ok!(_create_default_proposal());

            // Less than a quorum of councilors approved:
            let approvals = Proposals::approval_quorum_seats() - 1;
            for i in 0..approvals as usize {
                let vote = if (i as u32) < approvals {
                    Approve
                } else {
                    Slash
                };
                assert_ok!(Proposals::vote_on_proposal(
                    Origin::signed(ALL_COUNCILORS[i]),
                    1,
                    vote
                ));
            }
            assert_eq!(Proposals::votes_by_proposal(1).len() as u32, approvals);

            assert_runtime_code_empty!();

            let expiration_block = System::block_number() + Proposals::voting_period();
            System::set_block_number(expiration_block);
            let _ = Proposals::end_block(expiration_block);

            // Check that runtime code has NOT been updated after proposal slashed.
            assert_runtime_code_empty!();

            assert!(Proposals::active_proposal_ids().is_empty());
            assert_eq!(Proposals::proposals(1).status, Expired);
            assert_eq!(
                Proposals::tally_results(1),
                TallyResult {
                    proposal_id: 1,
                    abstentions: 0,
                    approvals: approvals,
                    rejections: 0,
                    slashes: 0,
                    status: Expired,
                    finalized_at: expiration_block
                }
            );

            // Check that proposer's balance reduced by burnt stake:
            assert_eq!(
                Balances::free_balance(PROPOSER1),
                initial_balance() - rejection_fee()
            );
            assert_eq!(Balances::reserved_balance(PROPOSER1), 0);

            // TODO expect event ProposalStatusUpdated(1, Rejected)
        });
    }
}
