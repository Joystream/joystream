#![cfg(test)]

use rstd::prelude::*;
pub use super::{types};
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
impl system::Trait for Test
{
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
impl types::Trait for Test
{
    type Event = ();
    type DataObjectTypeID = u64;
}

// This function basically just builds a genesis storage key/value store according to
// our desired mockup.
pub fn initial_test_ext() -> runtime_io::TestExternalities<Blake2Hasher> {
    let mut t = system::GenesisConfig::<Test>::default().build_storage().unwrap().0;

    runtime_io::TestExternalities::new(t)
}

pub type Types = types::Module<Test>;
