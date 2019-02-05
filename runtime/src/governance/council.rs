#![cfg_attr(not(feature = "std"), no_std)]

use srml_support::{StorageValue};
use runtime_primitives::traits::{As};
use {balances};

pub use election::{Seats as Council, Seat, CouncilElected};

// Hook For announcing that council term has ended
pub trait CouncilTermEnded {
    fn council_term_ended();
}

impl CouncilTermEnded for () {
    fn council_term_ended() {}
}

impl<X: CouncilTermEnded> CouncilTermEnded for (X,) {
    fn council_term_ended() {
        X::council_term_ended();
    }
}

pub trait Trait: system::Trait + balances::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type CouncilTermEnded: CouncilTermEnded;
}

decl_storage! {
    trait Store for Module<T: Trait> as CouncilInSession {

        // TODO A good practice to keep similar names for both storage and its getter, example:
        // ActiveCouncil get(active_council) ...
        // TermEndsAt get(term_ends_at)

        // Initial state - council is empty and resigned, which will trigger
        // an election in the next block
        ActiveCouncil get(council) config(): Option<Council<T::AccountId, T::Balance>> = None;

        // TODO rename to 'TermEndsAt' because 'at block', not 'on block'
        TermEndsOn get(term_ends) config(): T::BlockNumber = T::BlockNumber::sa(0);
    }
}

/// Event for this module.
decl_event!(
    pub enum Event<T> where <T as system::Trait>::BlockNumber {
        NewCouncilInSession(),
        Dummy(BlockNumber),
    }
);

impl<T: Trait> CouncilElected<Council<T::AccountId, T::Balance>, T::BlockNumber> for Module<T> {
    fn council_elected(council: Council<T::AccountId, T::Balance>, term: T::BlockNumber) {
        <ActiveCouncil<T>>::put(council);

        let next_term_ends = <system::Module<T>>::block_number() + term;
        <TermEndsOn<T>>::put(next_term_ends);
        Self::deposit_event(RawEvent::NewCouncilInSession());
    }
}

impl<T: Trait> Module<T> {

    pub fn is_term_ended(block: T::BlockNumber) -> bool {
        block >= Self::term_ends()
    }

    pub fn is_councilor(sender: T::AccountId) -> bool {
        if let Some(council) = Self::council() {
            council.iter().any(|c| c.member == sender)
        } else {
            false
        }
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        fn on_finalise(now: T::BlockNumber) {
            if Self::is_term_ended(now) {
                T::CouncilTermEnded::council_term_ended();
            }
        }
    }
}
