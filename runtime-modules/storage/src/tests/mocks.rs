#![cfg(test)]

pub use frame_support::traits::LockIdentifier;
use frame_support::{ensure, impl_outer_event, impl_outer_origin, parameter_types};
use frame_system::ensure_signed;
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    DispatchError, DispatchResult, ModuleId, Perbill,
};

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;

impl_outer_origin! {
    pub enum Origin for Test {}
}

mod storage {
    pub use crate::Event;
}

mod membership_mod {
    pub use membership::Event;
}

impl_outer_event! {
    pub enum TestEvent for Test {
        balances<T>,
        storage<T>,
        frame_system<T>,
        membership_mod<T>,
    }
}

parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
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

parameter_types! {
    pub const MaxDistributionBucketFamilyNumber: u64 = 6;
    pub const StorageModuleId: ModuleId = ModuleId(*b"mstorage"); // module storage
    pub const BlacklistSizeLimit: u64 = 1;
    pub const MaxNumberOfPendingInvitationsPerDistributionBucket: u64 = 1;
    pub const StorageBucketsPerBagValueConstraint: crate::StorageBucketsPerBagValueConstraint =
        crate::StorageBucketsPerBagValueConstraint {min: 3, max_min_diff: 7};
    pub const InitialStorageBucketsNumberForDynamicBag: u64 = 3;
    pub const MaxRandomIterationNumber: u64 = 3;
    pub const DefaultMemberDynamicBagNumberOfStorageBuckets: u64 = 3;
    pub const DefaultChannelDynamicBagNumberOfStorageBuckets: u64 = 4;
    pub const DistributionBucketsPerBagValueConstraint: crate::DistributionBucketsPerBagValueConstraint =
        crate::StorageBucketsPerBagValueConstraint {min: 3, max_min_diff: 7};
    pub const MaxDataObjectSize: u64 = 400;
}

pub const STORAGE_WG_LEADER_ACCOUNT_ID: u64 = 100001;
pub const DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID: u64 = 100002;
pub const DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID: u64 = 100003;
pub const DISTRIBUTION_WG_LEADER_ACCOUNT_ID: u64 = 100004;
pub const DEFAULT_STORAGE_PROVIDER_ID: u64 = 10;
pub const ANOTHER_STORAGE_PROVIDER_ID: u64 = 11;
pub const DEFAULT_DISTRIBUTION_PROVIDER_ID: u64 = 12;
pub const ANOTHER_DISTRIBUTION_PROVIDER_ID: u64 = 13;
pub const INITIAL_BALANCE: u64 = 10_000;
pub const BAG_DELETION_PRIZE_VALUE: u64 = 100;
pub const VOUCHER_SIZE_LIMIT: u64 = 100;
pub const VOUCHER_OBJECTS_LIMIT: u64 = 20;
pub const DEFAULT_STORAGE_BUCKET_SIZE_LIMIT: u64 = 100;
pub const DEFAULT_STORAGE_BUCKET_OBJECTS_LIMIT: u64 = 10;
pub const DEFAULT_STORAGE_BUCKETS_NUMBER: u64 = 10;

impl crate::Trait for Test {
    type Event = TestEvent;
    type DataObjectId = u64;
    type StorageBucketId = u64;
    type DistributionBucketIndex = u64;
    type DistributionBucketFamilyId = u64;
    type DistributionBucketOperatorId = u64;
    type ChannelId = u64;
    type BlacklistSizeLimit = BlacklistSizeLimit;
    type ModuleId = StorageModuleId;
    type StorageBucketsPerBagValueConstraint = StorageBucketsPerBagValueConstraint;
    type DefaultMemberDynamicBagNumberOfStorageBuckets =
        DefaultMemberDynamicBagNumberOfStorageBuckets;
    type DefaultChannelDynamicBagNumberOfStorageBuckets =
        DefaultChannelDynamicBagNumberOfStorageBuckets;
    type Randomness = CollectiveFlip;
    type MaxRandomIterationNumber = MaxRandomIterationNumber;
    type MaxDistributionBucketFamilyNumber = MaxDistributionBucketFamilyNumber;
    type DistributionBucketsPerBagValueConstraint = DistributionBucketsPerBagValueConstraint;
    type MaxNumberOfPendingInvitationsPerDistributionBucket =
        MaxNumberOfPendingInvitationsPerDistributionBucket;
    type MaxDataObjectSize = MaxDataObjectSize;
    type ContentId = u64;
    type StorageWorkingGroup = StorageWG;
    type DistributionWorkingGroup = DistributionWG;
}

