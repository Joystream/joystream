#![cfg(test)]

pub use super::{council, election};
pub use common::currency::GovernanceCurrency;

use frame_support::{impl_outer_origin, parameter_types};
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
pub use system;

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
    pub const MinimumPeriod: u64 = 5;
}

impl system::Trait for Test {
    type BaseCallFilter = ();
    type Origin = Origin;
    type Call = ();
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = ();
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type DbWeight = ();
    type BlockExecutionWeight = ();
    type ExtrinsicBaseWeight = ();
    type MaximumExtrinsicWeight = ();
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
    type ModuleToIndex = ();
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
}

impl pallet_timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
}
impl council::Trait for Test {
    type Event = ();

    type CouncilTermEnded = (Election,);
}
impl election::Trait for Test {
    type Event = ();

    type CouncilElected = (Council,);
}
impl membership::Trait for Test {
    type Event = ();
    type MemberId = u32;
    type SubscriptionId = u32;
    type PaidTermId = u32;
    type ActorId = u32;
}
impl minting::Trait for Test {
    type Currency = Balances;
    type MintId = u64;
}
impl recurringrewards::Trait for Test {
    type PayoutStatusHandler = ();
    type RecipientId = u64;
    type RewardRelationshipId = u64;
}
parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
}

impl balances::Trait for Test {
    type Balance = u64;
    type DustRemoval = ();
    type Event = ();
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
}

impl GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

// TODO add a Hook type to capture TriggerElection and CouncilElected hooks

// This function basically just builds a genesis storage key/value store according to
// our desired mockup.
pub fn initial_test_ext() -> sp_io::TestExternalities {
    let mut t = system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    membership::GenesisConfig::<Test> {
        default_paid_membership_fee: 0,
        members: vec![
            (1, "member1".into(), "".into(), "".into()),
            (2, "member2".into(), "".into(), "".into()),
            (3, "member3".into(), "".into(), "".into()),
            (4, "member4".into(), "".into(), "".into()),
            (5, "member5".into(), "".into(), "".into()),
            (6, "member6".into(), "".into(), "".into()),
            (7, "member7".into(), "".into(), "".into()),
            (8, "member8".into(), "".into(), "".into()),
            (9, "member9".into(), "".into(), "".into()),
            (10, "member10".into(), "".into(), "".into()),
            (11, "member11".into(), "".into(), "".into()),
            (12, "member12".into(), "".into(), "".into()),
            (13, "member13".into(), "".into(), "".into()),
            (14, "member14".into(), "".into(), "".into()),
            (15, "member15".into(), "".into(), "".into()),
            (16, "member16".into(), "".into(), "".into()),
            (17, "member17".into(), "".into(), "".into()),
            (18, "member18".into(), "".into(), "".into()),
            (19, "member19".into(), "".into(), "".into()),
            (20, "member20".into(), "".into(), "".into()),
        ],
    }
    .assimilate_storage(&mut t)
    .unwrap();

    t.into()
}

pub type Election = election::Module<Test>;
pub type Council = council::Module<Test>;
pub type System = system::Module<Test>;
pub type Balances = balances::Module<Test>;
