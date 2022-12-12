#![cfg(test)]
use crate::*;
use common::membership::MemberOriginValidator;
use common::working_group::WorkingGroupAuthenticator;
use frame_support::dispatch::DispatchResult;
use frame_support::traits::{
    ConstU16, ConstU32, ConstU64, LockIdentifier, OnFinalize, OnInitialize,
};
use frame_support::{parameter_types, PalletId};
pub use membership::WeightInfo;
use sp_core::{H256, U256};
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, Convert, IdentityLookup},
    Perbill, Permill,
};
use sp_std::cell::RefCell;
use sp_std::convert::{TryFrom, TryInto};
use staking_handler::LockComparator;

use crate::Config;
use crate::ContentActorAuthenticator;
use common::locks::{BoundStakingAccountLockId, InvitedMemberLockId};

/// Type aliases
pub type HashOutput = <Test as frame_system::Config>::Hash;
pub type Hashing = <Test as frame_system::Config>::Hashing;
pub type AccountId = <Test as frame_system::Config>::AccountId;
pub type VideoId = <Test as Config>::VideoId;
pub type CuratorId = <Test as ContentActorAuthenticator>::CuratorId;
pub type CuratorGroupId = <Test as ContentActorAuthenticator>::CuratorGroupId;
pub type MemberId = <Test as MembershipTypes>::MemberId;
pub type ChannelId = <Test as storage::Config>::ChannelId;
pub type TransferId = <Test as Config>::TransferId;
pub type StorageBucketId = <Test as storage::Config>::StorageBucketId;

const fn gen_array_u64<const N: usize>(init: u64) -> [u64; N] {
    let mut res = [0; N];

    let mut i = 0;
    while i < N as u64 {
        res[i as usize] = init + i;
        i += 1;
    }

    res
}

const fn account(id: u64) -> U256 {
    U256([id, 0, 0, 0])
}

pub const MEMBER_IDS_INIT: u64 = 500;
pub const MAX_MEMBER_IDS: usize = 100;

pub const MEMBER_IDS: [u64; MAX_MEMBER_IDS] = gen_array_u64::<MAX_MEMBER_IDS>(MEMBER_IDS_INIT);

pub const CURATOR_IDS_INIT: u64 = 600;
pub const MAX_CURATOR_IDS: usize = 100;

pub const CURATOR_IDS: [u64; MAX_CURATOR_IDS] = gen_array_u64::<MAX_CURATOR_IDS>(CURATOR_IDS_INIT);

pub const COLABORATOR_IDS_INIT: u64 = 700;
pub const MAX_COLABORATOR_IDS: usize = 100;

pub const COLABORATOR_IDS: [u64; MAX_COLABORATOR_IDS] =
    gen_array_u64::<MAX_COLABORATOR_IDS>(COLABORATOR_IDS_INIT);

pub const LEAD_ACCOUNT_ID: U256 = account(100005);
pub const LEAD_MEMBER_ID: u64 = 100005;

pub const DEFAULT_MEMBER_ACCOUNT_ID: U256 = account(MEMBER_IDS[0]);
pub const DEFAULT_MEMBER_ALT_ACCOUNT_ID: U256 = account(MEMBER_IDS[1]);
pub const DEFAULT_MEMBER_ID: u64 = MEMBER_IDS[0];

pub const SECOND_MEMBER_ACCOUNT_ID: U256 = account(MEMBER_IDS[2]);
pub const SECOND_MEMBER_ID: u64 = MEMBER_IDS[2];

pub const THIRD_MEMBER_ACCOUNT_ID: U256 = account(MEMBER_IDS[3]);
pub const THIRD_MEMBER_ID: u64 = MEMBER_IDS[3];

pub const COLLABORATOR_MEMBER_ACCOUNT_ID: U256 = account(COLABORATOR_IDS[0]);
pub const COLLABORATOR_MEMBER_ID: u64 = COLABORATOR_IDS[0];

pub const DEFAULT_CURATOR_ACCOUNT_ID: U256 = account(CURATOR_IDS[0]);
pub const DEFAULT_CURATOR_MEMBER_ID: u64 = CURATOR_IDS[0];
pub const DEFAULT_CURATOR_ID: u64 = CURATOR_IDS[0];

pub const UNAUTHORIZED_LEAD_ACCOUNT_ID: U256 = account(100008);

pub const UNAUTHORIZED_MEMBER_ACCOUNT_ID: U256 = account(MEMBER_IDS[4]);
pub const UNAUTHORIZED_MEMBER_ID: u64 = MEMBER_IDS[4];

