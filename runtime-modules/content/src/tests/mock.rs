#![cfg(test)]
use crate::*;
use frame_support::dispatch::DispatchResult;
use frame_support::traits::{LockIdentifier, OnFinalize, OnInitialize};
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types};
pub use membership::WeightInfo;
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    ModuleId, Perbill,
};
use sp_std::cell::RefCell;
use staking_handler::LockComparator;

use crate::ContentActorAuthenticator;
use crate::Trait;
use common::currency::GovernanceCurrency;

/// Module Aliases
pub type System = frame_system::Module<Test>;
pub type Content = Module<Test>;
pub type CollectiveFlip = randomness_collective_flip::Module<Test>;

/// Type aliases
pub type HashOutput = <Test as frame_system::Trait>::Hash;
pub type Hashing = <Test as frame_system::Trait>::Hashing;
pub type AccountId = <Test as frame_system::Trait>::AccountId;
pub type VideoId = <Test as Trait>::VideoId;
pub type VideoPostId = <Test as Trait>::VideoPostId;
pub type CuratorId = <Test as ContentActorAuthenticator>::CuratorId;
pub type CuratorGroupId = <Test as ContentActorAuthenticator>::CuratorGroupId;
pub type MemberId = <Test as MembershipTypes>::MemberId;
pub type ChannelId = <Test as storage::Trait>::ChannelId;

/// Account Ids
pub const DEFAULT_MEMBER_ACCOUNT_ID: u64 = 101;
pub const DEFAULT_CURATOR_ACCOUNT_ID: u64 = 102;
pub const LEAD_ACCOUNT_ID: u64 = 103;
pub const COLLABORATOR_MEMBER_ACCOUNT_ID: u64 = 104;
pub const DEFAULT_MODERATOR_ACCOUNT_ID: u64 = 105;
pub const UNAUTHORIZED_MEMBER_ACCOUNT_ID: u64 = 111;
pub const UNAUTHORIZED_CURATOR_ACCOUNT_ID: u64 = 112;
pub const UNAUTHORIZED_LEAD_ACCOUNT_ID: u64 = 113;
pub const UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID: u64 = 114;
pub const UNAUTHORIZED_MODERATOR_ACCOUNT_ID: u64 = 115;
pub const SECOND_MEMBER_ACCOUNT_ID: u64 = 116;
pub const DEFAULT_MEMBER_CHANNEL_REWARD_ACCOUNT_ID: u64 = 117;
pub const DEFAULT_CURATOR_CHANNEL_REWARD_ACCOUNT_ID: u64 = 118;
pub const DEFAULT_CHANNEL_REWARD_WITHDRAWAL_ACCOUNT_ID: u64 = 119;

/// Runtime Id's
pub const DEFAULT_MEMBER_ID: u64 = 201;
pub const DEFAULT_CURATOR_ID: u64 = 202;
pub const COLLABORATOR_MEMBER_ID: u64 = 204;
pub const DEFAULT_MODERATOR_ID: u64 = 205;
pub const UNAUTHORIZED_MEMBER_ID: u64 = 211;
pub const UNAUTHORIZED_CURATOR_ID: u64 = 212;
pub const UNAUTHORIZED_COLLABORATOR_MEMBER_ID: u64 = 214;
pub const UNAUTHORIZED_MODERATOR_ID: u64 = 215;
pub const SECOND_MEMBER_ID: u64 = 216;

pub const DATA_OBJECT_DELETION_PRIZE: u64 = 5;
pub const DEFAULT_OBJECT_SIZE: u64 = 5;
pub const DATA_OBJECTS_NUMBER: u64 = 10;

pub const OUTSTANDING_VIDEOS: u64 = 5;
pub const OUTSTANDING_CHANNELS: u64 = 3;
pub const TOTAL_OBJECTS_NUMBER: u64 =
    DATA_OBJECTS_NUMBER * (OUTSTANDING_VIDEOS + OUTSTANDING_CHANNELS);
pub const TOTAL_BALANCE_REQUIRED: u64 = TOTAL_OBJECTS_NUMBER * DATA_OBJECT_DELETION_PRIZE;

pub const STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT: u64 = TOTAL_OBJECTS_NUMBER;
pub const STORAGE_BUCKET_OBJECTS_SIZE_LIMIT: u64 =
    DEFAULT_OBJECT_SIZE * STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT;
