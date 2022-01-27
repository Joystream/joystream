#![cfg(test)]

use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types};
use frame_system::ensure_signed;
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    ModuleId, Perbill,
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
    pub const DataObjectDeletionPrize: u64 = 10;
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
    type DataObjectDeletionPrize = DataObjectDeletionPrize;
    type BlacklistSizeLimit = BlacklistSizeLimit;
    type ModuleId = StorageModuleId;
    type MemberOriginValidator = ();
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

    fn ensure_storage_working_group_leader_origin(origin: Self::Origin) -> DispatchResult {
        let account_id = ensure_signed(origin)?;

        if account_id != STORAGE_WG_LEADER_ACCOUNT_ID {
            Err(DispatchError::BadOrigin)
        } else {
            Ok(())
        }
    }

    fn ensure_storage_worker_origin(origin: Self::Origin, _: u64) -> DispatchResult {
        let account_id = ensure_signed(origin)?;

        if account_id != DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID {
            Err(DispatchError::BadOrigin)
        } else {
            Ok(())
        }
    }

    fn ensure_storage_worker_exists(worker_id: &u64) -> DispatchResult {
        let allowed_storage_providers =
            vec![DEFAULT_STORAGE_PROVIDER_ID, ANOTHER_STORAGE_PROVIDER_ID];

        if !allowed_storage_providers.contains(worker_id) {
            Err(DispatchError::Other("Invalid worker"))
        } else {
            Ok(())
        }
    }

    fn ensure_distribution_working_group_leader_origin(origin: Self::Origin) -> DispatchResult {
        let account_id = ensure_signed(origin)?;

        if account_id != DISTRIBUTION_WG_LEADER_ACCOUNT_ID {
            Err(DispatchError::BadOrigin)
        } else {
            Ok(())
        }
    }

    fn ensure_distribution_worker_origin(origin: Self::Origin, _: u64) -> DispatchResult {
        let account_id = ensure_signed(origin)?;

        if account_id != DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID {
            Err(DispatchError::BadOrigin)
        } else {
            Ok(())
        }
    }

    fn ensure_distribution_worker_exists(worker_id: &u64) -> DispatchResult {
        let allowed_providers = vec![
            DEFAULT_DISTRIBUTION_PROVIDER_ID,
            ANOTHER_DISTRIBUTION_PROVIDER_ID,
        ];

        if !allowed_providers.contains(worker_id) {
            Err(DispatchError::Other("Invalid worker"))
        } else {
            Ok(())
        }
    }
}

pub const DEFAULT_MEMBER_ID: u64 = 100;
pub const DEFAULT_MEMBER_ACCOUNT_ID: u64 = 101;

impl common::origin::ActorOriginValidator<Origin, u64, u64> for () {
    fn ensure_actor_origin(origin: Origin, member_id: u64) -> Result<u64, &'static str> {
        let signed_account_id = frame_system::ensure_signed(origin)?;

        if signed_account_id == DEFAULT_MEMBER_ACCOUNT_ID && member_id == DEFAULT_MEMBER_ID {
            Ok(signed_account_id)
        } else {
            Err(DispatchError::BadOrigin.into())
        }
    }
}

parameter_types! {
    pub const ScreenedMemberMaxInitialBalance: u64 = 5000;
}

impl common::MembershipTypes for Test {
    type MemberId = u64;
    type ActorId = u64;
}

impl membership::Trait for Test {
    type Event = TestEvent;
    type PaidTermId = u64;
    type SubscriptionId = u64;
    type ScreenedMemberMaxInitialBalance = ();
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