pub const UNAUTHORIZED_CURATOR_ACCOUNT_ID: U256 = account(CURATOR_IDS[1]);
pub const UNAUTHORIZED_CURATOR_MEMBER_ID: u64 = CURATOR_IDS[1];
pub const UNAUTHORIZED_CURATOR_ID: u64 = CURATOR_IDS[1];

pub const UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID: U256 = account(COLABORATOR_IDS[1]);
pub const UNAUTHORIZED_COLLABORATOR_MEMBER_ID: u64 = COLABORATOR_IDS[1];

pub const DEFAULT_DATA_OBJECT_STATE_BLOAT_BOND: u64 = 0;
pub const DEFAULT_CHANNEL_STATE_BLOAT_BOND: u64 = 25; // Should be >= ExistentialDeposit!
pub const DEFAULT_VIDEO_STATE_BLOAT_BOND: u64 = 0;
pub const DEFAULT_OBJECT_SIZE: u64 = 5;
pub const DATA_OBJECTS_NUMBER: u64 = 10; // MUST BE >= 1
pub const OUTSTANDING_VIDEOS: u64 = 5;
pub const OUTSTANDING_CHANNELS: u64 = 3;
pub const TOTAL_OBJECTS_NUMBER: u64 =
    DATA_OBJECTS_NUMBER * (OUTSTANDING_VIDEOS + OUTSTANDING_CHANNELS);

pub const STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT: u64 = TOTAL_OBJECTS_NUMBER;
pub const STORAGE_BUCKET_OBJECTS_SIZE_LIMIT: u64 =
    DEFAULT_OBJECT_SIZE * STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT;
pub const STORAGE_BUCKET_ACCEPTING_BAGS: bool = true;
pub const VOUCHER_OBJECTS_NUMBER_LIMIT: u64 = 2 * STORAGE_BUCKET_OBJECTS_NUMBER_LIMIT;
pub const VOUCHER_OBJECTS_SIZE_LIMIT: u64 = VOUCHER_OBJECTS_NUMBER_LIMIT * DEFAULT_OBJECT_SIZE;
pub const INITIAL_BALANCE: u64 = 1000;

// Transfer price
pub const DEFAULT_CHANNEL_TRANSFER_PRICE: u64 = 100;

pub const MEMBERS_COUNT: u64 = 10;
pub const PAYMENTS_NUMBER: u64 = 10;
pub const DEFAULT_PAYOUT_CLAIMED: u64 = 100;
pub const DEFAULT_PAYOUT_EARNED: u64 = 100;
pub const DEFAULT_NFT_PRICE: u64 = 1000;
pub const DEFAULT_ROYALTY: u32 = 1;

// Creator tokens
pub const DEFAULT_CREATOR_TOKEN_ISSUANCE: u64 = 1_000_000_000;
pub const DEFAULT_CREATOR_TOKEN_SALE_UNIT_PRICE: u64 = 10;
pub const DEFAULT_CREATOR_TOKEN_SALE_DURATION: u64 = 100;
pub const DEFAULT_ISSUER_TRANSFER_AMOUNT: u64 = 1_000_000;
pub const DEFAULT_PATRONAGE_RATE: YearlyRate = YearlyRate(Permill::from_percent(10));
pub const DEFAULT_REVENUE_SPLIT_DURATION: u64 = 1000;
pub const DEFAULT_SPLIT_RATE: Permill = Permill::from_percent(10);

type UncheckedExtrinsic = frame_system::mocking::MockUncheckedExtrinsic<Test>;
type Block = frame_system::mocking::MockBlock<Test>;

frame_support::construct_runtime!(
    pub enum Test where
        Block = Block,
        NodeBlock = Block,
        UncheckedExtrinsic = UncheckedExtrinsic,
    {
        System: frame_system,
        Balances: balances,
        Timestamp: pallet_timestamp,
        Membership: membership::{Pallet, Call, Storage, Event<T>},
        Storage: storage::{Pallet, Call, Storage, Event<T>},
        Token: project_token::{Pallet, Call, Storage, Config<T>, Event<T>},
        Content: crate::{Pallet, Call, Storage, Config<T>, Event<T>},
        DistributionWorkingGroup: working_group::<Instance9>::{Pallet, Call, Storage, Event<T, I>},
        StorageWorkingGroup: working_group::<Instance2>::{Pallet, Call, Storage, Event<T, I>},
        ContentWorkingGroup: working_group::<Instance3>::{Pallet, Call, Storage, Event<T, I>},
    }
);

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
}

