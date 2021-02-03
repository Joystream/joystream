// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![recursion_limit = "256"]

// #[cfg(test)]
// mod tests;

mod errors;
mod permissions;

pub use errors::*;
pub use permissions::*;

use core::hash::Hash;

use codec::Codec;
use codec::{Decode, Encode};

use frame_support::{
    decl_event, decl_module, decl_storage, dispatch::DispatchResult, ensure, traits::Get, Parameter,
};
#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};
use sp_arithmetic::traits::{BaseArithmetic, One, Zero};
use sp_runtime::traits::{MaybeSerializeDeserialize, Member};
use sp_std::collections::btree_set::BTreeSet;
// use sp_std::vec;
use sp_std::vec::Vec;
use system::ensure_signed;

pub use common::storage::{ContentParameters, StorageSystem};
pub use common::{
    currency::{BalanceOf, GovernanceCurrency},
    MembershipTypes, StorageOwnership,
};

pub(crate) type ContentId<T> = <T as StorageOwnership>::ContentId;

pub(crate) type DataObjectTypeId<T> = <T as StorageOwnership>::DataObjectTypeId;

/// Type, used in diffrent numeric constraints representations
pub type MaxNumber = u32;

/// A numeric identifier trait
pub trait NumericIdentifier:
    Parameter
    + Member
    + BaseArithmetic
    + Codec
    + Default
    + Copy
    + Clone
    + Hash
    + MaybeSerializeDeserialize
    + Eq
    + PartialEq
    + Ord
    + Zero
{
}

impl NumericIdentifier for u64 {}

/// Module configuration trait for this Substrate module.
pub trait Trait:
    system::Trait
    + ContentActorAuthenticator
    + Clone
    + StorageOwnership
    + MembershipTypes
    + GovernanceCurrency
{
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    /// EscrowAccountId seed for ModuleId to compute deterministic AccountId
    type ChannelOwnershipPaymentEscrowId: Get<[u8; 8]>;

    /// ChannelRevenueTreasury seed for ModuleId to compute deterministic AccountId
    type ChannelRevenueTreasuryId: Get<[u8; 8]>;

    /// Type of identifier for Videos
    type VideoId: NumericIdentifier;

    // Type already defined in StorageOwnership
    // Type of identifier for Channels
    // type ChannelId: NumericIdentifier;

    /// Type of identifier for Video Categories
    type VideoCategoryId: NumericIdentifier;

    /// Type of identifier for Channel Categories
    type ChannelCategoryId: NumericIdentifier;

    /// Type of identifier for Playlists
    type PlaylistId: NumericIdentifier;

    /// Type of identifier for Persons
    type PersonId: NumericIdentifier;

    /// Type of identifier for Channels
    type SeriesId: NumericIdentifier;

    /// Type of identifier for Channel transfer requests
    type ChannelOwnershipTransferRequestId: NumericIdentifier;

    /// The maximum number of curators per group constraint
    type MaxNumberOfCuratorsPerGroup: Get<MaxNumber>;

    // Type that handles asset uploads to storage system
    type StorageSystem: StorageSystem<Self>;
}

// How new assets are to be added on creating and updating
// Channels,Videos,Series and Person
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum NewAsset<ContentParameters> {
    Upload(ContentParameters),
    Uri(Vec<u8>),
}

// === Channels

// Must be convertible into new type StorageObjectOwner in storage system
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum ChannelOwner<MemberId, CuratorGroupId, DAOId> {
    /// Do not use - Default value representing empty value
    Nobody,
    /// A Member owns the channel
    Member(MemberId),
    /// A specific curation group owns the channel
    CuratorGroup(CuratorGroupId),
    // Native DAO owns the channel
    Dao(DAOId),
}

