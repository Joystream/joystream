use rstd::prelude::*;
use sr_primitives::traits::Zero;
use srml_support::{decl_event, decl_module, decl_storage, ensure};
use system::{self, ensure_root};

pub use super::election::{self, CouncilElected, Seat, Seats};
pub use common::currency::{BalanceOf, GovernanceCurrency};

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

pub trait Trait: system::Trait + minting::Trait + GovernanceCurrency {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type CouncilTermEnded: CouncilTermEnded;
}

decl_storage! {
    trait Store for Module<T: Trait> as Council {
        pub ActiveCouncil get(active_council) config(): Seats<T::AccountId, BalanceOf<T>>;

        pub TermEndsAt get(term_ends_at) config() : T::BlockNumber = T::BlockNumber::from(1);

        /// The mint that funds council member rewards and spending proposals budget. It is an Option
        /// because it was introduced in a runtime upgrade. It will be automatically created when
        /// a successful call to set_council_mint_capacity() is made.
        pub CouncilMint get(council_mint) : Option<<T as minting::Trait>::MintId>;
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

    /// Initializes a new mint, discarding previous mint if it existed.
    pub fn create_new_council_mint(
        capacity: minting::BalanceOf<T>,
    ) -> Result<T::MintId, &'static str> {
        let mint_id = <minting::Module<T>>::add_mint(capacity, None)?;
        CouncilMint::<T>::put(mint_id);
        Ok(mint_id)
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        fn on_finalize(now: T::BlockNumber) {
            if now == Self::term_ends_at() {
                Self::deposit_event(RawEvent::CouncilTermEnded(now));
                T::CouncilTermEnded::council_term_ended();
            }
        }

        // Privileged methods

        /// Force set a zero staked council. Stakes in existing council will vanish into thin air!
        fn set_council(origin, accounts: Vec<T::AccountId>) {
            ensure_root(origin)?;
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
        fn add_council_member(origin, account: T::AccountId) {
            ensure_root(origin)?;
            ensure!(!Self::is_councilor(&account), "cannot add same account multiple times");
            let seat = Seat {
                member: account,
                stake: BalanceOf::<T>::zero(),
                backers: vec![]
            };

            // add member to existing council
            <ActiveCouncil<T>>::mutate(|council| council.push(seat));
        }

        fn remove_council_member(origin, account_to_remove: T::AccountId) {
            ensure_root(origin)?;
            ensure!(Self::is_councilor(&account_to_remove), "account is not a councilor");
            let filtered_council: Seats<T::AccountId, BalanceOf<T>> = Self::active_council()
                .into_iter()
                .filter(|c| c.member != account_to_remove)
                .collect();
            <ActiveCouncil<T>>::put(filtered_council);
        }

        /// Set blocknumber when council term will end
        fn set_term_ends_at(origin, ends_at: T::BlockNumber) {
            ensure_root(origin)?;
            ensure!(ends_at > <system::Module<T>>::block_number(), "must set future block number");
            <TermEndsAt<T>>::put(ends_at);
        }

        /// Sets the capacity of the the council mint, if it doesn't exist, attempts to
        /// create a new one.
        fn set_council_mint_capacity(origin, capacity: minting::BalanceOf<T>) {
            ensure_root(origin)?;

            if let Some(mint_id) = Self::council_mint() {
                minting::Module::<T>::set_mint_capacity(mint_id, capacity)?;
            } else {
                Self::create_new_council_mint(capacity)?;
            }
        }

        /// Attempts to mint and transfer amount to destination account
        fn spend_from_council_mint(origin, amount: minting::BalanceOf<T>, destination: T::AccountId) {
            ensure_root(origin)?;

            if let Some(mint_id) = Self::council_mint() {
                minting::Module::<T>::transfer_tokens(mint_id, amount, &destination)?;
            } else {
                return Err("CouncilHashNoMint")
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::mock::*;
    use srml_support::*;

    fn add_council_member_as_root(account: <Test as system::Trait>::AccountId) -> dispatch::Result {
        Council::add_council_member(system::RawOrigin::Root.into(), account)
    }

    #[test]
    fn add_council_member_test() {
        initial_test_ext().execute_with(|| {
            assert!(!Council::is_councilor(&1));

            assert_ok!(add_council_member_as_root(1));
            assert!(Council::is_councilor(&1));

            assert_ok!(add_council_member_as_root(2));
            assert!(Council::is_councilor(&1));
            assert!(Council::is_councilor(&2));
        });
    }

    #[test]
    fn remove_council_member_test() {
        initial_test_ext().execute_with(|| {
            assert_ok!(add_council_member_as_root(1));
            assert_ok!(add_council_member_as_root(2));
            assert_ok!(add_council_member_as_root(3));

            assert_ok!(Council::remove_council_member(
                system::RawOrigin::Root.into(),
                2
            ));

            assert!(!Council::is_councilor(&2));
            assert!(Council::is_councilor(&1));
            assert!(Council::is_councilor(&3));
        });
    }

    #[test]
    fn set_council_test() {
        initial_test_ext().execute_with(|| {
            assert_ok!(Council::set_council(
                system::RawOrigin::Root.into(),
                vec![4, 5, 6]
            ));
            assert!(Council::is_councilor(&4));
            assert!(Council::is_councilor(&5));
            assert!(Council::is_councilor(&6));
        });
    }
}