impl frame_system::Config for Test {
    type BaseCallFilter = frame_support::traits::Everything;
    type BlockWeights = ();
    type BlockLength = ();
    type DbWeight = ();
    type Origin = Origin;
    type Call = Call;
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = U256;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = Event;
    type BlockHashCount = ConstU64<250>;
    type Version = ();
    type PalletInfo = PalletInfo;
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type SystemWeightInfo = ();
    type SS58Prefix = ConstU16<42>;
    type OnSetCode = ();
    type MaxConsumers = frame_support::traits::ConstU32<16>;
}

impl pallet_timestamp::Config for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

impl balances::Config for Test {
    type Balance = u64;
    type DustRemoval = ();
    type Event = Event;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type MaxLocks = ();
    type MaxReserves = ConstU32<2>;
    type ReserveIdentifier = [u8; 8];
    type WeightInfo = ();
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

parameter_types! {
    pub const ScreenedMemberMaxInitialBalance: u64 = 5000;
}

impl ContentActorAuthenticator for Test {
    type CuratorId = u64;
    type CuratorGroupId = u64;

    fn validate_member_id(member_id: &Self::MemberId) -> bool {
        if Membership::membership(member_id).is_some()
            || MEMBER_IDS.contains(member_id)
            || COLABORATOR_IDS.contains(member_id)
            || CURATOR_IDS.contains(member_id)
            || LEAD_MEMBER_ID == *member_id
        {
            true
        } else {
            false
        }
    }

    fn get_leader_member_id() -> Option<Self::MemberId> {
        Some(LEAD_MEMBER_ID)
    }

    fn get_curator_member_id(curator_id: &Self::CuratorId) -> Option<Self::MemberId> {
        ContentWorkingGroup::get_worker_member_id(curator_id).or_else(|| match *curator_id {
            DEFAULT_CURATOR_ID => Some(DEFAULT_CURATOR_MEMBER_ID),
            UNAUTHORIZED_CURATOR_ID => Some(UNAUTHORIZED_CURATOR_MEMBER_ID),
            _ => None,
        })
    }

    fn is_lead(account_id: &Self::AccountId) -> bool {
        working_group::Module::<Test, ContentWorkingGroupInstance>::is_leader_account_id(account_id)
            || *account_id == LEAD_ACCOUNT_ID
    }

    fn is_curator(curator_id: &Self::CuratorId, account_id: &Self::AccountId) -> bool {
        working_group::Module::<Test, ContentWorkingGroupInstance>::is_worker_account_id(
            account_id, curator_id,
        ) || (CURATOR_IDS.contains(curator_id) && *account_id == account(*curator_id))
    }

    fn is_member(member_id: &Self::MemberId, account_id: &Self::AccountId) -> bool {
        let controller_account_id = account(*member_id);
        if Membership::is_member_controller_account(member_id, account_id)
            || (*account_id == DEFAULT_MEMBER_ALT_ACCOUNT_ID && *member_id == DEFAULT_MEMBER_ID)
        {
            true
        } else if MEMBER_IDS.contains(member_id)
            || COLABORATOR_IDS.contains(member_id)
            || CURATOR_IDS.contains(member_id)
            || LEAD_MEMBER_ID == *member_id
        {
            *account_id == controller_account_id
        } else {
            false
        }
    }

