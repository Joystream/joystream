#![cfg_attr(not(feature = "std"), no_std)]

// extern crate sr_std;
// #[cfg(test)]
// extern crate sr_io;
// #[cfg(test)]
// extern crate substrate_primitives;
// extern crate sr_primitives;
// #[cfg(feature = "std")]
// extern crate parity_codec as codec;
// extern crate srml_system as system;

use srml_support::{StorageValue, StorageMap, dispatch::Result};
use runtime_primitives::traits::{Hash, As, Zero, SimpleArithmetic};
use {balances, system::{ensure_signed}};
use runtime_io::print;
use srml_support::dispatch::Vec;

use rstd::collections::btree_map::BTreeMap;

use super::transferable_stake::Stake;
use super::council;
use super::sealed_vote::SealedVote;
use super::root;

pub trait Trait: system::Trait + balances::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type CouncilElected: CouncilElected<BTreeMap<Self::AccountId, council::Seat<Self::AccountId, Self::Balance>>>;
}

#[derive(Clone, Copy, Encode, Decode, PartialEq, Debug)]
pub struct Period<T: PartialOrd + PartialEq + Copy> {
    pub starts: T,
    pub ends: T
}

#[derive(Clone, Copy, Encode, Decode)]
pub enum Stage<T: PartialOrd + PartialEq + Copy> {
    Announcing(Period<T>),
    Voting(Period<T>),
    Revealing(Period<T>),
}

// Hook for setting a new council when it is elected
pub trait CouncilElected<Elected> {
    fn council_elected(new_council: &Elected);
}

impl<Elected> CouncilElected<Elected> for () {
    fn council_elected(_new_council: &Elected) {}
}

impl<Elected, X: CouncilElected<Elected>> CouncilElected<Elected> for (X,) {
    fn council_elected(new_council: &Elected) {
        X::council_elected(new_council);
    }
}


pub const ANNOUNCING_PERIOD:u64 = 20;
pub const VOTING_PERIOD:u64 = 20;
pub const REVEALING_PERIOD:u64 = 20;
pub const COUNCIL_SIZE: usize = 10;
pub const CANDIDACY_LIMIT: usize = 20; // should be greater than COUNCIL_SIZE
pub const COUNCIL_MIN_STAKE: u64 = 100;

decl_storage! {
    trait Store for Module<T: Trait> as CouncilElection {
        //Current stage if there is an election ongoing
        ElectionStage get(stage): Option<Stage<T::BlockNumber>>;

        // The election round
        ElectionRound get(round): u32;

        // map doesn't have a clear() method so need to keep track of keys to know 
        // what keys to delete later < if council is not modified during election
        // we could always re-computer the vectors
        BackingStakeHolders get(backing_stakeholders): Vec<T::AccountId>;
        CouncilStakeHolders get(council_stakeholders): Vec<T::AccountId>;
        AvailableBackingStakesMap get(backing_stakes): map T::AccountId => T::Balance;
        AvailableCouncilStakesMap get(council_stakes): map T::AccountId => T::Balance;

        Applicants get(applicants): Vec<T::AccountId>;
        ApplicantStakes get(applicant_stakes): map T::AccountId => Stake<T::Balance>;

        Commitments get(commitments): Vec<T::Hash>;
        // simply a Yes vote for a candidate. Consider changing the vote payload to support
        // For and Against. 
        Votes get(votes): map T::Hash => SealedVote<T::AccountId, Stake<T::Balance>, T::Hash, T::AccountId>;
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
        ElectionCompleted(),
        Dummy(BlockNumber),
	}
);

impl<T: Trait> root::TriggerElection<council::Council<T::AccountId, T::Balance>> for Module<T> {
    fn trigger_election(current_council: Option<council::Council<T::AccountId, T::Balance>>) -> Result {
        if Self::stage().is_some() {
            return Err("election in progress")
        }
        
        Self::start_election(current_council);

        Ok(())
    }
}

