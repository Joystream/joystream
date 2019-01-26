#![cfg_attr(not(feature = "std"), no_std)]

extern crate sr_std;
#[cfg(test)]
extern crate sr_io;
#[cfg(test)]
extern crate substrate_primitives;
extern crate sr_primitives;
#[cfg(feature = "std")]
extern crate parity_codec as codec;
extern crate srml_system as system;

extern crate parity_codec;
//use self::parity_codec::Encode;
use srml_support::{StorageValue, StorageMap, dispatch::Result};
use runtime_primitives::traits::{Hash, As, Zero};
use {balances, system::{ensure_signed}};
use runtime_io::print;
use srml_support::dispatch::Vec;

use rstd::collections::btree_map::BTreeMap;

use super::transferable_stake::Stake;
use super::council;
use super::sealed_vote::SealedVote;

pub trait Trait: system::Trait + council::Trait + balances::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

#[derive(Clone, Copy, Encode, Decode)]
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

type Round = u32; // should go in the Trait? - only if it needs to configurabel

const ANNOUNCING_PERIOD:u64 = 20;
const VOTING_PERIOD:u64 = 20;
const REVEALING_PERIOD:u64 = 20;
const COUNCIL_SIZE: usize = 10;
const CANDIDACY_LIMIT: usize = 20;
const COUNCIL_MIN_STAKE: u64 = 100;

decl_storage! {
    trait Store for Module<T: Trait> as CouncilElection {
        //Current stage if there is an election ongoing
        ElectionStage get(stage): Option<Stage<T::BlockNumber>>;

        // The election round
        ElectionRound get(round): Round = 0;

        // map doesn't have a clear() method so need to keep track of keys to know 
        // what keys to delete later < if council is not modified during election
        // we could always re-computer the vectors
        BackingStakeHolders get(backing_stakeholders): Vec<T::AccountId>;
        CouncilStakeHolders get(council_stakeholders): Vec<T::AccountId>;
        AvailableBackingStakesMap get(backing_stakes): map T::AccountId => T::Balance;
        AvailableCouncilStakesMap get(council_stakes): map T::AccountId => T::Balance;

        Applicants get(applicants): Vec<T::AccountId>;
        ApplicantsMap get(applicants_map): map T::AccountId => Stake<T::Balance>;

        // probably don't need this state we only check existance in map
        // put in event instead good enough for ui
        Candidates get(candidates): Vec<T::AccountId>;
        CandidatesMap get(candidates_map): map T::AccountId => bool;

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
		ElectionStarted(BlockNumber),
        AnnouncingStarted(Round),
        AnnouncingEnded(),
        VotingStarted(),
        VotingEnded(),
        RevealingStarted(),
        RevealingEnded(),
        ElectionCompleted(),
	}
);


impl<T: Trait> Module<T> {
    pub fn start_election() -> Result {
        if Self::stage().is_some() {
            return Err("election in progress")
        }
        
        let current_block = <system::Module<T>>::block_number();
    
        if <council::Module<T>>::term_ended(current_block) {
            Self::deposit_event(RawEvent::ElectionStarted(current_block));
            // take snapshot of council and backing stakes
            Self::initialize_transferable_stakes();
            Self::move_to_announcing_stage();
        }

        Ok(())
    }

    fn new_period(length: T::BlockNumber) -> Period<T::BlockNumber> {
        let current_block = <system::Module<T>>::block_number();
        Period {
            starts: current_block,
            ends: current_block + length
        }
    }

    fn bump_round() -> Round {
        // bump the round number
        print("Bumping Election Round");
        <ElectionRound<T>>::mutate(|n| {
            *n += 1;
            *n
        })
    }

    fn move_to_announcing_stage() {
        let period = Self::new_period(T::BlockNumber::sa(ANNOUNCING_PERIOD));

        <ElectionStage<T>>::put(Stage::Announcing(period));
        
        let next_round = Self::bump_round();

        Self::deposit_event(RawEvent::AnnouncingStarted(next_round));
        print("Announcing Started");
    }

