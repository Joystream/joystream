#![cfg(test)]

use crate::*;

use frame_support::traits::{OnFinalize, OnInitialize};
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types};
use sp_core::H256;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};

use crate::ContentActorAuthenticator;
use crate::Trait;
use common::currency::GovernanceCurrency;
use common::storage::StorageSystem;
use frame_support::assert_ok;

pub type CuratorId = <Test as ContentActorAuthenticator>::CuratorId;
pub type CuratorGroupId = <Test as ContentActorAuthenticator>::CuratorGroupId;
pub type MemberId = <Test as membership::Trait>::MemberId;
pub type ChannelId = <Test as StorageOwnership>::ChannelId;
pub type VideoId = <Test as Trait>::VideoId;
pub type VideoCategoryId = <Test as Trait>::VideoCategoryId;
pub type ChannelCategoryId = <Test as Trait>::ChannelCategoryId;
type ChannelOwnershipTransferRequestId = <Test as Trait>::ChannelOwnershipTransferRequestId;
// pub type DAOId = <Test as StorageOwnership>::DAOId;

/// Origins

pub const LEAD_ORIGIN: u64 = 1;

pub const FIRST_CURATOR_ORIGIN: u64 = 2;
pub const SECOND_CURATOR_ORIGIN: u64 = 3;

pub const FIRST_MEMBER_ORIGIN: u64 = 4;
pub const SECOND_MEMBER_ORIGIN: u64 = 5;
pub const UNKNOWN_ORIGIN: u64 = 7777;

// Members range from MemberId 1 to 10
pub const MEMBERS_COUNT: MemberId = 10;

/// Runtime Id's

pub const FIRST_CURATOR_ID: CuratorId = 1;
pub const SECOND_CURATOR_ID: CuratorId = 2;

pub const FIRST_CURATOR_GROUP_ID: CuratorGroupId = 1;
// pub const SECOND_CURATOR_GROUP_ID: CuratorGroupId = 2;

pub const FIRST_MEMBER_ID: MemberId = 1;
pub const SECOND_MEMBER_ID: MemberId = 2;

impl_outer_origin! {
    pub enum Origin for Test {}
}

mod content {
    pub use crate::Event;
}

