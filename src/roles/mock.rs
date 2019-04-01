#![cfg(test)]

use rstd::prelude::*;
pub use crate::governance::{GovernanceCurrency};
pub use super::actors;
use crate::traits::{Members};
//pub use crate::membership::members;
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
#[derive(Clone, Eq, PartialEq, Debug)]
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

pub struct MockMembers {}

impl MockMembers {
    pub fn alice_id() -> u32 {1}
    pub fn alice_account() -> u64 {1}
    pub fn bob_id() -> u32 {2}
    pub fn bob_account() -> u64 {2}
}

impl Members<Test> for MockMembers {
    type Id = u32;
    fn is_active_member(who: &u64) -> bool {
        if *who == Self::alice_account() { return true; }
        if *who == Self::bob_account() { return true; }
        false
    }
    fn lookup_member_id(who: &u64) -> Result<u32, &'static str> {
        if *who == Self::alice_account() { return Ok(Self::alice_id()); }
        if *who == Self::bob_account() { return Ok(Self::bob_id()); }
        Err("member not found")
    }
}

impl actors::Trait for Test {
    type Event = ();
    type Members = MockMembers;
}

pub fn initial_test_ext() -> runtime_io::TestExternalities<Blake2Hasher> {
    let t = system::GenesisConfig::<Test>::default().build_storage().unwrap().0;

    runtime_io::TestExternalities::new(t)
}

pub type System = system::Module<Test>;
pub type Balances = balances::Module<Test>;
pub type Actors = actors::Module<Test>;

