extern crate parity_codec;
use self::parity_codec::Encode;
use srml_support::{StorageValue, StorageMap, StorageVec, dispatch::Result};
use runtime_primitives::traits::{Hash, As, Zero};
use {balances, system::{self, ensure_signed}};
use runtime_io::print;
use srml_support::dispatch::Vec;

use governance::transferable_stake::Stake;
use governance::council;
use governance::sealed_vote::SealedVote;

pub trait Trait: system::Trait + council::Trait + balances::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

#[derive(Clone, Copy, Encode, Decode)]
pub struct Period<T: PartialOrd + PartialEq + Copy> {
    pub start: T,
    pub end: T
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
            Err("election in progress")
        } else {
            print("Election: Starting");
            let current_block = <system::Module<T>>::block_number();
            Self::deposit_event(RawEvent::ElectionStarted(current_block));
            // take snapshot of council and backing stakes
            Self::initialize_transferable_stakes();
            Self::move_to_announcing_stage();
            Ok(())
        }
    }

    fn new_period(length: T::BlockNumber) -> Period<T::BlockNumber> {
        let current_block = <system::Module<T>>::block_number();
        Period {
            start: current_block,
            end: current_block + length
        }
    }

    fn bump_round() -> Round {
        // bump the round number
        // <ElectionRound<T>>::mutate(|n| *n += 1) // doesn't return anything
        let next_round = Self::round() + 1;
        <ElectionRound<T>>::put(next_round);
        print("Bumping Election Round");
        next_round
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
            let mut applicants: Vec<(T::AccountId, Stake<T::Balance>)> = Vec::new();
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
        <ElectionStage<T>>::kill();
        Self::deposit_event(RawEvent::ElectionCompleted());
        //Self::set_new_council(X);
        print("Election Round Ended");
    }

    fn tick(n: T::BlockNumber) {
        print("Election: tick");
        if let Some(stage) = Self::stage() {
            match stage {
                Stage::Announcing(period) => {
                    if period.end == n {
                        Self::deposit_event(RawEvent::AnnouncingEnded());
                        Self::on_announcing_ended();
                    }
                },
                Stage::Voting(period) => {
                    if period.end == n {
                        Self::deposit_event(RawEvent::VotingEnded());
                        Self::on_voting_ended();
                    }
                },
                Stage::Revealing(period) => {
                    if period.end == n {
                        Self::deposit_event(RawEvent::RevealingEnded());
                        Self::on_revealing_ended();
                    }
                },
            }
        }
    }

    pub fn can_start_election() -> bool {
        Self::stage().is_none()
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

        let transferable_stake = match <AvailableCouncilStakesMap<T>>::exists(&applicant) {
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

        if <balances::Module<T>>::decrease_free_balance(&applicant, new_stake.refundable).is_err() {
            return Err("failed to update balance");
        }

        <AvailableCouncilStakesMap<T>>::insert(&applicant, transferable_stake - new_stake.transferred);
       
        if !<ApplicantsMap<T>>::exists(&applicant) {
            <Applicants<T>>::mutate(|applicants| applicants.push(applicant.clone()));
        }
        
        if let Some(total_stake) = applicant_stake.checked_add(&new_stake) {
            let min_stake = Stake {
                refundable: T::Balance::sa(COUNCIL_MIN_STAKE),
                transferred: T::Balance::zero()
            };

            if min_stake > total_stake {
                return Err("minimum stake not met");
            }

            <ApplicantsMap<T>>::insert(applicant.clone(), total_stake);
            return Ok(());
        } else {
            return Err("overflow adding new stake");
        }
    }

    fn try_add_vote(voter: T::AccountId, stake: T::Balance, commitment: T::Hash) -> Result {
        let transferable_stake: T::Balance = match <AvailableBackingStakesMap<T>>::exists(&voter) {
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

        <AvailableBackingStakesMap<T>>::insert(voter.clone(), transferable_stake - vote_stake.transferred);

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
            return Err("sender is not owner of vote");
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
        fn on_finalise(n: T::BlockNumber){
            let _ = Self::tick(n);
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
