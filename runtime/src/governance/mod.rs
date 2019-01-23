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
use runtime_io::print;

pub mod election;
pub mod council;
pub mod transferable_stake;

use srml_support::{StorageValue, dispatch::Result};
use runtime_primitives::traits::{Hash, As};
use {balances, system::{ensure_signed}};

pub trait Trait: system::Trait + council::Trait + election::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Governance {
        
    }
}

/// Event for this module.
decl_event!(
	pub enum Event<T> where <T as system::Trait>::BlockNumber {
        Dummy(BlockNumber),
	}
);

impl<T: Trait> Module<T> {

}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        fn on_finalise(n: T::BlockNumber) {
            print("Governance::tick");
            // Determine if we need to start an election
            if <election::Module<T>>::can_start_election() {
                if <council::Module<T>>::council().is_none() || <council::Module<T>>::term_ended(n) {
                    print("Governance: Starting Election");
                    // panic means broken invariant!
                    <election::Module<T>>::start_election().expect("must be able to start election");
                }
            }
        }
    }
}