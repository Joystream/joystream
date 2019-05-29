#![cfg(test)]

pub use super::discovery;
pub use crate::roles::actors;
pub use crate::traits::Roles;

pub use primitives::{Blake2Hasher, H256};
pub use runtime_primitives::{
    testing::{Digest, DigestItem, Header, UintAuthorityId},
    traits::{BlakeTwo256, IdentityLookup, OnFinalize},
    BuildStorage,
};

use srml_support::{impl_outer_event, impl_outer_origin};

impl_outer_origin! {
    pub enum Origin for Test {}
}

impl_outer_event! {
    pub enum MetaEvent for Test {
        discovery<T>,
    }
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
    type Event = MetaEvent;
    type Log = DigestItem;
    type Lookup = IdentityLookup<u64>;
}

pub fn alice_account() -> u64 {
    1
}
pub fn bob_account() -> u64 {
    2
}

impl discovery::Trait for Test {
    type Event = MetaEvent;
    type Roles = MockRoles;
}

pub struct MockRoles {}
impl Roles<Test> for MockRoles {
    fn is_role_account(account_id: &u64) -> bool {
        *account_id == alice_account()
    }

    fn account_has_role(_account_id: &u64, _role: actors::Role) -> bool {
        false
    }

    fn random_account_for_role(_role: actors::Role) -> Result<u64, &'static str> {
        Err("not implemented")
    }
}

pub fn initial_test_ext() -> runtime_io::TestExternalities<Blake2Hasher> {
    let t = system::GenesisConfig::<Test>::default()
        .build_storage()
        .unwrap()
        .0;

    runtime_io::TestExternalities::new(t)
}

pub type System = system::Module<Test>;
pub type Discovery = discovery::Module<Test>;
