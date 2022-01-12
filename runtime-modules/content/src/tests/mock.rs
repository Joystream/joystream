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

pub type CuratorId = <Test as ContentActorAuthenticator>::CuratorId;
pub type CuratorGroupId = <Test as ContentActorAuthenticator>::CuratorGroupId;
pub type MemberId = <Test as MembershipTypes>::MemberId;
pub type ChannelId = <Test as StorageOwnership>::ChannelId;
// pub type DAOId = <Test as StorageOwnership>::DAOId;

/// Origins

pub const DEFAULT_MEMBER_ACCOUNT_ID: u64 = 101;
pub const DEFAULT_CURATOR_ACCOUNT_ID: u64 = 102;
pub const LEAD_ACCOUNT_ID: u64 = 103;
pub const DEFAULT_MODERATOR_ACCOUNT_ID: u64 = 104;

pub const UNAUTHORIZED_MEMBER_ACCOUNT_ID: u64 = 111;
pub const UNAUTHORIZED_CURATOR_ACCOUNT_ID: u64 = 112;
pub const UNAUTHORIZED_LEAD_ACCOUNT_ID: u64 = 113;
pub const UNAUTHORIZED_MODERATOR_ACCOUNT_ID: u64 = 114;

pub const INITIAL_BALANCE: u64 = 1000;
// Members range from MemberId 1 to 10
pub const MEMBERS_COUNT: MemberId = 10;

/// Runtime Id's
pub const DEFAULT_MEMBER_ID: u64 = 201;
pub const DEFAULT_CURATOR_ID: u64 = 202;
pub const DEFAULT_MODERATOR_ID: u64 = 204;

pub const UNAUTHORIZED_MEMBER_ID: u64 = 211;
pub const UNAUTHORIZED_CURATOR_ID: u64 = 212;
pub const UNAUTHORIZED_MODERATOR_ID: u64 = 214;

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

impl GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

impl ContentActorAuthenticator for Test {
    type CuratorId = u64;
    type CuratorGroupId = u64;

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

pub struct MockStorageSystem {}

// Anyone can upload and delete without restriction
impl StorageSystem<Test> for MockStorageSystem {
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

    /// PostId Type
    type PostId = u64;

    /// Post Reaction Type
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
    next_post_id: u64,
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
            next_post_id: 1,
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
            next_post_id: self.next_post_id,
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
