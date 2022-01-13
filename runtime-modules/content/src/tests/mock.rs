#![cfg(test)]

use crate::*;
use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::traits::{OnFinalize, OnInitialize};
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types};
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    ModuleId, Perbill,
};

use crate::ContentActorAuthenticator;
use crate::Trait;
use common::currency::GovernanceCurrency;

pub type CuratorId = <Test as ContentActorAuthenticator>::CuratorId;
pub type CuratorGroupId = <Test as ContentActorAuthenticator>::CuratorGroupId;
pub type MemberId = <Test as MembershipTypes>::MemberId;
pub type ChannelId = <Test as StorageOwnership>::ChannelId;

/// Accounts
pub const DEFAULT_MEMBER_ACCOUNT_ID: u64 = 101;
pub const DEFAULT_CURATOR_ACCOUNT_ID: u64 = 102;
pub const LEAD_ACCOUNT_ID: u64 = 103;
pub const COLLABORATOR_MEMBER_ACCOUNT_ID: u64 = 104;
pub const UNAUTHORIZED_MEMBER_ACCOUNT_ID: u64 = 105;
pub const UNAUTHORIZED_CURATOR_ACCOUNT_ID: u64 = 106;
pub const UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID: u64 = 107;
pub const UNAUTHORIZED_LEAD_ACCOUNT_ID: u64 = 108;

// Members range from MemberId 1 to 10
pub const MEMBERS_COUNT: MemberId = 10;

/// Runtime Id's
pub const DEFAULT_MEMBER_ID: MemberId = 201;
pub const DEFAULT_CURATOR_ID: CuratorId = 202;
pub const COLLABORATOR_MEMBER_ID: u64 = 204;
pub const UNAUTHORIZED_MEMBER_ID: u64 = 205;
pub const UNAUTHORIZED_CURATOR_ID: u64 = 206;
pub const UNAUTHORIZED_COLLABORATOR_MEMBER_ID: u64 = 207;

pub const INITIAL_BALANCE: u64 = 1000;
pub const DATA_OBJECTS_NUMBER: u64 = 10;
pub const DEFAULT_OBJECT_SIZE: u64 = 5;
pub const STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT: u64 = 4 * DATA_OBJECTS_NUMBER;
pub const STORAGE_BUCKET_OBJECTS_SIZE_LIMIT: u64 =
    STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT * DEFAULT_OBJECT_SIZE;
pub const VOUCHER_OBJECTS_NUMBER_LIMIT: u64 = 2 * STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT;
pub const VOUCHER_OBJECTS_SIZE_LIMIT: u64 = 2 * STORAGE_BUCKET_OBJECTS_SIZE_LIMIT;
pub const STORAGE_BUCKET_ACCEPTING_BAGS: bool = true;
pub const NUMBER_OF_CHANNELS_VIDEOS: u64 =
    STORAGE_BUCKET_OBJECTS_SIZE_LIMIT / (2 * DEFAULT_OBJECT_SIZE) - 1;

impl_outer_origin! {
    pub enum Origin for Test {}
}

mod content {
    pub use crate::Event;
}

mod storage_mod {
    pub use storage::Event;
}

mod membership_mod {
    pub use membership::Event;
}

impl_outer_event! {
    pub enum MetaEvent for Test {
        content<T>,
        frame_system<T>,
        balances<T>,
        membership_mod<T>,
        storage_mod<T>,
    }
}

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
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type PalletInfo = ();
    type SystemWeightInfo = ();
}

impl pallet_timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

impl common::MembershipTypes for Test {
    type MemberId = u64;
    type ActorId = u64;
}

impl common::StorageOwnership for Test {
    type ChannelId = u64;
    type ContentId = u64;
    type DataObjectTypeId = u64;
}

parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
}

impl balances::Trait for Test {
    type Balance = u64;
    type DustRemoval = ();
    type Event = MetaEvent;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type WeightInfo = ();
    type MaxLocks = ();
}

impl GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

