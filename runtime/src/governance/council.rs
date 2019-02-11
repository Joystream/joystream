#![cfg_attr(not(feature = "std"), no_std)]

use srml_support::{StorageValue, StorageMap, dispatch::Result, decl_module, decl_event, decl_storage, ensure};
use srml_support::traits::{Currency};
use system::{self, ensure_signed};
use runtime_primitives::traits::{As};
use {balances};

pub use super::election::{self, Seats, Seat, CouncilElected};
pub use super::{ GovernanceCurrency, BalanceOf };

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

pub trait Trait: system::Trait + balances::Trait + GovernanceCurrency {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type CouncilTermEnded: CouncilTermEnded;
}

decl_storage! {
    trait Store for Module<T: Trait> as Council {
        ActiveCouncil get(active_council) config(): Option<Seats<T::AccountId, BalanceOf<T>>> = None;
        TermEndsAt get(term_ends_at) config(): T::BlockNumber = T::BlockNumber::sa(0);
    }
}

/// Event for this module.
decl_event!(
    pub enum Event<T> where <T as system::Trait>::BlockNumber {
        NewCouncilInSession(),
        Dummy(BlockNumber),
    }
);

impl<T: Trait> CouncilElected<Seats<T::AccountId, BalanceOf<T>>, T::BlockNumber> for Module<T> {
    fn council_elected(seats: Seats<T::AccountId, BalanceOf<T>>, term: T::BlockNumber) {
        <ActiveCouncil<T>>::put(seats);

        let next_term_ends_at = <system::Module<T>>::block_number() + term;
        <TermEndsAt<T>>::put(next_term_ends_at);
        Self::deposit_event(RawEvent::NewCouncilInSession());
    }
}

impl<T: Trait> Module<T> {

    pub fn is_term_ended(block: T::BlockNumber) -> bool {
        block >= Self::term_ends_at()
    }

    pub fn is_councilor(sender: T::AccountId) -> bool {
        if let Some(council) = Self::active_council() {
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
