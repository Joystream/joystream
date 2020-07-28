#![cfg(test)]

pub use crate::*;

use frame_support::traits::{OnFinalize, OnInitialize};
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types};
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
pub use system;

pub use common::currency::GovernanceCurrency;
pub use hiring;
pub use membership;
pub use minting;
pub use recurringrewards;
pub use stake;
pub use versioned_store;
pub use versioned_store_permissions;

use crate::genesis;

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
    pub const ExistentialDeposit: u32 = 0;
    pub const StakePoolId: [u8; 8] = *b"joystake";
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;

impl_outer_origin! {
    pub enum Origin for Test {}
}

mod lib {
    pub use crate::Event;
}

impl_outer_event! {
    pub enum TestEvent for Test {
        versioned_store<T>,
        membership<T>,
        balances<T>,
        system<T>,
        lib<T>,
    }
}

pub type RawLibTestEvent = RawEvent<
    ChannelId<Test>,
    LeadId<Test>,
    CuratorOpeningId<Test>,
    CuratorApplicationId<Test>,
    CuratorId<Test>,
    CuratorApplicationIdToCuratorIdMap<Test>,
    minting::BalanceOf<Test>,
    <Test as system::Trait>::AccountId,
    <Test as minting::Trait>::MintId,
>;

pub fn get_last_event_or_panic() -> RawLibTestEvent {
    if let TestEvent::lib(ref x) = System::events().last().unwrap().event {
        x.clone()
    } else {
        panic!("No event deposited.");
    }
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

impl balances::Trait for Test {
    type Balance = u64;
    type DustRemoval = ();
    type Event = TestEvent;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
}

impl GovernanceCurrency for Test {
    type Currency = Balances;
}

type TestMintId = u64;
impl minting::Trait for Test {
    type Currency = Balances;
    type MintId = TestMintId;
}

type TestRecipientId = u64;
type TestRewardRelationshipId = u64;
impl recurringrewards::Trait for Test {
    type PayoutStatusHandler = ();
    type RecipientId = TestRecipientId;
    type RewardRelationshipId = TestRewardRelationshipId;
}

type TestStakeId = u64;
type TestSlashId = u64;
impl stake::Trait for Test {
    type Currency = Balances;
    type StakePoolId = StakePoolId;
    type StakingEventsHandler = ();
    type StakeId = TestStakeId;
    type SlashId = TestSlashId;
}

type TestOpeningId = u64;
type TestApplicationId = u64;
impl hiring::Trait for Test {
    type OpeningId = TestOpeningId;
    type ApplicationId = TestApplicationId;
    type ApplicationDeactivatedHandler = ();
    type StakeHandlerProvider = hiring::Module<Self>;
}

impl versioned_store::Trait for Test {
    type Event = TestEvent;
}

type TestPrincipalId = u64;
impl versioned_store_permissions::Trait for Test {
    type Credential = TestPrincipalId;
    type CredentialChecker = ();
    type CreateClassPermissionsChecker = ();
}

type TestMemberId = u64;
impl membership::Trait for Test {
    type Event = TestEvent;
    type MemberId = TestMemberId;
    type PaidTermId = u64;
    type SubscriptionId = u64;
    type ActorId = u64;
}

impl Trait for Test {
    type Event = TestEvent;
}

pub struct TestExternalitiesBuilder<T: Trait> {
    system_config: Option<system::GenesisConfig>,
    membership_config: Option<membership::GenesisConfig<T>>,
    content_wg_config: Option<GenesisConfig<T>>,
}

impl<T: Trait> Default for TestExternalitiesBuilder<T> {
    fn default() -> Self {
        Self {
            system_config: None,
            membership_config: None,
            content_wg_config: None,
        }
    }
}

impl<T: Trait> TestExternalitiesBuilder<T> {
    pub fn with_content_wg_config(mut self, conteng_wg_config: GenesisConfig<T>) -> Self {
        self.content_wg_config = Some(conteng_wg_config);
        self
    }

    pub fn build(self) -> sp_io::TestExternalities {
        // Add system
        let mut t = self
            .system_config
            .unwrap_or(system::GenesisConfig::default())
            .build_storage::<T>()
            .unwrap();

        // Add membership
        self.membership_config
            .unwrap_or(membership::GenesisConfig::default())
            .assimilate_storage(&mut t)
            .unwrap();

        // Add content wg
        if self.content_wg_config.is_none() {
            genesis::GenesisConfigBuilder::<Test>::default()
                .build()
                .assimilate_storage(&mut t)
                .unwrap();
        } else {
            self.content_wg_config
                .unwrap()
                .assimilate_storage(&mut t)
                .unwrap();
        }

        t.into()
    }
}

pub type System = system::Module<Test>;
pub type Balances = balances::Module<Test>;
pub type ContentWorkingGroup = Module<Test>;
pub type Minting = minting::Module<Test>;

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <ContentWorkingGroup as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <ContentWorkingGroup as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}
