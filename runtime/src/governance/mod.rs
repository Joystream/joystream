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
mod transferable_stake;
mod sealed_vote;

use srml_support::{StorageValue, dispatch::Result};
use runtime_primitives::traits::{Hash, As};
use {balances, system::{ensure_signed}};

pub trait Trait: system::Trait + council::Trait + election::Trait {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Governance {
        /// Just a dummy storage item. TODO: Documentation for this item (or just remove it).
		Something get(something) config(): Option<T::AccountId>;
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
            // print("Governance::tick");
            // Determine if we need to start an election
            if <election::Module<T>>::start_election().is_ok() {
                print("Election Started");
            }
        }
    }
}

// Tests
#[cfg(test)]
mod tests {
	use super::*;

	use self::sr_io::with_externalities;
	use self::substrate_primitives::{H256, Blake2Hasher};
	use self::sr_primitives::{
		BuildStorage, traits::BlakeTwo256, testing::{Digest, DigestItem, Header}
	};

	impl_outer_origin! {
		pub enum Origin for Test {}
	}

	// For testing the module, we construct most of a mock runtime. This means
	// first constructing a configuration type (`Test`) which `impl`s each of the
	// configuration traits of modules we want to use.
	#[derive(Clone, Eq, PartialEq)]
	pub struct Test;
	impl system::Trait for Test {
		type Origin = Origin;
		type Index = u64;
		type BlockNumber = u64;
		type Hash = H256;
		type Hashing = BlakeTwo256;
		type Digest = Digest;
		type AccountId = u64;
		type Header = Header;
		type Event = ();
		type Log = DigestItem;
		// type Lookup = ();   // StaticLookup<Target = Self::AccountId>;
	}
    impl council::Trait for Test {
        type Event = ();
    }
    impl election::Trait for Test {
        type Event = ();
    }
    impl balances::Trait for Test {
        type Event = ();

		/// The balance of an account.
		type Balance = u32;

		/// A function which is invoked when the free-balance has fallen below the existential deposit and
		/// has been reduced to zero.
		///
		/// Gives a chance to clean up resources associated with the given account.
		type OnFreeBalanceZero = ();

		/// Handler for when a new account is created.
		type OnNewAccount = ();

		/// A function that returns true iff a given account can transfer its funds to another account.
		type EnsureAccountLiquid = ();
    }
	impl Trait for Test {
		type Event = ();
	}
	type Governance = Module<Test>;

	/*
	// This function basically just builds a genesis storage key/value store according to
	// our desired mockup.
	fn new_test_ext() -> sr_io::TestExternalities<Blake2Hasher> {
		let mut t = system::GenesisConfig::<Test>::default().build_storage().unwrap();
		t.extend(GenesisConfig::<Test>{
			something: 42,
		}.build_storage().unwrap());
		t.into()
	}

	#[test]
	fn it_works_for_default_value() {
		with_externalities(&mut new_test_ext(), || {
			assert_eq!(Governance::something(), Some(42));
		});
	}
	*/
}