pub const STORAGE_BUCKET_ACCEPTING_BAGS: bool = true;
pub const VOUCHER_OBJECTS_NUMBER_LIMIT: u64 = 2 * STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT;
pub const VOUCHER_OBJECTS_SIZE_LIMIT: u64 = VOUCHER_OBJECTS_NUMBER_LIMIT * DEFAULT_OBJECT_SIZE;
pub const INITIAL_BALANCE: u64 = TOTAL_BALANCE_REQUIRED;

pub const MEMBERS_COUNT: u64 = 10;
pub const PAYMENTS_NUMBER: u64 = 10;
pub const DEFAULT_PAYOUT_CLAIMED: u64 = 10;
pub const DEFAULT_PAYOUT_EARNED: u64 = 10;
pub const DEFAULT_NFT_PRICE: u64 = 1000;

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

impl common::StorageOwnership for Test {
    type ChannelId = u64;
    type ContentId = u64;
    type DataObjectTypeId = u64;
}

impl common::MembershipTypes for Test {
    type MemberId = u64;
    type ActorId = u64;
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

impl pallet_timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

impl GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

parameter_types! {
    pub const ScreenedMemberMaxInitialBalance: u64 = 5000;
}

impl ContentActorAuthenticator for Test {
    type CuratorId = u64;
    type CuratorGroupId = u64;