// See if there is a way to get rid of the need for ChannelOwner enum to implement Default trait!
impl<MemberId, CuratorGroupId, DAOId> Default for ChannelOwner<MemberId, CuratorGroupId, DAOId> {
    fn default() -> Self {
        ChannelOwner::Nobody
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelCategory {
    number_of_channels_in: u32,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelCategoryCreationParameters {
    meta: Vec<u8>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelCategoryUpdateParameters {
    new_meta: Vec<u8>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelType<MemberId, CuratorGroupId, ChannelCategoryId, DAOId, Balance> {
    owner: ChannelOwner<MemberId, CuratorGroupId, DAOId>,
    in_category: ChannelCategoryId,
    number_of_videos: u32,
    number_of_playlists: u32,
    number_of_series: u32,
    // Only curator can update..
    is_curated: bool,
    // Balance of earnerned revenue yet to be withdrawn
    revenue: Balance,
}

pub type Channel<T> = ChannelType<
    <T as MembershipTypes>::MemberId,
    <T as ContentActorAuthenticator>::CuratorGroupId,
    <T as Trait>::ChannelCategoryId,
    <T as StorageOwnership>::DAOId,
    BalanceOf<T>,
>;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelOwnershipTransferRequestType<ChannelId, MemberId, CuratorGroupId, DAOId, Balance>
{
    channel_id: ChannelId,
    new_owner: ChannelOwner<MemberId, CuratorGroupId, DAOId>,
    payment: Balance,
}

pub type ChannelOwnershipTransferRequest<T> = ChannelOwnershipTransferRequestType<
    <T as StorageOwnership>::ChannelId,
    <T as MembershipTypes>::MemberId,
    <T as ContentActorAuthenticator>::CuratorGroupId,
    <T as StorageOwnership>::DAOId,
    BalanceOf<T>,
>;

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelCreationParameters<ChannelCategoryId> {
    in_category: ChannelCategoryId,
    meta: Vec<u8>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelUpdateParameters<ChannelCategoryId> {
    new_in_category: Option<ChannelCategoryId>,
    new_meta: Option<Vec<u8>>,
}

// === Videos

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoCategory {
    number_of_videos_in_category: u32,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoCategoryCreationParameters {
    meta: Vec<u8>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoCategoryUpdateParameters {
    new_meta: Vec<u8>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoCreationParameters<VideoCategoryId> {
    in_category: VideoCategoryId,
    meta: Vec<u8>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoUpdateParameters<VideoCategoryId> {
    new_in_category: Option<VideoCategoryId>,
    new_meta: Option<Vec<u8>>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Video<ChannelId, SeriesId, PlaylistId> {
    in_channel: ChannelId,
    // keep track of which seasons and playlists which reference the video
    // - prevent removing a video if it is in a season (because order is important)
    // - remove from playlist on deletion
    in_series: Vec<SeriesId>,
    in_playlists: Vec<PlaylistId>,

    // Only curator can update..
    is_curated: bool,
    is_featured: bool,
}

// === Playlists
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PlaylistCreationParameters<VideoId> {
    videos: Vec<VideoId>,
    meta: Vec<u8>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PlaylistUpdateParameters<VideoId> {
    // replace playlist with new collection
    new_videos: Option<Vec<VideoId>>,
    new_meta: Option<Vec<u8>>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Playlist<ChannelId, VideoId> {
    in_channel: ChannelId,
    // collection of videos that make up the playlist
    videos: Vec<VideoId>,
}

// === Series

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum EpisodeCreationParameters<VideoCategoryId, VideoId> {
    NewVideo(VideoCreationParameters<VideoCategoryId>),
    ExistingVideo(VideoId),
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum EpisodeUpdateParemters<VideoCategoryId, VideoId> {
    UpdateVideo(VideoUpdateParameters<VideoCategoryId>),
    ChangeExistingVideo(VideoId),
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct SeasonCreationParameters<VideoCategoryId, VideoId> {
    episodes: Vec<EpisodeCreationParameters<VideoCategoryId, VideoId>>,
    meta: Vec<u8>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct SeasonUpdateParameters<VideoCategoryId, VideoId> {
    new_episodes: Option<Vec<Option<EpisodeUpdateParemters<VideoCategoryId, VideoId>>>>,
    new_meta: Option<Vec<u8>>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Season<VideoId> {
    episodes: Vec<VideoId>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct SeriesCreationParameters<VideoCategoryId, VideoId> {
    seasons: Vec<SeasonCreationParameters<VideoCategoryId, VideoId>>,
    meta: Vec<u8>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct SeriesUpdateParameters<VideoCategoryId, VideoId> {
    seasons: Option<Vec<Option<SeasonUpdateParameters<VideoCategoryId, VideoId>>>>,
    new_meta: Option<Vec<u8>>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Series<ChannelId, VideoId> {
    in_channel: ChannelId,
    seasons: Vec<Season<VideoId>>,
}

// The authenticated origin for Person creation and updating calls
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum PersonActor<MemberId, CuratorId> {
    Member(MemberId),
    Curator(CuratorId),
}

// The authorized origin that may update or delete a Person
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum PersonController<MemberId> {
    /// Do not use - Default value representing empty value
    Nobody,
    /// Member controls the person
    Member(MemberId),
    /// Any curator controls the person
    Curators,
}

// See if there is a way to get rid of the need for PersonController enum to implement Default trait!
impl<MemberId> Default for PersonController<MemberId> {
    fn default() -> Self {
        PersonController::Nobody
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PersonCreationParameters {
    meta: Vec<u8>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PersonUpdateParameters {
    new_meta: Vec<u8>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Person<MemberId> {
    controlled_by: PersonController<MemberId>,
    number_of_videos_person_involed_in: u32,
}

decl_storage! {
    trait Store for Module<T: Trait> as Content {
        pub ChannelById get(fn channel_by_id): map hasher(blake2_128_concat) T::ChannelId => Channel<T>;

        pub ChannelCategoryById get(fn channel_category_by_id): map hasher(blake2_128_concat) T::ChannelCategoryId => ChannelCategory;

        pub VideoById get(fn video_by_id): map hasher(blake2_128_concat) T::VideoId => Video<T::ChannelId, T::SeriesId, T::PlaylistId>;

        pub VideoCategoryById get(fn video_category_by_id): map hasher(blake2_128_concat) T::VideoCategoryId => VideoCategory;

        pub PlaylistById get(fn playlist_by_id): map hasher(blake2_128_concat) T::PlaylistId => Playlist<T::ChannelId, T::VideoId>;

        pub SeriesById get(fn series_by_id): map hasher(blake2_128_concat) T::SeriesId => Series<T::ChannelId, T::VideoId>;

        pub PersonById get(fn person_by_id): map hasher(blake2_128_concat) T::PersonId => Person<T::MemberId>;

        // pub PersonInVideo get(fn person_in_video): double_map hasher(blake2_128_concat) (T::VideoId, T::PersonId), hasher(blake2_128_concat) T::Hash => ();

        pub ChannelOwnershipTransferRequestById get(fn channel_ownership_transfer_request_by_id):
            map hasher(blake2_128_concat) T::ChannelOwnershipTransferRequestId => ChannelOwnershipTransferRequest<T>;

        pub NextChannelCategoryId get(fn next_channel_category_id) config(): T::ChannelCategoryId;

        pub NextChannelId get(fn next_channel_id) config(): T::ChannelId;

        pub NextVideoCategoryId get(fn next_video_category_id) config(): T::VideoCategoryId;

        pub NextVideoId get(fn next_video_id) config(): T::VideoId;

        pub NextPlaylistId get(fn next_playlist_id) config(): T::PlaylistId;

        pub NextPersonId get(fn next_person_id) config(): T::PersonId;

        pub NextSeriesId get(fn next_series_id) config(): T::SeriesId;

        pub NextChannelOwnershipTransferRequestId get(fn next_channel_transfer_request_id) config(): T::ChannelOwnershipTransferRequestId;

        pub NextCuratorGroupId get(fn next_curator_group_id) config(): T::CuratorGroupId;

        /// Map, representing  CuratorGroupId -> CuratorGroup relation
        pub CuratorGroupById get(fn curator_group_by_id): map hasher(blake2_128_concat) T::CuratorGroupId => CuratorGroup<T>;
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        /// Initializing events
        fn deposit_event() = default;

        /// Exports const -  max number of curators per group
        const MaxNumberOfCuratorsPerGroup: MaxNumber = T::MaxNumberOfCuratorsPerGroup::get();

        // ======
        // Next set of extrinsics can only be invoked by lead.
        // ======

        /// Add new curator group to runtime storage
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_curator_group(
            origin,
        ) -> DispatchResult {

            // Ensure given origin is lead
            ensure_is_lead::<T>(origin)?;

            //
            // == MUTATION SAFE ==
            //

            let curator_group_id = Self::next_curator_group_id();

            // Insert empty curator group with `active` parameter set to false
            <CuratorGroupById<T>>::insert(curator_group_id, CuratorGroup::<T>::default());

            // Increment the next curator curator_group_id:
            <NextCuratorGroupId<T>>::mutate(|n| *n += T::CuratorGroupId::one());

            // Trigger event
            Self::deposit_event(RawEvent::CuratorGroupCreated(curator_group_id));
            Ok(())
        }

        /// Remove curator group under given `curator_group_id` from runtime storage
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_curator_group(
            origin,
            curator_group_id: T::CuratorGroupId,
        ) -> DispatchResult {

            // Ensure given origin is lead
            ensure_is_lead::<T>(origin)?;

            // Ensure CuratorGroup under given curator_group_id exists
            let curator_group = Self::ensure_curator_group_exists(&curator_group_id)?;

            // We should previously ensure that curator_group  maintains no classes to be able to remove it
            curator_group.ensure_curator_group_maintains_no_classes()?;

            //
            // == MUTATION SAFE ==
            //


            // Remove curator group under given curator group id from runtime storage
            <CuratorGroupById<T>>::remove(curator_group_id);

            // Trigger event
            Self::deposit_event(RawEvent::CuratorGroupDeleted(curator_group_id));
            Ok(())
        }

        /// Set `is_active` status for curator group under given `curator_group_id`
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_curator_group_status(
            origin,
            curator_group_id: T::CuratorGroupId,
            is_active: bool,
        ) -> DispatchResult {

            // Ensure given origin is lead
            ensure_is_lead::<T>(origin)?;

            // Ensure curator group under provided curator_group_id already exist
            Self::ensure_curator_group_under_given_id_exists(&curator_group_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Set `is_active` status for curator group under given `curator_group_id`
            <CuratorGroupById<T>>::mutate(curator_group_id, |curator_group| {
                curator_group.set_status(is_active)
            });

            // Trigger event
            Self::deposit_event(RawEvent::CuratorGroupStatusSet(curator_group_id, is_active));
            Ok(())
        }

        /// Add curator to curator group under given `curator_group_id`
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn add_curator_to_group(
            origin,
            curator_group_id: T::CuratorGroupId,
            curator_id: T::CuratorId,
        ) -> DispatchResult {

            // Ensure given origin is lead
            ensure_is_lead::<T>(origin)?;

            // Ensure curator group under provided curator_group_id already exist, retrieve corresponding one
            let curator_group = Self::ensure_curator_group_exists(&curator_group_id)?;

            // Ensure max number of curators per group limit not reached yet
            curator_group.ensure_max_number_of_curators_limit_not_reached()?;

            // Ensure curator under provided curator_id isn`t a CuratorGroup member yet
            curator_group.ensure_curator_in_group_does_not_exist(&curator_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Insert curator_id into curator_group under given curator_group_id
            <CuratorGroupById<T>>::mutate(curator_group_id, |curator_group| {
                curator_group.get_curators_mut().insert(curator_id);
            });

            // Trigger event
            Self::deposit_event(RawEvent::CuratorAdded(curator_group_id, curator_id));
            Ok(())
        }

        /// Remove curator from a given curator group
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn remove_curator_from_group(
            origin,
            curator_group_id: T::CuratorGroupId,
            curator_id: T::CuratorId,
        ) -> DispatchResult {

            // Ensure given origin is lead
            ensure_is_lead::<T>(origin)?;

            // Ensure curator group under provided curator_group_id already exist, retrieve corresponding one
            let curator_group = Self::ensure_curator_group_exists(&curator_group_id)?;

            // Ensure curator under provided curator_id is CuratorGroup member
            curator_group.ensure_curator_in_group_exists(&curator_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Remove curator_id from curator_group under given curator_group_id
            <CuratorGroupById<T>>::mutate(curator_group_id, |curator_group| {
                curator_group.get_curators_mut().remove(&curator_id);
            });

            // Trigger event
            Self::deposit_event(RawEvent::CuratorRemoved(curator_group_id, curator_id));
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_channel(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            assets: Vec<NewAsset<ContentParameters<T::ContentId, T::DataObjectTypeId>>>,
            params: ChannelCreationParameters<T::ChannelCategoryId>,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_channel(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            channel_id: T::ChannelId,
            new_assets: Vec<NewAsset<ContentParameters<T::ContentId, T::DataObjectTypeId>>>,
            params: ChannelUpdateParameters<T::ChannelCategoryId>,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_channel(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            channel_id: T::ChannelId,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn request_channel_transfer(
            origin,
            new_owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            channel_id: T::ChannelId,
            payment: BalanceOf<T>,
        ) -> DispatchResult {
            // requester must be new_owner
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn cancel_channel_transfer_request(
            origin,
            request_id: T::ChannelOwnershipTransferRequestId,
        ) -> DispatchResult {
            // origin must be original requester (ie. proposed new channel owner)
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn accept_channel_transfer(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            request_id: T::ChannelOwnershipTransferRequestId,
        ) -> DispatchResult {
            // only current owner of channel can approve
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_video(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            channel_id: T::ChannelId,
            assets: Vec<NewAsset<ContentParameters<T::ContentId, T::DataObjectTypeId>>>,
            params: VideoCreationParameters<T::VideoCategoryId>,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_video(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            video: T::VideoId,
            assets: Vec<NewAsset<ContentParameters<T::ContentId, T::DataObjectTypeId>>>,
            params: VideoUpdateParameters<T::VideoCategoryId>,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_video(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            video: T::VideoId,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_playlist(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            channel_id: T::ChannelId,
            assets: Vec<NewAsset<ContentParameters<T::ContentId, T::DataObjectTypeId>>>,
            params: PlaylistCreationParameters<T::VideoId>,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_playlist(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            playlist: T::PlaylistId,
            assets: Vec<NewAsset<ContentParameters<T::ContentId, T::DataObjectTypeId>>>,
            params: PlaylistUpdateParameters<T::VideoId>,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_playlist(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            channel_id: T::ChannelId,
            playlist: T::PlaylistId,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_featured_videos(
            origin,
            list: Vec<T::VideoId>
        ) -> DispatchResult {
            // can only be set by lead
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_video_category(
            origin,
            curator: T::CuratorId,
            params: VideoCategoryCreationParameters,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_video_category(
            origin,
            curator: T::CuratorId,
            category: T::VideoCategoryId,
            params: VideoCategoryUpdateParameters,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_video_category(
            origin,
            curator: T::CuratorId,
            category: T::VideoCategoryId,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_channel_category(
            origin,
            curator: T::CuratorId,
            params: ChannelCategoryCreationParameters,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_channel_category(
            origin,
            curator: T::CuratorId,
            category: T::ChannelCategoryId,
            params: ChannelCategoryUpdateParameters,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_channel_category(
            origin,
            curator: T::CuratorId,
            category: T::ChannelCategoryId,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_person(
            origin,
            actor: PersonActor<T::MemberId, T::CuratorId>,
            assets: Vec<NewAsset<ContentParameters<T::ContentId, T::DataObjectTypeId>>>,
            params: PersonCreationParameters,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_person(
            origin,
            actor: PersonActor<T::MemberId, T::CuratorId>,
            person: T::PersonId,
            assets: Vec<NewAsset<ContentParameters<T::ContentId, T::DataObjectTypeId>>>,
            params: PersonUpdateParameters,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_person(
            origin,
            actor: PersonActor<T::MemberId, T::CuratorId>,
            person: T::PersonId,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn add_person_to_video(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            video_id: T::VideoId,
            person: T::PersonId
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn remove_person_from_video(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            video_id: T::VideoId
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn curate_video(
            origin,
            curator_id: T::CuratorId,
            video_id: T::VideoId,
            rationale: Vec<u8>,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn curate_channel(
            origin,
            curator_id: T::CuratorId,
            channel_id: T::ChannelId,
            rationale: Vec<u8>,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn uncurate_video(
            origin,
            curator_id: T::CuratorId,
            video_id: T::VideoId,
            rationale: Vec<u8>
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn uncurate_channel(
            origin,
            curator_id: T::CuratorId,
            channel_id: T::ChannelId,
            rationale: Vec<u8>,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_series(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            channel_id: T::ChannelId,
            assets: Vec<NewAsset<ContentParameters<T::ContentId, T::DataObjectTypeId>>>,
            params: SeriesCreationParameters<T::VideoCategoryId, T::VideoId>,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_series(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            channel_id: T::ChannelId,
            assets: Vec<NewAsset<ContentParameters<T::ContentId, T::DataObjectTypeId>>>,
            params: SeriesUpdateParameters<T::VideoCategoryId, T::VideoId>,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_series(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            series: T::SeriesId,
        ) -> DispatchResult {
            Ok(())
        }
    }
}

impl<T: Trait> Module<T> {
    // TODO: make this private again after used in module
    /// Increment number of classes, maintained by each curator group
    pub fn increment_number_of_channels_owned_by_curator_groups(
        curator_group_ids: BTreeSet<T::CuratorGroupId>,
    ) {
        curator_group_ids.into_iter().for_each(|curator_group_id| {
            Self::increment_number_of_channels_owned_by_curator_group(curator_group_id);
        });
    }

    // TODO: make this private again after used in module
    /// Decrement number of classes, maintained by each curator group
    pub fn decrement_number_of_channels_owned_by_curator_groups(
        curator_group_ids: BTreeSet<T::CuratorGroupId>,
    ) {
        curator_group_ids.into_iter().for_each(|curator_group_id| {
            Self::decrement_number_of_channels_owned_by_curator_group(curator_group_id);
        });
    }

    // TODO: make this private again after used in module
    /// Increment number of classes, maintained by curator group
    pub fn increment_number_of_channels_owned_by_curator_group(
        curator_group_id: T::CuratorGroupId,
    ) {
        <CuratorGroupById<T>>::mutate(curator_group_id, |curator_group| {
            curator_group.increment_number_of_channels_owned_count();
        });
    }

    // TODO: make this private again after used in module
    /// Decrement number of classes, maintained by curator group
    pub fn decrement_number_of_channels_owned_by_curator_group(
        curator_group_id: T::CuratorGroupId,
    ) {
        <CuratorGroupById<T>>::mutate(curator_group_id, |curator_group| {
            curator_group.decrement_number_of_channels_owned_count();
        });
    }

    /// Ensure `CuratorGroup` under given id exists
    pub fn ensure_curator_group_under_given_id_exists(
        curator_group_id: &T::CuratorGroupId,
    ) -> Result<(), Error<T>> {
        ensure!(
            <CuratorGroupById<T>>::contains_key(curator_group_id),
            Error::<T>::CuratorGroupDoesNotExist
        );
        Ok(())
    }

    /// Ensure `CuratorGroup` under given id exists, return corresponding one
    pub fn ensure_curator_group_exists(
        curator_group_id: &T::CuratorGroupId,
    ) -> Result<CuratorGroup<T>, Error<T>> {
        Self::ensure_curator_group_under_given_id_exists(curator_group_id)?;
        Ok(Self::curator_group_by_id(curator_group_id))
    }

    /// Ensure all `CuratorGroup`'s under given ids exist
    pub fn ensure_curator_groups_exist(
        curator_groups: &BTreeSet<T::CuratorGroupId>,
    ) -> Result<(), Error<T>> {
        for curator_group in curator_groups {
            // Ensure CuratorGroup under given id exists
            Self::ensure_curator_group_exists(curator_group)?;
        }
        Ok(())
    }
}

// Some initial config for the module on runtime upgrade
impl<T: Trait> Module<T> {
    pub fn on_runtime_upgrade() {
        <NextChannelCategoryId<T>>::put(T::ChannelCategoryId::one());
        <NextVideoCategoryId<T>>::put(T::VideoCategoryId::one());
        <NextVideoId<T>>::put(T::VideoId::one());
        <NextChannelId<T>>::put(T::ChannelId::one());
        <NextPlaylistId<T>>::put(T::PlaylistId::one());
        <NextSeriesId<T>>::put(T::SeriesId::one());
        <NextPersonId<T>>::put(T::PersonId::one());
        <NextChannelOwnershipTransferRequestId<T>>::put(T::ChannelOwnershipTransferRequestId::one());
    }
}

decl_event!(
    pub enum Event<T>
    where
        CuratorGroupId = <T as ContentActorAuthenticator>::CuratorGroupId,
        CuratorId = <T as ContentActorAuthenticator>::CuratorId,
        VideoId = <T as Trait>::VideoId,
        VideoCategoryId = <T as Trait>::VideoCategoryId,
        ChannelId = <T as StorageOwnership>::ChannelId,
        MemberId = <T as MembershipTypes>::MemberId,
        NewAsset = NewAsset<ContentParameters<ContentId<T>, DataObjectTypeId<T>>>,
        ChannelCategoryId = <T as Trait>::ChannelCategoryId,
        ChannelOwnershipTransferRequestId = <T as Trait>::ChannelOwnershipTransferRequestId,
        PlaylistId = <T as Trait>::PlaylistId,
        SeriesId = <T as Trait>::SeriesId,
        PersonId = <T as Trait>::PersonId,
        DAOId = <T as StorageOwnership>::DAOId,
        ChannelOwnershipTransferRequest = ChannelOwnershipTransferRequest<T>,
    {
        // Curators
        CuratorGroupCreated(CuratorGroupId),
        CuratorGroupDeleted(CuratorGroupId),
        CuratorGroupStatusSet(CuratorGroupId, bool /* active status */),
        CuratorAdded(CuratorGroupId, CuratorId),
        CuratorRemoved(CuratorGroupId, CuratorId),

        // Channels
        ChannelCreated(
            ChannelId,
            ChannelOwner<MemberId, CuratorGroupId, DAOId>,
            Vec<NewAsset>,
            ChannelCreationParameters<ChannelCategoryId>,
        ),
        ChannelUpdated(
            ChannelId,
            Vec<NewAsset>,
            ChannelUpdateParameters<ChannelCategoryId>,
        ),
        ChannelDeleted(ChannelId),

        // Channel Ownership Transfers
        ChannelOwnershipTransferRequested(
            ChannelOwnershipTransferRequestId,
            ChannelOwnershipTransferRequest,
        ),
        ChannelOwnershipTransferRequestWithdrawn(ChannelOwnershipTransferRequestId),
        ChannelOwnershipTransferred(ChannelOwnershipTransferRequestId),

        // Channel Categories
        ChannelCategoryCreated(ChannelCategoryId, ChannelCategoryCreationParameters),
        ChannelCategoryUpdated(ChannelCategoryUpdateParameters),
        ChannelCategoryDeleted(ChannelCategoryId),

        // Videos
        VideoCategoryCreated(VideoCategoryId, VideoCategoryCreationParameters),
        VideoCategoryUpdated(VideoCategoryId, VideoCategoryUpdateParameters),
        VideoCategoryDeleted(VideoCategoryId),

        VideoCreated(
            VideoId,
            Vec<NewAsset>,
            VideoCreationParameters<VideoCategoryId>,
        ),
        VideoUpdated(
            VideoId,
            Vec<NewAsset>,
            VideoUpdateParameters<VideoCategoryId>,
        ),
        VideoDeleted(VideoId),

        VideoCurated(VideoId, Vec<u8> /* rationale */),
        VideoUncurated(VideoId, Vec<u8> /* rationale */),

        // Featured Videos
        FeaturedVideosSet(Vec<VideoId>),

        // Video Playlists
        PlaylistCreated(PlaylistId, PlaylistCreationParameters<VideoId>),
        PlaylistUpdated(PlaylistId, PlaylistUpdateParameters<VideoId>),
        PlaylistDeleted(PlaylistId),

        // Series
        SeriesCreated(
            SeriesId,
            Vec<NewAsset>,
            SeriesCreationParameters<VideoCategoryId, VideoId>,
        ),
        SeriesUpdated(
            SeriesId,
            Vec<NewAsset>,
            SeriesUpdateParameters<VideoCategoryId, VideoId>,
        ),
        SeriesDeleted(SeriesId),

        // Persons
        PersonCreated(PersonId, Vec<NewAsset>, PersonCreationParameters),
        PersonUpdated(PersonId, Vec<NewAsset>, PersonUpdateParameters),
        PersonDeleted(PersonId),
        PersonAddedToVideo(PersonId, VideoId),
        PersonRemovedFromVideo(PersonId, VideoId),
    }
);
