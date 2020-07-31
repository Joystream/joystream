// TODO: module documentation

// NOTE: This module is instantiable pallet as described here https://substrate.dev/recipes/3-entrees/instantiable.html
// No default instance is provided.

/////////////////// Configuration //////////////////////////////////////////////
#![cfg_attr(not(feature = "std"), no_std)]

// used dependencies
use codec::{Decode, Encode};
use srml_support::Parameter;
use srml_support::{decl_error, decl_event, decl_module, decl_storage};
use std::marker::PhantomData;
use system::ensure_signed;

//use sr_primitives::traits::{MaybeSerialize, Member, One, SimpleArithmetic};
//use codec::{Codec};

// conditioned dependencies
//#[cfg(feature = "std")]
//use serde::serde_derive::{Deserialize, Serialize};

// declared modules
mod mock;
mod tests;

/////////////////// Data Structures ////////////////////////////////////////////

#[derive(Encode, Decode, PartialEq, Eq, Debug)]
pub enum ReferendumStage {
    Void,
    Voting,
    Revealing,
}

impl Default for ReferendumStage {
    fn default() -> ReferendumStage {
        ReferendumStage::Void
    }
}

/////////////////// Trait, Storage, Errors, and Events /////////////////////////

pub trait Trait<I: Instance>: system::Trait {
    /// The overarching event type.
    type Event: From<Event<Self, I>> + Into<<Self as system::Trait>::Event>;

    // we need to use at least one type belogning to `Trait` to supress `decl_storage` macro's errors
    type TmpDummy: Parameter + Default;

    fn is_super_user(account_id: &<Self as system::Trait>::AccountId) -> bool;
}

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance> as Referendum {
        // Current stage if there is an election running
        Stage get(stage) config(): (ReferendumStage, T::BlockNumber);

        Tmp get(tmp) config(): Option<T::TmpDummy>;
    }

    /* This might be needed in some cases
    // add_extra_genesis has to be present in Instantiable Modules - see https://github.com/paritytech/substrate/blob/master/frame/support/procedural/src/lib.rs#L217
    add_extra_genesis {
        config(phantom): PhantomData<I>;
    }
    */
}

decl_event! {
    pub enum Event<T, I>
    where
        <T as system::Trait>::BlockNumber,
    {
        // temporary event
        ReferendumStarted(BlockNumber),
        RevealingPhaseStarted(BlockNumber),
        ReferendumFinished(BlockNumber),
    }
}

decl_error! {
    #[derive(Copy)]
    /// Referendum errors
    pub enum Error {
        /// Origin doesn't correspond to any superuser
        OriginNotSuperUser,

        /// Referendum cannot run twice at the same time
        ReferendumAlreadyRunning,
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
    pub struct Module<T: Trait<I>, I: Instance> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error;

        /////////////////// Lifetime ///////////////////////////////////////////

        // start voting period
        pub fn start_referendum(origin) -> Result<(), Error> {
            // prepare referendum

            //EnsureChecks<T>::can_start_referendum()?;
            EnsureChecks::<T, I>::can_start_referendum(origin)?;

            // change referendum state
            Stage::<T, I>::put((ReferendumStage::Voting, T::BlockNumber::from(0))); // TODO: get block number or remove it from stage storage

            Ok(())
        }

        // finish voting period
        pub fn finish_voting(origin) -> Result<(), Error> {
            // do necessary actions to close voting

            // start revealing phase
            Self::start_revealing_period()?;

            Ok(())
        }

        pub fn finish_revealing_period(origin) -> Result<(), Error> {
            // do necessary actions to finish revealing phase

            Self::evaluate_referendum_results()?;

            Ok(())
        }

        /////////////////// User actions ///////////////////////////////////////

        pub fn vote(origin) -> Result<(), Error> {
            // recieve user's commitment

            Ok(())
        }

        pub fn reveal_vote(origin) -> Result<(), Error> {
            // reveals user's commitment

            Ok(())
        }
    }
}

/////////////////// Inner logic ////////////////////////////////////////////////
impl<T: Trait<I>, I: Instance> Module<T, I> {
    fn start_revealing_period() -> Result<(), Error> {
        // do necessary actions to start commitment revealing phase

        Ok(())
    }

    fn evaluate_referendum_results() -> Result<(), Error> {
        // evaluate results

        Ok(())
    }
}

/////////////////// Ensure checks //////////////////////////////////////////////
pub struct EnsureChecks<T: Trait<I>, I: Instance> {
    _dummy: PhantomData<(T, I)>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait<I>, I: Instance> EnsureChecks<T, I> {
    fn can_start_referendum(origin: T::Origin) -> Result<(), Error> {
        let who = ensure_signed(origin)?;

        if !T::is_super_user(&who) {
            return Err(Error::OriginNotSuperUser);
        }

        if Stage::<T, I>::get().0 != ReferendumStage::Void {
            return Err(Error::ReferendumAlreadyRunning);
        }

        Ok(())
    }
}
