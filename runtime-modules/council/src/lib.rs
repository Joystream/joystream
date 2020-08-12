// TODO: module documentation
// TODO: adjust all extrinsic weights

/////////////////// Configuration //////////////////////////////////////////////
#![cfg_attr(not(feature = "std"), no_std)]

// used dependencies
use codec::{Codec, Decode, Encode};
use sp_runtime::traits::{MaybeSerialize, Member};
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage, error::BadOrigin, traits::Get, Parameter
};
use sp_arithmetic::traits::{BaseArithmetic, One};

#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use std::marker::PhantomData;
use system::ensure_signed;

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

pub trait Trait: system::Trait {
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type Tmp: Parameter // needed to provide some parameter to event
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    /// Minimum number of candidates needed to conclude announcing period
    type MinNumberOfCandidates: Get<u64>;
    /// Duration of annoncing period
    type AnnouncingPeriodDuration: Get<Self::BlockNumber>;
    /// Duration of idle period
    type IdlePeriodDuration: Get<Self::BlockNumber>;


    fn is_super_user(account_id: &<Self as system::Trait>::AccountId) -> bool;
}

decl_storage! {
    trait Store for Module<T: Trait> as Referendum {
        /// Current referendum stage
        pub Stage get(fn stage) config(): (CouncilElectionStage, T::BlockNumber);

        pub CouncilMembers get(fn council_members) config(): Vec<Candidate>;
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

        // User cant unlock stake because idle period is not running right now.
        IdlePeriodNotRunning,
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

/////////////////// Module definition and implementation ///////////////////////

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        /// Setup events
        fn deposit_event() = default;

        /////////////////// Lifetime ///////////////////////////////////////////

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

        /// Finalize the announcing period and start voting if there are enough candidates.
        #[weight = 10_000_000]
        pub fn finalize_announcing_period(origin) -> Result<(), Error<T>> {
            // ensure action can be started
            let candidates = EnsureChecks::<T>::can_finalize_announcing_period(origin)?;

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
            Mutations::<T>::finalize_announcing_period(&candidates);

            // emit event
            Self::deposit_event(RawEvent::VotingPeriodStarted(candidates));

            Ok(())
        }

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

        /// Unlock stake after voting (unless you are current council member).
        #[weight = 10_000_000]
        pub fn unlock_stake(origin) -> Result<(), Error<T>> {
            // ensure action can be started
            let elected_members = EnsureChecks::<T>::can_unlock_stake(origin)?;

            //
            // == MUTATION SAFE ==
            //

            // update state
            Mutations::<T>::unlock_stake(elected_members);

            // emit event
            Self::deposit_event(RawEvent::RevealingPeriodStarted());

            Ok(())
        }
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

    fn finalize_announcing_period(candidates: &Vec<Candidate>) -> () {
        let block_number = <system::Module<T>>::block_number();

        Stage::<T>::mutate(|value| *value = (CouncilElectionStage::Election, block_number));

        // TODO: start election
        // let max_counil_members =  T::MaxCouncilMembers::get();
        // ...start_election(candidates, max_counil_members)
    }

    fn start_idle_period(elected_members: &Vec<Candidate>) -> () {
        let block_number = <system::Module<T>>::block_number();

        Stage::<T>::mutate(|value| *value = (CouncilElectionStage::Idle, block_number));

        CouncilMembers::mutate(|value| *value = elected_members.clone());
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
        if !T::is_super_user(&account_id) {
            return Err(Error::OriginNotSuperUser);
        }

        Ok(account_id)
    }

    fn ensure_regular_user(origin: T::Origin) -> Result<T::AccountId, Error<T>> {
        let account_id = ensure_signed(origin)?;

        Ok(account_id)
    }

    /////////////////// Action checks //////////////////////////////////////////

    fn can_start_announcing_period(
        origin: T::Origin,
    ) -> Result<(), Error<T>> {
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

    fn can_finalize_announcing_period(
        origin: T::Origin,
    ) -> Result<Vec<Candidate>, Error<T>> {
        // ensure superuser requested action
        Self::ensure_super_user(origin)?;

        let candidates = vec![]; // TODO: retrieve real list of candidates

        Ok(candidates)
    }

    fn can_start_idle_period(
        origin: T::Origin,
    ) -> Result<Vec<Candidate>, Error<T>> {
        // ensure superuser requested action
        Self::ensure_super_user(origin)?;

        // TODO: check referendum ended

        let elected_members = vec![]; // TODO: retrieve real list of elected council members

        Ok(elected_members)
    }

    fn can_unlock_stake(
        origin: T::Origin,
    ) -> Result<T::AccountId, Error<T>> {
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
