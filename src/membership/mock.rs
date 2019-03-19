#![cfg(test)]

use rstd::prelude::*;
pub use crate::governance::{GovernanceCurrency};
pub use super::{registry};
pub use system;

pub use primitives::{H256, Blake2Hasher};
pub use runtime_primitives::{
    BuildStorage,
    traits::{BlakeTwo256, OnFinalise, IdentityLookup},
    testing::{Digest, DigestItem, Header, UintAuthorityId}
};

use srml_support::impl_outer_origin;

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
    type Lookup = IdentityLookup<u64>;
}
impl timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
}
impl consensus::Trait for Test {
    type SessionKey = UintAuthorityId;
    type InherentOfflineReport = ();
    type Log = DigestItem;
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

impl GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

// This function basically just builds a genesis storage key/value store according to
// our desired mockup.
pub fn initial_test_ext() -> runtime_io::TestExternalities<Blake2Hasher> {
    let mut t = system::GenesisConfig::<Test>::default().build_storage().unwrap().0;

    runtime_io::TestExternalities::new(t)
}

pub type System = system::Module<Test>;
pub type Balances = balances::Module<Test>;
pub type Membership = registry::Module<Test>;
