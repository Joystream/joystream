extern crate parity_codec;

use self::parity_codec::Encode;
use srml_support::{StorageValue, StorageMap, dispatch::Result};
use runtime_primitives::traits::{Hash, As};
use {balances, system::{self, ensure_signed}};
use runtime_io::print;

use governance::council;

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

#[derive(Clone, Copy, Encode, Decode, Default)]
pub struct Stake<Balance> {
    pub refundable: Balance,
    pub transferred: Balance,
}

type Round = u32; // should go in the Trait? - only if it needs to configurabel

const ANNOUNCING_PERIOD:u64 = 20;
const VOTING_PERIOD:u64 = 20;
const REVEALING_PERIOD:u64 = 20;
const COUNCIL_SIZE: usize = 10;
const CANDIDACY_LIMIT: usize = 20;
const COUNCIL_MIN_STAKE: u32 = 100;

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

        Applicants get(applicants): Vec<(T::AccountId, T::Balance)>;
        ApplicantsMap get(applicants_map): map T::AccountId => Stake<T::Balance>;

        Candidates get(candidates): Vec<T::AccountId>;
        CandidatesMap get(candidates_map): map T::AccountId => bool;
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
            let mut applicants = Self::applicants();
            applicants.sort_by_key(|&(_, stake)| stake); // ASC or DESC ?
            applicants.reverse(); // If ASC
            let mut candidates: Vec<T::AccountId> = vec![];
            for (ref applicant, _) in applicants[0..CANDIDACY_LIMIT].iter() {
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
            let mut accountsCouncil: Vec<T::AccountId> = vec![];
            let mut accountsBackers: Vec<T::AccountId> = vec![];
            for ref seat in council.iter() {
                <AvailableCouncilStakesMap<T>>::insert(seat.member, seat.stake);
                accountsCouncil.push(seat.member);
                for ref backer in seat.backers.iter() {
                    if !<AvailableBackingStakesMap<T>>::exists(backer.member) {
                        <AvailableBackingStakesMap<T>>::insert(backer.member, backer.stake);
                        accountsBackers.push(backer.member);
                    } else {
                        <AvailableBackingStakesMap<T>>::mutate(backer.member, |stake| *stake += backer.stake);
                    }
                }
            }

            <CouncilStakeHolders<T>>::put(accountsCouncil);
            <BackingStakeHolders<T>>::put(accountsBackers);
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
    }
}
