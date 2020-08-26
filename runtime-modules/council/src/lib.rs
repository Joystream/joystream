// TODO: module documentation
// TODO: adjust all extrinsic weights

/////////////////// Configuration //////////////////////////////////////////////
#![cfg_attr(not(feature = "std"), no_std)]

// used dependencies
use codec::{Codec, Decode, Encode};
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage, error::BadOrigin, Parameter,
};
use frame_support::traits::{Currency, Get};
use sp_arithmetic::traits::{BaseArithmetic, One};
use sp_runtime::traits::{MaybeSerialize, Member};

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use std::marker::PhantomData;
use system::ensure_signed;

use referendum::Instance as ReferendumInstanceGeneric;
use referendum::Trait as ReferendumTrait;
use referendum::{ReferendumManager};

// declared modules
mod mock;
mod tests;

/////////////////// Data Structures ////////////////////////////////////////////

#[derive(Encode, Decode, PartialEq, Eq, Debug)]
pub enum CouncilElectionStage {
    Void, // init state - behaves the same way as IdlePeriod but can be immediately changed to `Election`
    Election,
    Announcing,
    Idle,
}

impl Default for CouncilElectionStage {
    fn default() -> CouncilElectionStage {
        CouncilElectionStage::Void
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, PartialEq, Eq, Debug, Default, Clone)]
pub struct Candidate {
    tmp: u64,
}

/////////////////// Trait, Storage, Errors, and Events /////////////////////////

// TODO: look for ways to check that selected instance is only used in this module to prevent unexpected behaviour
// The storage alias for referendum instance.
pub(crate) type ReferendumInstance = referendum::Instance0;

// Alias for referendum's storage.
//pub(crate) type Referendum<T> = referendum::Module<T, ReferendumInstance>;

pub trait Trait: system::Trait + referendum::Trait<ReferendumInstance> {
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type Tmp: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    /// Minimum number of candidates needed to conclude announcing period
    type MinNumberOfCandidates: Get<u64>;
    /// Council member count
    type CouncilSize: Get<u64>;
    /// Duration of annoncing period
    type AnnouncingPeriodDuration: Get<Self::BlockNumber>;
    /// Duration of idle period
    type IdlePeriodDuration: Get<Self::BlockNumber>;

    fn is_super_user(account_id: &<Self as system::Trait>::AccountId) -> bool;
}

decl_storage! {
    trait Store for Module<T: Trait> as Referendum {
        /// Current council voting stage
        pub Stage get(fn stage) config(): (CouncilElectionStage, T::BlockNumber);

        /// Current council members
        pub CouncilMembers get(fn council_members) config(): Vec<Candidate>;

        /// Current candidates to council
        pub Candidates get(fn candidates) config(): Vec<(Candidate, Balance<T>)>;
    }
}

decl_event! {
    pub enum Event<T>
    where
        <T as Trait>::Tmp
    {
        /// New council was elected
        AnnouncingPeriodStarted(Tmp),

        /// Announcing period can't finish because of insufficient candidtate count
        NotEnoughCandidates(),

        /// Candidates are announced and voting starts
        VotingPeriodStarted(Vec<Candidate>),

        /// Revealing periods has started
        RevealingPeriodStarted(),

        /// Revealing period has finished and new council was elected
        RevealingPeriodFinished(/* TODO */),

        /// Idle period started
        IdlePeriodStarted(),

        /// New candidate announced
        NewCandidate(Candidate),
    }
}

decl_error! {
    /// Referendum errors
    pub enum Error for Module<T: Trait> {
        /// Origin is invalid
        BadOrigin,

        /// Origin doesn't correspond to any superuser
        OriginNotSuperUser,

        /// Council election cannot run twice at the same time
        ElectionAlreadyRunning,

        /// Idle period is still running
        IdlePeriodNotFinished,

        /// User can't unlock stake because idle period is not running right now
        IdlePeriodNotRunning,

        /// Election is still running
        ElectionNotFinished,
    }
}

impl<T: Trait, RT: ReferendumTrait<I>, I: ReferendumInstanceGeneric> From<referendum::Error<RT, I>>
    for Error<T>
{
    fn from(other: referendum::Error<RT, I>) -> Error<T> {
        panic!(format!("{:?}", other)); // temporary debug
        Error::<T>::BadOrigin // TODO: find way to select proper error
    }
}

impl<T: Trait> PartialEq for Error<T> {
    fn eq(&self, other: &Self) -> bool {
        self.as_u8() == other.as_u8()
    }
}

impl<T: Trait> From<BadOrigin> for Error<T> {
    fn from(_error: BadOrigin) -> Self {
        Error::<T>::BadOrigin
    }
}

/////////////////// Type aliases ///////////////////////////////////////////////

type Balance<T> =
    <<T as referendum::Trait<ReferendumInstance>>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