parameter_types! {
    pub const ScreenedMemberMaxInitialBalance: u64 = 5000;
}

impl membership::Trait for Test {
    type Event = MetaEvent;
    type PaidTermId = u64;
    type SubscriptionId = u64;
    type ScreenedMemberMaxInitialBalance = ();
}

impl ContentActorAuthenticator for Test {
    type CuratorId = u64;
    type CuratorGroupId = u64;

    fn validate_member_id(member_id: &Self::MemberId) -> bool {
        match *member_id {
            DEFAULT_MEMBER_ID => true,
            UNAUTHORIZED_MEMBER_ID => true,
            COLLABORATOR_MEMBER_ID => true,
            UNAUTHORIZED_COLLABORATOR_MEMBER_ID => true,
            _ => false,
        }
    }

    fn is_lead(account_id: &Self::AccountId) -> bool {
        *account_id == ensure_signed(Origin::signed(LEAD_ACCOUNT_ID)).unwrap()
    }

    fn is_curator(curator_id: &Self::CuratorId, account_id: &Self::AccountId) -> bool {
        match *curator_id {
            DEFAULT_CURATOR_ID => {
                *account_id == ensure_signed(Origin::signed(DEFAULT_CURATOR_ACCOUNT_ID)).unwrap()
            }

            UNAUTHORIZED_CURATOR_ID => {
                *account_id
                    == ensure_signed(Origin::signed(UNAUTHORIZED_CURATOR_ACCOUNT_ID)).unwrap()
            }

            _ => false,
        }
    }

    fn is_member(member_id: &Self::MemberId, account_id: &Self::AccountId) -> bool {
        match *member_id {
            DEFAULT_MEMBER_ID => {
                *account_id == ensure_signed(Origin::signed(DEFAULT_MEMBER_ACCOUNT_ID)).unwrap()
            }

            UNAUTHORIZED_MEMBER_ID => {
                *account_id
                    == ensure_signed(Origin::signed(UNAUTHORIZED_MEMBER_ACCOUNT_ID)).unwrap()
            }

            UNAUTHORIZED_COLLABORATOR_MEMBER_ID => {
                *account_id
                    == ensure_signed(Origin::signed(UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID))
                        .unwrap()
            }

            COLLABORATOR_MEMBER_ID => {
                *account_id
                    == ensure_signed(Origin::signed(COLLABORATOR_MEMBER_ACCOUNT_ID)).unwrap()
            }
            _ => false,
        }
    }

    fn is_valid_curator_id(curator_id: &Self::CuratorId) -> bool {
        match *curator_id {
            DEFAULT_CURATOR_ID => true,
            UNAUTHORIZED_CURATOR_ID => true,
            _ => false,
        }
    }
}

