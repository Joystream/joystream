// TODO: module documentation

// NOTE: This module is instantiable pallet as described here https://substrate.dev/recipes/3-entrees/instantiable.html
// No default instance is provided.

/////////////////// Configuration //////////////////////////////////////////////
#![cfg_attr(not(feature = "std"), no_std)]

// used dependencies
use codec::{ Decode, Encode};
use srml_support::{decl_event, decl_module, decl_storage, dispatch};
use std::marker::PhantomData;

//use srml_support::{Parameter};
//use sr_primitives::traits::{MaybeSerialize, Member, One, SimpleArithmetic};

// conditioned dependencies
//[cfg(feature = "std")]
//use serde::serde_derive::{Deserialize, Serialize};

// declared modules
mod mock;
mod tests;

/////////////////// Data Structures ////////////////////////////////////////////

#[derive(Encode, Decode)]
pub enum ReferendumStage<BlockNumber> {
    Void(BlockNumber),
    Voting(BlockNumber),
    Revealing(BlockNumber),
}

/////////////////// Trait, Storage, and Events /////////////////////////////////

pub trait Trait<I: Instance>: system::Trait {
    /// The overarching event type.
    type Event: From<Event<Self, I>> + Into<<Self as system::Trait>::Event>;
}

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance> as Referendum {

        // Current stage if there is an election running
        Stage get(stage) config(): Option<ReferendumStage<T::BlockNumber>>;

        // TODO: remove after `unused parameter` error for `I: Instance` is resolved
        Tmp: PhantomData<I>;
    }
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

/////////////////// Module definition and implementation ///////////////////////

decl_module! {
    pub struct Module<T: Trait<I>, I: Instance> for enum Call where origin: T::Origin {

        /////////////////// Lifetime ///////////////////////////////////////////

        // start voting period
        pub fn start_referendum(origin) -> dispatch::Result {
            // prepare referendum

            //EnsureChecks<T>::can_start_referendum()?;
            EnsureChecks::<T, I>::can_start_referendum(origin)?;

            Ok(())
        }

        // finish voting period
        pub fn finish_voting(origin) -> dispatch::Result {
            // do necessary actions to close voting

            // start revealing phase
            Self::start_revealing_period()?;

            Ok(())
        }

        pub fn finish_revealing_period(origin) -> dispatch::Result {
            // do necessary actions to finish revealing phase

            Self::evaluate_referendum_results()?;

            Ok(())
        }

        /////////////////// User actions ///////////////////////////////////////

        pub fn vote(origin) -> dispatch::Result {
            // recieve user's commitment

            Ok(())
        }

        pub fn reveal_vote(origin) -> dispatch::Result {
            // reveals user's commitment

            Ok(())
        }
    }
}

/////////////////// Inner logic ////////////////////////////////////////////
impl<T: Trait<I>, I: Instance> Module<T, I> {

    fn start_revealing_period() -> dispatch::Result {
        // do necessary actions to start commitment revealing phase

        Ok(())
    }

    fn evaluate_referendum_results() -> dispatch::Result {
        // evaluate results

        Ok(())
    }
}

/////////////////// Ensure checks //////////////////////////////////////////
pub struct EnsureChecks<T: Trait<I>, I: Instance> {
    _dummy: PhantomData<(T, I)>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait<I>, I: Instance> EnsureChecks<T, I> {
    fn can_start_referendum(origin: T::Origin) -> dispatch::Result {

        Ok(())
    }
}
