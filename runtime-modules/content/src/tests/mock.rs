#![cfg(test)]
use crate::*;
use common::membership::MemberOriginValidator;
use frame_support::dispatch::DispatchResult;
use frame_support::traits::{
    ConstU16, ConstU32, ConstU64, LockIdentifier, OnFinalize, OnInitialize,
};
use frame_support::{parameter_types, PalletId};
pub use membership::WeightInfo;
use sp_core::H256;
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

/// Type aliases
pub type HashOutput = <Test as frame_system::Config>::Hash;
pub type Hashing = <Test as frame_system::Config>::Hashing;
pub type AccountId = <Test as frame_system::Config>::AccountId;
pub type VideoId = <Test as Config>::VideoId;
pub type CuratorId = <Test as ContentActorAuthenticator>::CuratorId;
pub type CuratorGroupId = <Test as ContentActorAuthenticator>::CuratorGroupId;
pub type MemberId = <Test as MembershipTypes>::MemberId;
pub type ChannelId = <Test as storage::Config>::ChannelId;
pub type StorageBucketId = <Test as storage::Config>::StorageBucketId;

/// Account Ids
pub const DEFAULT_MEMBER_ACCOUNT_ID: u128 = 101;
pub const DEFAULT_CURATOR_ACCOUNT_ID: u128 = 102;
pub const LEAD_ACCOUNT_ID: u128 = 103;
pub const COLLABORATOR_MEMBER_ACCOUNT_ID: u128 = 104;
pub const UNAUTHORIZED_MEMBER_ACCOUNT_ID: u128 = 111;
pub const UNAUTHORIZED_CURATOR_ACCOUNT_ID: u128 = 112;
pub const UNAUTHORIZED_LEAD_ACCOUNT_ID: u128 = 113;
pub const UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID: u128 = 114;
pub const SECOND_MEMBER_ACCOUNT_ID: u128 = 116;
pub const THIRD_MEMBER_ACCOUNT_ID: u128 = 117;
pub const DEFAULT_CHANNEL_REWARD_WITHDRAWAL_ACCOUNT_ID: u128 = 119;
pub const LEAD_MEMBER_CONTROLLER_ACCOUNT_ID: u128 = 120;
pub const DEFAULT_CURATOR_MEMBER_CONTROLLER_ACCOUNT_ID: u128 = 121;
pub const UNAUTHORIZED_CURATOR_MEMBER_CONTROLLER_ACCOUNT_ID: u128 = 122;

/// Runtime Id's
pub const DEFAULT_MEMBER_ID: u64 = 201;
pub const DEFAULT_CURATOR_ID: u64 = 202;
pub const COLLABORATOR_MEMBER_ID: u64 = 204;
pub const UNAUTHORIZED_MEMBER_ID: u64 = 211;
pub const UNAUTHORIZED_CURATOR_ID: u64 = 212;
pub const UNAUTHORIZED_COLLABORATOR_MEMBER_ID: u64 = 214;
pub const SECOND_MEMBER_ID: u64 = 216;
pub const THIRD_MEMBER_ID: u64 = 217;
pub const LEAD_MEMBER_ID: u64 = 218;
pub const DEFAULT_CURATOR_MEMBER_ID: u64 = 219;
pub const UNAUTHORIZED_CURATOR_MEMBER_ID: u64 = 220;

