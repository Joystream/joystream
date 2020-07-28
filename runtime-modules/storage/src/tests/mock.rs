#![cfg(test)]

use frame_support::storage::StorageMap;
use frame_support::traits::{OnFinalize, OnInitialize};
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types};
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};

use crate::data_directory::ContentIdExists;
use crate::data_object_type_registry::IsActiveDataObjectType;
pub use crate::StorageWorkingGroupInstance;
pub use crate::{data_directory, data_object_storage_registry, data_object_type_registry};
use common::currency::GovernanceCurrency;
use membership;

mod working_group_mod {
    pub use super::StorageWorkingGroupInstance;
    pub use working_group::Event;
}

mod members {
    pub use membership::Event;
}

impl_outer_origin! {
    pub enum Origin for Test {}
}

impl_outer_event! {
    pub enum MetaEvent for Test {
        data_object_type_registry<T>,
        data_directory<T>,
        data_object_storage_registry<T>,
        balances<T>,
        members<T>,
        working_group_mod StorageWorkingGroupInstance <T>,
        system<T>,
    }
}

pub const TEST_FIRST_DATA_OBJECT_TYPE_ID: u64 = 1000;
pub const TEST_FIRST_CONTENT_ID: u64 = 2000;
pub const TEST_FIRST_RELATIONSHIP_ID: u64 = 3000;
pub const TEST_FIRST_METADATA_ID: u64 = 4000;

pub const TEST_MOCK_LIAISON_STORAGE_PROVIDER_ID: u32 = 1;
pub const TEST_MOCK_EXISTING_CID: u64 = 42;

pub struct AnyDataObjectTypeIsActive {}
impl<T: data_object_type_registry::Trait> IsActiveDataObjectType<T> for AnyDataObjectTypeIsActive {
    fn is_active_data_object_type(_which: &T::DataObjectTypeId) -> bool {
        true
    }
}

pub struct MockContent {}
impl ContentIdExists<Test> for MockContent {
    fn has_content(which: &<Test as data_directory::Trait>::ContentId) -> bool {
        *which == TEST_MOCK_EXISTING_CID
    }

    fn get_data_object(
        which: &<Test as data_directory::Trait>::ContentId,
    ) -> Result<data_directory::DataObject<Test>, &'static str> {
        match *which {
            TEST_MOCK_EXISTING_CID => Ok(data_directory::DataObjectInternal {
                type_id: 1,
                size: 1234,
                added_at: data_directory::BlockAndTime {
                    block: 10,
                    time: 1024,
                },
                owner: 1,
                liaison: TEST_MOCK_LIAISON_STORAGE_PROVIDER_ID,
                liaison_judgement: data_directory::LiaisonJudgement::Pending,
                ipfs_content_id: vec![],
            }),
            _ => Err("nope, missing"),
        }
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
    pub const MaxObjectsPerInjection: u32 = 5;
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
    type Event = MetaEvent;
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

parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
    pub const StakePoolId: [u8; 8] = *b"joystake";
}

impl balances::Trait for Test {
    type Balance = u64;
    type DustRemoval = ();
    type Event = MetaEvent;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
}

impl GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 3;
}

impl working_group::Trait<StorageWorkingGroupInstance> for Test {
    type Event = MetaEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
}

impl data_object_type_registry::Trait for Test {
    type Event = MetaEvent;
    type DataObjectTypeId = u64;
}

impl data_directory::Trait for Test {
    type Event = MetaEvent;
    type ContentId = u64;
    type StorageProviderHelper = ();
    type IsActiveDataObjectType = AnyDataObjectTypeIsActive;
    type MemberOriginValidator = ();
    type MaxObjectsPerInjection = MaxObjectsPerInjection;
}

impl crate::data_directory::StorageProviderHelper<Test> for () {
    fn get_random_storage_provider() -> Result<u32, &'static str> {
        Ok(1)
    }
}

impl common::origin::ActorOriginValidator<Origin, u64, u64> for () {
    fn ensure_actor_origin(origin: Origin, _account_id: u64) -> Result<u64, &'static str> {
        let signed_account_id = system::ensure_signed(origin)?;

        Ok(signed_account_id)
    }
}

impl data_object_storage_registry::Trait for Test {
    type Event = MetaEvent;
    type DataObjectStorageRelationshipId = u64;
    type ContentIdExists = MockContent;
}