    fn on_announcing_ended() {
        if Self::applicants().len() < COUNCIL_SIZE {
            // Not enough candidates announced candidacy
            Self::move_to_announcing_stage();
        } else {
            // Sort Applicants by stake decending, and filter top CANDIDACY_LIMIT
            // Howto ensure deterministic sorting (stable sort -> sort_by_key) - also howto deal with
            // equal stake for bottom slot - order in applicants vector.
            // This is highly ineffieicent (cloning ApplicationId twice)
            // using functional style should help
            let mut applicants = Vec::new();
            for applicant in Self::applicants().iter() {
                let stake = Self::applicants_map(applicant);
                applicants.push((applicant.clone(), stake));
            }

            applicants.sort_by_key(|&(_, stake)| stake); // ASC or DESC ?
            applicants.reverse(); // If ASC
            applicants.truncate(CANDIDACY_LIMIT);

            let mut candidates: Vec<T::AccountId> = Vec::new();
            for (applicant, _) in applicants.iter() {
                <CandidatesMap<T>>::insert(applicant, true);
                candidates.push(applicant.clone());
            }
            <Candidates<T>>::put(candidates);
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
        for candidate in Self::candidates() {
           match new_council.get(&candidate) {
                Some(_) => (),
                None => {
                    new_council.insert(candidate.clone(), council::Seat {
                        member: candidate.clone(),
                        stake: Self::applicants_map(candidate).total(),
                        backers: Vec::new(),
                    });
                }
           }
        }

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


//   refund all vote stakes for candidates that did not get elected
//   refund all applicantsPool stakes for applicants that did not get elected 
        // (maybe this should have been done when moving to voting stage, so applicants who did not make it to
        // to be candidates can reuse their stake for voting?)
        // since candidates is a subest of applicants, this will obvioulsy include non elected candidates.
//   refund all unused availableBackingStakes
//   refund all unused availableCouncilStakes
  
        Self::refund_voting_stakes(&votes, &new_council);
        Self::refund_applicant_stakes(&new_council);
        Self::refund_unused_transferable_stakes();

        <ElectionStage<T>>::kill();
        
        //<council::Module<T>>::set_council(&new_council);
        
        Self::deposit_event(RawEvent::ElectionCompleted());
        print("Election Completed");
    }

    fn refund_unused_transferable_stakes() {
        // BackingStakeHolders get(backing_stakeholders): Vec<T::AccountId>;
        // CouncilStakeHolders get(council_stakeholders): Vec<T::AccountId>;
        // AvailableBackingStakesMap get(backing_stakes): map T::AccountId => T::Balance;
        // AvailableCouncilStakesMap get(council_stakes): map T::AccountId => T::Balance;
        
        // move stakes back to account holder's free balance

        // clear snapshot
    }

    fn refund_applicant_stakes(new_council: &BTreeMap<T::AccountId, council::Seat<T::AccountId, T::Balance>>) {
        for applicant in Self::applicants().iter() {
            let do_refund = match new_council.get(&applicant) {
                Some(_) => false,
                None => true
            };

            if do_refund {
                Self::return_stake_to(&applicant, <ApplicantsMap<T>>::get(applicant));
            }

            <ApplicantsMap<T>>::remove(applicant);
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
                            stake: Self::applicants_map(candidate).total(),
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
    fn initialize_transferable_stakes() {
        if let Some(council) = <council::Module<T>>::council() {
            let mut accounts_council: Vec<T::AccountId> = Vec::new();
            let mut accounts_backers: Vec<T::AccountId> = Vec::new();
            for ref seat in council.iter() {
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
    }

    fn try_add_applicant(applicant: T::AccountId, stake: T::Balance) -> Result {
        let applicant_stake = match <ApplicantsMap<T>>::exists(&applicant) {
            false => Default::default(), //zero
            true => <ApplicantsMap<T>>::get(&applicant)
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
        
        let min_stake = Stake {
            refundable: T::Balance::sa(COUNCIL_MIN_STAKE),
            transferred: T::Balance::zero()
        };

        if min_stake > total_stake {
            return Err("minimum stake not met");
        }   

        if <balances::Module<T>>::decrease_free_balance(&applicant, new_stake.refundable).is_err() {
            return Err("failed to update balance");
        }

        if applicant_has_council_stake {
            <AvailableCouncilStakesMap<T>>::insert(&applicant, transferable_stake - new_stake.transferred);
        }
       
        if !<ApplicantsMap<T>>::exists(&applicant) {
            <Applicants<T>>::mutate(|applicants| applicants.push(applicant.clone()));
        }

        <ApplicantsMap<T>>::insert(applicant.clone(), total_stake);

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
        if !<CandidatesMap<T>>::exists(&candidate) {
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