    fn is_valid_curator_id(curator_id: &Self::CuratorId) -> bool {
        working_group::Module::<Test, ContentWorkingGroupInstance>::ensure_worker_exists(curator_id)
            .is_ok()
            || CURATOR_IDS.contains(curator_id)
    }
}

parameter_types! {
    pub const MaxNumberOfDataObjectsPerBag: u64 = 4;
    pub const MaxDistributionBucketFamilyNumber: u64 = 20;
    pub const StorageModuleId: PalletId = PalletId(*b"mstorage"); // module storage
    pub const BlacklistSizeLimit: u64 = 1;
    pub const MaxNumberOfPendingInvitationsPerDistributionBucket: u32 = 1;
    pub const MinStorageBucketsPerBag: u32 = 1;
    pub const MaxStorageBucketsPerBag: u32 = 20;
    pub const MinDistributionBucketsPerBag: u32 = 1;
    pub const MaxDistributionBucketsPerBag: u32 = 20;
    pub const DefaultMemberDynamicBagNumberOfStorageBuckets: u32 = 3;
    pub const DefaultChannelDynamicBagNumberOfStorageBuckets: u32 = 4;
    pub const MaxDataObjectSize: u64 = VOUCHER_OBJECTS_SIZE_LIMIT;
    pub const MaxNumberOfOperatorsPerDistributionBucket: u32 = 5;
}

pub const STORAGE_WG_LEADER_ACCOUNT_ID: U256 = U256([100001, 0, 0, 0]);
pub const DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID: U256 = U256([100002, 0, 0, 0]);
pub const DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID: U256 = U256([100003, 0, 0, 0]);
pub const DISTRIBUTION_WG_LEADER_ACCOUNT_ID: U256 = U256([100004, 0, 0, 0]);
pub const DEFAULT_STORAGE_PROVIDER_ID: u64 = 10;
pub const ANOTHER_STORAGE_PROVIDER_ID: u64 = 11;
pub const DEFAULT_DISTRIBUTION_PROVIDER_ID: u64 = 12;
pub const ANOTHER_DISTRIBUTION_PROVIDER_ID: u64 = 13;

impl storage::Config for Test {
    type Event = Event;
    type DataObjectId = u64;
    type StorageBucketId = u64;
    type DistributionBucketIndex = u64;
    type DistributionBucketFamilyId = u64;
    type DistributionBucketOperatorId = u64;
    type ChannelId = u64;
    type BlacklistSizeLimit = BlacklistSizeLimit;
    type ModuleId = StorageModuleId;
    type MinStorageBucketsPerBag = MinStorageBucketsPerBag;
    type MaxStorageBucketsPerBag = MaxStorageBucketsPerBag;
    type MinDistributionBucketsPerBag = MinDistributionBucketsPerBag;
    type MaxDistributionBucketsPerBag = MaxDistributionBucketsPerBag;
    type DefaultMemberDynamicBagNumberOfStorageBuckets =
        DefaultMemberDynamicBagNumberOfStorageBuckets;
    type DefaultChannelDynamicBagNumberOfStorageBuckets =
        DefaultChannelDynamicBagNumberOfStorageBuckets;
    type MaxDistributionBucketFamilyNumber = MaxDistributionBucketFamilyNumber;
    type MaxNumberOfPendingInvitationsPerDistributionBucket =
        MaxNumberOfPendingInvitationsPerDistributionBucket;
    type MaxNumberOfOperatorsPerDistributionBucket = MaxNumberOfOperatorsPerDistributionBucket;
    type ContentId = u64;
    type MaxDataObjectSize = MaxDataObjectSize;
    type StorageWorkingGroup = StorageWG;
    type DistributionWorkingGroup = DistributionWG;
    type WeightInfo = ();
    type ModuleAccountInitialBalance = ExistentialDeposit;
}

// Anyone can upload and delete without restriction

parameter_types! {
    pub const MaxNumberOfCuratorsPerGroup: u32 = 10;
    pub const MaxNumberOfAssetsPerChannel: u32 = 1000;
    pub const MaxNumberOfAssetsPerVideo: u32 = 2000;
    pub const MaxNumberOfCollaboratorsPerChannel: u32 = 10;
    pub const ChannelOwnershipPaymentEscrowId: [u8; 8] = *b"12345678";
    pub const ContentModuleId: PalletId = PalletId(*b"mContent"); // module content
    pub const MaxKeysPerCuratorGroupPermissionsByLevelMap: u8 = 25;
    pub const DefaultGlobalDailyNftLimit: LimitPerPeriod<u64> = LimitPerPeriod {
        block_number_period: 100,
        limit: 10000,
    };
    pub const DefaultGlobalWeeklyNftLimit: LimitPerPeriod<u64> = LimitPerPeriod {
        block_number_period: 1000,
        limit: 50000,
    };
    pub const DefaultChannelDailyNftLimit: LimitPerPeriod<u64> = LimitPerPeriod {
        block_number_period: 100,
        limit: 100,
    };
    pub const DefaultChannelWeeklyNftLimit: LimitPerPeriod<u64> = LimitPerPeriod {
        block_number_period: 1000,
        limit: 500,
    };
    pub const MinimumCashoutAllowedLimit: u64 = 1;
    pub const MaximumCashoutAllowedLimit: u64 = 1_000_000;
    pub const MaxNftAuctionWhitelistLength: u32 = 5;
}

impl Config for Test {
    type WeightInfo = ();

    /// The overarching event type.
    type Event = Event;

    /// Type of identifier for Videos
    type VideoId = u64;

    /// Type of identifier for open auctions
    type OpenAuctionId = u64;