/////////////////// Module definition and implementation ///////////////////////

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        /// Setup events
        fn deposit_event() = default;

        /////////////////// Lifetime ///////////////////////////////////////////

        // No origin so this is a priviledged call
        fn on_finalize(now: T::BlockNumber) {
            Self::try_progress_stage(now);
        }

        /// Start new council election.
        #[weight = 10_000_000]
        pub fn start_announcing_period(origin) -> Result<(), Error<T>> {
            // ensure action can be started
            EnsureChecks::<T>::can_start_announcing_period(origin)?;

            //
            // == MUTATION SAFE ==
            //

            // update state
            Mutations::<T>::start_announcing_period();

            // emit event
            Self::deposit_event(RawEvent::AnnouncingPeriodStarted(1.into())); // TODO

            Ok(())
        }
/*
        /// Finalize the announcing period and start voting if there are enough candidates.
        #[weight = 10_000_000]
        pub fn finalize_announcing_period(origin) -> Result<(), Error<T>> {
            // ensure action can be started
            let candidates = EnsureChecks::<T>::can_finalize_announcing_period(origin.clone())?;

            //
            // == MUTATION SAFE ==
            //

            // prolong announcing period when not enough candidates registered
            if (candidates.len() as u64) < T::MinNumberOfCandidates::get() {
                Mutations::<T>::prolong_announcing_period();

                // emit event
                Self::deposit_event(RawEvent::NotEnoughCandidates());

                return Ok(());
            }

            // update state
            Mutations::<T>::finalize_announcing_period(origin, &candidates)?;

            // emit event
            Self::deposit_event(RawEvent::VotingPeriodStarted(candidates.iter().map(|item| item.0.clone()).collect()));

            Ok(())
        }
*/

        /// Start revealing period.
        #[weight = 10_000_000]
        pub fn start_idle_period(origin) -> Result<(), Error<T>> {
            // ensure action can be started
            let elected_members = EnsureChecks::<T>::can_start_idle_period(origin)?;

            //
            // == MUTATION SAFE ==
            //

            // update state
            Mutations::<T>::start_idle_period(&elected_members);

            // emit event
            Self::deposit_event(RawEvent::IdlePeriodStarted());

            Ok(())
        }

        /// Subscribe candidate
        #[weight = 10_000_000]
        pub fn candidate(origin, stake: Balance<T>) -> Result<(), Error<T>> {
            // ensure action can be started
            let candidate = EnsureChecks::<T>::can_candidate(origin)?;

            //
            // == MUTATION SAFE ==
            //

            // update state
            Mutations::<T>::candidate(&candidate, &stake);

            // emit event
            Self::deposit_event(RawEvent::NewCandidate(candidate));

            Ok(())
        }

        /// Unlock stake after voting (unless you are current council member).
        #[weight = 10_000_000]
        pub fn release_stake(origin) -> Result<(), Error<T>> {
            // ensure action can be started
            let elected_members = EnsureChecks::<T>::can_unlock_stake(origin)?;

            
/*
            //
            // == MUTATION SAFE ==
            //

            // update state
            Mutations::<T>::release_stake(elected_members);

            // emit event
            Self::deposit_event(RawEvent::RevealingPeriodStarted());
*/
            Ok(())
        }

        /////////////////// Referendum Wrap ////////////////////////////////////
        // start voting period
        #[weight = 10_000_000]
        pub fn vote(origin, commitment: T::Hash, balance: Balance<T>) -> Result<(), Error<T>> {
            // call referendum vote extrinsic
            <referendum::Module<T, ReferendumInstance>>::vote(origin, commitment, balance)?;

            Ok(())
        }

        #[weight = 10_000_000]
        pub fn reveal_vote(origin, salt: Vec<u8>, vote_option_index: u64) -> Result<(), Error<T>> {
            // call referendum reveal vote extrinsic
            <referendum::Module<T, ReferendumInstance>>::reveal_vote(origin, salt, vote_option_index)?;

            Ok(())
        }
    }
}

/////////////////// Inner logic ////////////////////////////////////////////////

impl<T: Trait> Module<T> {
    /// Checkout expire of referendum stage.
    fn try_progress_stage(now: T::BlockNumber) {
        match Stage::<T>::get() {
            (CouncilElectionStage::Announcing, _) => {
                if now == Stage::<T>::get().1 + T::AnnouncingPeriodDuration::get() {
                    Self::end_announcement_period();
                }
            }
            // TODO
            _ => (),
        }
    }

    /// Finish voting and start ravealing.
    fn end_announcement_period() {
        let candidates = Candidates::<T>::get();

        // prolong announcing period when not enough candidates registered
        if (candidates.len() as u64) < T::MinNumberOfCandidates::get() {
            Mutations::<T>::prolong_announcing_period();

            // emit event
            Self::deposit_event(RawEvent::NotEnoughCandidates());

            return;
        }

        // TODO: try to find way how to get rid of unwrap here or staticly ensure it will not fail here
        // update state
        Mutations::<T>::finalize_announcing_period(&candidates).unwrap(); // starting referendum should always start - unwrap

        // emit event
        Self::deposit_event(RawEvent::VotingPeriodStarted(candidates.iter().map(|item| item.0.clone()).collect()));
    }
}

/////////////////// Mutations //////////////////////////////////////////////////

struct Mutations<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> Mutations<T> {
    fn start_announcing_period() -> () {
        Self::prolong_announcing_period();
    }

