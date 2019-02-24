#![cfg_attr(not(feature = "std"), no_std)]

use srml_support::{StorageValue, StorageMap, dispatch::Result, decl_module, decl_event, decl_storage, ensure};
use srml_support::traits::{Currency};
use system::{self, ensure_signed};
use runtime_primitives::traits::{As, Zero};
use rstd::prelude::*;

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

pub trait Trait: system::Trait + GovernanceCurrency {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type CouncilTermEnded: CouncilTermEnded;
}

decl_storage! {
    trait Store for Module<T: Trait> as Council {
        ActiveCouncil get(active_council) config(): Seats<T::AccountId, BalanceOf<T>>;
        TermEndsAt get(term_ends_at) config() : T::BlockNumber = T::BlockNumber::sa(1);
    }
}

/// Event for this module.
decl_event!(
    pub enum Event<T> where <T as system::Trait>::BlockNumber {
        CouncilTermEnded(BlockNumber),
        NewCouncilTermStarted(BlockNumber),
    }
);

impl<T: Trait> CouncilElected<Seats<T::AccountId, BalanceOf<T>>, T::BlockNumber> for Module<T> {
    fn council_elected(seats: Seats<T::AccountId, BalanceOf<T>>, term: T::BlockNumber) {
        <ActiveCouncil<T>>::put(seats);

        let next_term_ends_at = <system::Module<T>>::block_number() + term;
        <TermEndsAt<T>>::put(next_term_ends_at);
        Self::deposit_event(RawEvent::NewCouncilTermStarted(next_term_ends_at));
    }
}

impl<T: Trait> Module<T> {

    pub fn is_term_ended() -> bool {
        <system::Module<T>>::block_number() >= Self::term_ends_at()
    }

    pub fn is_councilor(sender: &T::AccountId) -> bool {
        Self::active_council().iter().any(|c| c.member == *sender)
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        fn on_finalise(now: T::BlockNumber) {
            if now == Self::term_ends_at() {
                Self::deposit_event(RawEvent::CouncilTermEnded(now));
                T::CouncilTermEnded::council_term_ended();
            }
        }

        // Sudo methods...

        /// Force set a zero staked council. Stakes in existing council will vanish into thin air!
        fn set_council(accounts: Vec<T::AccountId>) {
            let new_council: Seats<T::AccountId, BalanceOf<T>> = accounts.into_iter().map(|account| {
                Seat {
                    member: account,
                    stake: BalanceOf::<T>::zero(),
                    backers: vec![]
                }
            }).collect();
            <ActiveCouncil<T>>::put(new_council);
        }

        /// Adds a zero staked council member
        fn add_council_member(account: T::AccountId) -> Result {
            ensure!(!Self::is_councilor(&account), "cannot add same account multiple times");
            let seat = Seat {
                member: account,
                stake: BalanceOf::<T>::zero(),
                backers: vec![]
            };

            // add member to existing council
            <ActiveCouncil<T>>::mutate(|council| council.push(seat));
            Ok(())
        }

        fn remove_council_member(account_to_remove: T::AccountId) -> Result {
            ensure!(Self::is_councilor(&account_to_remove), "account is not a councilor");
            let filtered_council: Seats<T::AccountId, BalanceOf<T>> = Self::active_council()
                .into_iter()
                .filter(|c| c.member != account_to_remove)
                .collect();
            <ActiveCouncil<T>>::put(filtered_council);
            Ok(())
        }

        /// Set blocknumber when council term will end
        fn set_term_ends_at(ends_at: T::BlockNumber) -> Result {
            ensure!(ends_at > <system::Module<T>>::block_number(), "must set future block number");
            <TermEndsAt<T>>::put(ends_at);
            Ok(())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::governance::mock::*;
    use parity_codec::Encode;
    use runtime_io::with_externalities;
    use srml_support::*;

    #[test]
    fn add_council_member_test() {
        with_externalities(&mut initial_test_ext(), || {
            assert!(!Council::is_councilor(&1));

            assert_ok!(Council::add_council_member(1));
            assert!(Council::is_councilor(&1));

            assert_ok!(Council::add_council_member(2));
            assert!(Council::is_councilor(&1));
            assert!(Council::is_councilor(&2));
        });
    }

    #[test]
    fn remove_council_member_test() {
        with_externalities(&mut initial_test_ext(), || {
            assert_ok!(Council::add_council_member(1));
            assert_ok!(Council::add_council_member(2));
            assert_ok!(Council::add_council_member(3));

            assert_ok!(Council::remove_council_member(2));

            assert!(!Council::is_councilor(&2));
            assert!(Council::is_councilor(&1));
            assert!(Council::is_councilor(&3));
        });
    }

    #[test]
    fn set_council_test() {
        with_externalities(&mut initial_test_ext(), || {
            assert_ok!(Council::set_council(vec![4,5,6]));
            assert!(Council::is_councilor(&4));
            assert!(Council::is_councilor(&5));
            assert!(Council::is_councilor(&6));
        });
    }
}