impl<T: Trait> Module<T> {
    fn start_election(current_council: Option<council::Council<T::AccountId, T::Balance>>) {
        //ensure!(Self::stage().is_none());

        // take snapshot of council and backing stakes of an existing council
        current_council.map(|c| Self::initialize_transferable_stakes(c));

        Self::move_to_announcing_stage();
    }

    fn new_period(length: T::BlockNumber) -> Period<T::BlockNumber> {
        let current_block = <system::Module<T>>::block_number();
        Period {
            starts: current_block,
            ends: current_block + length
        }
    }

    fn bump_round() -> u32 {
        // bump the round number
        print("Bumping Election Round");
        <ElectionRound<T>>::mutate(|n| {
            *n += 1;
            *n
        })
    }

    fn move_to_announcing_stage() -> Period<T::BlockNumber> {
        let period = Self::new_period(T::BlockNumber::sa(ANNOUNCING_PERIOD));

        <ElectionStage<T>>::put(Stage::Announcing(period));
        
        let next_round = Self::bump_round();

        Self::deposit_event(RawEvent::AnnouncingStarted(next_round));
        print("Announcing Started");
        period
    }

    fn on_announcing_ended() {
        let mut applicants = Self::applicants();

        if applicants.len() < COUNCIL_SIZE {
            // Not enough candidates announced candidacy
            Self::move_to_announcing_stage();
        } else {
            // Sort Applicants by stake decending, and filter top CANDIDACY_LIMIT
            // Howto ensure deterministic sorting (stable sort -> sort_by_key) - also howto deal with
            // equal stake for bottom slot - order in applicants vector.
            // This is highly ineffieicent (cloning ApplicationId twice)
            // using functional style should help
            if applicants.len() > CANDIDACY_LIMIT {
                let mut sorted_applicants: Vec<(&T::AccountId, Stake<T::Balance>)> = applicants.iter()
                    .map(|applicant| (applicant, Self::applicant_stakes(applicant)))
                    .collect();

                sorted_applicants.sort_by_key(|&(_, stake)| stake); // ASC or DESC ?

                let bottom_applicants = &sorted_applicants[0 .. sorted_applicants.len() - CANDIDACY_LIMIT];
                let candidates = &sorted_applicants[sorted_applicants.len() - CANDIDACY_LIMIT..];

                for (applicant, stake) in bottom_applicants.iter() {
                    // refund applicants
                    Self::return_stake_to(*applicant, *stake);
                    // remove applicant
                    <ApplicantStakes<T>>::remove(*applicant);
                    //applicants.remove_item(applicant); // unstable feature

                }

                let candidates: Vec<T::AccountId> = candidates.into_iter()
                    .map(|(applicant,_)| (*applicant).clone())
                    .collect();
                
                <Applicants<T>>::put(candidates);
            }

            Self::move_to_voting_stage();
        }
    }

    fn move_to_voting_stage() {
        let period = Self::new_period(T::BlockNumber::sa(VOTING_PERIOD));

        <ElectionStage<T>>::put(Stage::Voting(period));
        
        Self::deposit_event(RawEvent::VotingStarted());
        print("Voting Started");
    }

    fn on_voting_ended() {
        Self::move_to_revealing_stage();
    }