impl membership::Trait for Test {
    type Event = MetaEvent;
    type MemberId = u64;
    type SubscriptionId = u32;
    type PaidTermId = u32;
    type ActorId = u32;
}

impl stake::Trait for Test {
    type Currency = Balances;
    type StakePoolId = StakePoolId;
    type StakingEventsHandler = ();
    type StakeId = u64;
    type SlashId = u64;
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

impl hiring::Trait for Test {
    type OpeningId = u64;
    type ApplicationId = u64;
    type ApplicationDeactivatedHandler = ();
    type StakeHandlerProvider = hiring::Module<Self>;
}

pub struct ExtBuilder {
    first_data_object_type_id: u64,
    first_content_id: u64,
    first_relationship_id: u64,
    first_metadata_id: u64,
}

impl Default for ExtBuilder {
    fn default() -> Self {
        Self {
            first_data_object_type_id: 1,
            first_content_id: 2,
            first_relationship_id: 3,
            first_metadata_id: 4,
        }
    }
}

impl ExtBuilder {
    pub fn first_data_object_type_id(mut self, first_data_object_type_id: u64) -> Self {
        self.first_data_object_type_id = first_data_object_type_id;
        self
    }
    pub fn first_content_id(mut self, first_content_id: u64) -> Self {
        self.first_content_id = first_content_id;
        self
    }
    pub fn first_relationship_id(mut self, first_relationship_id: u64) -> Self {
        self.first_relationship_id = first_relationship_id;
        self
    }
    pub fn first_metadata_id(mut self, first_metadata_id: u64) -> Self {
        self.first_metadata_id = first_metadata_id;
        self
    }
    pub fn build(self) -> sp_io::TestExternalities {
        let mut t = system::GenesisConfig::default()
            .build_storage::<Test>()
            .unwrap();

        data_object_type_registry::GenesisConfig::<Test> {
            first_data_object_type_id: self.first_data_object_type_id,
        }
        .assimilate_storage(&mut t)
        .unwrap();

        data_object_storage_registry::GenesisConfig::<Test> {
            first_relationship_id: self.first_relationship_id,
        }
        .assimilate_storage(&mut t)
        .unwrap();

        membership::GenesisConfig::<Test> {
            default_paid_membership_fee: 0,
            members: vec![(1, "alice".into(), "".into(), "".into())],
        }
        .assimilate_storage(&mut t)
        .unwrap();

        t.into()
    }
}

pub type TestDataObjectType = data_object_type_registry::DataObjectType;

pub type Balances = balances::Module<Test>;
pub type System = system::Module<Test>;
pub type TestDataObjectTypeRegistry = data_object_type_registry::Module<Test>;
pub type TestDataDirectory = data_directory::Module<Test>;
pub type TestDataObjectStorageRegistry = data_object_storage_registry::Module<Test>;

pub fn with_default_mock_builder<R, F: FnOnce() -> R>(f: F) -> R {
    ExtBuilder::default()
        .first_data_object_type_id(TEST_FIRST_DATA_OBJECT_TYPE_ID)
        .first_content_id(TEST_FIRST_CONTENT_ID)
        .first_relationship_id(TEST_FIRST_RELATIONSHIP_ID)
        .first_metadata_id(TEST_FIRST_METADATA_ID)
        .build()
        .execute_with(|| f())
}

pub(crate) fn hire_storage_provider() -> (u64, u32) {
    let storage_provider_id = 1;
    let role_account_id = 1;

    let storage_provider = working_group::Worker {
        member_id: 1,
        role_account_id,
        reward_relationship: None,
        role_stake_profile: None,
    };

    <working_group::WorkerById<Test, StorageWorkingGroupInstance>>::insert(
        storage_provider_id,
        storage_provider,
    );

    (role_account_id, storage_provider_id)
}

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <TestDataObjectTypeRegistry as OnFinalize<u64>>::on_finalize(System::block_number());
        <TestDataDirectory as OnFinalize<u64>>::on_finalize(System::block_number());
        <TestDataObjectStorageRegistry as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <TestDataObjectTypeRegistry as OnInitialize<u64>>::on_initialize(System::block_number());
        <TestDataDirectory as OnInitialize<u64>>::on_initialize(System::block_number());
        <TestDataObjectStorageRegistry as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}
