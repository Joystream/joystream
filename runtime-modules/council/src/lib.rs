// TODO: module documentation

/////////////////// Configuration //////////////////////////////////////////////
#![cfg_attr(not(feature = "std"), no_std)]

// used dependencies
use codec::{Codec, Decode, Encode};
use sr_primitives::traits::{MaybeSerialize, Member, One, SimpleArithmetic};
use srml_support::{decl_error, decl_event, decl_module, decl_storage, traits::Get, Parameter};
use std::marker::PhantomData;
use system::ensure_signed;

// declared modules
mod mock;
mod tests;

/////////////////// Data Structures ////////////////////////////////////////////

#[derive(Encode, Decode, PartialEq, Eq, Debug)]
pub enum CouncilStage {
    Void,
}

impl Default for CouncilStage {
    fn default() -> CouncilStage {
        CouncilStage::Void
    }
}


/////////////////// Trait, Storage, Errors, and Events /////////////////////////

pub trait Trait: system::Trait {
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type Tmp: Parameter // needed to provide some parameter to event
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    fn is_super_user(account_id: &<Self as system::Trait>::AccountId) -> bool;
}

decl_storage! {
    trait Store for Module<T: Trait> as Referendum {
        /// Current referendum stage
        pub Stage get(stage) config(): (CouncilStage, T::BlockNumber);
    }
}

decl_event! {
    pub enum Event<T>
    where
        <T as Trait>::Tmp
    {
        /// New council was elected
        ElectionCycleStarted(Tmp),
    }
}

decl_error! {
    #[derive(Copy)]
    /// Referendum errors
    pub enum Error {
        /// Origin doesn't correspond to any superuser
        OriginNotSuperUser,
    }
}

impl From<system::Error> for Error {
    fn from(error: system::Error) -> Self {
        match error {
            system::Error::Other(msg) => Error::Other(msg),
            system::Error::RequireRootOrigin => Error::OriginNotSuperUser,
            _ => Error::Other(error.into()),
        }
    }
}

/////////////////// Module definition and implementation ///////////////////////

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error;

        /// Setup events
        fn deposit_event() = default;

        /////////////////// Lifetime ///////////////////////////////////////////

        // start new council election period
        pub fn start_election_cycle(origin) -> Result<(), Error> {
            // ensure action can be started
            EnsureChecks::<T>::can_start_election_cycle(origin)?;

            //
            // == MUTATION SAFE ==
            //

            // update state
            Mutations::<T>::start_election_cycle();

            // emit event
            Self::deposit_event(RawEvent::ElectionCycleStarted(1.into())); // TODO

            Ok(())
        }
    }
}

/////////////////// Mutations //////////////////////////////////////////////////

struct Mutations<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> Mutations<T> {
    fn start_election_cycle() -> () {

    }
}

/////////////////// Ensure checks //////////////////////////////////////////////

struct EnsureChecks<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> EnsureChecks<T> {
    /////////////////// Common checks //////////////////////////////////////////

    fn ensure_super_user(origin: T::Origin) -> Result<T::AccountId, Error> {
        let account_id = ensure_signed(origin)?;

        // ensure superuser requested action
        if !T::is_super_user(&account_id) {
            return Err(Error::OriginNotSuperUser);
        }

        Ok(account_id)
    }

    /////////////////// Action checks //////////////////////////////////////////

    fn can_start_election_cycle(
        origin: T::Origin,
    ) -> Result<(), Error> {
        // ensure superuser requested action
        Self::ensure_super_user(origin)?;

        Ok(())
    }
}
