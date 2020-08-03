// TODO: module documentation

// NOTE: This module is instantiable pallet as described here https://substrate.dev/recipes/3-entrees/instantiable.html
// No default instance is provided.

/////////////////// Configuration //////////////////////////////////////////////
#![cfg_attr(not(feature = "std"), no_std)]

// used dependencies
use codec::{Codec, Decode, Encode};
use sr_primitives::traits::{MaybeSerialize, Member, SimpleArithmetic};
use srml_support::{decl_error, decl_event, decl_module, decl_storage, traits::Get, Parameter};
use std::marker::PhantomData;
use system::ensure_signed;

use std::collections::HashSet;

// conditioned dependencies
//#[cfg(feature = "std")]
//use serde_derive::{Deserialize, Serialize};

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

//pub trait Trait<I: Instance>: system::Trait + Sized {
pub trait Trait<I: Instance>: system::Trait {
    /// The overarching event type.
    type Event: From<Event<Self, I>> + Into<<Self as system::Trait>::Event>;

    // maximum number of options in one referendum
    type MaxReferendumOptions: Get<u64>;
    type ReferendumOption: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>
        + Into<u64>;

    type VoteStageDuration: Get<Self::BlockNumber>;

    fn is_super_user(account_id: &<Self as system::Trait>::AccountId) -> bool;
}

decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance> as Referendum {
        // Current stage if there is an election running
        pub Stage get(stage) config(): (ReferendumStage, T::BlockNumber);

        pub ReferendumOptions get(referendum_options) config(): Option<Vec<T::ReferendumOption>>;
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
        <T as Trait<I>>::ReferendumOption,
    {
        /// Referendum started
        ReferendumStarted(Vec<ReferendumOption>),

        /// Revealing phase have begun
        RevealingStageStarted(),

        ReferendumFinished(),
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

        /// No options were given to referendum
        NoReferendumOptions,

        /// Number of referendum options exceeds the limit
        TooManyReferendumOptions,

        /// Not all referendum options are unique
        DuplicateReferendumOptions,

        // Referendum is not running when expected to
        ReferendumNotRunning,

        // Voting stage hasn't finished yet
        VotingNotFinishedYet,
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

        /// Setup events
        fn deposit_event() = default;

        /////////////////// Lifetime ///////////////////////////////////////////

        // start voting period
        pub fn start_referendum(origin, options: Vec<T::ReferendumOption>) -> Result<(), Error> {
            // ensure action can be started
            EnsureChecks::<T, I>::can_start_referendum(origin, &options)?;

            //
            // == MUTATION SAFE ==
            //

            // update state
            Mutations::<T, I>::start_voting_period(options.clone());

            // emit event
            Self::deposit_event(RawEvent::ReferendumStarted(options));

            Ok(())
        }

        // finish voting period
        pub fn finish_voting_start_revealing(origin) -> Result<(), Error> {
            // ensure action can be started
            EnsureChecks::<T, I>::can_finish_voting(origin)?;

            //
            // == MUTATION SAFE ==
            //

            // start revealing phase
            Mutations::<T, I>::start_revealing_period();

            Self::deposit_event(RawEvent::RevealingStageStarted());

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
    /*
    fn start_revealing_period() -> Result<(), Error> {
        // do necessary actions to start commitment revealing phase

        Ok(())
    }
    */

    fn evaluate_referendum_results() -> Result<(), Error> {
        // evaluate results

        Ok(())
    }
}

/////////////////// Mutations //////////////////////////////////////////////////

struct Mutations<T: Trait<I>, I: Instance> {
    _dummy: PhantomData<(T, I)>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait<I>, I: Instance> Mutations<T, I> {
    fn start_voting_period(options: Vec<T::ReferendumOption>) -> () {
        // change referendum state
        Stage::<T, I>::put((ReferendumStage::Voting, <system::Module<T>>::block_number()));

        // store new options
        ReferendumOptions::<T, I>::mutate(|_| Some(options));
    }

    fn start_revealing_period() -> () {
        // change referendum state
        Stage::<T, I>::put((
            ReferendumStage::Revealing,
            <system::Module<T>>::block_number(),
        ));
    }
}

/////////////////// Ensure checks //////////////////////////////////////////////

struct EnsureChecks<T: Trait<I>, I: Instance> {
    _dummy: PhantomData<(T, I)>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait<I>, I: Instance> EnsureChecks<T, I> {
    fn can_start_referendum(
        origin: T::Origin,
        options: &[T::ReferendumOption],
    ) -> Result<(), Error> {
        let who = ensure_signed(origin)?;

        // ensure superuser requested action
        if !T::is_super_user(&who) {
            return Err(Error::OriginNotSuperUser);
        }

        // ensure referendum is not already running
        if Stage::<T, I>::get().0 != ReferendumStage::Void {
            return Err(Error::ReferendumAlreadyRunning);
        }

        // ensure some options were given
        if options.len() == 0 {
            return Err(Error::NoReferendumOptions);
        }

        // ensure number of options doesn't exceed limit
        if options.len() > T::MaxReferendumOptions::get() as usize {
            return Err(Error::TooManyReferendumOptions);
        }

        // ensure no two options are the same
        let mut options_by_id = HashSet::<u64>::new();
        for option in options {
            options_by_id.insert((*option).into());
        }
        if options_by_id.len() != options.len() {
            return Err(Error::DuplicateReferendumOptions);
        }

        Ok(())
    }

    fn can_finish_voting(origin: T::Origin) -> Result<(), Error> {
        let who = ensure_signed(origin)?;

        // ensure superuser requested action
        if !T::is_super_user(&who) {
            return Err(Error::OriginNotSuperUser);
        }

        let (stage, starting_block_number) = Stage::<T, I>::get();

        // ensure referendum is running
        if stage != ReferendumStage::Voting {
            return Err(Error::ReferendumNotRunning);
        }

        let current_block = <system::Module<T>>::block_number();

        // ensure voting stage is complete
        if current_block < T::VoteStageDuration::get() + starting_block_number {
            return Err(Error::VotingNotFinishedYet);
        }

        Ok(())
    }
}
