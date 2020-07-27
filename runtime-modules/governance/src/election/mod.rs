//! Council Elections Manager
//!
//! # Election Parameters:
//! We don't currently handle zero periods, zero council term, zero council size and candidacy
//! limit in any special way. The behaviour in such cases:
//!
//! - Setting any period to 0 will mean the election getting stuck in that stage, until force changing
//! the state.
//!
//! - Council Size of 0 - no limit to size of council, all applicants that move beyond
//! announcing stage would become council members, so effectively the candidacy limit will
//! be the size of the council, voting and revealing have no impact on final results.
//!
//! - If candidacy limit is zero and council size > 0, council_size number of applicants will reach the voting stage.
//! and become council members, voting will have no impact on final results.
//!
//! - If both candidacy limit and council size are zero then all applicant become council members
//! since no filtering occurs at end of announcing stage.
//!
//! We only guard against these edge cases in the [`set_election_parameters`] call.
//!
//! [`set_election_parameters`]: struct.Module.html#method.set_election_parameters

// Clippy linter warning
#![allow(clippy::type_complexity)]
// disable it because of possible frontend API break
// TODO: remove post-Constaninople

// Clippy linter warning
#![allow(clippy::redundant_closure_call)] // disable it because of the substrate lib design

use rstd::prelude::*;
use srml_support::traits::{Currency, ReservableCurrency};
use srml_support::{decl_event, decl_module, decl_storage, dispatch::Result, ensure};
use system::{self, ensure_root, ensure_signed};

use codec::{Decode, Encode};
use rstd::collections::btree_map::BTreeMap;
use rstd::ops::Add;
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sr_primitives::traits::{Hash, Zero};

use super::sealed_vote::SealedVote;
use super::stake::Stake;

use super::council;
use crate::election_params::ElectionParameters;
pub use common::currency::{BalanceOf, GovernanceCurrency};

mod tests;

pub trait Trait:
    system::Trait + council::Trait + GovernanceCurrency + membership::members::Trait
{
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type CouncilElected: CouncilElected<Seats<Self::AccountId, BalanceOf<Self>>, Self::BlockNumber>;
}

pub static MSG_CANNOT_CHANGE_PARAMS_DURING_ELECTION: &str = "CannotChangeParamsDuringElection";