impl_outer_event! {
    pub enum MetaEvent for Test {
        content<T>,
        frame_system<T>,
        balances<T>,
        membership<T>,
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
    type DAOId = u64;
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

parameter_types! {
    pub const ScreenedMemberMaxInitialBalance: u64 = 500;
}

impl membership::Trait for Test {
    type Event = MetaEvent;
    type MemberId = u64;
    type SubscriptionId = u32;
    type PaidTermId = u32;
    type ActorId = u32;
    type ScreenedMemberMaxInitialBalance = ScreenedMemberMaxInitialBalance;
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

impl ContentActorAuthenticator for Test {
    type CuratorId = u64;
    type CuratorGroupId = u64;

    fn is_lead(account_id: &Self::AccountId) -> bool {
        let lead_account_id = ensure_signed(Origin::signed(LEAD_ORIGIN)).unwrap();
        *account_id == lead_account_id
    }

    fn is_curator(curator_id: &Self::CuratorId, account_id: &Self::AccountId) -> bool {
        let first_curator_account_id = ensure_signed(Origin::signed(FIRST_CURATOR_ORIGIN)).unwrap();
        let second_curator_account_id =
            ensure_signed(Origin::signed(SECOND_CURATOR_ORIGIN)).unwrap();
        (first_curator_account_id == *account_id && FIRST_CURATOR_ID == *curator_id)
            || (second_curator_account_id == *account_id && SECOND_CURATOR_ID == *curator_id)
    }

    fn is_member(member_id: &Self::MemberId, account_id: &Self::AccountId) -> bool {
        let unknown_member_account_id = ensure_signed(Origin::signed(UNKNOWN_ORIGIN)).unwrap();
        *member_id < MEMBERS_COUNT && unknown_member_account_id != *account_id
    }

    fn is_valid_curator_id(curator_id: &Self::CuratorId) -> bool {
        *curator_id == FIRST_CURATOR_ID || *curator_id == SECOND_CURATOR_ID
    }
}

pub struct MockStorageSystem {}

// Anyone can upload and delete without restriction
impl StorageSystem<Test, MemberId> for MockStorageSystem {
    fn atomically_add_content(
        _owner: StorageObjectOwner<Test>,
        _content_parameters: Vec<ContentParameters<Test>>,
    ) -> DispatchResult {
        Ok(())
    }

    fn can_add_content(
        _owner: StorageObjectOwner<Test>,
        _content_parameters: Vec<ContentParameters<Test>>,
    ) -> DispatchResult {
        Ok(())
    }

    fn atomically_remove_content(
        _owner: &StorageObjectOwner<Test>,
        _content_ids: &[u64],
    ) -> DispatchResult {
        Ok(())
    }

    fn can_remove_content(
        _owner: &StorageObjectOwner<Test>,
        _content_ids: &[u64],
    ) -> DispatchResult {
        Ok(())
    }
}

parameter_types! {
    pub const MaxNumberOfCuratorsPerGroup: u32 = 10;
    pub const ChannelOwnershipPaymentEscrowId: [u8; 8] = *b"12345678";
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

    // Type that handles asset uploads to storage frame_system
    type StorageSystem = MockStorageSystem;
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
    auction_fee_percentage: Perbill,
    auction_starts_at_max_delta: u64,
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
            min_auction_duration: 3,
            max_auction_duration: 20,
            min_auction_extension_period: 5,
            max_auction_extension_period: 30,
            min_bid_lock_duration: 2,
            max_bid_lock_duration: 10,
            min_starting_price: 10,
            max_starting_price: 1000,
            min_creator_royalty: Perbill::from_percent(1),
            max_creator_royalty: Perbill::from_percent(5),
            min_bid_step: 10,
            max_bid_step: 100,
            auction_fee_percentage: Perbill::from_percent(1),
            auction_starts_at_max_delta: 90_000,
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
            auction_fee_percentage: self.auction_fee_percentage,
            auction_starts_at_max_delta: self.auction_starts_at_max_delta,
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
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}

// Events

type RawEvent = crate::RawEvent<
    ContentActor<CuratorGroupId, CuratorId, MemberId>,
    MemberId,
    CuratorGroupId,
    CuratorId,
    VideoId,
    VideoCategoryId,
    ChannelId,
    NewAsset<ContentParameters<Test>>,
    ChannelCategoryId,
    ChannelOwnershipTransferRequestId,
    u64,
    u64,
    u64,
    ChannelOwnershipTransferRequest<Test>,
    Series<<Test as StorageOwnership>::ChannelId, VideoId>,
    Channel<Test>,
    ContentParameters<Test>,
    <Test as frame_system::Trait>::AccountId,
    ContentId<Test>,
    bool,
    AuctionParams<VideoId, <Test as frame_system::Trait>::BlockNumber, BalanceOf<Test>, MemberId>,
    BalanceOf<Test>,
>;

pub fn get_test_event(raw_event: RawEvent) -> MetaEvent {
    MetaEvent::content(raw_event)
}

pub fn assert_event(tested_event: MetaEvent, number_of_events_after_call: usize) {
    // Ensure  runtime events length is equal to expected number of events after call
    assert_eq!(System::events().len(), number_of_events_after_call);

    // Ensure  last emitted event is equal to expected one
    assert_eq!(System::events().iter().last().unwrap().event, tested_event);
}

pub fn create_member_channel() -> ChannelId {
    let channel_id = Content::next_channel_id();

    // Member can create the channel
    assert_ok!(Content::create_channel(
        Origin::signed(FIRST_MEMBER_ORIGIN),
        ContentActor::Member(FIRST_MEMBER_ID),
        ChannelCreationParameters {
            assets: vec![],
            meta: vec![],
            reward_account: None,
        }
    ));

    channel_id
}

pub fn create_member_video() -> VideoId {
    let channel_id = create_member_channel();

    let video_id = Content::next_video_id();
    assert_ok!(Content::create_video(
        Origin::signed(FIRST_MEMBER_ORIGIN),
        ContentActor::Member(FIRST_MEMBER_ID),
        channel_id,
        VideoCreationParameters {
            assets: vec![NewAsset::Urls(vec![b"https://somewhere.com/".to_vec()])],
            meta: b"metablob".to_vec(),
        }
    ));

    video_id
}
