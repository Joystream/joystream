#![cfg_attr(not(feature = "std"), no_std)]

use srml_support::dispatch::Vec;
use rstd::collections::btree_map::BTreeMap;

use srml_support::{StorageValue, dispatch::Result};
use runtime_primitives::traits::{As};
use {balances, system::{ensure_signed}};

use rstd::ops::Add;

use super::election;


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

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Seat<Id, Stake> {
    pub member: Id,
    pub stake: Stake,
    pub backers: Vec<Backer<Id, Stake>>,
}

impl<Id, Stake> Seat<Id, Stake>
    where Stake: Add<Output=Stake> + Copy,
{
    pub fn total_stake(&self) -> Stake {
        let mut stake = self.stake;
        for backer in self.backers.iter() {
            stake = stake + backer.stake;
        }
        stake
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Backer<Id, Stake> {
    pub member: Id,
    pub stake: Stake,
}

pub type Council<AccountId, Balance> = Vec<Seat<AccountId, Balance>>;

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

impl<T: Trait> election::CouncilElected<BTreeMap<T::AccountId, Seat<T::AccountId, T::Balance>>> for Module<T> {
    fn council_elected(council: &BTreeMap<T::AccountId, Seat<T::AccountId, T::Balance>>) {
        let new_council: Vec<Seat<T::AccountId, T::Balance>> = council.into_iter().map(|(_, seat)| seat.clone()).collect();

        <ActiveCouncil<T>>::put(new_council);

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