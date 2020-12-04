#![cfg(test)]

pub use frame_system;

use frame_support::traits::{OnFinalize, OnInitialize};
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types, weights::Weight};
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};

use crate::ActorOriginValidator;
use crate::WeightInfo;

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

parameter_types! {
    pub const ThreadTitleLengthLimit: u32 = 200;
    pub const PostLengthLimit: u32 = 2000;
}

mod discussion {
    pub use crate::Event;
}

mod membership_mod {
    pub use membership::Event;
}

impl_outer_event! {
    pub enum TestEvent for Test {
        discussion<T>,
        balances<T>,
        membership_mod<T>,
        frame_system<T>,
    }
}

parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
    pub const TransferFee: u32 = 0;
    pub const CreationFee: u32 = 0;
    pub const MaxWhiteListSize: u32 = 4;
}

impl balances::Trait for Test {
    type Balance = u64;
    type DustRemoval = ();
    type Event = TestEvent;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type WeightInfo = ();
    type MaxLocks = ();
}

impl common::currency::GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

impl membership::Trait for Test {
    type Event = TestEvent;
    type MemberId = u64;
    type PaidTermId = u64;
    type SubscriptionId = u64;
    type ActorId = u64;
}

impl crate::Trait for Test {
    type Event = TestEvent;
    type AuthorOriginValidator = ();
    type CouncilOriginValidator = CouncilMock;
    type ThreadId = u64;
    type PostId = u64;
    type MaxWhiteListSize = MaxWhiteListSize;
    type WeightInfo = ();
}

impl WeightInfo for () {
    fn add_post(_: u32) -> Weight {
        0
    }

    fn update_post() -> Weight {
        0
    }

    fn change_thread_mode(_: u32) -> Weight {
        0
    }
}

impl ActorOriginValidator<Origin, u64, u64> for () {
    fn ensure_actor_origin(origin: Origin, actor_id: u64) -> Result<u64, &'static str> {
        if frame_system::ensure_none(origin.clone()).is_ok() {
            return Ok(1);
        }

        if actor_id == 1 {
            return Ok(1);
        }

        if actor_id == 2 {
            return Ok(2);
        }

        if actor_id == 11 {
            return Ok(11);
        }

        if actor_id == 12 && frame_system::ensure_signed(origin).unwrap_or_default() == 12 {
            return Ok(12);
        }

        Err("Invalid author")
    }
}

pub struct CouncilMock;
impl ActorOriginValidator<Origin, u64, u64> for CouncilMock {
    fn ensure_actor_origin(origin: Origin, actor_id: u64) -> Result<u64, &'static str> {
        if actor_id == 2 && frame_system::ensure_signed(origin).unwrap_or_default() == 2 {
            return Ok(2);
        }

        Err("Not a council")
    }
}

impl frame_system::Trait for Test {
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
    type Event = TestEvent;
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type DbWeight = ();
    type BlockExecutionWeight = ();
    type ExtrinsicBaseWeight = ();
    type MaximumExtrinsicWeight = ();
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
    type PalletInfo = ();
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type SystemWeightInfo = ();
}

impl pallet_timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

pub fn initial_test_ext() -> sp_io::TestExternalities {
    let t = frame_system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

pub type Discussions = crate::Module<Test>;
pub type System = frame_system::Module<Test>;

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <Discussions as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <Discussions as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}
