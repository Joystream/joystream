#![cfg(test)]

pub use super::discovery;
pub use crate::roles::actors;
use roles::traits::Roles;

pub use primitives::{Blake2Hasher, H256};
pub use sr_primitives::{
    testing::{Digest, DigestItem, Header, UintAuthorityId},
    traits::{BlakeTwo256, IdentityLookup, OnFinalize},
    BuildStorage, Perbill,
};

use srml_support::{impl_outer_event, impl_outer_origin, parameter_types};

impl_outer_origin! {
    pub enum Origin for Test {}
}

impl_outer_event! {
    pub enum MetaEvent for Test {
        discovery<T>,
    }
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;
parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
}

impl system::Trait for Test {
    type Origin = Origin;
    type Index = u64;
    type BlockNumber = u64;
    type Call = ();
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = MetaEvent;
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
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

pub fn initial_test_ext() -> runtime_io::TestExternalities {
    let t = system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

pub type System = system::Module<Test>;
pub type Discovery = discovery::Module<Test>;