    /// The maximum number of curators per group constraint
    type MaxNumberOfCuratorsPerGroup = MaxNumberOfCuratorsPerGroup;

    /// The data object used in storage
    type DataObjectStorage = storage::Module<Self>;

    /// module id
    type ModuleId = ContentModuleId;

    /// membership info provider
    type MemberAuthenticator = TestMemberships;

    /// max number of keys per curator_group.permissions_by_level map instance
    type MaxKeysPerCuratorGroupPermissionsByLevelMap = MaxKeysPerCuratorGroupPermissionsByLevelMap;

    /// The maximum number of assets that can be assigned to a single channel
    type MaxNumberOfAssetsPerChannel = MaxNumberOfAssetsPerChannel;

    /// The maximum number of assets that can be assigned to a signle video
    type MaxNumberOfAssetsPerVideo = MaxNumberOfAssetsPerVideo;

    /// The maximum number of collaborators per channel
    type MaxNumberOfCollaboratorsPerChannel = MaxNumberOfCollaboratorsPerChannel;

    /// channel privilege level
    type ChannelPrivilegeLevel = u8;

    /// Provides an access for the council budget.
    type CouncilBudgetManager = CouncilBudgetManager;

    /// Content working group pallet integration.
    type ContentWorkingGroup = ContentWG;

    /// Default global daily NFT limit.
    type DefaultGlobalDailyNftLimit = DefaultGlobalDailyNftLimit;

    /// Default global weekly NFT limit.
    type DefaultGlobalWeeklyNftLimit = DefaultGlobalWeeklyNftLimit;

    /// Default channel daily NFT limit.
    type DefaultChannelDailyNftLimit = DefaultChannelDailyNftLimit;

    /// Default channel weekly NFT limit.
    type DefaultChannelWeeklyNftLimit = DefaultChannelWeeklyNftLimit;

    /// Creator tokens interface
    type ProjectToken = project_token::Module<Self>;

    /// Transfer Id
    type TransferId = u64;

    /// Minimum cashout allowed limit
    type MinimumCashoutAllowedLimit = MinimumCashoutAllowedLimit;

    /// Max cashout allowed limit
    type MaximumCashoutAllowedLimit = MaximumCashoutAllowedLimit;

    /// Max nft auction whitelist length
    type MaxNftAuctionWhitelistLength = MaxNftAuctionWhitelistLength;
}

pub const COUNCIL_INITIAL_BUDGET: u64 = 0;

thread_local! {
    pub static COUNCIL_BUDGET: RefCell<u64> = RefCell::new(COUNCIL_INITIAL_BUDGET);
}

pub struct CouncilBudgetManager;
impl common::council::CouncilBudgetManager<U256, u64> for CouncilBudgetManager {
    fn get_budget() -> u64 {
        COUNCIL_BUDGET.with(|val| *val.borrow())
    }

    fn set_budget(budget: u64) {
        COUNCIL_BUDGET.with(|val| {
            *val.borrow_mut() = budget;
        });
    }

    fn try_withdraw(account_id: &U256, amount: u64) -> DispatchResult {
        ensure!(
            Self::get_budget() >= amount,
            DispatchError::Other("CouncilBudgetManager: try_withdraw - not enough balance.")
        );

        let _ = Balances::deposit_creating(account_id, amount);

        Self::decrease_budget(amount);

        Ok(())
    }
}

// The storage working group instance alias.
pub type StorageWorkingGroupInstance = working_group::Instance2;

impl working_group::Config<StorageWorkingGroupInstance> for Test {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingAccountValidator = membership::Module<Test>;
    type StakingHandler = staking_handler::StakingManager<Self, LockId>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}
// The distribution working group instance alias.
pub type DistributionWorkingGroupInstance = working_group::Instance9;

impl working_group::Config<DistributionWorkingGroupInstance> for Test {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingAccountValidator = membership::Module<Test>;
    type StakingHandler = staking_handler::StakingManager<Self, LockId2>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

// Content working group instance alias.
pub type ContentWorkingGroupInstance = working_group::Instance3;

impl working_group::Config<ContentWorkingGroupInstance> for Test {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingAccountValidator = membership::Module<Test>;
    type StakingHandler = staking_handler::StakingManager<Self, LockId3>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl common::membership::MemberOriginValidator<Origin, u64, U256> for () {
    fn ensure_member_controller_account_origin(
        origin: Origin,
        member_id: u64,
    ) -> Result<U256, DispatchError> {
        let account_id = ensure_signed(origin).unwrap();
        ensure!(
            Self::is_member_controller_account(&member_id, &account_id),
            DispatchError::BadOrigin
        );
        Ok(account_id)
    }

    fn is_member_controller_account(member_id: &u64, account_id: &U256) -> bool {
        return Membership::is_member_controller_account(member_id, account_id)
            || TestMemberships::is_member_controller_account(member_id, account_id);
    }
}
thread_local! {
    pub static CONTENT_WG_BUDGET: RefCell<u64> = RefCell::new(WORKING_GROUP_BUDGET);
}

pub struct ContentWG;
impl common::working_group::WorkingGroupBudgetHandler<U256, u64> for ContentWG {
    fn get_budget() -> u64 {
        CONTENT_WG_BUDGET.with(|val| *val.borrow())
    }

