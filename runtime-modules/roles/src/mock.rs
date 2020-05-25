#![cfg(test)]

pub use super::actors;
pub use common::currency::GovernanceCurrency;
pub use srml_support::traits::Currency;
pub use system;

pub use primitives::{Blake2Hasher, H256};
pub use sr_primitives::{
    testing::{Digest, DigestItem, Header, UintAuthorityId},
    traits::{BlakeTwo256, Convert, IdentityLookup, OnFinalize},
    weights::Weight,
    BuildStorage, Perbill,
};

use srml_support::{impl_outer_origin, parameter_types};

impl_outer_origin! {
    pub enum Origin for Test {}
}

pub fn alice_id() -> u32 {
    Members::member_ids_by_root_account_id(alice_account())[0]
}
pub fn alice_account() -> u64 {
    1
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;
parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
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
    pub const InitialMembersBalance: u32 = 2000;
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

impl timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
}

impl membership::Trait for Test {
    type Event = ();
    type MemberId = u32;
    type SubscriptionId = u32;
    type PaidTermId = u32;
    type ActorId = u32;
    type InitialMembersBalance = InitialMembersBalance;
}

impl actors::Trait for Test {
    type Event = ();
    type OnActorRemoved = ();
}

impl actors::ActorRemoved<Test> for () {
    fn actor_removed(_: &u64) {}
}

pub fn initial_test_ext() -> runtime_io::TestExternalities {
    let mut t = system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    membership::GenesisConfig::<Test> {
        default_paid_membership_fee: 0,
        members: vec![(alice_account(), "alice".into(), "".into(), "".into())],
    }
    .assimilate_storage(&mut t)
    .unwrap();

    t.into()
}

pub type System = system::Module<Test>;
pub type Balances = balances::Module<Test>;
pub type Actors = actors::Module<Test>;
pub type Members = membership::Module<Test>;