    fn move_to_revealing_stage() {
        let period = Self::new_period(T::BlockNumber::sa(REVEALING_PERIOD));

        <ElectionStage<T>>::put(Stage::Revealing(period));
        
        Self::deposit_event(RawEvent::RevealingStarted());
        print("Revealing Started");
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
        let applicants = Self::applicants();
        let not_on_council: Vec<&T::AccountId> = applicants.iter()
            .filter(|applicant| new_council.get(applicant).is_none()).collect();

        let _: Vec<()> = not_on_council.into_iter().map(|applicant| {
            new_council.insert(applicant.clone(), council::Seat {
                member: applicant.clone(),
                stake: Self::applicant_stakes(applicant).total(),
                backers: Vec::new(),
            });
            ()
        }).collect();

        if new_council.len() == COUNCIL_SIZE {
            // all candidates in the tally will form the new council
        } else if new_council.len() > COUNCIL_SIZE {
            // we have more than enough elected candidates to form the new council
            // select top COUNCIL_SIZE prioritised by stake
            Self::filter_top_staked(&mut new_council, COUNCIL_SIZE);
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
        Self::refund_applicant_stakes(&new_council);
        Self::refund_unused_transferable_stakes();
        <ElectionStage<T>>::kill();

        T::CouncilElected::council_elected(&new_council);
        
        Self::deposit_event(RawEvent::ElectionCompleted());
        print("Election Completed");
    }

    fn refund_unused_transferable_stakes() {
        // move stakes back to account holder's free balance
        for stakeholder in Self::backing_stakeholders().iter() {
            let stake = Self::backing_stakes(stakeholder);
            if stake > T::Balance::zero() {
                let balance = <balances::Module<T>>::free_balance(stakeholder);
                <balances::Module<T>>::set_free_balance(stakeholder, balance + stake);
            }
            <AvailableBackingStakesMap<T>>::remove(stakeholder);
        }
        <BackingStakeHolders<T>>::kill();

        for stakeholder in Self::council_stakeholders().iter() {
            let stake = Self::council_stakes(stakeholder);
            if stake > T::Balance::zero() {
                let balance = <balances::Module<T>>::free_balance(stakeholder);
                <balances::Module<T>>::set_free_balance(stakeholder, balance + stake);
            }
            <AvailableCouncilStakesMap<T>>::remove(stakeholder);
        }
        <CouncilStakeHolders<T>>::kill();
    }

    fn refund_applicant_stakes(new_council: &BTreeMap<T::AccountId, council::Seat<T::AccountId, T::Balance>>) {
        for applicant in Self::applicants().iter() {
            let do_refund = match new_council.get(&applicant) {
                Some(_) => false,
                None => true
            };

            if do_refund {
                Self::return_stake_to(&applicant, <ApplicantStakes<T>>::get(applicant));
            }

            <ApplicantStakes<T>>::remove(applicant);
        }

        <Applicants<T>>::kill();
    }

    fn return_stake_to(who: &T::AccountId, stake_to_return: Stake<T::Balance>) {
        // return refundable stake to account's free balance
        if stake_to_return.refundable > T::Balance::zero() {
            let balance = <balances::Module<T>>::free_balance(who);
            <balances::Module<T>>::set_free_balance(who, balance + stake_to_return.refundable);
        }

        // return unused transferable stake
        if stake_to_return.transferred > T::Balance::zero() {
            <AvailableBackingStakesMap<T>>::mutate(who, |stake| *stake += stake_to_return.transferred);
        }
    }

    fn refund_voting_stakes(
        sealed_votes: &Vec<SealedVote<T::AccountId, Stake<T::Balance>, T::Hash, T::AccountId>>,
        new_council: &BTreeMap<T::AccountId, council::Seat<T::AccountId, T::Balance>>)
    {
        for sealed_vote in sealed_votes.iter() {
            // Do a refund if commitment was not revealed or vote was for candidate that did
            // not get elected to the council
            let do_refund = match sealed_vote.get_vote() {
                Some(candidate) => {
                    match new_council.get(&candidate) {
                        None => true,
                        Some(_) => false
                    }
                },
                None => true
            };

            if do_refund {
                Self::return_stake_to(&sealed_vote.voter, sealed_vote.stake);
            }
    
            // remove vote
            <Votes<T>>::remove(sealed_vote.commitment);
        }

        // clear commitments
        //<Commitments<T>>::put(Vec::new());
        <Commitments<T>>::kill();
    }

    fn tally_votes(sealed_votes: &Vec<SealedVote<T::AccountId, Stake<T::Balance>, T::Hash, T::AccountId>>) -> BTreeMap<T::AccountId, council::Seat<T::AccountId, T::Balance>> {
        let mut tally: BTreeMap<T::AccountId, council::Seat<T::AccountId, T::Balance>> = BTreeMap::new();

        for sealed_vote in sealed_votes.iter() {
            if let Some(candidate) = sealed_vote.get_vote() {
                match tally.get(&candidate) {
                    // Add new seat and first backer
                    None => {
                        let backers = [council::Backer {
                            member: sealed_vote.voter.clone(),
                            stake: sealed_vote.stake.total()
                        }].to_vec();

                        let seat = council::Seat {
                            member: candidate.clone(),
                            stake: Self::applicant_stakes(candidate).total(),
                            backers: backers,
                        };

                        tally.insert(candidate.clone(), seat);
                    },

                    // Add backer to existing seat
                    Some(_) => {
                        if let Some(seat) = tally.get_mut(&candidate) {
                            seat.backers.push(council::Backer {
                                member: sealed_vote.voter.clone(),
                                stake: sealed_vote.stake.total()
                            });
                        }
                    }
                }
            }
        }

        tally
    }

    fn filter_top_staked(tally: &mut BTreeMap<T::AccountId, council::Seat<T::AccountId, T::Balance>>, limit: usize) {
        // 
        let mut seats = Vec::new();

        // is iteration deterministic???
        for (id, seat) in tally.iter() {
            seats.push((id.clone(), seat.total_stake()));
        }

        seats.sort_by_key(|&(_, stake)| stake); // ASC

        // seats at bottom of list
        let filtered_out_seats = &seats[0 .. seats.len() - rstd::cmp::min(limit, seats.len())];

        for (id, _) in filtered_out_seats.iter() {
            tally.remove(&id);
        }
    }

    fn tick(now: T::BlockNumber) {
        print("Election: tick");
        if let Some(stage) = Self::stage() {
            match stage {
                Stage::Announcing(period) => {
                    if period.ends == now {
                        Self::deposit_event(RawEvent::AnnouncingEnded());
                        Self::on_announcing_ended();
                    }
                },
                Stage::Voting(period) => {
                    if period.ends == now {
                        Self::deposit_event(RawEvent::VotingEnded());
                        Self::on_voting_ended();
                    }
                },
                Stage::Revealing(period) => {
                    if period.ends == now {
                        Self::deposit_event(RawEvent::RevealingEnded());
                        Self::on_revealing_ended();
                    }
                },
            }
        }
    }

    /// Takes a snapshot of the stakes from the current council
    fn initialize_transferable_stakes(current_council: council::Council<T::AccountId, T::Balance>) {
        let mut accounts_council: Vec<T::AccountId> = Vec::new();
        let mut accounts_backers: Vec<T::AccountId> = Vec::new();
        for ref seat in current_council.iter() {
            let id = seat.member.clone();
            <AvailableCouncilStakesMap<T>>::insert(&id, seat.stake);
            accounts_council.push(id);
            for ref backer in seat.backers.iter() {
                let id = backer.member.clone();
                if !<AvailableBackingStakesMap<T>>::exists(&id) {
                    <AvailableBackingStakesMap<T>>::insert(&id, backer.stake);
                    accounts_backers.push(id);
                } else {
                    <AvailableBackingStakesMap<T>>::mutate(&backer.member, |stake| *stake += backer.stake);
                }
            }
        }

        <CouncilStakeHolders<T>>::put(accounts_council);
        <BackingStakeHolders<T>>::put(accounts_backers);
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

        let mut new_stake: Stake<T::Balance> = Default::default();

        new_stake.transferred = if transferable_stake >= stake {
            stake
        } else {
            transferable_stake
        };

        new_stake.refundable = stake - new_stake.transferred;
 
        let balance = <balances::Module<T>>::free_balance(&applicant);

        if new_stake.refundable > balance {
            return Err("not enough balance to cover stake");
        }
        
        let total_stake = applicant_stake.add(&new_stake);

        if T::Balance::sa(COUNCIL_MIN_STAKE) > total_stake.total() {
            return Err("minimum stake not met");
        }   

        if <balances::Module<T>>::decrease_free_balance(&applicant, new_stake.refundable).is_err() {
            return Err("failed to update balance");
        }

        if applicant_has_council_stake {
            <AvailableCouncilStakesMap<T>>::insert(&applicant, transferable_stake - new_stake.transferred);
        }
       
        if !<ApplicantStakes<T>>::exists(&applicant) {
            <Applicants<T>>::mutate(|applicants| applicants.push(applicant.clone()));
        }

        <ApplicantStakes<T>>::insert(applicant.clone(), total_stake);

        Ok(())
    }

    fn try_add_vote(voter: T::AccountId, stake: T::Balance, commitment: T::Hash) -> Result {
        if <Votes<T>>::exists(commitment) {
            return Err("duplicate commitment");
        }

        let voter_has_backing_stake = <AvailableBackingStakesMap<T>>::exists(&voter);

        let transferable_stake: T::Balance = match voter_has_backing_stake {
            false => Default::default(), //zero
            true => <AvailableBackingStakesMap<T>>::get(&voter)
        };

        let mut vote_stake: Stake<T::Balance> = Default::default();

        vote_stake.transferred = if transferable_stake >= stake {
            stake
        } else {
            transferable_stake
        };

        vote_stake.refundable = stake - vote_stake.transferred;
        
        let balance = <balances::Module<T>>::free_balance(&voter);

        if vote_stake.refundable > balance {
            return Err("not enough balance to cover voting stake");
        }
        
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
        if !<ApplicantStakes<T>>::exists(&candidate) {
            return Err("vote for non-candidate not allowed");
        }

        if !<Votes<T>>::exists(&commitment) {
            return Err("commitment not found");
        }
        
        let mut sealed_vote = <Votes<T>>::get(&commitment);

        // only voter can reveal their own votes
        if !sealed_vote.owned_by(voter) {
            return Err("only voter can reveal vote");
        }

        let mut salt = salt.clone();
        let valid = sealed_vote.unseal(candidate, &mut salt, <T as system::Trait>::Hashing::hash)?;
        match valid {
            true => {
                // update the sealed vote
                <Votes<T>>::insert(commitment, sealed_vote);
                Ok(())
            },

            false => Err("invalid salt")
        }
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        // No origin so this is a priviledged call
        fn on_finalise(now: T::BlockNumber){
            let _ = Self::tick(now);
        }

        fn announce_candidacy(origin, stake: T::Balance) -> Result {
            let sender = ensure_signed(origin)?;
            // Can only announce candidacy during election announcing stage
            if let Some(stage) = Self::stage() {
                match stage {
                    Stage::Announcing(_) => Self::try_add_applicant(sender, stake),
                    _ => Err("election not in announcing stage")
                }
            } else {
                Err("election not running")
            }
        }

        fn vote_for_candidate(origin, commitment: T::Hash, stake: T::Balance) -> Result {
            let sender = ensure_signed(origin)?;
            // Can only vote during election voting stage
            if let Some(stage) = Self::stage() {
                match stage {
                    Stage::Voting(_) => Self::try_add_vote(sender, stake, commitment),
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
                    Stage::Revealing(_) => Self::try_reveal_vote(sender, commitment, vote, salt),
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

    #[test]
    fn default_paramas_should_work () {

    }

    fn assert_announcing_period (expected_period: Period<<Test as system::Trait>::BlockNumber>) {
        assert!(Election::stage().is_some(), "Election Stage was not set");

        let election_stage = Election::stage().unwrap();

        match election_stage {
            election::Stage::Announcing(period) => {
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
            
            let prev_round = Election::round();

            Election::start_election(None);

            // election round is bumped
            assert_eq!(Election::round(), prev_round + 1);

            // we enter the announcing stage for a specified period
            assert_announcing_period(election::Period {
                starts: 1,
                ends: 1 + election::ANNOUNCING_PERIOD
            });

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
                council::Seat {
                    member: council_stakeholders[0],
                    stake: council_stakes[0],
                    backers: vec![
                        council::Backer {
                            member: backing_stakeholders[0],
                            stake: 2,
                        },
                        council::Backer {
                            member: backing_stakeholders[3],
                            stake: 5,
                        }]
                },

                council::Seat {
                    member: council_stakeholders[1],
                    stake: council_stakes[1],
                    backers: vec![
                        council::Backer {
                            member: backing_stakeholders[1],
                            stake: 4,
                        },
                        council::Backer {
                            member: backing_stakeholders[3],
                            stake: 5,
                        }]
                },

                council::Seat {
                    member: council_stakeholders[2],
                    stake: council_stakes[2],
                    backers: vec![council::Backer {
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

            // must provide stake
            assert!(Election::try_add_applicant(applicant, 0).is_err());
            
            // Get some balance
            let starting_balance = (election::COUNCIL_MIN_STAKE * 10) as u32;
            Balances::set_free_balance(&applicant, starting_balance);

            // must provide min stake
            let stake = election::COUNCIL_MIN_STAKE as u32;
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
            let starting_stake = election::COUNCIL_MIN_STAKE as u32;
    
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

    }

    #[test]
    fn applicants_announcing_when_not_in_announcing_stage_should_not_work () {

    }

    fn create_and_add_applicant (
        id: <Test as system::Trait>::AccountId,
        balance: <Test as balances::Trait>::Balance,
        stake: <Test as balances::Trait>::Balance
    ) {
        Balances::set_free_balance(&id, balance);
        assert!(Election::try_add_applicant(id, stake).is_ok(), "failed to add mock account and applicant");
    }

    #[test]
    fn moving_to_voting_without_enough_applicants_should_not_work() {
        with_externalities(&mut initial_test_ext(), || {
            System::set_block_number(1);
            let ann_period = Election::move_to_announcing_stage();
            let round = Election::round();

            // add applicants
            assert_eq!(Election::applicants().len(), 0);
            create_and_add_applicant(20, (election::COUNCIL_MIN_STAKE * 10) as u32, election::COUNCIL_MIN_STAKE as u32);
            create_and_add_applicant(21, (election::COUNCIL_MIN_STAKE * 10) as u32, election::COUNCIL_MIN_STAKE as u32);
            
            let applicants = Election::applicants();
            assert_eq!(applicants.len(), 2);

            // make sure we are testing the condition that we don't have enought applicants
            assert!(election::COUNCIL_SIZE > applicants.len());

            // try to move to voting stage
            System::set_block_number(ann_period.ends);
            Election::on_announcing_ended();

            // A new round should have been started
            assert_eq!(Election::round(), round + 1);

            // A new announcing period started
            assert_announcing_period(Period {
                starts: ann_period.ends,
                ends: ann_period.ends + election::ANNOUNCING_PERIOD,
            });

            // applicants list should be unchanged..
            assert_eq!(Election::applicants(), applicants);
        });
    }

    #[test]
    fn top_applicants_become_candidates_should_work() {

    }

    #[test]
    fn refunding_applicant_stakes_should_work () {

    }

    #[test]
    fn votes_can_be_submitted_in_voting_stage () {

    }

    #[test]
    fn votes_can_be_revealed_in_revealing_stage () {

    }

    #[test]
    fn invalid_votes_should_not_work () {

    }

    #[test]
    fn vote_tallying_should_work () {

    }

    #[test]
    fn refunding_voting_stakes_should_work () {

    }

    #[test]
    fn council_is_set_after_revealing_should_work() {

    }
}