    fn set_budget(new_value: u64) {
        CONTENT_WG_BUDGET.with(|val| {
            *val.borrow_mut() = new_value;
        });
    }

    fn try_withdraw(_account_id: &U256, _amount: u64) -> DispatchResult {
        unimplemented!()
    }
}

// #[derive (Default)]
pub struct ExtBuilder {
    next_channel_id: u64,
    next_video_id: u64,
    next_curator_group_id: u64,
    next_transfer_id: u64,
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
    nft_limits_enabled: bool,
    channel_state_bloat_bond_value: BalanceOf<Test>,
    video_state_bloat_bond_value: BalanceOf<Test>,
}

impl Default for ExtBuilder {
    // init test scenario for ExtBuilder
    fn default() -> Self {
        Self {
            next_channel_id: 1,
            next_video_id: 1,
            next_curator_group_id: 1,
            next_transfer_id: 1,
            max_cashout_allowed: BalanceOf::<Test>::from(1_000u32),
            min_cashout_allowed: BalanceOf::<Test>::from(10u32),
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
            nft_limits_enabled: true,
            channel_state_bloat_bond_value: DEFAULT_CHANNEL_STATE_BLOAT_BOND,
            video_state_bloat_bond_value: DEFAULT_VIDEO_STATE_BLOAT_BOND,
        }
    }
}

// TODO(post mainnet?): authomatically set block number = 1
impl ExtBuilder {
    pub fn with_creator_royalty_bounds(
        self,
        min_creator_royalty: Perbill,
        max_creator_royalty: Perbill,
    ) -> Self {
        Self {
            min_creator_royalty,
            max_creator_royalty,
            ..self
        }
    }
    /// test externalities + initial balances allocation
    pub fn build_with_balances(
        self,
        balances: Vec<(AccountId, BalanceOf<Test>)>,
    ) -> sp_io::TestExternalities {
        let mut t = frame_system::GenesisConfig::default()
            .build_storage::<Test>()
            .unwrap();

        balances::GenesisConfig::<Test> { balances }
            .assimilate_storage(&mut t)
            .unwrap();

        storage::GenesisConfig::<Test>::default()
            .assimilate_storage(&mut t)
            .unwrap();

        project_token::GenesisConfig::<Test>::default()
            .assimilate_storage(&mut t)
            .unwrap();

        // the same as t.top().extend(GenesisConfig::<Test> etc...)
        crate::GenesisConfig::<Test> {
            next_channel_id: self.next_channel_id,
            next_video_id: self.next_video_id,
            next_transfer_id: self.next_transfer_id,
            next_curator_group_id: self.next_curator_group_id,
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
            nft_limits_enabled: self.nft_limits_enabled,
            channel_state_bloat_bond_value: self.channel_state_bloat_bond_value,
            video_state_bloat_bond_value: self.video_state_bloat_bond_value,
        }
        .assimilate_storage(&mut t)
        .unwrap();

        Into::<sp_io::TestExternalities>::into(t)
    }

