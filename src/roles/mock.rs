#![cfg(test)]

pub use super::actors;
pub use crate::currency::GovernanceCurrency;
use crate::traits::Members;
pub use srml_support::traits::Currency;
pub use system;

pub use primitives::{Blake2Hasher, H256};
pub use runtime_primitives::{
    testing::{Digest, DigestItem, Header, UintAuthorityId},
    traits::{BlakeTwo256, Convert, IdentityLookup, OnFinalize},
    weights::Weight,
    BuildStorage, Perbill,
};

use srml_support::{impl_outer_origin, parameter_types};

impl_outer_origin! {
    pub enum Origin for Test {}
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
    type Event = ();
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
}

parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
    pub const TransferFee: u32 = 0;
    pub const CreationFee: u32 = 0;
    pub const TransactionBaseFee: u32 = 1;
    pub const TransactionByteFee: u32 = 0;
}

impl balances::Trait for Test {
    /// The type for recording an account's balance.
    type Balance = u64;
    /// What to do if an account's free balance gets zeroed.
    type OnFreeBalanceZero = ();
    /// What to do if a new account is created.
    type OnNewAccount = ();
    /// The ubiquitous event type.
    type Event = ();

    type DustRemoval = ();
    type TransferPayment = ();
    type ExistentialDeposit = ExistentialDeposit;
    type TransferFee = TransferFee;
    type CreationFee = CreationFee;
}

impl GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

pub struct MockMembers {}

impl MockMembers {
    pub fn alice_id() -> u32 {
        1
    }
    pub fn alice_account() -> u64 {
        1
    }
    pub fn bob_id() -> u32 {
        2
    }
    pub fn bob_account() -> u64 {
        2
    }
}

impl Members<Test> for MockMembers {
    type Id = u32;
    fn is_active_member(who: &u64) -> bool {
        if *who == Self::alice_account() {
            return true;
        }
        if *who == Self::bob_account() {
            return true;
        }
        false
    }
    fn lookup_member_id(who: &u64) -> Result<u32, &'static str> {
        if *who == Self::alice_account() {
            return Ok(Self::alice_id());
        }
        if *who == Self::bob_account() {
            return Ok(Self::bob_id());
        }
        Err("member not found")
    }
    fn lookup_account_by_member_id(id: Self::Id) -> Result<u64, &'static str> {
        if id == Self::alice_id() {
            return Ok(Self::alice_account());
        }
        if id == Self::bob_id() {
            return Ok(Self::bob_account());
        }
        Err("account not found")
    }
}

impl actors::Trait for Test {
    type Event = ();
    type Members = MockMembers;
    type OnActorRemoved = ();
}

impl actors::ActorRemoved<Test> for () {
    fn actor_removed(_: &u64) {}
}

pub fn initial_test_ext() -> runtime_io::TestExternalities {
    let t = system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

pub type System = system::Module<Test>;
pub type Balances = balances::Module<Test>;
pub type Actors = actors::Module<Test>;