#[derive(Clone, Copy, Encode, Decode)]
pub enum ElectionStage<BlockNumber> {
    Announcing(BlockNumber),
    Voting(BlockNumber),
    Revealing(BlockNumber),
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Seat<AccountId, Balance> {
    pub member: AccountId,
    pub stake: Balance,
    pub backers: Vec<Backer<AccountId, Balance>>,
}

impl<AccountId, Balance> Seat<AccountId, Balance>
where
    Balance: Add<Output = Balance> + Copy,
{
    pub fn calc_total_stake(&self) -> Balance {
        self.backers
            .iter()
            .fold(self.stake, |acc, backer| acc + backer.stake)
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Backer<AccountId, Balance> {
    pub member: AccountId,
    pub stake: Balance,
}

pub type Seats<AccountId, Balance> = Vec<Seat<AccountId, Balance>>;

// Hook for setting a new council when it is elected
pub trait CouncilElected<Elected, Term> {
    fn council_elected(new_council: Elected, term: Term);
}

impl<Elected, Term> CouncilElected<Elected, Term> for () {
    fn council_elected(_new_council: Elected, _term: Term) {}
}

impl<Elected, Term, X: CouncilElected<Elected, Term>> CouncilElected<Elected, Term> for (X,) {
    fn council_elected(new_council: Elected, term: Term) {
        X::council_elected(new_council, term);
    }
}
// Chain of handlers.
impl<
        Elected: Clone,
        Term: Clone,
        X: CouncilElected<Elected, Term>,
        Y: CouncilElected<Elected, Term>,
    > CouncilElected<Elected, Term> for (X, Y)
{
    fn council_elected(new_council: Elected, term: Term) {
        X::council_elected(new_council.clone(), term.clone());
        Y::council_elected(new_council, term);
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Clone, Copy, Encode, Decode, Default)]
pub struct TransferableStake<Balance> {
    seat: Balance,
    backing: Balance,
}

// can we use a type alias to overcome name clashes of public types with other modules?
pub type ElectionStake<T> = Stake<BalanceOf<T>>;

decl_storage! {
    trait Store for Module<T: Trait> as CouncilElection {
        // Flag for wether to automatically start an election after a council term ends
        AutoStart get(auto_start) config() : bool = true;

        // Current stage if there is an election running
        Stage get(stage): Option<ElectionStage<T::BlockNumber>>;

        // The election round
        Round get(round): u32;

        ExistingStakeHolders get(existing_stake_holders): Vec<T::AccountId>;
        TransferableStakes get(transferable_stakes): map T::AccountId => TransferableStake<BalanceOf<T>>;

        Applicants get(applicants): Vec<T::AccountId>;
        ApplicantStakes get(applicant_stakes): map T::AccountId => ElectionStake<T>;

        Commitments get(commitments): Vec<T::Hash>;

        // TODO value type of this map looks scary, is there any way to simplify the notation?
        Votes get(votes): map T::Hash => SealedVote<T::AccountId, ElectionStake<T>, T::Hash, T::AccountId>;

        // Current Election Parameters.
        // Should we replace all the individual values with a single ElectionParameters type?
        // Having them individually makes it more flexible to add and remove new parameters in future
        // without dealing with migration issues.
        AnnouncingPeriod get(announcing_period): T::BlockNumber;
        VotingPeriod get(voting_period): T::BlockNumber;
        RevealingPeriod get(revealing_period): T::BlockNumber;
        CouncilSize get(council_size): u32;
        CandidacyLimit get (candidacy_limit): u32;
        MinCouncilStake get(min_council_stake): BalanceOf<T>;
        NewTermDuration get(new_term_duration): T::BlockNumber;
        MinVotingStake get(min_voting_stake): BalanceOf<T>;
    }
    add_extra_genesis {
        config(election_parameters): ElectionParameters<BalanceOf<T>, T::BlockNumber>;
        build(|config: &GenesisConfig<T>| {
            config.election_parameters.ensure_valid().expect("Invalid Election Parameters");
            Module::<T>::set_verified_election_parameters(config.election_parameters);
        });
    }
}

// Event for this module.
decl_event!(
    pub enum Event<T> where
    <T as system::Trait>::BlockNumber,
    <T as system::Trait>::AccountId,
    <T as system::Trait>::Hash  {
        /// A new election started
        ElectionStarted(),
        AnnouncingStarted(u32),
        AnnouncingEnded(),
        VotingStarted(),
        VotingEnded(),
        RevealingStarted(),
        RevealingEnded(),
        CouncilElected(BlockNumber),
        Applied(AccountId),
        Voted(AccountId, Hash),
        Revealed(AccountId, Hash, AccountId),
    }
);

impl<T: Trait> Module<T> {
    // HELPERS - IMMUTABLES

    fn council_size_usize() -> usize {
        Self::council_size() as usize
    }

    fn candidacy_limit_usize() -> usize {
        Self::candidacy_limit() as usize
    }

    fn current_block_number_plus(length: T::BlockNumber) -> T::BlockNumber {
        <system::Module<T>>::block_number() + length
    }

    fn can_participate(sender: &T::AccountId) -> bool {
        !<T as GovernanceCurrency>::Currency::free_balance(sender).is_zero()
            && <membership::members::Module<T>>::is_member_account(sender)
    }

    // PUBLIC IMMUTABLES

    /// Returns true if an election is running
    pub fn is_election_running() -> bool {
        Self::stage().is_some()
    }

    /// Returns block number at which current stage will end if an election is running.
    pub fn stage_ends_at() -> Option<T::BlockNumber> {
        if let Some(stage) = Self::stage() {
            match stage {
                ElectionStage::Announcing(ends) => Some(ends),
                ElectionStage::Voting(ends) => Some(ends),
                ElectionStage::Revealing(ends) => Some(ends),
            }
        } else {
            None
        }
    }

    // PRIVATE MUTABLES

    /// Starts an election. Will fail if an election is already running
    /// Initializes transferable stakes. Assumes election parameters have already been set.
    fn start_election(current_council: Seats<T::AccountId, BalanceOf<T>>) -> Result {
        ensure!(!Self::is_election_running(), "election already in progress");
        ensure!(
            Self::existing_stake_holders().is_empty(),
            "stake holders must be empty"
        );
        ensure!(Self::applicants().is_empty(), "applicants must be empty");
        ensure!(Self::commitments().is_empty(), "commitments must be empty");

        // Take snapshot of seat and backing stakes of an existing council
        // Its important to note that the election system takes ownership of these stakes, and is responsible
        // to return any unused stake to original owners at the end of the election.
        Self::initialize_transferable_stakes(current_council);

        Self::deposit_event(RawEvent::ElectionStarted());

        Self::move_to_announcing_stage();
        Ok(())
    }

    /// Sets announcing stage. Can be called from any stage and assumes all preparatory work
    /// for entering the stage has been performed.
    /// Bumps the election round.
    fn move_to_announcing_stage() {
        let next_round = Round::mutate(|n| {
            *n += 1;
            *n
        });

        let new_stage_ends_at = Self::current_block_number_plus(Self::announcing_period());

        <Stage<T>>::put(ElectionStage::Announcing(new_stage_ends_at));

        Self::deposit_event(RawEvent::AnnouncingStarted(next_round));
    }

    /// Sets announcing stage. Can be called from any stage and assumes all preparatory work
    /// for entering the stage has been performed.
    fn move_to_voting_stage() {
        let new_stage_ends_at = Self::current_block_number_plus(Self::voting_period());

        <Stage<T>>::put(ElectionStage::Voting(new_stage_ends_at));

        Self::deposit_event(RawEvent::VotingStarted());
    }

    /// Sets announcing stage. Can be called from any stage and assumes all preparatory work
    /// for entering the stage has been performed.
    fn move_to_revealing_stage() {
        let new_stage_ends_at = Self::current_block_number_plus(Self::revealing_period());

        <Stage<T>>::put(ElectionStage::Revealing(new_stage_ends_at));

        Self::deposit_event(RawEvent::RevealingStarted());
    }

    /// Sorts applicants by stake, and returns slice of applicants with least stake. Applicants not
    /// returned in the slice are the top `len` highest staked.
    fn find_least_staked_applicants(
        applicants: &mut Vec<T::AccountId>,
        len: usize,
    ) -> &[T::AccountId] {
        if len >= applicants.len() {
            &[]
        } else {
            #[allow(clippy::redundant_closure)] // disable incorrect Clippy linter warning
            applicants.sort_by_key(|applicant| Self::applicant_stakes(applicant));
            &applicants[0..applicants.len() - len]
        }
    }

    fn on_announcing_ended() {
        let mut applicants = Self::applicants();

        if applicants.len() < Self::council_size_usize() {
            // Not enough applicants announced candidacy
            Self::move_to_announcing_stage();
        } else {
            // upper limit on applicants that will move to voting stage
            let limit = rstd::cmp::max(Self::council_size_usize(), Self::candidacy_limit_usize());
            let applicants_to_drop = Self::find_least_staked_applicants(&mut applicants, limit);

            Self::drop_applicants(applicants_to_drop);

            Self::move_to_voting_stage();
        }
    }

    fn on_voting_ended() {
        Self::move_to_revealing_stage();
    }

    fn on_revealing_ended() {
        // tally the revealed votes
        let mut votes = Vec::new();

        for commitment in Self::commitments().iter() {
            votes.push(Self::votes(commitment));
        }

        let mut new_council = Self::tally_votes(&votes);

        // Note here that applicants with zero votes dont appear in the tally.
        // Is an applicant with some votes but less total stake than another applicant with zero votes
        // more qualified to be on the council?
        // Consider implications - if a council can be formed purely by staking are we fine with that?

        for applicant in Self::applicants().iter() {
            if !new_council.contains_key(applicant) {
                new_council.insert(
                    applicant.clone(),
                    Seat {
                        member: applicant.clone(),
                        stake: Self::applicant_stakes(applicant).total(),
                        backers: Vec::new(),
                    },
                );
            }
        }

        match new_council.len() {
            ncl if ncl == Self::council_size_usize() => {
                // all applicants in the tally will form the new council
            }
            ncl if ncl > Self::council_size_usize() => {
                // we have more than enough applicants to form the new council.
                // select top staked
                Self::filter_top_staked(&mut new_council, Self::council_size_usize());
            }
            _ => {
                // Not enough applicants with votes to form a council.
                // This may happen if we didn't add applicants with zero votes to the tally,
                // or in future if we allow applicants to withdraw candidacy during voting or revealing stages.
                // or council size was increased during voting, revealing stages.
            }
        }

        // unless we want to add more filtering criteria to what is considered a successful election
        // other than just the minimum stake for candidacy, we have a new council!

        Self::teardown_election(
            &votes,
            &new_council,
            true, /* unlock transferable stakes */
        );

        let new_council = new_council.into_iter().map(|(_, seat)| seat).collect();
        T::CouncilElected::council_elected(new_council, Self::new_term_duration());

        Self::deposit_event(RawEvent::CouncilElected(<system::Module<T>>::block_number()));
    }

    fn teardown_election(
        votes: &[SealedVote<T::AccountId, Stake<BalanceOf<T>>, T::Hash, T::AccountId>],
        new_council: &BTreeMap<T::AccountId, Seat<T::AccountId, BalanceOf<T>>>,
        unlock_ts: bool,
    ) {
        Self::refund_voting_stakes(&votes, &new_council);
        Self::clear_votes();

        Self::drop_unelected_applicants(&new_council);
        Self::clear_applicants();

        if unlock_ts {
            Self::unlock_transferable_stakes();
        }

        Self::clear_transferable_stakes();

        <Stage<T>>::kill();
    }

    fn unlock_transferable_stakes() {
        // move stakes back to account holder's free balance
        for stakeholder in Self::existing_stake_holders().iter() {
            let stake = Self::transferable_stakes(stakeholder);
            if !stake.seat.is_zero() || !stake.backing.is_zero() {
                <T as GovernanceCurrency>::Currency::unreserve(
                    stakeholder,
                    stake.seat + stake.backing,
                );
            }
        }
    }

    fn clear_transferable_stakes() {
        for stakeholder in Self::existing_stake_holders() {
            <TransferableStakes<T>>::remove(stakeholder);
        }

        <ExistingStakeHolders<T>>::kill();
    }

    fn clear_applicants() {
        for applicant in Self::applicants() {
            <ApplicantStakes<T>>::remove(applicant);
        }
        <Applicants<T>>::kill();
    }

    fn refund_applicant(applicant: &T::AccountId) {
        let stake = <ApplicantStakes<T>>::get(applicant);

        // return new stake to account's free balance
        if !stake.new.is_zero() {
            <T as GovernanceCurrency>::Currency::unreserve(applicant, stake.new);
        }

        // return unused transferable stake
        if !stake.transferred.is_zero() {
            <TransferableStakes<T>>::mutate(applicant, |transferable| {
                (*transferable).seat += stake.transferred
            });
        }
    }

    fn drop_applicants(drop: &[T::AccountId]) {
        let not_dropped: Vec<T::AccountId> = Self::applicants()
            .into_iter()
            .filter(|id| !drop.iter().any(|x| *x == *id))
            .collect();

        for applicant in drop {
            Self::refund_applicant(applicant);
            <ApplicantStakes<T>>::remove(applicant);
        }

        <Applicants<T>>::put(not_dropped);
    }

    fn drop_unelected_applicants(
        new_council: &BTreeMap<T::AccountId, Seat<T::AccountId, BalanceOf<T>>>,
    ) {
        let applicants_to_drop: Vec<T::AccountId> = Self::applicants()
            .into_iter()
            .filter(|applicant| !new_council.contains_key(&applicant))
            .collect();

        Self::drop_applicants(&applicants_to_drop[..]);
    }

    fn refund_voting_stakes(
        sealed_votes: &[SealedVote<T::AccountId, Stake<BalanceOf<T>>, T::Hash, T::AccountId>],
        new_council: &BTreeMap<T::AccountId, Seat<T::AccountId, BalanceOf<T>>>,
    ) {
        for sealed_vote in sealed_votes.iter() {
            // Do a refund if commitment was not revealed, or the vote was for applicant that did
            // not get elected to the council
            // TODO critical: shouldn't we slash the stake in such a case? This is the whole idea behid staking on something: people need to decide carefully and be responsible for their bahavior because they can loose their stake
            // See https://github.com/Joystream/substrate-node-joystream/issues/4
            let do_refund = match sealed_vote.get_vote() {
                Some(applicant) => !new_council.contains_key(&applicant),
                None => true,
            };

            if do_refund {
                // return new stake to account's free balance
                let SealedVote { voter, stake, .. } = sealed_vote;
                if !stake.new.is_zero() {
                    <T as GovernanceCurrency>::Currency::unreserve(voter, stake.new);
                }

                // return unused transferable stake
                if !stake.transferred.is_zero() {
                    <TransferableStakes<T>>::mutate(voter, |transferable| {
                        (*transferable).backing += stake.transferred
                    });
                }
            }
        }
    }

    fn clear_votes() {
        for commitment in Self::commitments() {
            <Votes<T>>::remove(commitment);
        }
        <Commitments<T>>::kill();
    }

    fn tally_votes(
        sealed_votes: &[SealedVote<T::AccountId, Stake<BalanceOf<T>>, T::Hash, T::AccountId>],
    ) -> BTreeMap<T::AccountId, Seat<T::AccountId, BalanceOf<T>>> {
        let mut tally: BTreeMap<T::AccountId, Seat<T::AccountId, BalanceOf<T>>> = BTreeMap::new();

        for sealed_vote in sealed_votes.iter() {
            if let Some(applicant) = sealed_vote.get_vote() {
                if !tally.contains_key(&applicant) {
                    // Add new seat
                    tally.insert(
                        applicant.clone(),
                        Seat {
                            member: applicant.clone(),
                            stake: Self::applicant_stakes(applicant).total(),
                            backers: vec![],
                        },
                    );
                }
                if let Some(seat) = tally.get_mut(&applicant) {
                    // Add backer to existing seat
                    seat.backers.push(Backer {
                        member: sealed_vote.voter.clone(),
                        stake: sealed_vote.stake.total(),
                    });
                }
            }
        }

        tally
    }

    fn filter_top_staked(
        tally: &mut BTreeMap<T::AccountId, Seat<T::AccountId, BalanceOf<T>>>,
        limit: usize,
    ) {
        if limit >= tally.len() {
            return;
        }

        // use ordering in the applicants vector (not ordering resulting from btreemap iteration)
        let mut seats: Vec<T::AccountId> = Self::applicants()
            .into_iter()
            .filter(|id| tally.contains_key(id))
            .collect();

        // ensure_eq!(seats.len(), tally.len());

        if limit >= seats.len() {
            // Tally is inconsistent with list of applicants!
            return;
        }

        // TODO: order by number of votes, then number of backers

        seats.sort_by_key(|applicant| {
            tally
                .get(&applicant)
                .map_or(Zero::zero(), |seat| seat.calc_total_stake())
        });

        // seats at bottom of list
        let filtered_out_seats = &seats[0..seats.len() - limit];

        for id in filtered_out_seats {
            tally.remove(id);
        }
    }

    /// Checks if the current election stage has ended and calls the stage ended handler
    fn check_if_stage_is_ending(now: T::BlockNumber) {
        if let Some(stage) = Self::stage() {
            match stage {
                ElectionStage::Announcing(ends) => {
                    if ends == now {
                        Self::deposit_event(RawEvent::AnnouncingEnded());
                        Self::on_announcing_ended();
                    }
                }
                ElectionStage::Voting(ends) => {
                    if ends == now {
                        Self::deposit_event(RawEvent::VotingEnded());
                        Self::on_voting_ended();
                    }
                }
                ElectionStage::Revealing(ends) => {
                    if ends == now {
                        Self::deposit_event(RawEvent::RevealingEnded());
                        Self::on_revealing_ended();
                    }
                }
            }
        }
    }

    /// Takes a snapshot of the stakes from the current council
    fn initialize_transferable_stakes(current_council: Seats<T::AccountId, BalanceOf<T>>) {
        let mut stakeholder_accounts: Vec<T::AccountId> = Vec::new();

        for seat in current_council.into_iter() {
            let Seat { member, stake, .. } = seat;

            if <TransferableStakes<T>>::exists(&member) {
                <TransferableStakes<T>>::mutate(&member, |transferbale_stake| {
                    *transferbale_stake = TransferableStake {
                        seat: transferbale_stake.seat + stake,
                        backing: transferbale_stake.backing,
                    }
                });
            } else {
                <TransferableStakes<T>>::insert(
                    &member,
                    TransferableStake {
                        seat: stake,
                        backing: BalanceOf::<T>::zero(),
                    },
                );

                stakeholder_accounts.push(member);
            }

            for backer in seat.backers.into_iter() {
                let Backer { member, stake, .. } = backer;

                if <TransferableStakes<T>>::exists(&member) {
                    <TransferableStakes<T>>::mutate(&member, |transferbale_stake| {
                        *transferbale_stake = TransferableStake {
                            seat: transferbale_stake.seat,
                            backing: transferbale_stake.backing + stake,
                        }
                    });
                } else {
                    <TransferableStakes<T>>::insert(
                        &member,
                        TransferableStake {
                            seat: BalanceOf::<T>::zero(),
                            backing: stake,
                        },
                    );

                    stakeholder_accounts.push(member);
                }
            }
        }

        <ExistingStakeHolders<T>>::put(stakeholder_accounts);
    }

    fn new_stake_reusing_transferable(
        transferable: &mut BalanceOf<T>,
        new_stake: BalanceOf<T>,
    ) -> Stake<BalanceOf<T>> {
        let transferred = if *transferable >= new_stake {
            new_stake
        } else {
            *transferable
        };

        *transferable -= transferred;

        Stake {
            new: new_stake - transferred,
            transferred,
        }
    }

    fn try_add_applicant(applicant: T::AccountId, stake: BalanceOf<T>) -> Result {
        let mut transferable_stake = <TransferableStakes<T>>::get(&applicant);

        let new_stake = Self::new_stake_reusing_transferable(&mut transferable_stake.seat, stake);

        ensure!(
            <T as GovernanceCurrency>::Currency::can_reserve(&applicant, new_stake.new),
            "not enough free balance to reserve"
        );

        ensure!(
            <T as GovernanceCurrency>::Currency::reserve(&applicant, new_stake.new).is_ok(),
            "failed to reserve applicant stake!"
        );

        let applicant_stake = <ApplicantStakes<T>>::get(&applicant);
        let total_stake = applicant_stake.add(&new_stake);

        if <TransferableStakes<T>>::exists(&applicant) {
            <TransferableStakes<T>>::insert(&applicant, transferable_stake);
        }

        if !<ApplicantStakes<T>>::exists(&applicant) {
            // insert element at the begining, this gives priority to early applicants
            // when ordering applicants by stake if stakes are equal
            <Applicants<T>>::mutate(|applicants| applicants.insert(0, applicant.clone()));
        }

        <ApplicantStakes<T>>::insert(applicant, total_stake);

        Ok(())
    }

    fn try_add_vote(voter: T::AccountId, stake: BalanceOf<T>, commitment: T::Hash) -> Result {
        ensure!(!<Votes<T>>::exists(commitment), "duplicate commitment");

        let mut transferable_stake = <TransferableStakes<T>>::get(&voter);

        let vote_stake =
            Self::new_stake_reusing_transferable(&mut transferable_stake.backing, stake);

        ensure!(
            <T as GovernanceCurrency>::Currency::can_reserve(&voter, vote_stake.new),
            "not enough free balance to reserve"
        );

        ensure!(
            <T as GovernanceCurrency>::Currency::reserve(&voter, vote_stake.new).is_ok(),
            "failed to reserve voting stake!"
        );

        <Commitments<T>>::mutate(|commitments| commitments.push(commitment));

        <Votes<T>>::insert(
            commitment,
            SealedVote::new(voter.clone(), vote_stake, commitment),
        );

        if <TransferableStakes<T>>::exists(&voter) {
            <TransferableStakes<T>>::insert(&voter, transferable_stake);
        }

        Ok(())
    }

    fn try_reveal_vote(
        voter: T::AccountId,
        commitment: T::Hash,
        vote_for: T::AccountId,
        salt: Vec<u8>,
    ) -> Result {
        ensure!(<Votes<T>>::exists(&commitment), "commitment not found");

        let mut sealed_vote = <Votes<T>>::get(&commitment);

        ensure!(sealed_vote.is_not_revealed(), "vote already revealed");
        // only voter can reveal their own votes
        ensure!(sealed_vote.is_owned_by(voter), "only voter can reveal vote");
        ensure!(
            <ApplicantStakes<T>>::exists(&vote_for),
            "vote for non-applicant not allowed"
        );

        let mut salt = salt;

        // Tries to unseal, if salt is invalid will return error
        sealed_vote.unseal(vote_for, &mut salt, <T as system::Trait>::Hashing::hash)?;

        // Update the revealed vote
        <Votes<T>>::insert(commitment, sealed_vote);

        Ok(())
    }

    fn set_verified_election_parameters(params: ElectionParameters<BalanceOf<T>, T::BlockNumber>) {
        <AnnouncingPeriod<T>>::put(params.announcing_period);
        <VotingPeriod<T>>::put(params.voting_period);
        <RevealingPeriod<T>>::put(params.revealing_period);
        <MinCouncilStake<T>>::put(params.min_council_stake);
        <NewTermDuration<T>>::put(params.new_term_duration);
        CouncilSize::put(params.council_size);
        CandidacyLimit::put(params.candidacy_limit);
        <MinVotingStake<T>>::put(params.min_voting_stake);
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        // No origin so this is a priviledged call
        fn on_finalize(now: T::BlockNumber) {
            Self::check_if_stage_is_ending(now);
        }

        // Member can apply during announcing stage only. On first call a minimum stake will need to be provided.
        // Member can make subsequent calls during announcing stage to increase their stake.
        fn apply(origin, stake: BalanceOf<T>) {
            let sender = ensure_signed(origin)?;
            ensure!(Self::can_participate(&sender), "Only members can apply to be on council");

            let stage = Self::stage();
            ensure!(Self::stage().is_some(), "election not running");

            let is_announcing = match stage.unwrap() {
                ElectionStage::Announcing(_) => true,
                _ => false
            };
            ensure!(is_announcing, "election not in announcing stage");

            // minimum stake on first attempt to apply
            if !<ApplicantStakes<T>>::exists(&sender) {
                ensure!(stake >= Self::min_council_stake(), "minimum stake must be provided");
            }

            Self::try_add_applicant(sender.clone(), stake)?;

            Self::deposit_event(RawEvent::Applied(sender));
        }

        fn vote(origin, commitment: T::Hash, stake: BalanceOf<T>) {
            let sender = ensure_signed(origin)?;
            ensure!(Self::can_participate(&sender), "Only members can vote for an applicant");

            let stage = Self::stage();
            ensure!(Self::stage().is_some(), "election not running");

            let is_voting = match stage.unwrap() {
                ElectionStage::Voting(_) => true,
                _ => false
            };
            ensure!(is_voting, "election not in voting stage");

            ensure!(stake >= Self::min_voting_stake(), "voting stake too low");
            Self::try_add_vote(sender.clone(), stake, commitment)?;
            Self::deposit_event(RawEvent::Voted(sender, commitment));
        }

        fn reveal(origin, commitment: T::Hash, vote: T::AccountId, salt: Vec<u8>) {
            let sender = ensure_signed(origin)?;

            ensure!(salt.len() <= 32, "salt too large"); // at most 256 bits salt

            let stage = Self::stage();
            ensure!(Self::stage().is_some(), "election not running");

            let is_revealing = match stage.unwrap() {
                ElectionStage::Revealing(_) => true,
                _ => false
            };
            ensure!(is_revealing, "election not in revealing stage");

            Self::try_reveal_vote(sender.clone(), commitment, vote.clone(), salt)?;
            Self::deposit_event(RawEvent::Revealed(sender, commitment, vote));
        }

        fn set_stage_announcing(origin, ends_at: T::BlockNumber) {
            ensure_root(origin)?;
            ensure!(ends_at > <system::Module<T>>::block_number(), "must end at future block number");
            <Stage<T>>::put(ElectionStage::Announcing(ends_at));
        }

        fn set_stage_revealing(origin, ends_at: T::BlockNumber) {
            ensure_root(origin)?;
            ensure!(ends_at > <system::Module<T>>::block_number(), "must end at future block number");
            <Stage<T>>::put(ElectionStage::Revealing(ends_at));
        }

        fn set_stage_voting(origin, ends_at: T::BlockNumber) {
            ensure_root(origin)?;
            ensure!(ends_at > <system::Module<T>>::block_number(), "must end at future block number");
            <Stage<T>>::put(ElectionStage::Voting(ends_at));
        }

        /// Sets new election parameters. Some combination of parameters that are not desirable, so
        /// the parameters are checked for validity.
        /// The call will fail if an election is in progress. If a council is not being elected for some
        /// reaon after multiple rounds, force_stop_election() can be called to stop elections and followed by
        /// set_election_parameters().
        pub fn set_election_parameters(origin, params: ElectionParameters<BalanceOf<T>, T::BlockNumber>) {
            ensure_root(origin)?;
            ensure!(!Self::is_election_running(), MSG_CANNOT_CHANGE_PARAMS_DURING_ELECTION);
            params.ensure_valid()?;
            Self::set_verified_election_parameters(params);
        }

        fn force_stop_election(origin) {
            ensure_root(origin)?;
            ensure!(Self::is_election_running(), "only running election can be stopped");

            let mut votes = Vec::new();
            for commitment in Self::commitments() {
                votes.push(Self::votes(commitment));
            }

            // no council gets elected
            let empty_council = BTreeMap::new();

            Self::teardown_election (
                &votes,
                &empty_council,
                false /* do not unlock transferable stakes */
            );
        }

        fn force_start_election(origin) {
            ensure_root(origin)?;
            Self::start_election(<council::Module<T>>::active_council())?;
        }

        fn set_auto_start (origin, flag: bool) {
            ensure_root(origin)?;
            AutoStart::put(flag);
        }

    }
}

impl<T: Trait> council::CouncilTermEnded for Module<T> {
    fn council_term_ended() {
        if Self::auto_start() {
            let _ = Self::start_election(<council::Module<T>>::active_council());
        }
    }
}
