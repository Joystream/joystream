// Copyright 2019 Joystream Contributors
// This file is part of Joystream runtime

// Joystream runtime is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Joystream runtime is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// === Substrate ===
// Copyright 2017-2019 Parity Technologies (UK) Ltd.
// Substrate is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Substrate is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this software If not, see <http://www.gnu.org/licenses/>.

use rstd::prelude::*;
use runtime_primitives::traits::{As, Zero};
use srml_support::{decl_event, decl_module, decl_storage, ensure, StorageValue};
use system;

pub use super::election::{self, CouncilElected, Seat, Seats};
pub use crate::currency::{BalanceOf, GovernanceCurrency};

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

// Event for this module.
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

        fn on_finalize(now: T::BlockNumber) {
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
        fn add_council_member(account: T::AccountId) {
            ensure!(!Self::is_councilor(&account), "cannot add same account multiple times");
            let seat = Seat {
                member: account,
                stake: BalanceOf::<T>::zero(),
                backers: vec![]
            };

            // add member to existing council
            <ActiveCouncil<T>>::mutate(|council| council.push(seat));
        }

        fn remove_council_member(account_to_remove: T::AccountId) {
            ensure!(Self::is_councilor(&account_to_remove), "account is not a councilor");
            let filtered_council: Seats<T::AccountId, BalanceOf<T>> = Self::active_council()
                .into_iter()
                .filter(|c| c.member != account_to_remove)
                .collect();
            <ActiveCouncil<T>>::put(filtered_council);
        }

        /// Set blocknumber when council term will end
        fn set_term_ends_at(ends_at: T::BlockNumber) {
            ensure!(ends_at > <system::Module<T>>::block_number(), "must set future block number");
            <TermEndsAt<T>>::put(ends_at);
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::governance::mock::*;
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
            assert_ok!(Council::set_council(vec![4, 5, 6]));
            assert!(Council::is_councilor(&4));
            assert!(Council::is_councilor(&5));
            assert!(Council::is_councilor(&6));
        });
    }
}