parameter_types! {
    pub const MaxNumberOfDataObjectsPerBag: u64 = 4;
    pub const MaxDistributionBucketFamilyNumber: u64 = 4;
    pub const DataObjectDeletionPrize: u64 = 10;
    pub const StorageModuleId: ModuleId = ModuleId(*b"mstorage"); // module storage
    pub const BlacklistSizeLimit: u64 = 1;
    pub const MaxNumberOfPendingInvitationsPerDistributionBucket: u64 = 1;
    pub const StorageBucketsPerBagValueConstraint: storage::StorageBucketsPerBagValueConstraint =
        storage::StorageBucketsPerBagValueConstraint {min: 3, max_min_diff: 7};
    pub const InitialStorageBucketsNumberForDynamicBag: u64 = 3;
    pub const MaxRandomIterationNumber: u64 = 3;
    pub const DefaultMemberDynamicBagNumberOfStorageBuckets: u64 = 3;
    pub const DefaultChannelDynamicBagNumberOfStorageBuckets: u64 = 4;
    pub const DistributionBucketsPerBagValueConstraint: storage::DistributionBucketsPerBagValueConstraint =
        storage::StorageBucketsPerBagValueConstraint {min: 3, max_min_diff: 7};
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

impl storage::Trait for Test {
    type Event = MetaEvent;
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
    type ContentId = u64;
    type MaxDataObjectSize = MaxDataObjectSize;

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

// Anyone can upload and delete without restriction

parameter_types! {
    pub const MaxNumberOfCuratorsPerGroup: u32 = 10;
    pub const ChannelOwnershipPaymentEscrowId: [u8; 8] = *b"12345678";
    pub const VideosMigrationsEachBlock: u64 = 20;
    pub const ChannelsMigrationsEachBlock: u64 = 10;
}

impl Trait for Test {
    /// The overarching event type.
    type Event = MetaEvent;

    /// Channel Transfer Payments Escrow Account seed for ModuleId to compute deterministic AccountId
    type ChannelOwnershipPaymentEscrowId = ChannelOwnershipPaymentEscrowId;

    /// Type of identifier for Videos
    type VideoId = u64;

    /// Type of identifier for Video Categories
    type VideoCategoryId = u64;

    /// Type of identifier for Channel Categories
    type ChannelCategoryId = u64;

    /// Type of identifier for Playlists
    type PlaylistId = u64;

    /// Type of identifier for Persons
    type PersonId = u64;

    /// Type of identifier for Channels
    type SeriesId = u64;

    /// Type of identifier for Channel transfer requests
    type ChannelOwnershipTransferRequestId = u64;

    /// The maximum number of curators per group constraint
    type MaxNumberOfCuratorsPerGroup = MaxNumberOfCuratorsPerGroup;

    /// The data object used in storage
    type DataObjectStorage = storage::Module<Self>;

    type VideosMigrationsEachBlock = VideosMigrationsEachBlock;
    type ChannelsMigrationsEachBlock = ChannelsMigrationsEachBlock;
}

pub type System = frame_system::Module<Test>;
pub type Content = Module<Test>;
// #[derive (Default)]
pub struct ExtBuilder {
    next_channel_category_id: u64,
    next_channel_id: u64,
    next_video_category_id: u64,
    next_video_id: u64,
    next_playlist_id: u64,
    next_person_id: u64,
    next_series_id: u64,
    next_channel_transfer_request_id: u64,
    next_curator_group_id: u64,
    video_migration: VideoMigrationConfig<Test>,
    channel_migration: ChannelMigrationConfig<Test>,
}

impl Default for ExtBuilder {
    fn default() -> Self {
        Self {
            next_channel_category_id: 1,
            next_channel_id: 1,
            next_video_category_id: 1,
            next_video_id: 1,
            next_playlist_id: 1,
            next_person_id: 1,
            next_series_id: 1,
            next_channel_transfer_request_id: 1,
            next_curator_group_id: 1,
            video_migration: MigrationConfigRecord {
                current_id: 1,
                final_id: 1,
            },
            channel_migration: MigrationConfigRecord {
                current_id: 1,
                final_id: 1,
            },
        }
    }
}

impl ExtBuilder {
    pub fn build(self) -> sp_io::TestExternalities {
        let mut t = frame_system::GenesisConfig::default()
            .build_storage::<Test>()
            .unwrap();

        GenesisConfig::<Test> {
            next_channel_category_id: self.next_channel_category_id,
            next_channel_id: self.next_channel_id,
            next_video_category_id: self.next_video_category_id,
            next_video_id: self.next_video_id,
            next_playlist_id: self.next_playlist_id,
            next_person_id: self.next_person_id,
            next_series_id: self.next_series_id,
            next_channel_transfer_request_id: self.next_channel_transfer_request_id,
            next_curator_group_id: self.next_curator_group_id,
            video_migration: self.video_migration,
            channel_migration: self.channel_migration,
        }
        .assimilate_storage(&mut t)
        .unwrap();

        t.into()
    }
}

pub fn with_default_mock_builder<R, F: FnOnce() -> R>(f: F) -> R {
    ExtBuilder::default().build().execute_with(|| f())
}

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        <Content as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <Content as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}

pub type CollectiveFlip = randomness_collective_flip::Module<Test>;

pub type Balances = balances::Module<Test>;