pub const DEFAULT_MEMBER_ID: u64 = 100;
pub const DEFAULT_MEMBER_ACCOUNT_ID: u64 = 101;

parameter_types! {
    pub const ScreenedMemberMaxInitialBalance: u64 = 5000;
}

impl common::MembershipTypes for Test {
    type MemberId = u64;
    type ActorId = u64;
}

impl pallet_timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

impl common::currency::GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

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
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type PalletInfo = ();
    type SystemWeightInfo = ();
}

pub fn build_test_externalities() -> sp_io::TestExternalities {
    let t = frame_system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

pub type Storage = crate::Module<Test>;
pub type System = frame_system::Module<Test>;
pub type Balances = balances::Module<Test>;
pub type CollectiveFlip = randomness_collective_flip::Module<Test>;

// working group integration
pub struct StorageWG;
pub struct DistributionWG;

impl common::working_group::WorkingGroupAuthenticator<Test> for StorageWG {
    fn ensure_worker_origin(
        origin: <Test as frame_system::Trait>::Origin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        let account_id = ensure_signed(origin)?;
        ensure!(
            account_id == DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID,
            DispatchError::BadOrigin,
        );
        Ok(())
    }

    fn ensure_leader_origin(origin: <Test as frame_system::Trait>::Origin) -> DispatchResult {
        let account_id = ensure_signed(origin)?;
        ensure!(
            account_id == STORAGE_WG_LEADER_ACCOUNT_ID,
            DispatchError::BadOrigin,
        );
        Ok(())
    }

    fn get_leader_member_id() -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Trait>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Trait>::AccountId,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> bool {
        unimplemented!()
    }

    fn worker_exists(worker_id: &<Test as common::membership::MembershipTypes>::ActorId) -> bool {
        Self::ensure_worker_exists(worker_id).is_ok()
    }

    fn ensure_worker_exists(
        worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        let allowed_storage_providers =
            vec![DEFAULT_STORAGE_PROVIDER_ID, ANOTHER_STORAGE_PROVIDER_ID];
        ensure!(
            allowed_storage_providers.contains(worker_id),
            DispatchError::Other("Invailid worker"),
        );
        Ok(())
    }
}

impl common::working_group::WorkingGroupAuthenticator<Test> for DistributionWG {
    fn ensure_worker_origin(
        origin: <Test as frame_system::Trait>::Origin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        let account_id = ensure_signed(origin)?;
        ensure!(
            account_id == DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID,
            DispatchError::BadOrigin,
        );
        Ok(())
    }

    fn ensure_leader_origin(origin: <Test as frame_system::Trait>::Origin) -> DispatchResult {
        let account_id = ensure_signed(origin)?;
        ensure!(
            account_id == DISTRIBUTION_WG_LEADER_ACCOUNT_ID,
            DispatchError::BadOrigin,
        );
        Ok(())
    }

    fn get_leader_member_id() -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Trait>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Trait>::AccountId,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> bool {
        unimplemented!()
    }

    fn worker_exists(worker_id: &<Test as common::membership::MembershipTypes>::ActorId) -> bool {
        Self::ensure_worker_exists(worker_id).is_ok()
    }

    fn ensure_worker_exists(
        worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        let allowed_storage_providers = vec![
            DEFAULT_DISTRIBUTION_PROVIDER_ID,
            ANOTHER_DISTRIBUTION_PROVIDER_ID,
        ];
        ensure!(
            allowed_storage_providers.contains(worker_id),
            DispatchError::Other("Invailid worker"),
        );
        Ok(())
    }
}

impl common::working_group::WorkingGroupBudgetHandler<Test> for StorageWG {
    fn get_budget() -> u64 {
        unimplemented!()
    }

    fn set_budget(_new_value: u64) {
        unimplemented!()
    }
}

impl common::working_group::WorkingGroupBudgetHandler<Test> for DistributionWG {
    fn get_budget() -> u64 {
        unimplemented!()
    }

    fn set_budget(_new_value: u64) {
        unimplemented!()
    }
}
