#![cfg_attr(not(feature = "std"), no_std)]

use srml_support::dispatch::Vec;
use rstd::collections::btree_map::BTreeMap;

use srml_support::{StorageValue, dispatch::Result};
use runtime_primitives::traits::{As};
use {balances, system::{ensure_signed}};

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
        // Initial state - council is empty and resigned, which will trigger
        // and election in next block
        ActiveCouncil get(council) config(): Option<Council<T::AccountId, T::Balance>>;

        TermEnds get(term_ends) config(): T::BlockNumber = T::BlockNumber::sa(0);

        CouncilTerm get(council_term): T::BlockNumber = T::BlockNumber::sa(1000);
    }
}

/// Event for this module.
decl_event!(
	pub enum Event<T> where <T as system::Trait>::BlockNumber {
        NewCouncilInSession(),
        Dummy(BlockNumber),
	}
);

impl<T: Trait> CouncilElected<Council<T::AccountId, T::Balance>> for Module<T> {
    fn council_elected(council: Council<T::AccountId, T::Balance>) {
        <ActiveCouncil<T>>::put(council);

        let next_term_ends = <system::Module<T>>::block_number() + Self::council_term();
        <TermEnds<T>>::put(next_term_ends);
        Self::deposit_event(RawEvent::NewCouncilInSession());
    }
}

impl<T: Trait> Module<T> {
    pub fn term_ended(n: T::BlockNumber) -> bool {
        n >= Self::term_ends()
    }

    pub fn is_councilor(sender: T::AccountId) -> bool {
        if let Some(council) = Self::council() {
            council.iter().any(|c| c.member == sender)
        } else {
            false
        }
    }

    fn tick (now: T::BlockNumber) {
        if Self::term_ended(now) {
            T::CouncilTermEnded::council_term_ended();
        }
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        fn on_finalise(n: T::BlockNumber) {
            Self::tick(n);
        }
    }
}

#[cfg(test)]
mod tests {
	use super::*;
	use ::governance::tests::*;

    #[test]
    fn dummy() {
        with_externalities(&mut initial_test_ext(), || {
            assert!(true);
        });
    }
}