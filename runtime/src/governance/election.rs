#![cfg_attr(not(feature = "std"), no_std)]

use srml_support::{StorageValue, StorageMap, dispatch::Result};
use runtime_primitives::traits::{Hash, As, Zero, SimpleArithmetic};
use {balances, system::{ensure_signed}};

use rstd::collections::btree_map::BTreeMap;
use rstd::ops::Add;
use rstd::vec::Vec;

use super::transferable_stake::Stake;
use super::sealed_vote::SealedVote;

pub trait Trait: system::Trait + balances::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type CouncilElected: CouncilElected<Seats<Self::AccountId, Self::Balance>, Self::BlockNumber>;
}

#[derive(Clone, Copy, Encode, Decode)]
pub enum ElectionStage<BlockNumber> {
    Announcing(BlockNumber),
    Voting(BlockNumber),
    Revealing(BlockNumber),
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Seat<Id, Stake> {
    pub member: Id,
    pub stake: Stake,
    pub backers: Vec<Backer<Id, Stake>>,
}

impl<Id, Stake> Seat<Id, Stake>
    where Stake: Add<Output=Stake> + Copy,
{
    pub fn calc_total_stake(&self) -> Stake {
        self.backers.iter().fold(self.stake, |acc, backer| acc + backer.stake)
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Backer<Id, Stake> {
    pub member: Id,
    pub stake: Stake,
}

pub type Seats<AccountId, Balance> = Vec<Seat<AccountId, Balance>>;

// Hook for setting a new council when it is elected
pub trait CouncilElected<Elected, Term> {
    fn council_elected(new_council: Elected, term: Term);
}

impl<Elected, Term> CouncilElected<Elected, Term> for () {
    fn council_elected(_new_council: Elected, term: Term) {}
}

impl<Elected, Term, X: CouncilElected<Elected, Term>> CouncilElected<Elected, Term> for (X,) {
    fn council_elected(new_council: Elected, term: Term) {
        X::council_elected(new_council, term);
    }
}

// Hook For starting election
pub trait TriggerElection<CurrentCouncil, Params> {
    fn trigger_election(current: Option<CurrentCouncil>, params: Params) -> Result;
}

impl<CurrentCouncil, Params> TriggerElection<CurrentCouncil, Params> for () {
    fn trigger_election(_: Option<CurrentCouncil>, _: Params) -> Result { Ok(())}
}

impl<CurrentCouncil, Params, X: TriggerElection<CurrentCouncil, Params>> TriggerElection<CurrentCouncil, Params> for (X,) {
    fn trigger_election(current: Option<CurrentCouncil>, params: Params) -> Result{
        X::trigger_election(current, params)
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Clone, Copy, Encode, Decode)]
pub struct ElectionParameters<BlockNumber, Balance> {
    pub announcing_period: BlockNumber,
    pub voting_period: BlockNumber,
    pub revealing_period: BlockNumber,
    pub council_size: u32,
    pub candidacy_limit_multiple: u32,
    pub min_council_stake: Balance,
    pub new_term_duration: BlockNumber,
}

impl<BlockNumber, Balance> Default for ElectionParameters<BlockNumber, Balance>
    where BlockNumber: SimpleArithmetic, Balance: SimpleArithmetic
{
    fn default() -> Self {
        Self {
            announcing_period: BlockNumber::sa(100),
            voting_period: BlockNumber::sa(100),
            revealing_period: BlockNumber::sa(100),
            council_size: 10,
            candidacy_limit_multiple: 2,
            min_council_stake: Balance::sa(100),
            new_term_duration: BlockNumber::sa(1000),
        }
    }
}

decl_storage! {
    trait Store for Module<T: Trait> as CouncilElection {

        // TODO a good practice to keep similar names for both storage and its getter, examples:
        // Stage get(stage)
        // ElectionStage get(election_stage)
        // BackingStakeHolders get(backing_stake_holders) ...
        // AvailableBackingStakes get(available_backing_stakes) ...

        // Current stage if there is an election ongoing
        Stage get(stage): Option<ElectionStage<T::BlockNumber>>;

        // The election round
        Round get(round): u32;

        BackingStakeHolders get(backing_stakeholders): Vec<T::AccountId>;
        CouncilStakeHolders get(council_stakeholders): Vec<T::AccountId>;

        // TODO Could these two maps can be merged into one?
        // If yes, then it will simplify/generalize other code where they are used.
        AvailableBackingStakesMap get(backing_stakes): map T::AccountId => T::Balance;
        AvailableCouncilStakesMap get(council_stakes): map T::AccountId => T::Balance;

        Applicants get(applicants): Vec<T::AccountId>;
        ApplicantStakes get(applicant_stakes): map T::AccountId => Stake<T::Balance>;

        Commitments get(commitments): Vec<T::Hash>;
        // simply a Yes vote for a candidate. Consider changing the vote payload to support
        // For and Against.
        // TODO value type of this map looks scary, is there any way to simplify the notation?
        Votes get(votes): map T::Hash => SealedVote<T::AccountId, Stake<T::Balance>, T::Hash, T::AccountId>;

        // Parameters election. Set when a new election is started
        AnnouncingPeriod get(announcing_period): T::BlockNumber;
        VotingPeriod get(voting_period): T::BlockNumber;
        RevealingPeriod get(revealing_period): T::BlockNumber;
        CouncilSize get(council_size): u32;
        CandidacyLimitMultiple get (candidacy_limit_multiple): u32;
        MinCouncilStake get(min_council_stake): T::Balance;
        NewTermDuration get(new_term_duration): T::BlockNumber;
    }
}

/// Event for this module.
decl_event!(
    pub enum Event<T> where <T as system::Trait>::BlockNumber {
        /// A new election started
        AnnouncingStarted(u32),
        AnnouncingEnded(),
        VotingStarted(),
        VotingEnded(),
        RevealingStarted(),
        RevealingEnded(),
        CouncilElected(),
        Dummy(BlockNumber),
    }
);

impl<T: Trait> TriggerElection<Seats<T::AccountId, T::Balance>, ElectionParameters<T::BlockNumber, T::Balance>> for Module<T> {
    fn trigger_election(
        current_council: Option<Seats<T::AccountId, T::Balance>>,
        params: ElectionParameters<T::BlockNumber, T::Balance>) -> Result
    {
        ensure!(!Self::is_election_running(), "Election already running");

        Self::set_election_parameters(params);
        Self::start_election(current_council)
    }
}

impl<T: Trait> Module<T> {
    fn council_size_usize() -> usize {
        Self::council_size() as usize
    }

    fn candidacy_limit_multiple_usize() -> usize {
        Self::candidacy_limit_multiple() as usize
    }

    fn set_election_parameters(params: ElectionParameters<T::BlockNumber, T::Balance>) {
        <AnnouncingPeriod<T>>::put(params.announcing_period);
        <VotingPeriod<T>>::put(params.voting_period);
        <RevealingPeriod<T>>::put(params.revealing_period);
        <CouncilSize<T>>::put(params.council_size);
        <MinCouncilStake<T>>::put(params.min_council_stake);
        <NewTermDuration<T>>::put(params.new_term_duration);
        <CandidacyLimitMultiple<T>>::put(params.candidacy_limit_multiple);
    }

    pub fn is_election_running() -> bool {
        Self::stage().is_some()
    }

    fn start_election(current_council: Option<Seats<T::AccountId, T::Balance>>) -> Result {
        ensure!(!Self::is_election_running(), "election already in progress");

        // take snapshot of council and backing stakes of an existing council
        current_council.map(|c| Self::initialize_transferable_stakes(c));

        Self::move_to_announcing_stage();
        Ok(())
    }

    fn new_period(length: T::BlockNumber) -> T::BlockNumber {
        <system::Module<T>>::block_number() + length
    }

    fn bump_round() -> u32 {
        <Round<T>>::mutate(|n| {
            *n += 1;
            *n
        })
    }

    fn move_to_announcing_stage() -> T::BlockNumber {
        let period = Self::new_period(Self::announcing_period());

        <Stage<T>>::put(ElectionStage::Announcing(period));

        let next_round = Self::bump_round();

        Self::deposit_event(RawEvent::AnnouncingStarted(next_round));

        period
    }

    /// Sorts applicants by stake, and returns slice of applicants with least stake. Applicants not
    /// returned in the slice are the top `len` highest staked.
    fn find_least_staked_applicants (
        applicants: &mut Vec<T::AccountId>,
        len: usize) -> &[T::AccountId]
    {
        if len >= applicants.len() {
            &[]
        } else {
            applicants.sort_by_key(|applicant| Self::applicant_stakes(applicant));
            &applicants[0 .. applicants.len() - len]
        }
    }

    fn on_announcing_ended() {
        let mut applicants = Self::applicants();

        if applicants.len() < Self::council_size_usize() {
            // Not enough candidates announced candidacy
            Self::move_to_announcing_stage();
        } else {
            // upper limit on applicants that will move to voting stage
            let multiple = rstd::cmp::max(1, Self::candidacy_limit_multiple_usize());
            let candidacy_limit = Self::council_size_usize() * multiple;
            let applicants_to_drop = Self::find_least_staked_applicants(&mut applicants, candidacy_limit);

            Self::drop_applicants(applicants_to_drop);

            Self::move_to_voting_stage();
        }
    }

    fn move_to_voting_stage() {
        // TODO check that current stage is Announcing
        let period = Self::new_period(Self::voting_period());

        <Stage<T>>::put(ElectionStage::Voting(period));

        Self::deposit_event(RawEvent::VotingStarted());
    }

    fn on_voting_ended() {
        Self::move_to_revealing_stage();
    }

    fn move_to_revealing_stage() {
        // TODO check that current stage is Voting
        let period = Self::new_period(Self::revealing_period());

        <Stage<T>>::put(ElectionStage::Revealing(period));

        Self::deposit_event(RawEvent::RevealingStarted());
    }

    fn on_revealing_ended() {
        // tally the revealed votes
        let mut votes = Vec::new();

        for commitment in Self::commitments().iter() {
            votes.push(Self::votes(commitment));
        }

        let mut new_council = Self::tally_votes(&votes);

        // Note here that candidates with zero votes have been excluded from the tally.
        // Is a candidate with some votes but less total stake than another candidate with zero votes
        // more qualified to be on the council?
        // Consider implications - if a council can be formed purely by staking are we fine with that?

        for applicant in Self::applicants().iter() {
            if !new_council.contains_key(applicant) {
                new_council.insert(applicant.clone(), Seat {
                    member: applicant.clone(),
                    stake: Self::applicant_stakes(applicant).total(),
                    backers: Vec::new(),
                });
            }
        }

        if new_council.len() == Self::council_size_usize() {
            // all candidates in the tally will form the new council
        } else if new_council.len() > Self::council_size_usize() {
            // we have more than enough elected candidates to form the new council
            // select top staked prioritised by stake
            Self::filter_top_staked(&mut new_council, Self::council_size_usize());
        } else {
            // Not enough candidates with votes to form a council.
            // This may happen if we didn't add candidates with zero votes to the tally,
            // or in future if we allow candidates to withdraw candidacy during voting or revealing stages.
            // Solution 1. Restart election.
            // Solution 2. Add to the tally candidates with zero votes.
            //      selection criteria:
            //          -> priority by largest stake?
            //          -> priority given to candidates who announced first?
            //          -> deterministic random selection?
        }

        // unless we want to add more filtering criteria to what is considered a successful election
        // other than just the minimum stake for candidacy, we have a new council!

        Self::refund_voting_stakes(&votes, &new_council);
        Self::clear_votes();

        // TODO consider consistent naming: candidates vs applicants. Different names for the same things?
        Self::drop_unelected_candidates(&new_council);
        Self::clear_applicants();

        Self::refund_transferable_stakes();
        Self::clear_transferable_stakes();

        <Stage<T>>::kill();

        let new_council = new_council.into_iter().map(|(_, seat)| seat.clone()).collect();
        T::CouncilElected::council_elected(new_council, Self::new_term_duration());

        Self::deposit_event(RawEvent::CouncilElected());
    }

    fn refund_transferable_stakes() {
        // move stakes back to account holder's free balance
        for stakeholder in Self::backing_stakeholders().iter() {
            let stake = Self::backing_stakes(stakeholder);
            if !stake.is_zero() {
                let balance = <balances::Module<T>>::free_balance(stakeholder);
                <balances::Module<T>>::set_free_balance(stakeholder, balance + stake);
            }
        }

        for stakeholder in Self::council_stakeholders().iter() {
            let stake = Self::council_stakes(stakeholder);
            if !stake.is_zero() {
                let balance = <balances::Module<T>>::free_balance(stakeholder);
                <balances::Module<T>>::set_free_balance(stakeholder, balance + stake);
            }
        }
    }

    fn clear_transferable_stakes() {
        for stakeholder in Self::backing_stakeholders() {
            <AvailableBackingStakesMap<T>>::remove(stakeholder);
        }

        for stakeholder in Self::council_stakeholders() {
            <AvailableCouncilStakesMap<T>>::remove(stakeholder);
        }

        <BackingStakeHolders<T>>::kill();
        <CouncilStakeHolders<T>>::kill();
    }

    fn clear_applicants() {
        for applicant in Self::applicants() {
            <ApplicantStakes<T>>::remove(applicant);
        }
        <Applicants<T>>::put(vec![]);
    }

    fn refund_applicant(applicant: &T::AccountId) {
        let stake = <ApplicantStakes<T>>::get(applicant);

        // return refundable stake to account's free balance
        if !stake.refundable.is_zero() {
            let balance = <balances::Module<T>>::free_balance(applicant);
            <balances::Module<T>>::set_free_balance(applicant, balance + stake.refundable);
        }

        // return unused transferable stake
        if !stake.transferred.is_zero() {
            <AvailableCouncilStakesMap<T>>::mutate(applicant, |transferred_stake| *transferred_stake += stake.transferred);
        }
    }

    fn drop_applicants(drop: &[T::AccountId]) {
        let not_dropped: Vec<T::AccountId> = Self::applicants().into_iter()
            .filter(|id| !drop.iter().any(|x| *x == *id))
            .collect();

        for applicant in drop {
            Self::refund_applicant(applicant);
            <ApplicantStakes<T>>::remove(applicant);
        }

        <Applicants<T>>::put(not_dropped);
    }

    // TODO consider consistent naming: candidates vs applicants. Different names for the same things?
    fn drop_unelected_candidates(new_council: &BTreeMap<T::AccountId, Seat<T::AccountId, T::Balance>>) {
        let applicants_to_drop: Vec<T::AccountId> = Self::applicants().into_iter()
            .filter(|applicant| !new_council.contains_key(&applicant))
            .collect();

        Self::drop_applicants(&applicants_to_drop[..]);
    }

    fn refund_voting_stakes(
        sealed_votes: &Vec<SealedVote<T::AccountId, Stake<T::Balance>, T::Hash, T::AccountId>>,
        new_council: &BTreeMap<T::AccountId, Seat<T::AccountId, T::Balance>>)
    {
        for sealed_vote in sealed_votes.iter() {
            // Do a refund if commitment was not revealed or vote was for candidate that did
            // not get elected to the council
            // TODO critical: shouldn't we slash the stake in such a case? This is the whole idea behid staking on something: people need to decide carefully and be responsible for their bahavior because they can loose their stake
            // See https://github.com/Joystream/substrate-node-joystream/issues/4
            let do_refund = match sealed_vote.get_vote() {
                Some(candidate) => !new_council.contains_key(&candidate),
                None => true
            };

            if do_refund {
                // return refundable stake to account's free balance
                let SealedVote { voter, stake, .. } = sealed_vote;
                if !stake.refundable.is_zero() {
                    let balance = <balances::Module<T>>::free_balance(voter);
                    <balances::Module<T>>::set_free_balance(voter, balance + stake.refundable);
                }

                // return unused transferable stake
                if !stake.transferred.is_zero() {
                    <AvailableBackingStakesMap<T>>::mutate(voter, |transferred_stake| *transferred_stake += stake.transferred);
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

    fn tally_votes(sealed_votes: &Vec<SealedVote<T::AccountId, Stake<T::Balance>, T::Hash, T::AccountId>>) -> BTreeMap<T::AccountId, Seat<T::AccountId, T::Balance>> {
        let mut tally: BTreeMap<T::AccountId, Seat<T::AccountId, T::Balance>> = BTreeMap::new();

        for sealed_vote in sealed_votes.iter() {
            if let Some(candidate) = sealed_vote.get_vote() {
                if !tally.contains_key(&candidate) {
                    // Add new seat
                    tally.insert(candidate.clone(), Seat {
                        member: candidate.clone(),
                        stake: Self::applicant_stakes(candidate).total(),
                        backers: vec![],
                    });
                }
                if let Some(seat) = tally.get_mut(&candidate) {
                    // Add backer to existing seat
                    seat.backers.push(Backer {
                        member: sealed_vote.voter.clone(),
                        stake: sealed_vote.stake.total()
                    });
                }
            }
        }

        tally
    }

    fn filter_top_staked(tally: &mut BTreeMap<T::AccountId, Seat<T::AccountId, T::Balance>>, limit: usize) {

        if limit >= tally.len() {
            return;
        }

        // use ordering in the applicants vector (not ordering resulting from btreemap iteration)
        let mut seats: Vec<T::AccountId> = Self::applicants().into_iter()
            .filter(|id| tally.contains_key(id)).collect();

        // ensure_eq!(seats.len(), tally.len());

        if limit >= seats.len() {
            // Tally is inconsistent with list of candidates!
            return;
        }

        // TODO: order by number of votes, then number of backers

        seats.sort_by_key(|applicant| {
            tally.get(&applicant).map_or(Zero::zero(), |seat| seat.calc_total_stake())
        });

        // seats at bottom of list
        let filtered_out_seats = &seats[0 .. seats.len() - limit];

        for id in filtered_out_seats {
            tally.remove(id);
        }
    }

    fn check_if_stage_is_ending(now: T::BlockNumber) {
        if let Some(stage) = Self::stage() {
            match stage {
                ElectionStage::Announcing(ends) => if ends == now {
                    Self::deposit_event(RawEvent::AnnouncingEnded());
                    Self::on_announcing_ended();
                },
                ElectionStage::Voting(ends) => if ends == now {
                    Self::deposit_event(RawEvent::VotingEnded());
                    Self::on_voting_ended();
                },
                ElectionStage::Revealing(ends) => if ends == now {
                    Self::deposit_event(RawEvent::RevealingEnded());
                    Self::on_revealing_ended();
                },
            }
        }
    }

    /// Takes a snapshot of the stakes from the current council
    fn initialize_transferable_stakes(current_council: Seats<T::AccountId, T::Balance>) {
        let mut council_accounts: Vec<T::AccountId> = Vec::new();
        let mut backer_accounts: Vec<T::AccountId> = Vec::new();
        for ref seat in current_council.iter() {
            let id = seat.member.clone();
            <AvailableCouncilStakesMap<T>>::insert(&id, seat.stake);
            council_accounts.push(id);
            for ref backer in seat.backers.iter() {
                let id = backer.member.clone();
                if !<AvailableBackingStakesMap<T>>::exists(&id) {
                    <AvailableBackingStakesMap<T>>::insert(&id, backer.stake);
                    backer_accounts.push(id);
                } else {
                    <AvailableBackingStakesMap<T>>::mutate(&backer.member, |stake| *stake += backer.stake);
                }
            }
        }

        <CouncilStakeHolders<T>>::put(council_accounts);
        <BackingStakeHolders<T>>::put(backer_accounts);
    }

    fn try_add_applicant(applicant: T::AccountId, stake: T::Balance) -> Result {
        let applicant_stake = match <ApplicantStakes<T>>::exists(&applicant) {
            false => Default::default(), //zero
            true => <ApplicantStakes<T>>::get(&applicant)
        };

        let applicant_has_council_stake = <AvailableCouncilStakesMap<T>>::exists(&applicant);
        let transferable_stake = match applicant_has_council_stake {
            false => Default::default(), //zero
            true => <AvailableCouncilStakesMap<T>>::get(&applicant)
        };

        // TODO: notice: next ~20 lines look similar to what we have in `try_add_vote`. Consider refactoring
        let mut new_stake: Stake<T::Balance> = Default::default();

        new_stake.transferred =
            if transferable_stake >= stake {
                stake
            } else {
                transferable_stake
            };

        new_stake.refundable = stake - new_stake.transferred;

        let balance = <balances::Module<T>>::free_balance(&applicant);

        // TODO use `ensure!()` instead
        if new_stake.refundable > balance {
            return Err("not enough balance to cover stake");
        }

        let total_stake = applicant_stake.add(&new_stake);

        // TODO use `ensure!()` instead
        if Self::min_council_stake() > total_stake.total() {
            return Err("minimum stake not met");
        }

        // TODO use `ensure!()` instead
        if <balances::Module<T>>::decrease_free_balance(&applicant, new_stake.refundable).is_err() {
            return Err("failed to update balance");
        }

        if applicant_has_council_stake {
            <AvailableCouncilStakesMap<T>>::insert(&applicant, transferable_stake - new_stake.transferred);
        }

        if !<ApplicantStakes<T>>::exists(&applicant) {
            // insert element at the begining, this gives priority to early applicants
            // when its comes to selecting candidates if stakes are equal
            <Applicants<T>>::mutate(|applicants| applicants.insert(0, applicant.clone()));
        }

        <ApplicantStakes<T>>::insert(applicant.clone(), total_stake);

        Ok(())
    }

    fn try_add_vote(voter: T::AccountId, stake: T::Balance, commitment: T::Hash) -> Result {
        // TODO use `ensure!()` instead
        if <Votes<T>>::exists(commitment) {
            return Err("duplicate commitment");
        }

        let voter_has_backing_stake = <AvailableBackingStakesMap<T>>::exists(&voter);

        let transferable_stake: T::Balance = match voter_has_backing_stake {
            false => Default::default(), //zero
            true => <AvailableBackingStakesMap<T>>::get(&voter)
        };

        // TODO: notice: next ~20 lines look similar to what we have in `try_add_aaplicant`. Consider refactoring
        let mut vote_stake: Stake<T::Balance> = Default::default();

        vote_stake.transferred =
            if transferable_stake >= stake {
                stake
            } else {
                transferable_stake
            };

        vote_stake.refundable = stake - vote_stake.transferred;

        let balance = <balances::Module<T>>::free_balance(&voter);

        // TODO use `ensure!()` instead
        if vote_stake.refundable > balance {
            return Err("not enough balance to cover voting stake");
        }

        // TODO use `ensure!()` instead
        if <balances::Module<T>>::decrease_free_balance(&voter, vote_stake.refundable).is_err() {
            return Err("failed to update balance");
        }

        <Commitments<T>>::mutate(|commitments| commitments.push(commitment));

        <Votes<T>>::insert(commitment, SealedVote::new(voter.clone(), vote_stake, commitment));

        if voter_has_backing_stake {
            <AvailableBackingStakesMap<T>>::insert(voter.clone(), transferable_stake - vote_stake.transferred);
        }

        Ok(())
    }

    fn try_reveal_vote(voter: T::AccountId, commitment: T::Hash, candidate: T::AccountId, salt: Vec<u8>) -> Result {
        // TODO use `ensure!()` instead
        if !<ApplicantStakes<T>>::exists(&candidate) {
            return Err("vote for non-candidate not allowed");
        }

        // TODO use `ensure!()` instead
        if !<Votes<T>>::exists(&commitment) {
            return Err("commitment not found");
        }

        let mut sealed_vote = <Votes<T>>::get(&commitment);

        // only voter can reveal their own votes
        // TODO use `ensure!()` instead
        if !sealed_vote.owned_by(voter) {
            return Err("only voter can reveal vote");
        }

        let mut salt = salt.clone();
        let is_salt_valid = sealed_vote.unseal(candidate, &mut salt, <T as system::Trait>::Hashing::hash)?;
        if is_salt_valid {
            // update the sealed vote
            <Votes<T>>::insert(commitment, sealed_vote);
            Ok(())
        } else {
            Err("invalid salt")
        }
    }

    // TODO This method should be moved to Membership module once it's created.
    fn is_member(sender: T::AccountId) -> bool {
        !<balances::Module<T>>::free_balance(sender).is_zero()
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        // No origin so this is a priviledged call
        fn on_finalise(now: T::BlockNumber) {
            Self::check_if_stage_is_ending(now);
        }

        fn announce_candidacy(origin, stake: T::Balance) -> Result {
            let sender = ensure_signed(origin)?;
            ensure!(Self::is_member(sender.clone()), "Only members can announce their candidacy");

            // Can only announce candidacy during election announcing stage
            if let Some(stage) = Self::stage() {
                match stage {
                    ElectionStage::Announcing(_) => {
                        // TODO fail fast: ensure that stake >= min_stake
                        Self::try_add_applicant(sender, stake)
                    },
                    _ => Err("election not in announcing stage")
                }
            } else {
                Err("election not running")
            }
        }

        fn vote_for_candidate(origin, commitment: T::Hash, stake: T::Balance) -> Result {
            let sender = ensure_signed(origin)?;
            ensure!(Self::is_member(sender.clone()), "Only members can vote for a candidate");

            // Can only vote during election voting stage
            if let Some(stage) = Self::stage() {
                match stage {
                    ElectionStage::Voting(_) => {
                        // TODO fail fast: ensure that stake >= min_stake
                        Self::try_add_vote(sender, stake, commitment)
                    },
                    _ => Err("election not in voting stage")
                }
            } else {
                Err("election not running")
            }
        }

        fn reveal_vote(origin, commitment: T::Hash, vote: T::AccountId, salt: Vec<u8>) -> Result {
            let sender = ensure_signed(origin)?;

            // Can only reveal vote during election revealing stage
            if let Some(stage) = Self::stage() {
                match stage {
                    ElectionStage::Revealing(_) => Self::try_reveal_vote(sender, commitment, vote, salt),
                    _ => Err("election not in revealing stage")
                }
            } else {
                Err("election not running")
            }
        }

        // fn withdraw_candidacy()
        // fn withdraw_vote()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ::governance::tests::*;
    use parity_codec::Encode;

    #[test]
    fn check_default_params() {
        // TODO missing test implementation?
    }

    #[test]
    fn should_not_start_new_election_if_already_started() {
        with_externalities(&mut initial_test_ext(), || {
            assert_ok!(Election::start_election(None));
            assert_err!(Election::start_election(None), "election already in progress");
        });
    }

    fn assert_announcing_period(expected_period: <Test as system::Trait>::BlockNumber) {
        assert!(Election::is_election_running(), "Election Stage was not set");

        let election_stage = Election::stage().unwrap();

        match election_stage {
            election::ElectionStage::Announcing(period) => {
                assert_eq!(period, expected_period, "Election period not set correctly")
            }
            _ => {
                assert!(false, "Election Stage was not correctly set to Announcing")
            }
        }
    }

    #[test]
    fn start_election_should_work() {
        with_externalities(&mut initial_test_ext(), || {
            System::set_block_number(1);
            <AnnouncingPeriod<Test>>::put(20);
            let prev_round = Election::round();

            assert_ok!(Election::start_election(None));

            // election round is bumped
            assert_eq!(Election::round(), prev_round + 1);

            // we enter the announcing stage for a specified period
            assert_announcing_period(1 + Election::announcing_period());

            // transferable stakes should have been initialized..(if council exists)
        });
    }

    #[test]
    fn init_transferable_stake_should_work () {
        with_externalities(&mut initial_test_ext(), || {
            let council_stakes = vec![10,11,12];
            let council_stakeholders = vec![1,2,3];
            let backing_stakeholders = vec![10,20,30,50];

            let existing_council = vec![
                Seat {
                    member: council_stakeholders[0],
                    stake: council_stakes[0],
                    backers: vec![
                        Backer {
                            member: backing_stakeholders[0],
                            stake: 2,
                        },
                        Backer {
                            member: backing_stakeholders[3],
                            stake: 5,
                        }]
                },

                Seat {
                    member: council_stakeholders[1],
                    stake: council_stakes[1],
                    backers: vec![
                        Backer {
                            member: backing_stakeholders[1],
                            stake: 4,
                        },
                        Backer {
                            member: backing_stakeholders[3],
                            stake: 5,
                        }]
                },

                Seat {
                    member: council_stakeholders[2],
                    stake: council_stakes[2],
                    backers: vec![Backer {
                        member: backing_stakeholders[2],
                        stake: 6,
                    }]
                }
            ];

            Election::initialize_transferable_stakes(existing_council);

            assert_eq!(Election::council_stakeholders(), council_stakeholders);

            for (i, id) in council_stakeholders.iter().enumerate() {
                assert_eq!(Election::council_stakes(id), council_stakes[i]);
            }

            let computed_backers = Election::backing_stakeholders();
            assert_eq!(computed_backers.len(), backing_stakeholders.len());
            for id in backing_stakeholders {
                assert!(computed_backers.iter().any(|&x| x == id));
            }

            assert_eq!(Election::backing_stakes(10), 2);
            assert_eq!(Election::backing_stakes(20), 4);
            assert_eq!(Election::backing_stakes(30), 6);
            assert_eq!(Election::backing_stakes(50), 10);

        });
    }

    #[test]
    fn announcing_should_work() {
        with_externalities(&mut initial_test_ext(), || {

            assert!(Election::applicants().len() == 0);

            let applicant = 20 as u64;

            let min_stake = 100 as u32;
            <MinCouncilStake<Test>>::put(min_stake);

            // must provide stake
            assert!(Election::try_add_applicant(applicant, 0).is_err());

            // Get some balance
            let starting_balance = (min_stake * 10) as u32;
            Balances::set_free_balance(&applicant, starting_balance);

            // must provide min stake
            let stake = min_stake as u32;
            assert!(Election::try_add_applicant(applicant, stake - 1).is_err());

            // with enough balance and stake, announcing should work
            assert!(Election::try_add_applicant(applicant, stake).is_ok());
            assert_eq!(Election::applicants(), vec![applicant]);

            assert_eq!(Election::applicant_stakes(applicant).refundable, stake);
            assert_eq!(Election::applicant_stakes(applicant).transferred, 0);

            assert_eq!(Balances::free_balance(&applicant), starting_balance - stake);
        });
    }

    #[test]
    fn increasing_stake_when_announcing_should_work () {
        with_externalities(&mut initial_test_ext(), || {
            let applicant = 20 as u64;
            <MinCouncilStake<Test>>::put(100);
            let starting_stake = Election::min_council_stake();

            <Applicants<Test>>::put(vec![applicant]);
            <ApplicantStakes<Test>>::insert(applicant, Stake {
                refundable: starting_stake,
                transferred: 0,
            });

            let additional_stake = 100 as u32;
            Balances::set_free_balance(&applicant, additional_stake);
            assert!(Election::try_add_applicant(applicant, additional_stake).is_ok());

            assert_eq!(Election::applicant_stakes(applicant).refundable, starting_stake + additional_stake);
            assert_eq!(Election::applicant_stakes(applicant).transferred, 0)
        });
    }

    #[test]
    fn announcing_with_transferable_council_stake_should_work() {
        with_externalities(&mut initial_test_ext(), || {

            let applicant = 20 as u64;
            <MinCouncilStake<Test>>::put(100);
            Balances::set_free_balance(&applicant, 5000);

            <CouncilStakeHolders<Test>>::put(vec![applicant]);
            save_council_stake(applicant, 1000);

            <Applicants<Test>>::put(vec![applicant]);
            let starting_stake = Stake {
                refundable: Election::min_council_stake(),
                transferred: 0,
            };
            <ApplicantStakes<Test>>::insert(applicant, starting_stake);

            // transferable stake covers new stake
            assert!(Election::try_add_applicant(applicant, 600).is_ok());
            assert_eq!(Election::applicant_stakes(applicant).refundable, starting_stake.refundable, "refundable");
            assert_eq!(Election::applicant_stakes(applicant).transferred, 600, "trasferred");
            assert_eq!(Election::council_stakes(applicant), 400,  "transferrable");
            assert_eq!(Balances::free_balance(applicant), 5000, "balance");

            // all remaining transferable stake is consumed and free balance covers remaining stake
            assert!(Election::try_add_applicant(applicant, 1000).is_ok());
            assert_eq!(Election::applicant_stakes(applicant).refundable, starting_stake.refundable + 600, "refundable");
            assert_eq!(Election::applicant_stakes(applicant).transferred, 1000, "trasferred");
            assert_eq!(Election::council_stakes(applicant), 0,  "transferrable");
            assert_eq!(Balances::free_balance(applicant), 4400, "balance");

        });
    }

    #[test]
    fn moving_to_voting_without_enough_applicants_should_not_work() {
        with_externalities(&mut initial_test_ext(), || {
            System::set_block_number(1);
            <AnnouncingPeriod<Test>>::put(20);
            <CouncilSize<Test>>::put(10);
            let ann_ends = Election::move_to_announcing_stage();
            let round = Election::round();

            // add applicants
            <Applicants<Test>>::put(vec![10,20,30]);
            let stake = Stake {
                refundable: 10,
                transferred: 0,
            };

            let applicants = Election::applicants();

            for applicant in applicants.iter() {
                <ApplicantStakes<Test>>::insert(applicant, stake);
            }

            // make sure we are testing the condition that we don't have enough applicants
            assert!(Election::council_size_usize() > applicants.len());

            // try to move to voting stage
            System::set_block_number(ann_ends);
            Election::on_announcing_ended();

            // A new round should have been started
            assert_eq!(Election::round(), round + 1);

            // A new announcing period started
            assert_announcing_period(ann_ends + Election::announcing_period());

            // applicants list should be unchanged..
            assert_eq!(Election::applicants(), applicants);
        });
    }

    #[test]
    fn top_applicants_become_candidates_should_work() {
        with_externalities(&mut initial_test_ext(), || {
            <Applicants<Test>>::put(vec![10, 20, 30, 40]);
            let mut applicants = Election::applicants();

            for (i, applicant) in applicants.iter().enumerate() {
                <ApplicantStakes<Test>>::insert(applicant, Stake {
                    refundable: (i * 10) as u32,
                    transferred: 0,
                });
            }

            let rejected = Election::find_least_staked_applicants(&mut applicants, 3);
            assert_eq!(rejected.to_vec(), vec![10]);

            <Applicants<Test>>::put(vec![40, 30, 20, 10]);
            let mut applicants = Election::applicants();

            for applicant in applicants.iter() {
                <ApplicantStakes<Test>>::insert(applicant, Stake {
                    refundable: 20 as u32,
                    transferred: 0,
                });
            }

            // stable sort is preserving order when two elements are equivalent
            let rejected = Election::find_least_staked_applicants(&mut applicants, 3);
            assert_eq!(rejected.to_vec(), vec![40]);
        });
    }

    #[test]
    fn refunding_applicant_stakes_should_work () {
        with_externalities(&mut initial_test_ext(), || {
            Balances::set_free_balance(&1, 1000);
            Balances::set_free_balance(&2, 2000);
            Balances::set_free_balance(&3, 3000);

            <Applicants<Test>>::put(vec![1,2,3]);

            save_council_stake(1, 50);
            save_council_stake(2, 0);
            save_council_stake(3, 0);

            <ApplicantStakes<Test>>::insert(1, Stake {
                refundable: 100,
                transferred: 200,
            });

            <ApplicantStakes<Test>>::insert(2, Stake {
                refundable: 300,
                transferred: 400,
            });

            <ApplicantStakes<Test>>::insert(3, Stake {
                refundable: 500,
                transferred: 600,
            });

            Election::drop_applicants(&vec![2,3][..]);

            assert_eq!(Election::applicants(), vec![1]);

            assert_eq!(Election::applicant_stakes(1).refundable, 100);
            assert_eq!(Election::applicant_stakes(1).transferred, 200);
            assert_eq!(Election::council_stakes(1), 50);
            assert_eq!(Balances::free_balance(&1), 1000);

            //assert_eq!(Election::applicant_stakes(2), Default::default());
            assert!(!<ApplicantStakes<Test>>::exists(2));
            assert_eq!(Election::council_stakes(2), 400);
            assert_eq!(Balances::free_balance(&2), 2300);

            //assert_eq!(Election::applicant_stakes(3), Default::default());
            assert!(!<ApplicantStakes<Test>>::exists(3));
            assert_eq!(Election::council_stakes(3), 600);
            assert_eq!(Balances::free_balance(&3), 3500);
        });
    }

    #[test]
    fn voting_should_work () {
        with_externalities(&mut initial_test_ext(), || {
            Balances::set_free_balance(&20, 1000);
            let payload = vec![10u8];
            let commitment = <Test as system::Trait>::Hashing::hash(&payload[..]);

            assert!(Election::try_add_vote(20, 100, commitment).is_ok());

            assert_eq!(Election::commitments(), vec![commitment]);
            assert_eq!(Election::votes(commitment).voter, 20);
            assert_eq!(Election::votes(commitment).commitment, commitment);
            assert_eq!(Election::votes(commitment).stake, Stake {
                refundable: 100,
                transferred: 0,
            });
            assert_eq!(Balances::free_balance(&20), 900);
        });
    }

    fn save_council_stake(id: u64, stake: u32) {
        <AvailableCouncilStakesMap<Test>>::insert(id, stake);
    }

    fn save_backing_stake(id: u64, stake: u32) {
        <AvailableBackingStakesMap<Test>>::insert(id, stake);
    }

    #[test]
    fn votes_can_be_covered_by_transferable_stake () {
        with_externalities(&mut initial_test_ext(), || {
            Balances::set_free_balance(&20, 1000);

            save_backing_stake(20, 500);

            let payload = vec![10u8];
            let commitment = <Test as system::Trait>::Hashing::hash(&payload[..]);

            assert!(Election::try_add_vote(20, 100, commitment).is_ok());

            assert_eq!(Election::commitments(), vec![commitment]);
            assert_eq!(Election::votes(commitment).voter, 20);
            assert_eq!(Election::votes(commitment).commitment, commitment);
            assert_eq!(Election::votes(commitment).stake, Stake {
                refundable: 0,
                transferred: 100,
            });
            assert_eq!(Balances::free_balance(&20), 1000);
        });
    }

    #[test]
    fn voting_without_enough_balance_should_not_work () {
        with_externalities(&mut initial_test_ext(), || {
            Balances::set_free_balance(&20, 100);

            save_backing_stake(20, 500);

            let payload = vec![10u8];
            let commitment = <Test as system::Trait>::Hashing::hash(&payload[..]);

            assert!(Election::try_add_vote(20, 1000, commitment).is_err());
            assert_eq!(Election::commitments(), vec![]);
            assert!(!<Votes<Test>>::exists(commitment));
            assert_eq!(Balances::free_balance(&20), 100);
        });
    }

    #[test]
    fn voting_with_existing_commitment_should_not_work () {
        with_externalities(&mut initial_test_ext(), || {
            Balances::set_free_balance(&20, 1000);

            save_backing_stake(20, 500);

            let payload = vec![10u8];
            let commitment = <Test as system::Trait>::Hashing::hash(&payload[..]);

            assert!(Election::try_add_vote(20, 100, commitment).is_ok());

            assert_eq!(Election::commitments(), vec![commitment]);
            assert_eq!(Election::votes(commitment).voter, 20);
            assert_eq!(Election::votes(commitment).commitment, commitment);
            assert_eq!(Election::votes(commitment).stake, Stake {
                refundable: 0,
                transferred: 100,
            });
            assert_eq!(Balances::free_balance(&20), 1000);

            assert!(Election::try_add_vote(30, 100, commitment).is_err());
        });
    }

    fn make_commitment_for_candidate(candidate: <Test as system::Trait>::AccountId, salt: &mut Vec<u8>) -> <Test as system::Trait>::Hash {
        let mut payload = candidate.encode();
        payload.append(salt);
        <Test as system::Trait>::Hashing::hash(&payload[..])
    }

    #[test]
    fn revealing_vote_works () {
        with_externalities(&mut initial_test_ext(), || {
            let candidate = 20 as u64;
            let salt = vec![128u8];
            let commitment = make_commitment_for_candidate(candidate, &mut salt.clone());
            let voter = 10 as u64;

            <ApplicantStakes<Test>>::insert(&candidate, Stake {refundable: 0, transferred: 0});

            <Votes<Test>>::insert(&commitment, SealedVote::new(voter, Stake {
                refundable: 100, transferred: 0
            }, commitment));

            assert!(<Votes<Test>>::get(commitment).is_not_revealed());
            assert!(Election::try_reveal_vote(voter, commitment, candidate, salt).is_ok());
            assert_eq!(<Votes<Test>>::get(commitment).get_vote().unwrap(), candidate);
        });
    }

    #[test]
    fn revealing_with_bad_salt_should_not_work () {
        with_externalities(&mut initial_test_ext(), || {
            let candidate = 20 as u64;
            let salt = vec![128u8];
            let commitment = make_commitment_for_candidate(candidate, &mut salt.clone());
            let voter = 10 as u64;

            <ApplicantStakes<Test>>::insert(&candidate, Stake {refundable: 0, transferred: 0});

            <Votes<Test>>::insert(&commitment, SealedVote::new(voter, Stake {
                refundable: 100, transferred: 0
            }, commitment));

            assert!(<Votes<Test>>::get(commitment).is_not_revealed());
            assert!(Election::try_reveal_vote(voter, commitment, candidate, vec![]).is_err());
            assert!(<Votes<Test>>::get(commitment).is_not_revealed());
        });
    }

    #[test]
    fn revealing_non_matching_commitment_should_not_work () {
        with_externalities(&mut initial_test_ext(), || {
            let candidate = 20 as u64;
            let salt = vec![128u8];
            let commitment = make_commitment_for_candidate(100, &mut salt.clone());
            let voter = 10 as u64;

            <ApplicantStakes<Test>>::insert(&candidate, Stake {refundable: 0, transferred: 0});

            assert!(Election::try_reveal_vote(voter, commitment, candidate, vec![]).is_err());
        });
    }

    #[test]
    fn revealing_for_non_candidate_should_not_work () {
        with_externalities(&mut initial_test_ext(), || {
            let candidate = 20 as u64;
            let salt = vec![128u8];
            let commitment = make_commitment_for_candidate(candidate, &mut salt.clone());
            let voter = 10 as u64;

            <Votes<Test>>::insert(&commitment, SealedVote::new(voter, Stake {
                refundable: 100, transferred: 0
            }, commitment));

            assert!(<Votes<Test>>::get(commitment).is_not_revealed());
            assert!(Election::try_reveal_vote(voter, commitment, candidate, vec![]).is_err());
            assert!(<Votes<Test>>::get(commitment).is_not_revealed());
        });
    }

    #[test]
    fn revealing_by_non_committer_should_not_work () {
        with_externalities(&mut initial_test_ext(), || {
            let candidate = 20 as u64;
            let salt = vec![128u8];
            let commitment = make_commitment_for_candidate(candidate, &mut salt.clone());
            let voter = 10 as u64;
            let not_voter = 100 as u64;

            <ApplicantStakes<Test>>::insert(&candidate, Stake {refundable: 0, transferred: 0});

            <Votes<Test>>::insert(&commitment, SealedVote::new(voter, Stake {
                refundable: 100, transferred: 0
            }, commitment));

            assert!(<Votes<Test>>::get(commitment).is_not_revealed());
            assert!(Election::try_reveal_vote(not_voter, commitment, candidate, salt).is_err());
            assert!(<Votes<Test>>::get(commitment).is_not_revealed());
        });
    }

    pub fn mock_votes (mock: Vec<(u64, u32, u32, u64)>) -> Vec<SealedVote<u64, Stake<u32>, primitives::H256, u64>> {
        let commitment = make_commitment_for_candidate(1, &mut vec![0u8]);

        mock.into_iter().map(|(voter, stake_ref, stake_tran, candidate)| SealedVote::new_unsealed(voter as u64, Stake {
            refundable: stake_ref as u32, transferred: stake_tran as u32
        }, commitment, candidate as u64)).collect()
    }


    #[test]
    fn vote_tallying_should_work () {
        with_externalities(&mut initial_test_ext(), || {
            let votes = mock_votes(vec![
            //  (voter, stake[refundable], stake[transferred], candidate)
                (10, 100, 0, 100),
                (10, 150, 0, 100),

                (10, 500, 0, 200),
                (20, 200, 0, 200),

                (30, 300, 0, 300),
                (30, 400, 0, 300),
            ]);

            let tally = Election::tally_votes(&votes);

            assert_eq!(tally.len(), 3);

            assert_eq!(tally.get(&100).unwrap().member, 100);
            assert_eq!(tally.get(&100).unwrap().backers, vec![
                Backer {
                    member: 10 as u64,
                    stake: 100 as u32,
                },
                Backer {
                    member: 10 as u64,
                    stake: 150 as u32,
                },
            ]);

            assert_eq!(tally.get(&200).unwrap().member, 200);
            assert_eq!(tally.get(&200).unwrap().backers, vec![
                Backer {
                    member: 10 as u64,
                    stake: 500 as u32,
                },
                Backer {
                    member: 20 as u64,
                    stake: 200 as u32,
                }
            ]);

            assert_eq!(tally.get(&300).unwrap().member, 300);
            assert_eq!(tally.get(&300).unwrap().backers, vec![
                Backer {
                    member: 30 as u64,
                    stake: 300 as u32,
                },
                Backer {
                    member: 30 as u64,
                    stake: 400 as u32,
                }
            ]);
        });
    }

   #[test]
    fn filter_top_staked_candidates_should_work () {
        with_externalities(&mut initial_test_ext(), || {
            // filter_top_staked depends on order of candidates
            // and would panic if tally size was larger than applicants
            <Applicants<Test>>::put(vec![100, 200, 300]);

            {
                let votes = mock_votes(vec![
                //  (voter, stake[refundable], candidate)
                    (10, 100, 0, 100),
                    (10, 150, 0, 100),

                    (10, 500, 0, 200),
                    (20, 200, 0, 200),

                    (30, 300, 0, 300),
                    (30, 400, 0, 300),
                ]);

                let mut tally = Election::tally_votes(&votes);
                assert_eq!(tally.len(), 3);
                Election::filter_top_staked(&mut tally, 3);
                assert_eq!(tally.len(), 3);
            }

            {
                let votes = mock_votes(vec![
                //  (voter, stake[refundable], candidate)
                    (10, 100, 0, 100),
                    (10, 150, 0, 100),

                    (10, 500, 0, 200),
                    (20, 200, 0, 200),

                    (30, 300, 0, 300),
                    (30, 400, 0, 300),
                ]);

                let mut tally = Election::tally_votes(&votes);
                assert_eq!(tally.len(), 3);
                Election::filter_top_staked(&mut tally, 2);
                assert_eq!(tally.len(), 2);
                assert!(tally.get(&200).is_some());
                assert!(tally.get(&300).is_some());
            }
        });
    }

    #[test]
    fn drop_unelected_candidates_should_work () {
        with_externalities(&mut initial_test_ext(), || {
            <Applicants<Test>>::put(vec![100, 200, 300]);

            Balances::set_free_balance(&100, 1000);

            <ApplicantStakes<Test>>::insert(100, Stake {
                refundable: 20 as u32,
                transferred: 50 as u32,
            });

            save_council_stake(100, 100);

            let mut new_council: BTreeMap<u64, Seat<u64, u32>> = BTreeMap::new();
            new_council.insert(200 as u64, Seat{ member: 200 as u64, stake: 0 as u32, backers: vec![]});
            new_council.insert(300 as u64, Seat{ member: 300 as u64, stake: 0 as u32, backers: vec![]});

            Election::drop_unelected_candidates(&new_council);

            // applicant dropped
            assert_eq!(Election::applicants(), vec![200, 300]);
            assert!(!<ApplicantStakes<Test>>::exists(100));

            // and refunded
            assert_eq!(Election::council_stakes(100), 150);
            assert_eq!(Balances::free_balance(&100), 1020);
        });
    }


    #[test]
    fn refunding_voting_stakes_should_work () {
        with_externalities(&mut initial_test_ext(), || {
            // voters' balances
            Balances::set_free_balance(&10, 1000);
            Balances::set_free_balance(&20, 2000);
            Balances::set_free_balance(&30, 3000);

            save_backing_stake(10, 100);
            save_backing_stake(20, 200);
            save_backing_stake(30, 300);

            let votes = mock_votes(vec![
            //  (voter, stake[refundable], stake[transferred], candidate)
                (10, 100, 20, 100),
                (20, 200, 40, 100),
                (30, 300, 60, 100),

                (10, 500, 70, 200),
                (20, 600, 80, 200),
                (30, 700, 90, 200),

                (10,  800, 100, 300),
                (20,  900, 120, 300),
                (30, 1000, 140, 300),
            ]);

            let mut new_council: BTreeMap<u64, Seat<u64, u32>> = BTreeMap::new();
            new_council.insert(200 as u64, Seat{ member: 200 as u64, stake: 0 as u32, backers: vec![]});
            new_council.insert(300 as u64, Seat{ member: 300 as u64, stake: 0 as u32, backers: vec![]});

            Election::refund_voting_stakes(&votes, &new_council);

            assert_eq!(Balances::free_balance(&10), 1100);
            assert_eq!(Balances::free_balance(&20), 2200);
            assert_eq!(Balances::free_balance(&30), 3300);

            assert_eq!(Election::backing_stakes(10), 120);
            assert_eq!(Election::backing_stakes(20), 240);
            assert_eq!(Election::backing_stakes(30), 360);
        });
    }

    #[test]
    fn refund_transferable_stakes_should_work () {
       with_externalities(&mut initial_test_ext(), || {
            <BackingStakeHolders<Test>>::put(vec![10,20,30]);
            <CouncilStakeHolders<Test>>::put(vec![10,20,30]);

            Balances::set_free_balance(&10, 1000);
            save_backing_stake(10, 100);
            save_council_stake(10, 50);

            Balances::set_free_balance(&20, 2000);
            save_backing_stake(20, 200);
            save_council_stake(20, 60);

            Balances::set_free_balance(&30, 3000);
            save_backing_stake(30, 300);
            save_council_stake(30, 70);

            Election::refund_transferable_stakes();

            assert_eq!(Balances::free_balance(&10), 1150);
            assert_eq!(Balances::free_balance(&20), 2260);
            assert_eq!(Balances::free_balance(&30), 3370);
       });
    }

    #[test]
    fn council_elected_hook_should_work() {
        with_externalities(&mut initial_test_ext(), || {

            let mut new_council: BTreeMap<u64, Seat<u64, u32>> = BTreeMap::new();
            new_council.insert(200 as u64, Seat{ member: 200 as u64, stake: 10 as u32, backers: vec![]});
            new_council.insert(300 as u64, Seat{ member: 300 as u64, stake: 20 as u32, backers: vec![]});

            assert!(Council::active_council().is_none());

            let new_council = new_council.into_iter().map(|(_, seat)| seat.clone()).collect();
            <Test as election::Trait>::CouncilElected::council_elected(new_council, 10);

            assert!(Council::active_council().is_some());
        });
    }

    #[test]
    fn simulation() {
        with_externalities(&mut initial_test_ext(), || {
            assert!(Council::active_council().is_none());
            assert!(Election::stage().is_none());

            <CouncilSize<Test>>::put(10);
            <MinCouncilStake<Test>>::put(50);
            <AnnouncingPeriod<Test>>::put(10);
            <VotingPeriod<Test>>::put(10);
            <RevealingPeriod<Test>>::put(10);
            <CandidacyLimitMultiple<Test>>::put(2);

            for i in 1..20 {
                Balances::set_free_balance(&(i as u64), 50000);
            }

            System::set_block_number(1);
            assert_ok!(Election::start_election(None));

            for i in 1..20 {
                assert!(Election::announce_candidacy(Origin::signed(i), 150).is_ok());
                assert!(Election::announce_candidacy(Origin::signed(i + 1000), 150).is_err());
            }

            let n = 1 + Election::announcing_period();
            System::set_block_number(n);
            Election::on_finalise(n);

            for i in 1..20 {
                assert!(Election::vote_for_candidate(Origin::signed(i), make_commitment_for_candidate(i, &mut vec![40u8]), 100).is_ok());

                assert!(Election::vote_for_candidate(Origin::signed(i), make_commitment_for_candidate(i, &mut vec![41u8]), 100).is_ok());

                assert!(Election::vote_for_candidate(Origin::signed(i), make_commitment_for_candidate(i + 1000, &mut vec![42u8]), 100).is_ok());
            }

            let n = n + Election::voting_period();
            System::set_block_number(n);
            Election::on_finalise(n);

            for i in 1..20 {
                assert!(Election::reveal_vote(Origin::signed(i), make_commitment_for_candidate(i, &mut vec![40u8]), i, vec![40u8]).is_ok());
                //wrong salt
                assert!(Election::reveal_vote(Origin::signed(i), make_commitment_for_candidate(i, &mut vec![41u8]), i, vec![]).is_err());
                //vote not for valid candidate
                assert!(Election::reveal_vote(Origin::signed(i), make_commitment_for_candidate(i + 1000, &mut vec![42u8]), i + 1000, vec![42u8]).is_err());
            }

            let n = n + Election::revealing_period();
            System::set_block_number(n);
            Election::on_finalise(n);

            assert!(Council::active_council().is_some());
            assert_eq!(Council::active_council().unwrap().len(), Election::council_size_usize());
            for (i, seat) in Council::active_council().unwrap().iter().enumerate() {
                assert_eq!(seat.member, (i + 1) as u64);
            }
            assert!(Election::stage().is_none());
        });
    }
}