    fn prolong_announcing_period() {
        let block_number = <system::Module<T>>::block_number();

        Stage::<T>::mutate(|value| *value = (CouncilElectionStage::Announcing, block_number));
    }

    fn finalize_announcing_period(
        candidates: &Vec<(Candidate, Balance<T>)>,
    ) -> Result<(), Error<T>> {
        let winning_target_count = T::CouncilSize::get();

        // IMPORTANT - because locking currency can fail it has to be the first mutation!
        <referendum::Module<T, ReferendumInstance> as ReferendumManager<T, ReferendumInstance>>::start_referendum(
            candidates.len() as u64,
            winning_target_count,
        )?;

        let block_number = <system::Module<T>>::block_number();

        Stage::<T>::mutate(|value| *value = (CouncilElectionStage::Election, block_number));

        Ok(())
    }

    fn start_idle_period(elected_members: &Vec<Candidate>) -> () {
        let block_number = <system::Module<T>>::block_number();

        Stage::<T>::mutate(|value| *value = (CouncilElectionStage::Idle, block_number));

        CouncilMembers::mutate(|value| *value = elected_members.clone());
    }

    fn candidate(candidate: &Candidate, stake: &Balance<T>) -> () {
        Candidates::<T>::mutate(|current_candidates| {
            let mut inserted = false;
            for (i, c) in current_candidates.iter().enumerate() {
                if stake > &c.1 {
                    current_candidates.insert(i, (candidate.clone(), stake.clone()));
                    inserted = true;
                    break;
                }
            }

            if !inserted {
                current_candidates.push((candidate.clone(), stake.clone()));
            }

            let council_size = T::CouncilSize::get();
            if current_candidates.len() as u64 > council_size {
                *current_candidates = current_candidates[..council_size as usize].to_vec();
            }
        });
    }

    fn unlock_stake(account_id: T::AccountId) -> () {
        // TODO
    }
}

/////////////////// Ensure checks //////////////////////////////////////////////

struct EnsureChecks<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> EnsureChecks<T> {
    /////////////////// Common checks //////////////////////////////////////////

    fn ensure_super_user(origin: T::Origin) -> Result<T::AccountId, Error<T>> {
        let account_id = ensure_signed(origin)?;

        // ensure superuser requested action
        if !<T as Trait>::is_super_user(&account_id) {
            return Err(Error::OriginNotSuperUser);
        }

        Ok(account_id)
    }

    fn ensure_regular_user(origin: T::Origin) -> Result<T::AccountId, Error<T>> {
        let account_id = ensure_signed(origin)?;

        Ok(account_id)
    }

    /////////////////// Action checks //////////////////////////////////////////

    fn can_start_announcing_period(origin: T::Origin) -> Result<(), Error<T>> {
        // ensure superuser requested action
        Self::ensure_super_user(origin)?;

        let (stage, starting_block_number) = Stage::<T>::get();

        // ensure council election is not already running
        if stage != CouncilElectionStage::Void && stage != CouncilElectionStage::Idle {
            return Err(Error::ElectionAlreadyRunning);
        }

        // skip idle period duration check when starting announcing period from `Void` (initial) state
        if stage == CouncilElectionStage::Void {
            return Ok(());
        }

        let current_block = <system::Module<T>>::block_number();

        // ensure voting stage is complete
        if current_block < T::IdlePeriodDuration::get() + starting_block_number + One::one() {
            return Err(Error::IdlePeriodNotFinished);
        }

        Ok(())
    }
/*
    fn can_finalize_announcing_period(
        origin: T::Origin,
    ) -> Result<Vec<(Candidate, Balance<T>)>, Error<T>> {
        // ensure superuser requested action
        Self::ensure_super_user(origin)?;

        let candidates_info = Candidates::<T>::get();

        Ok(candidates_info)
    }
*/
    fn can_start_idle_period(origin: T::Origin) -> Result<Vec<Candidate>, Error<T>> {
        // ensure superuser requested action
        Self::ensure_super_user(origin)?;

        // check that referendum have ended
        let referendum_stage = referendum::Stage::<T, ReferendumInstance>::get();
        if referendum_stage != referendum::ReferendumStage::Inactive {
            return Err(Error::ElectionNotFinished);
        }

        let elected_members = vec![]; // TODO: retrieve real list of elected council members

        Ok(elected_members)
    }

    fn can_candidate(origin: T::Origin) -> Result<Candidate, Error<T>> {
        // ensure superuser requested action
        Self::ensure_regular_user(origin)?;

        // TODO: create proper candidate
        let candidate = Candidate { tmp: 0 };

        Ok(candidate)
    }

    fn can_release_stake(origin: T::Origin) -> Result<T::AccountId, Error<T>> {
        // ensure regular user requested action
        let account_id = Self::ensure_regular_user(origin)?;

        let (stage, starting_block_number) = Stage::<T>::get();

        if stage != CouncilElectionStage::Idle {
            return Err(Error::IdlePeriodNotRunning);
        }

        // TODO: check user has locked stake

        Ok(account_id)
    }
}
