use frame_support::traits::{OnFinalize, OnInitialize};
use frame_support::weights::Weight;
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types};
use frame_system;
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};

use crate::{DefaultInstance, Module, Trait};

impl_outer_origin! {
    pub enum Origin for Test {}
}

mod working_group {
    pub use crate::Event;
}

mod membership_mod {
    pub use membership::Event;
}

impl_outer_event! {
    pub enum TestEvent for Test {
        balances<T>,
        crate DefaultInstance <T>,
        membership_mod<T>,
        frame_system<T>,
    }
}

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
    pub const ExistentialDeposit: u32 = 0;
    pub const MembershipFee: u64 = 0;
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 - remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;

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

impl common::currency::GovernanceCurrency for Test {
    type Currency = Balances;
}

impl pallet_timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
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

impl membership::Trait for Test {
    type Event = TestEvent;
    type MemberId = u64;
    type ActorId = u64;
    type MembershipFee = MembershipFee;
}

pub type Balances = balances::Module<Test>;
pub type System = frame_system::Module<Test>;
pub type Membership = membership::Module<Test>;

parameter_types! {
    pub const RewardPeriod: u32 = 2;
    pub const MaxWorkerNumberLimit: u32 = 3;
    pub const MinUnstakingPeriodLimit: u64 = 3;
    pub const LockId: [u8; 8] = [1; 8];
}

impl Trait for Test {
    type Event = TestEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = staking_handler::StakingManager<Self, LockId>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = MinUnstakingPeriodLimit;
    type RewardPeriod = RewardPeriod;
    type WeightInfo = ();
}

impl crate::WeightInfo for () {
    fn on_initialize_leaving(_: u32) -> Weight {
        0
    }
    fn on_initialize_rewarding_with_missing_reward(_: u32) -> Weight {
        0
    }
    fn on_initialize_rewarding_with_missing_reward_cant_pay(_: u32) -> Weight {
        0
    }
    fn on_initialize_rewarding_without_missing_reward(_: u32) -> Weight {
        0
    }
    fn apply_on_opening(_: u32) -> Weight {
        0
    }
    fn fill_opening_lead() -> Weight {
        0
    }
    fn fill_opening_worker(_: u32) -> Weight {
        0
    }
    fn update_role_account() -> Weight {
        0
    }
    fn cancel_opening() -> Weight {
        0
    }
    fn withdraw_application() -> Weight {
        0
    }
    fn slash_stake(_: u32) -> Weight {
        0
    }
    fn terminate_role_worker(_: u32) -> Weight {
        0
    }
    fn terminate_role_lead(_: u32) -> Weight {
        0
    }
    fn increase_stake() -> Weight {
        0
    }
    fn decrease_stake() -> Weight {
        0
    }
    fn spend_from_budget() -> Weight {
        0
    }
    fn update_reward_amount() -> Weight {
        0
    }
    fn set_status_text(_: u32) -> Weight {
        0
    }
    fn update_reward_account() -> Weight {
        0
    }
    fn set_budget() -> Weight {
        0
    }
    fn add_opening(_: u32) -> Weight {
        0
    }
    fn leave_role_immediatly() -> Weight {
        0
    }
    fn leave_role_later() -> Weight {
        0
    }
}

pub const ACTOR_ORIGIN_ERROR: &'static str = "Invalid membership";

impl common::origin::ActorOriginValidator<Origin, u64, u64> for () {
    fn ensure_actor_origin(origin: Origin, member_id: u64) -> Result<u64, &'static str> {
        let signed_account_id = frame_system::ensure_signed(origin)?;

        if member_id > 10 {
            return Err(ACTOR_ORIGIN_ERROR);
        }

        Ok(signed_account_id)
    }
}

pub type TestWorkingGroup = Module<Test, DefaultInstance>;

pub const STAKING_ACCOUNT_ID_FOR_FAILED_VALIDITY_CHECK: u64 = 111;
pub const STAKING_ACCOUNT_ID_FOR_CONFLICTING_STAKES: u64 = 333;
pub const STAKING_ACCOUNT_ID_FOR_ZERO_STAKE: u64 = 444;

pub fn build_test_externalities() -> sp_io::TestExternalities {
    let t = frame_system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <TestWorkingGroup as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <TestWorkingGroup as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}
