#![cfg(test)]

pub use crate::{GenesisConfig, Trait};

pub use frame_support::traits::{Currency, LockIdentifier};
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types};
pub use frame_system;
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};

pub use common::currency::GovernanceCurrency;
use frame_support::traits::{OnFinalize, OnInitialize};
use frame_system::{EventRecord, Phase};

impl_outer_origin! {
    pub enum Origin for Test {}
}

mod membership_mod {
    pub use crate::Event;
}

impl_outer_event! {
    pub enum TestEvent for Test {
        membership_mod<T>,
        frame_system<T>,
        balances<T>,
        working_group Instance4 <T>,
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
    pub const MinimumPeriod: u64 = 5;
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

parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
    pub const MembershipFee: u64 = 100;
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

impl common::Trait for Test {
    type MemberId = u64;
    type ActorId = u32;
}

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 3;
    pub const LockId: LockIdentifier = [9; 8];
}

impl working_group::Trait<crate::MembershipWorkingGroupInstance> for Test {
    type Event = TestEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingHandler = staking_handler::StakingManager<Self, LockId>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
}

impl common::origin::ActorOriginValidator<Origin, u64, u64> for () {
    fn ensure_actor_origin(origin: Origin, _: u64) -> Result<u64, &'static str> {
        let account_id = frame_system::ensure_signed(origin)?;

        Ok(account_id)
    }
}

impl Trait for Test {
    type Event = TestEvent;
    type MembershipFee = MembershipFee;
}

pub struct TestExternalitiesBuilder<T: Trait> {
    system_config: Option<frame_system::GenesisConfig>,
    membership_config: Option<GenesisConfig<T>>,
}

impl<T: Trait> Default for TestExternalitiesBuilder<T> {
    fn default() -> Self {
        Self {
            system_config: None,
            membership_config: None,
        }
    }
}

impl<T: Trait> TestExternalitiesBuilder<T> {
    pub fn set_membership_config(mut self, membership_config: GenesisConfig<T>) -> Self {
        self.membership_config = Some(membership_config);
        self
    }
    pub fn build(self) -> sp_io::TestExternalities {
        // Add system
        let mut t = self
            .system_config
            .unwrap_or(frame_system::GenesisConfig::default())
            .build_storage::<T>()
            .unwrap();

        // Add membership
        self.membership_config
            .unwrap_or(GenesisConfig::default())
            .assimilate_storage(&mut t)
            .unwrap();

        t.into()
    }
}

pub fn build_test_externalities() -> sp_io::TestExternalities {
    TestExternalitiesBuilder::<Test>::default().build()
}

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <Membership as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <Membership as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}

pub struct EventFixture;
impl EventFixture {
    pub fn assert_last_crate_event(expected_raw_event: crate::Event<Test>) {
        let converted_event = TestEvent::membership_mod(expected_raw_event);

        Self::assert_last_global_event(converted_event)
    }

    pub fn assert_last_global_event(expected_event: TestEvent) {
        let expected_event = EventRecord {
            phase: Phase::Initialization,
            event: expected_event,
            topics: vec![],
        };

        assert_eq!(System::events().pop().unwrap(), expected_event);
    }
}

pub type Balances = balances::Module<Test>;
pub type Membership = crate::Module<Test>;
pub type System = frame_system::Module<Test>;