pub const DATA_OBJECT_STATE_BLOAT_BOND: u64 = 0;
pub const DEFAULT_OBJECT_SIZE: u64 = 5;
pub const DATA_OBJECTS_NUMBER: u64 = 10;
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
pub const DEFAULT_PATRONAGE_RATE: YearlyRate = YearlyRate(Permill::from_percent(1));
pub const DEFAULT_REVENUE_SPLIT_DURATION: u64 = 1000;

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
    type AccountId = u128;
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
        match *member_id {
            DEFAULT_MEMBER_ID => true,
            SECOND_MEMBER_ID => true,
            THIRD_MEMBER_ID => true,
            UNAUTHORIZED_MEMBER_ID => true,
            COLLABORATOR_MEMBER_ID => true,
            UNAUTHORIZED_COLLABORATOR_MEMBER_ID => true,
            _ => false,
        }
    }

    fn get_leader_member_id() -> Option<Self::MemberId> {
        Some(LEAD_MEMBER_ID)
    }

    fn get_curator_member_id(curator_id: &Self::CuratorId) -> Option<Self::MemberId> {
        match *curator_id {
            DEFAULT_CURATOR_ID => Some(DEFAULT_CURATOR_MEMBER_ID),
            UNAUTHORIZED_CURATOR_ID => Some(UNAUTHORIZED_CURATOR_MEMBER_ID),
            _ => None,
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

            THIRD_MEMBER_ID => {
                *account_id == ensure_signed(Origin::signed(THIRD_MEMBER_ACCOUNT_ID)).unwrap()
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

            LEAD_MEMBER_ID => {
                *account_id
                    == ensure_signed(Origin::signed(LEAD_MEMBER_CONTROLLER_ACCOUNT_ID)).unwrap()
            }
            DEFAULT_CURATOR_MEMBER_ID => {
                *account_id
                    == ensure_signed(Origin::signed(DEFAULT_CURATOR_MEMBER_CONTROLLER_ACCOUNT_ID))
                        .unwrap()
            }
            UNAUTHORIZED_CURATOR_MEMBER_ID => {
                *account_id
                    == ensure_signed(Origin::signed(
                        UNAUTHORIZED_CURATOR_MEMBER_CONTROLLER_ACCOUNT_ID,
                    ))
                    .unwrap()
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
    pub const StorageModuleId: PalletId = PalletId(*b"mstorage"); // module storage
    pub const BlacklistSizeLimit: u64 = 1;
    pub const MaxNumberOfPendingInvitationsPerDistributionBucket: u64 = 1;
    pub const StorageBucketsPerBagValueConstraint: storage::StorageBucketsPerBagValueConstraint =
        storage::StorageBucketsPerBagValueConstraint {min: 0, max_min_diff: 7};
    pub const InitialStorageBucketsNumberForDynamicBag: u64 = 3;
    pub const DefaultMemberDynamicBagNumberOfStorageBuckets: u64 = 3;
    pub const DefaultChannelDynamicBagNumberOfStorageBuckets: u64 = 4;
    pub const DistributionBucketsPerBagValueConstraint: storage::DistributionBucketsPerBagValueConstraint =
    storage::StorageBucketsPerBagValueConstraint {min: 3, max_min_diff: 7};
    pub const MaxDataObjectSize: u64 = VOUCHER_OBJECTS_SIZE_LIMIT;
}

pub const STORAGE_WG_LEADER_ACCOUNT_ID: u128 = 100001;
pub const DEFAULT_STORAGE_PROVIDER_ACCOUNT_ID: u128 = 100002;
pub const DEFAULT_DISTRIBUTION_PROVIDER_ACCOUNT_ID: u128 = 100003;
pub const DISTRIBUTION_WG_LEADER_ACCOUNT_ID: u128 = 100004;
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
    type StorageBucketsPerBagValueConstraint = StorageBucketsPerBagValueConstraint;
    type DefaultMemberDynamicBagNumberOfStorageBuckets =
        DefaultMemberDynamicBagNumberOfStorageBuckets;
    type DefaultChannelDynamicBagNumberOfStorageBuckets =
        DefaultChannelDynamicBagNumberOfStorageBuckets;
    type MaxDistributionBucketFamilyNumber = MaxDistributionBucketFamilyNumber;
    type DistributionBucketsPerBagValueConstraint = DistributionBucketsPerBagValueConstraint;
    type MaxNumberOfPendingInvitationsPerDistributionBucket =
        MaxNumberOfPendingInvitationsPerDistributionBucket;
    type ContentId = u64;
    type MaxDataObjectSize = MaxDataObjectSize;
    type StorageWorkingGroup = StorageWG;
    type DistributionWorkingGroup = DistributionWG;
    type WeightInfo = ();
    type ModuleAccountInitialBalance = ModuleAccountInitialBalance;
}

// Anyone can upload and delete without restriction

parameter_types! {
    pub const MaxNumberOfCuratorsPerGroup: u32 = 10;
    pub const ChannelOwnershipPaymentEscrowId: [u8; 8] = *b"12345678";
    pub const ContentModuleId: PalletId = PalletId(*b"mContent"); // module content
    pub const PricePerByte: u32 = 2;
    pub const MaxKeysPerCuratorGroupPermissionsByLevelMap: u8 = 25;
    pub const ModuleAccountInitialBalance: u64 = 1;
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
}

impl Config for Test {
    /// The overarching event type.
    type Event = Event;

    /// Type of identifier for Videos
    type VideoId = u64;

    /// Type of identifier for open auctions
    type OpenAuctionId = u64;

    /// Type of identifier for Channel Categories
    type ChannelCategoryId = u64;

    /// The maximum number of curators per group constraint
    type MaxNumberOfCuratorsPerGroup = MaxNumberOfCuratorsPerGroup;

    /// The data object used in storage
    type DataObjectStorage = storage::Module<Self>;

    /// price per byte
    type PricePerByte = PricePerByte;

    /// module id
    type ModuleId = ContentModuleId;

    /// membership info provider
    type MemberAuthenticator = TestMemberships;

    /// max number of keys per curator_group.permissions_by_level map instance
    type MaxKeysPerCuratorGroupPermissionsByLevelMap = MaxKeysPerCuratorGroupPermissionsByLevelMap;

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
}

pub const COUNCIL_BUDGET_ACCOUNT_ID: u128 = 90000000;
pub struct CouncilBudgetManager;
impl common::council::CouncilBudgetManager<u128, u64> for CouncilBudgetManager {
    fn get_budget() -> u64 {
        balances::Pallet::<Test>::usable_balance(&COUNCIL_BUDGET_ACCOUNT_ID)
    }

    fn set_budget(budget: u64) {
        let old_budget = Self::get_budget();

        if budget > old_budget {
            let _ = balances::Pallet::<Test>::deposit_creating(
                &COUNCIL_BUDGET_ACCOUNT_ID,
                budget - old_budget,
            );
        }

        if budget < old_budget {
            let _ =
                balances::Pallet::<Test>::slash(&COUNCIL_BUDGET_ACCOUNT_ID, old_budget - budget);
        }
    }

    fn try_withdraw(account_id: &u128, amount: u64) -> DispatchResult {
        ensure!(
            Self::get_budget() >= amount,
            DispatchError::Other("CouncilBudgetManager: try_withdraw - not enough balance.")
        );

        let _ = Balances::deposit_creating(account_id, amount);

        let current_budget = Self::get_budget();
        let new_budget = current_budget.saturating_sub(amount);
        Self::set_budget(new_budget);

        Ok(())
    }
}

thread_local! {
    pub static CONTENT_WG_BUDGET: RefCell<u64> = RefCell::new(WORKING_GROUP_BUDGET);
}

pub struct ContentWG;
impl common::working_group::WorkingGroupBudgetHandler<u128, u64> for ContentWG {
    fn get_budget() -> u64 {
        CONTENT_WG_BUDGET.with(|val| *val.borrow())
    }

    fn set_budget(new_value: u64) {
        CONTENT_WG_BUDGET.with(|val| {
            *val.borrow_mut() = new_value;
        });
    }

    fn try_withdraw(_account_id: &u128, _amount: u64) -> DispatchResult {
        unimplemented!()
    }
}

// #[derive (Default)]
pub struct ExtBuilder {
    next_channel_category_id: u64,
    next_channel_id: u64,
    next_video_id: u64,
    next_curator_group_id: u64,
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
            next_video_id: 1,
            next_curator_group_id: 1,
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

// TODO(post mainnet?): authomatically set block number = 1
impl ExtBuilder {
    pub fn with_creator_royalty_bounds(self, min_creator_royalty: Perbill, max_creator_royalty: Perbill) -> Self {
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

        // the same as t.top().extend(GenesisConfig::<Test> etc...)
        crate::GenesisConfig::<Test> {
            next_channel_category_id: self.next_channel_category_id,
            next_channel_id: self.next_channel_id,
            next_video_id: self.next_video_id,
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
            max_auction_whitelist_length: self.max_auction_whitelist_length,
        }
        .assimilate_storage(&mut t)
        .unwrap();

        Into::<sp_io::TestExternalities>::into(t)
    }

    pub fn build(self) -> sp_io::TestExternalities {
        let mut t = frame_system::GenesisConfig::default()
            .build_storage::<Test>()
            .unwrap();

        // the same as t.top().extend(GenesisConfig::<Test> etc...)
        crate::GenesisConfig::<Test> {
            next_channel_category_id: self.next_channel_category_id,
            next_channel_id: self.next_channel_id,
            next_video_id: self.next_video_id,
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

impl membership::Config for Test {
    type Event = Event;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type WorkingGroup = Wg;
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

pub struct Wg;
impl common::working_group::WorkingGroupBudgetHandler<u128, u64> for Wg {
    fn get_budget() -> u64 {
        WG_BUDGET.with(|val| *val.borrow())
    }

    fn set_budget(new_value: u64) {
        WG_BUDGET.with(|val| {
            *val.borrow_mut() = new_value;
        });
    }

    fn try_withdraw(_account_id: &u128, _amount: u64) -> DispatchResult {
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

impl LockComparator<u128> for Test {
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
        match member_id {
            DEFAULT_MEMBER_ID => Ok(DEFAULT_MEMBER_ACCOUNT_ID),
            SECOND_MEMBER_ID => Ok(SECOND_MEMBER_ACCOUNT_ID),
            THIRD_MEMBER_ID => Ok(THIRD_MEMBER_ACCOUNT_ID),
            UNAUTHORIZED_MEMBER_ID => Ok(UNAUTHORIZED_MEMBER_ACCOUNT_ID),
            UNAUTHORIZED_COLLABORATOR_MEMBER_ID => Ok(UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID),
            COLLABORATOR_MEMBER_ID => Ok(COLLABORATOR_MEMBER_ACCOUNT_ID),
            LEAD_MEMBER_ID => Ok(LEAD_MEMBER_CONTROLLER_ACCOUNT_ID),
            DEFAULT_CURATOR_MEMBER_ID => Ok(DEFAULT_CURATOR_MEMBER_CONTROLLER_ACCOUNT_ID),
            UNAUTHORIZED_CURATOR_MEMBER_ID => Ok(UNAUTHORIZED_CURATOR_MEMBER_CONTROLLER_ACCOUNT_ID),
            _ => Err(DispatchError::Other("no account found")),
        }
    }
}

// Mock MemberOriginValidator impl.
impl MemberOriginValidator<Origin, u64, u128> for TestMemberships {
    fn ensure_member_controller_account_origin(
        origin: Origin,
        member_id: u64,
    ) -> Result<u128, DispatchError> {
        let sender = ensure_signed(origin)?;
        ensure!(
            Self::is_member_controller_account(&member_id, &sender),
            DispatchError::Other("origin signer not a member controller account"),
        );
        Ok(sender)
    }

    fn is_member_controller_account(member_id: &u64, account_id: &u128) -> bool {
        match *member_id {
            DEFAULT_MEMBER_ID => *account_id == DEFAULT_MEMBER_ACCOUNT_ID,
            SECOND_MEMBER_ID => *account_id == SECOND_MEMBER_ACCOUNT_ID,
            UNAUTHORIZED_MEMBER_ID => *account_id == UNAUTHORIZED_MEMBER_ACCOUNT_ID,
            UNAUTHORIZED_COLLABORATOR_MEMBER_ID => {
                *account_id == UNAUTHORIZED_COLLABORATOR_MEMBER_ACCOUNT_ID
            }
            COLLABORATOR_MEMBER_ID => *account_id == COLLABORATOR_MEMBER_ACCOUNT_ID,
            LEAD_MEMBER_ID => *account_id == LEAD_MEMBER_CONTROLLER_ACCOUNT_ID,
            DEFAULT_CURATOR_MEMBER_ID => {
                *account_id == DEFAULT_CURATOR_MEMBER_CONTROLLER_ACCOUNT_ID
            }
            UNAUTHORIZED_CURATOR_MEMBER_ID => {
                *account_id == UNAUTHORIZED_CURATOR_MEMBER_CONTROLLER_ACCOUNT_ID
            }
            _ => false,
        }
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

impl common::working_group::WorkingGroupBudgetHandler<u128, u64> for StorageWG {
    fn get_budget() -> u64 {
        unimplemented!()
    }

    fn set_budget(_new_value: u64) {
        unimplemented!()
    }

    fn try_withdraw(_account_id: &u128, _amount: u64) -> DispatchResult {
        unimplemented!()
    }
}

impl common::working_group::WorkingGroupBudgetHandler<u128, u64> for DistributionWG {
    fn get_budget() -> u64 {
        unimplemented!()
    }

    fn set_budget(_new_value: u64) {
        unimplemented!()
    }

    fn try_withdraw(_account_id: &u128, _amount: u64) -> DispatchResult {
        unimplemented!()
    }
}

// pallet_project_token trait implementation and related stuff
parameter_types! {
    pub const TokenModuleId: PalletId = PalletId(*b"m__Token");
    pub const MaxVestingBalancesPerAccountPerToken: u8 = 3;
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
    type MaxVestingBalancesPerAccountPerToken = MaxVestingBalancesPerAccountPerToken;
    type BlocksPerYear = BlocksPerYear;
    type MemberOriginValidator = TestMemberships;
    type MembershipInfoProvider = TestMemberships;
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
