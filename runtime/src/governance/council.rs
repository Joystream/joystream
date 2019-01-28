#![cfg_attr(not(feature = "std"), no_std)]

extern crate sr_std;
#[cfg(test)]
extern crate sr_io;
#[cfg(test)]
extern crate substrate_primitives;
extern crate sr_primitives;
#[cfg(feature = "std")]
extern crate parity_codec as codec;
extern crate srml_system as system;
use srml_support::dispatch::Vec;
use rstd::collections::btree_map::BTreeMap;

use srml_support::{StorageValue, dispatch::Result};
use runtime_primitives::traits::{Hash, As};
use {balances, system::{ensure_signed}};

use rstd::ops::Add;

pub trait Trait: system::Trait + balances::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

#[derive(Clone, Encode, Decode)]
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

#[derive(Copy, Clone, Encode, Decode)]
pub struct Backer<Id, Stake> {
    pub member: Id,
    pub stake: Stake,
}

pub type Council<AccountId, Balance> = Vec<Seat<AccountId, Balance>>;

const COUNCIL_TERM: u64 = 1000;

decl_storage! {
    trait Store for Module<T: Trait> as CouncilInSession {
        // Initial state - council is empty and resigned, which will trigger
        // and election in next block
        ActiveCouncil get(council): Option<Council<T::AccountId, T::Balance>>;

        TermEnds get(term_ends): T::BlockNumber = T::BlockNumber::sa(0);
    }
}

/// Event for this module.
decl_event!(
	pub enum Event<T> where <T as system::Trait>::BlockNumber {
        CouncilResigned(BlockNumber),
        CouncilTermEnded(BlockNumber),
	}
);

impl<T: Trait> Module<T> {
    pub fn set_council(council: &BTreeMap<T::AccountId, Seat<T::AccountId, T::Balance>>) {
        let mut new_council = Vec::new();

        for (_, seat) in council.iter() {
            new_council.push(seat.clone());
        }

        <ActiveCouncil<T>>::put(new_council);

        let next_term_ends = <system::Module<T>>::block_number() + T::BlockNumber::sa(COUNCIL_TERM);
        <TermEnds<T>>::put(next_term_ends);
    }

    pub fn term_ended(n: T::BlockNumber) -> bool {
        n >= Self::term_ends()
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;
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