    fn validate_member_id(member_id: &Self::MemberId) -> bool {
        match *member_id {
            DEFAULT_MEMBER_ID => true,
            SECOND_MEMBER_ID => true,
            UNAUTHORIZED_MEMBER_ID => true,
            COLLABORATOR_MEMBER_ID => true,
            DEFAULT_MODERATOR_ID => true,
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

            SECOND_MEMBER_ID => {
                *account_id == ensure_signed(Origin::signed(SECOND_MEMBER_ACCOUNT_ID)).unwrap()
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
            UNAUTHORIZED_MODERATOR_ID => {
                *account_id
                    == ensure_signed(Origin::signed(UNAUTHORIZED_MODERATOR_ACCOUNT_ID)).unwrap()
            }

            DEFAULT_MODERATOR_ID => {
                *account_id == ensure_signed(Origin::signed(DEFAULT_MODERATOR_ACCOUNT_ID)).unwrap()
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
    pub const DataObjectDeletionPrize: u64 = DATA_OBJECT_DELETION_PRIZE;
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
    pub const MaxDataObjectSize: u64 = VOUCHER_OBJECTS_SIZE_LIMIT;
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

    type StorageWorkingGroup = StorageWG;
    type DistributionWorkingGroup = DistributionWG;
}

// Anyone can upload and delete without restriction

parameter_types! {
    pub const MaxNumberOfCuratorsPerGroup: u32 = 10;
    pub const ChannelOwnershipPaymentEscrowId: [u8; 8] = *b"12345678";
    pub const ContentModuleId: ModuleId = ModuleId(*b"mContent"); // module content
    pub const MaxModerators: u64 = 5;
    pub const CleanupMargin: u32 = 3;
    pub const CleanupCost: u32 = 1;
    pub const PricePerByte: u32 = 2;
    pub const VideoCommentsModuleId: ModuleId = ModuleId(*b"m0:forum"); // module : forum
    pub const BloatBondCap: u32 = 1000;
}

impl Trait for Test {
    /// The overarching event type.
    type Event = MetaEvent;

    /// Type of identifier for Videos
    type VideoId = u64;

    /// Type of identifier for open auctions
    type OpenAuctionId = u64;

    /// Type of identifier for Video Categories
    type VideoCategoryId = u64;

    /// Type of identifier for Channel Categories
    type ChannelCategoryId = u64;

    /// The maximum number of curators per group constraint
    type MaxNumberOfCuratorsPerGroup = MaxNumberOfCuratorsPerGroup;

    /// The data object used in storage
    type DataObjectStorage = storage::Module<Self>;

    /// VideoPostId Type
    type VideoPostId = u64;

    /// VideoPost Reaction Type
    type ReactionId = u64;

    /// moderators limit
    type MaxModerators = MaxModerators;

    /// price per byte
    type PricePerByte = PricePerByte;

    /// cleanup margin
    type CleanupMargin = CleanupMargin;

    /// bloat bond cap
    type BloatBondCap = BloatBondCap;

    /// cleanup cost
    type CleanupCost = CleanupCost;

    /// module id
    type ModuleId = ContentModuleId;

    /// membership info provider
    type MemberAuthenticator = MemberInfoProvider;

    /// council budget manager
    type CouncilBudgetManager = CouncilBudgetManager;
}

// #[derive (Default)]
pub struct ExtBuilder {
    next_channel_category_id: u64,
    next_channel_id: u64,
    next_video_category_id: u64,
    next_video_id: u64,
    next_curator_group_id: u64,
    next_video_post_id: u64,
    max_cashout_allowed: BalanceOf<Test>,
    min_cashout_allowed: BalanceOf<Test>,
    channel_cashouts_enabled: bool,
    min_auction_duration: u64,
    max_auction_duration: u64,
    min_auction_extension_period: u64,
    max_auction_extension_period: u64,
    min_bid_lock_duration: u64,
    max_bid_lock_duration: u64,
    min_starting_price: u64,
    max_starting_price: u64,
    min_creator_royalty: Perbill,
    max_creator_royalty: Perbill,
    min_bid_step: u64,
    max_bid_step: u64,
    platform_fee_percentage: Perbill,
    auction_starts_at_max_delta: u64,
    max_auction_whitelist_length: u32,
}

impl Default for ExtBuilder {
    // init test scenario for ExtBuilder
    fn default() -> Self {
        Self {
            next_channel_category_id: 1,
            next_channel_id: 1,
            next_video_category_id: 1,
            next_video_id: 1,
            next_curator_group_id: 1,
            next_video_post_id: 1,
            max_cashout_allowed: BalanceOf::<Test>::from(1_000u32),
            min_cashout_allowed: BalanceOf::<Test>::from(1u32),
            channel_cashouts_enabled: true,
            min_auction_duration: 5,
            max_auction_duration: 20,
            min_auction_extension_period: 3,
            max_auction_extension_period: 30,
            min_bid_lock_duration: 2,
            max_bid_lock_duration: 10,
            min_starting_price: 10,
            max_starting_price: 1000,
            min_creator_royalty: Perbill::from_percent(1),
            max_creator_royalty: Perbill::from_percent(5),
            min_bid_step: 10,
            max_bid_step: 100,
            platform_fee_percentage: Perbill::from_percent(1),
            auction_starts_at_max_delta: 90_000,
            max_auction_whitelist_length: 4,
        }
    }
}

impl ExtBuilder {
    pub fn build(self) -> sp_io::TestExternalities {
        let mut t = frame_system::GenesisConfig::default()
            .build_storage::<Test>()
            .unwrap();

        // the same as t.top().extend(GenesisConfig::<Test> etc...)
        GenesisConfig::<Test> {
            next_channel_category_id: self.next_channel_category_id,
            next_channel_id: self.next_channel_id,
            next_video_category_id: self.next_video_category_id,
            next_video_id: self.next_video_id,
            next_curator_group_id: self.next_curator_group_id,
            next_video_post_id: self.next_video_post_id,
            max_cashout_allowed: self.max_cashout_allowed,
            min_cashout_allowed: self.min_cashout_allowed,
            channel_cashouts_enabled: self.channel_cashouts_enabled,
            min_auction_duration: self.min_auction_duration,
            max_auction_duration: self.max_auction_duration,
            min_auction_extension_period: self.min_auction_extension_period,
            max_auction_extension_period: self.max_auction_extension_period,
            min_bid_lock_duration: self.min_bid_lock_duration,
            max_bid_lock_duration: self.max_bid_lock_duration,
            min_starting_price: self.min_starting_price,
            max_starting_price: self.max_starting_price,
            min_creator_royalty: self.min_creator_royalty,
            max_creator_royalty: self.max_creator_royalty,
            min_bid_step: self.min_bid_step,
            max_bid_step: self.max_bid_step,
            platform_fee_percentage: self.platform_fee_percentage,
            auction_starts_at_max_delta: self.auction_starts_at_max_delta,
            max_auction_whitelist_length: self.max_auction_whitelist_length,
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
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}

pub fn assert_event(tested_event: MetaEvent, number_of_events_after_call: usize) {
    // Ensure  runtime events length is equal to expected number of events after call
    assert_eq!(System::events().len(), number_of_events_after_call);

    // Ensure  last emitted event is equal to expected one
    assert_eq!(System::events().iter().last().unwrap().event, tested_event);
}

/// Get good params for open auction
pub fn get_open_auction_params() -> OpenAuctionParams<Test> {
    OpenAuctionParams::<Test> {
        starting_price: Content::min_starting_price(),
        buy_now_price: None,
        whitelist: BTreeSet::new(),
        bid_lock_duration: Content::min_bid_lock_duration(),
        starts_at: None,
    }
}

// membership trait implementation and related stuff

parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
    pub const DefaultMembershipPrice: u64 = 100;
    pub const InvitedMemberLockId: [u8; 8] = [2; 8];
    pub const StakingCandidateLockId: [u8; 8] = [3; 8];
    pub const CandidateStake: u64 = 100;
}

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 3;
    pub const LockId: LockIdentifier = [9; 8];
    pub const DefaultInitialInvitationBalance: u64 = 100;
    pub const ReferralCutMaximumPercent: u8 = 50;
    pub const MinimumStakeForOpening: u32 = 50;
    pub const MinimumApplicationStake: u32 = 50;
    pub const LeaderOpeningStake: u32 = 20;
}

impl membership::Trait for Test {
    type Event = MetaEvent;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type WorkingGroup = ();
    type DefaultInitialInvitationBalance = DefaultInitialInvitationBalance;
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InvitedMemberLockId>;
    type StakingCandidateStakingHandler =
        staking_handler::StakingManager<Self, StakingCandidateLockId>;
    type CandidateStake = CandidateStake;
    type WeightInfo = ();
}

pub const WORKING_GROUP_BUDGET: u64 = 100;

thread_local! {
    pub static WG_BUDGET: RefCell<u64> = RefCell::new(WORKING_GROUP_BUDGET);
    pub static LEAD_SET: RefCell<bool> = RefCell::new(bool::default());
}

impl common::working_group::WorkingGroupBudgetHandler<Test> for () {
    fn get_budget() -> u64 {
        WG_BUDGET.with(|val| *val.borrow())
    }

    fn set_budget(new_value: u64) {
        WG_BUDGET.with(|val| {
            *val.borrow_mut() = new_value;
        });
    }
}

impl common::working_group::WorkingGroupAuthenticator<Test> for () {
    fn ensure_worker_origin(
        _origin: <Test as frame_system::Trait>::Origin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!()
    }

    fn ensure_leader_origin(_origin: <Test as frame_system::Trait>::Origin) -> DispatchResult {
        unimplemented!()
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

    fn worker_exists(_worker_id: &<Test as common::membership::MembershipTypes>::ActorId) -> bool {
        unimplemented!();
    }

    fn ensure_worker_exists(
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!();
    }
}

impl LockComparator<u64> for Test {
    fn are_locks_conflicting(new_lock: &LockIdentifier, existing_locks: &[LockIdentifier]) -> bool {
        if *new_lock == InvitedMemberLockId::get() {
            existing_locks.contains(new_lock)
        } else {
            false
        }
    }
}

pub struct MemberInfoProvider {}
impl MembershipInfoProvider<Test> for MemberInfoProvider {
    fn controller_account_id(
        member_id: common::MemberId<Test>,
    ) -> Result<AccountId, DispatchError> {
        match member_id {
            DEFAULT_MEMBER_ID => Ok(DEFAULT_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID => Ok(SECOND_MEMBER_ACCOUNT_ID),
            UNAUTHORIZED_MEMBER_ID => Ok(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            UNAUTHORIZED_COLLABORATOR_MEMBER_ID => Ok(UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID),
            COLLABORATOR_MEMBER_ID => Ok(COLLABORATOR_MEMBER_ACCOUNT_ID),
            UNAUTHORIZED_MODERATOR_ID => Ok(UNAUTHORIZED_MODERATOR_ACCOUNT_ID),
            DEFAULT_MODERATOR_ID => Ok(DEFAULT_MODERATOR_ACCOUNT_ID),
            _ => Err(DispatchError::Other("no account found")),
        }
    }
}

// storage & distribution wg auth
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

pub const COUNCIL_BUDGET_ACCOUNT_ID: u64 = 90000000;
pub struct CouncilBudgetManager;
impl common::council::CouncilBudgetManager<u64, u64> for CouncilBudgetManager {
    fn get_budget() -> u64 {
        balances::Module::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID)
    }

    fn set_budget(budget: u64) {
        let old_budget = Self::get_budget();

        if budget > old_budget {
            let _ = balances::Module::<Test>::deposit_creating(
                &COUNCIL_BUDGET_ACCOUNT_ID,
                budget - old_budget,
            );
        }

        if budget < old_budget {
            let _ =
                balances::Module::<Test>::slash(&COUNCIL_BUDGET_ACCOUNT_ID, old_budget - budget);
        }
    }

    fn try_withdraw(account_id: &u64, amount: u64) -> DispatchResult {
        ensure!(
            Self::get_budget() >= amount,
            DispatchError::Other("CouncilBudgetManager: try_withdraw - not enough balance.")
        );

        let _ = Balances::<Test>::deposit_creating(account_id, amount);

        let current_budget = Self::get_budget();
        let new_budget = current_budget.saturating_sub(amount);
        Self::set_budget(new_budget);

        Ok(())
    }
}