    pub fn build(self) -> sp_io::TestExternalities {
        self.build_with_balances(vec![])
    }
}

pub fn with_default_mock_builder<R, F: FnOnce() -> R>(f: F) -> R {
    ExtBuilder::default().build().execute_with(f)
}

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    // System module initializes first and finalizes last
    while System::block_number() < n {
        <Content as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <Content as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}

#[macro_export]
macro_rules! last_event_eq {
    ($e:expr) => {
        assert_eq!(
            System::events().last().unwrap().event,
            MetaEvent::Content($e)
        )
    };
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
    pub const ExistentialDeposit: u32 = 10;
    pub const DefaultMembershipPrice: u64 = 100;
    pub const CandidateStake: u64 = 100;
}

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 10;
    pub const LockId: LockIdentifier = [9; 8];
    pub const LockId2: LockIdentifier = [10; 8];
    pub const LockId3: LockIdentifier = [11; 8];
    pub const DefaultInitialInvitationBalance: u64 = 100;
    pub const DefaultMemberInvitesCount: u32 = 2;
    pub const ReferralCutMaximumPercent: u8 = 50;
    pub const MinimumStakeForOpening: u32 = 50;
    pub const MinimumApplicationStake: u32 = 50;
    pub const LeaderOpeningStake: u32 = 20;
}

impl membership::Config for Test {
    type Event = Event;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type WorkingGroup = Wg;
    type DefaultInitialInvitationBalance = DefaultInitialInvitationBalance;
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InvitedMemberLockId>;
    type StakingCandidateStakingHandler =
        staking_handler::StakingManager<Self, BoundStakingAccountLockId>;
    type CandidateStake = CandidateStake;
    type WeightInfo = ();
    type DefaultMemberInvitesCount = DefaultMemberInvitesCount;
}

pub const WORKING_GROUP_BUDGET: u64 = 100;

thread_local! {
    pub static WG_BUDGET: RefCell<u64> = RefCell::new(WORKING_GROUP_BUDGET);
    pub static LEAD_SET: RefCell<bool> = RefCell::new(bool::default());
}

pub struct Wg;
impl common::working_group::WorkingGroupBudgetHandler<U256, u64> for Wg {
    fn get_budget() -> u64 {
        WG_BUDGET.with(|val| *val.borrow())
    }

    fn set_budget(new_value: u64) {
        WG_BUDGET.with(|val| {
            *val.borrow_mut() = new_value;
        });
    }

    fn try_withdraw(_account_id: &U256, _amount: u64) -> DispatchResult {
        unimplemented!()
    }
}

impl common::working_group::WorkingGroupAuthenticator<Test> for Wg {
    fn ensure_worker_origin(
        _origin: <Test as frame_system::Config>::Origin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!()
    }

    fn ensure_leader_origin(_origin: <Test as frame_system::Config>::Origin) -> DispatchResult {
        unimplemented!()
    }

    fn get_leader_member_id() -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn get_worker_member_id(
        _: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Config>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Config>::AccountId,
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

impl LockComparator<U256> for Test {
    fn are_locks_conflicting(new_lock: &LockIdentifier, existing_locks: &[LockIdentifier]) -> bool {
        if *new_lock == InvitedMemberLockId::get() {
            existing_locks.contains(new_lock)
        } else {
            false
        }
    }
}

pub struct TestMemberships {}

// Mock MembershipInfoProvider impl.
impl MembershipInfoProvider<Test> for TestMemberships {
    fn controller_account_id(
        member_id: common::MemberId<Test>,
    ) -> Result<AccountId, DispatchError> {
        Membership::controller_account_id(member_id).or_else(|_| {
            let account_id = account(member_id);
            if MEMBER_IDS.contains(&member_id)
                || COLABORATOR_IDS.contains(&member_id)
                || CURATOR_IDS.contains(&member_id)
                || member_id == LEAD_MEMBER_ID
            {
                Ok(account_id)
            } else {
                Err(DispatchError::Other("no account found"))
            }
        })
    }
}

// Mock MemberOriginValidator impl.
impl MemberOriginValidator<Origin, u64, U256> for TestMemberships {
    fn ensure_member_controller_account_origin(
        origin: Origin,
        member_id: u64,
    ) -> Result<U256, DispatchError> {
        let sender = ensure_signed(origin)?;
        ensure!(
            Self::is_member_controller_account(&member_id, &sender),
            DispatchError::Other("origin signer not a member controller account"),
        );
        Ok(sender)
    }

    fn is_member_controller_account(member_id: &u64, account_id: &U256) -> bool {
        Membership::is_member_controller_account(member_id, account_id)
            || MEMBER_IDS.contains(&member_id)
            || COLABORATOR_IDS.contains(&member_id)
            || CURATOR_IDS.contains(&member_id)
            || LEAD_MEMBER_ID == *member_id
    }
}

// storage & distribution wg auth
// working group integration
pub struct StorageWG;
pub struct DistributionWG;

impl common::working_group::WorkingGroupAuthenticator<Test> for StorageWG {
    fn ensure_worker_origin(
        origin: <Test as frame_system::Config>::Origin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        let account_id = ensure_signed(origin)?;
        ensure!(
            account_id == DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID,
            DispatchError::BadOrigin,
        );
        Ok(())
    }

    fn ensure_leader_origin(origin: <Test as frame_system::Config>::Origin) -> DispatchResult {
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

    fn get_worker_member_id(
        _: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Config>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Config>::AccountId,
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
        origin: <Test as frame_system::Config>::Origin,
        _worker_id: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        let account_id = ensure_signed(origin)?;
        ensure!(
            account_id == DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID,
            DispatchError::BadOrigin,
        );
        Ok(())
    }

    fn ensure_leader_origin(origin: <Test as frame_system::Config>::Origin) -> DispatchResult {
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

    fn get_worker_member_id(
        _: &<Test as common::membership::MembershipTypes>::ActorId,
    ) -> Option<<Test as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(_account_id: &<Test as frame_system::Config>::AccountId) -> bool {
        unimplemented!()
    }

    fn is_worker_account_id(
        _account_id: &<Test as frame_system::Config>::AccountId,
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

impl common::working_group::WorkingGroupBudgetHandler<U256, u64> for StorageWG {
    fn get_budget() -> u64 {
        unimplemented!()
    }

    fn set_budget(_new_value: u64) {
        unimplemented!()
    }

    fn try_withdraw(_account_id: &U256, _amount: u64) -> DispatchResult {
        unimplemented!()
    }
}

impl common::working_group::WorkingGroupBudgetHandler<U256, u64> for DistributionWG {
    fn get_budget() -> u64 {
        unimplemented!()
    }

    fn set_budget(_new_value: u64) {
        unimplemented!()
    }

    fn try_withdraw(_account_id: &U256, _amount: u64) -> DispatchResult {
        unimplemented!()
    }
}

// pallet_project_token trait implementation and related stuff
parameter_types! {
    pub const TokenModuleId: PalletId = PalletId(*b"m__Token");
    pub const MaxVestingSchedulesPerAccountPerToken: u32 = 3;
    pub const BlocksPerYear: u32 = 5259487; // blocks every 6s
}

impl project_token::Config for Test {
    type Event = Event;
    type Balance = u64;
    type TokenId = u64;
    type BlockNumberToBalance = Block2Balance;
    type DataObjectStorage = storage::Module<Self>;
    type ModuleId = TokenModuleId;
    type JoyExistentialDeposit = ExistentialDeposit;
    type MaxVestingSchedulesPerAccountPerToken = MaxVestingSchedulesPerAccountPerToken;
    type BlocksPerYear = BlocksPerYear;
    type MemberOriginValidator = TestMemberships;
    type MembershipInfoProvider = TestMemberships;
    type WeightInfo = ();
}

pub struct Block2Balance {}

impl Convert<u64, u64> for Block2Balance {
    fn convert(block: u64) -> u64 {
        block
    }
}

pub(crate) fn set_default_nft_limits() {
    let limit = 1000;
    let channel_id = 1;

    set_all_nft_limits(channel_id, limit);
}

pub(crate) fn set_all_nft_limits(channel_id: u64, limit: u64) {
    set_global_daily_nft_limit(limit);
    set_global_weekly_nft_limit(limit);
    set_channel_daily_nft_limit(channel_id, limit);
    set_channel_weekly_nft_limit(channel_id, limit);
}

pub(crate) fn set_global_daily_nft_limit(limit: u64) {
    Content::set_nft_limit(NftLimitId::GlobalDaily, limit);
}

pub(crate) fn set_global_weekly_nft_limit(limit: u64) {
    Content::set_nft_limit(NftLimitId::GlobalWeekly, limit);
}

pub(crate) fn set_channel_daily_nft_limit(channel_id: u64, limit: u64) {
    Content::set_nft_limit(NftLimitId::ChannelDaily(channel_id), limit);
}

pub(crate) fn set_channel_weekly_nft_limit(channel_id: u64, limit: u64) {
    Content::set_nft_limit(NftLimitId::ChannelWeekly(channel_id), limit);
}

pub(crate) fn nft_limit_by_id(limit_id: NftLimitId<ChannelId>) -> LimitPerPeriod<u64> {
    match limit_id {
        NftLimitId::GlobalDaily => crate::GlobalDailyNftLimit::<Test>::get(),
        NftLimitId::GlobalWeekly => crate::GlobalWeeklyNftLimit::<Test>::get(),
        NftLimitId::ChannelDaily(channel_id) => Content::channel_by_id(channel_id).daily_nft_limit,
        NftLimitId::ChannelWeekly(channel_id) => {
            Content::channel_by_id(channel_id).weekly_nft_limit
        }
    }
}
