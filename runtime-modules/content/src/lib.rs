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
    MembershipTypes, StorageOwnership, Url,
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

/// Module configuration trait for Content Directory Module
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

    /// Channel Transfer Payments Escrow Account seed for ModuleId to compute deterministic AccountId
    type ChannelOwnershipPaymentEscrowId: Get<[u8; 8]>;

    /// Type of identifier for Videos
    type VideoId: NumericIdentifier;

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

/// Specifies how a new asset will be provided on creating and updating
/// Channels, Videos, Series and Person
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum NewAsset<ContentParameters> {
    /// Upload to the storage system
    Upload(ContentParameters),
    /// Multiple url strings pointing at an asset
    Urls(Vec<Url>),
}

/// The owner of a channel, is the authorized "actor" that can update
/// or delete or transfer a channel and its contents.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum ChannelOwner<MemberId, CuratorGroupId, DAOId> {
    /// A Member owns the channel
    Member(MemberId),
    /// A specific curation group owns the channel
    CuratorGroup(CuratorGroupId),
    // Native DAO owns the channel
    Dao(DAOId),
}

// Default trait implemented only because its used in a Channel which needs to implement a Default trait
// since it is a StorageValue.
impl<MemberId: Default, CuratorGroupId, DAOId> Default
    for ChannelOwner<MemberId, CuratorGroupId, DAOId>
{
    fn default() -> Self {
        ChannelOwner::Member(MemberId::default())
    }
}

/// A category which channels can belong to.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelCategory {
    // No runtime information is currently stored for a Category.
}

/// Information on the category being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelCategoryCreationParameters {
    /// Metadata for the category.
    meta: Vec<u8>,
}

/// Information on the category being updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelCategoryUpdateParameters {
    // as this is the only field it is not an Option
    /// Metadata update for the category.
    new_meta: Vec<u8>,
}

/// Type representing an owned channel which videos, playlists, and series can belong to.
/// If a channel is deleted, all videos, playlists and series will also be deleted.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelRecord<MemberId, CuratorGroupId, DAOId, AccountId, VideoId, PlaylistId, SeriesId>
{
    /// The owner of a channel
    owner: ChannelOwner<MemberId, CuratorGroupId, DAOId>,
    /// The videos under this channel
    videos: Vec<VideoId>,
    /// The playlists under this channel
    playlists: Vec<PlaylistId>,
    /// The series under this channel
    series: Vec<SeriesId>,
    /// If curators have censored this channel or not
    is_censored: bool,
    /// Reward account where revenue is sent if set.
    reward_account: Option<AccountId>,
}

// Channel alias type for simplification.
pub type Channel<T> = ChannelRecord<
    <T as MembershipTypes>::MemberId,
    <T as ContentActorAuthenticator>::CuratorGroupId,
    <T as StorageOwnership>::DAOId,
    <T as system::Trait>::AccountId,
    <T as Trait>::VideoId,
    <T as Trait>::PlaylistId,
    <T as Trait>::SeriesId,
>;

/// A request to buy a channel by a new ChannelOwner.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelOwnershipTransferRequestRecord<
    ChannelId,
    MemberId,
    CuratorGroupId,
    DAOId,
    Balance,
> {
    channel_id: ChannelId,
    new_owner: ChannelOwner<MemberId, CuratorGroupId, DAOId>,
    payment: Balance,
}

// ChannelOwnershipTransferRequest type alias for simplification.
pub type ChannelOwnershipTransferRequest<T> = ChannelOwnershipTransferRequestRecord<
    <T as StorageOwnership>::ChannelId,
    <T as MembershipTypes>::MemberId,
    <T as ContentActorAuthenticator>::CuratorGroupId,
    <T as StorageOwnership>::DAOId,
    BalanceOf<T>,
>;

/// Information about channel being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelCreationParameters {
    /// Metadata about the channel.
    meta: Vec<u8>,
}

/// Information about channel being updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelUpdateParameters {
    /// If set, metadata update for the channel.
    new_meta: Option<Vec<u8>>,
}

/// A category that videos can belong to.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoCategory {
    // No runtime information is currently stored for a Category.
}

/// Information about the video category being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoCategoryCreationParameters {
    /// Metadata about the video category.
    meta: Vec<u8>,
}

/// Information about the video category being updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoCategoryUpdateParameters {
    // Because it is the only field it is not an Option
    /// Metadata update for the video category.
    new_meta: Vec<u8>,
}

/// Information about the video being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoCreationParameters {
    /// Metadata for the video.
    meta: Vec<u8>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoUpdateParameters {
    /// If set, metadata update for the video.
    new_meta: Option<Vec<u8>>,
}

/// A video which belongs to a channel. A video may be part of a series or playlist.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Video<ChannelId, SeriesId> {
    in_channel: ChannelId,
    // keep track of which season the video is in if it is an 'episode'
    // - prevent removing a video if it is in a season (because order is important)
    in_series: Option<SeriesId>,
    /// Whether the curators have censored the video or not.
    is_censored: bool,
    /// Whether the curators have chosen to feature the video or not.
    is_featured: bool,
}

/// Information about the plyalist being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PlaylistCreationParameters {
    /// Metadata about the playlist.
    meta: Vec<u8>,
}

/// Information about the playlist being updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PlaylistUpdateParameters {
    /// If set, metadata update for the playlist.
    new_meta: Option<Vec<u8>>,
}

/// A playlist is an ordered collection of videos.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Playlist<ChannelId> {
    /// The channel the playlist belongs to.
    in_channel: ChannelId,
}

/// Information about the episode being created or updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum EpisodeParameters<VideoId> {
    /// A new video is being added as the episode.
    NewVideo(VideoCreationParameters),
    /// An existing video is being made into an episode.
    ExistingVideo(VideoId),
}

/// Information about the season being created or updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct SeasonParameters<VideoId> {
    // ?? It might just be more straighforward to always provide full list of episodes at cost of larger tx.
    /// If set, updates the episodes of a season. Extends the number of episodes in a season
    /// when length of new_episodes is greater than previously set. Last elements must all be
    /// 'Some' in that case.
    /// Will truncate existing season when length of new_episodes is less than previously set.
    episodes: Option<Vec<Option<EpisodeParameters<VideoId>>>>,
    /// If set, Metadata update for season.
    meta: Option<Vec<u8>>,
}

/// Information about the series being created or updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct SeriesParameters<VideoId> {
    // ?? It might just be more straighforward to always provide full list of seasons at cost of larger tx.
    /// If set, updates the seasons of a series. Extend a series when length of seasons is
    /// greater than previoulsy set. Last elements must all be 'Some' in that case.
    /// Will truncate existing series when length of seasons is less than previously set.
    seasons: Option<Vec<Option<SeasonParameters<VideoId>>>>,
    meta: Option<Vec<u8>>,
}

/// A season is an ordered list of videos (episodes).
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Season<VideoId> {
    episodes: Vec<VideoId>,
}

/// A series is an ordered list of seasons that belongs to a channel.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Series<ChannelId, VideoId> {
    in_channel: ChannelId,
    seasons: Vec<Season<VideoId>>,
}

// The actor the caller/origin is trying to act as for Person creation and update and delete calls.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum PersonActor<MemberId, CuratorId> {
    Member(MemberId),
    Curator(CuratorId),
}

/// The authorized actor that may update or delete a Person.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum PersonController<MemberId> {
    /// Member controls the person
    Member(MemberId),
    /// Any curator controls the person
    Curators,
}

// Default trait implemented only because its used in Person which needs to implement a Default trait
// since it is a StorageValue.
impl<MemberId: Default> Default for PersonController<MemberId> {
    fn default() -> Self {
        PersonController::Member(MemberId::default())
    }
}

/// Information for Person being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PersonCreationParameters {
    /// Metadata for person.
    meta: Vec<u8>,
}

/// Information for Persion being updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PersonUpdateParameters {
    /// Metadata to update person.
    new_meta: Vec<u8>,
}

/// A Person represents a real person that may be associated with a video.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Person<MemberId> {
    /// Who can update or delete this person.
    controlled_by: PersonController<MemberId>,
}

decl_storage! {
    trait Store for Module<T: Trait> as Content {
        pub ChannelById get(fn channel_by_id): map hasher(blake2_128_concat) T::ChannelId => Channel<T>;

        pub ChannelCategoryById get(fn channel_category_by_id): map hasher(blake2_128_concat) T::ChannelCategoryId => ChannelCategory;

        pub VideoById get(fn video_by_id): map hasher(blake2_128_concat) T::VideoId => Video<T::ChannelId, T::SeriesId>;

        pub VideoCategoryById get(fn video_category_by_id): map hasher(blake2_128_concat) T::VideoCategoryId => VideoCategory;

        pub PlaylistById get(fn playlist_by_id): map hasher(blake2_128_concat) T::PlaylistId => Playlist<T::ChannelId>;

        pub SeriesById get(fn series_by_id): map hasher(blake2_128_concat) T::SeriesId => Series<T::ChannelId, T::VideoId>;

        pub PersonById get(fn person_by_id): map hasher(blake2_128_concat) T::PersonId => Person<T::MemberId>;

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

            // We should previously ensure that curator_group  owns no channels to be able to remove it
            curator_group.ensure_curator_group_owns_no_channels()?;

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
            params: ChannelCreationParameters,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_channel(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            channel_id: T::ChannelId,
            new_assets: Vec<NewAsset<ContentParameters<T::ContentId, T::DataObjectTypeId>>>,
            params: ChannelUpdateParameters,
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
            params: VideoCreationParameters,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_video(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            video: T::VideoId,
            assets: Vec<NewAsset<ContentParameters<T::ContentId, T::DataObjectTypeId>>>,
            params: VideoUpdateParameters,
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
            params: PlaylistCreationParameters,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_playlist(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            playlist: T::PlaylistId,
            assets: Vec<NewAsset<ContentParameters<T::ContentId, T::DataObjectTypeId>>>,
            params: PlaylistUpdateParameters,
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
        pub fn censor_video(
            origin,
            curator_id: T::CuratorId,
            video_id: T::VideoId,
            rationale: Vec<u8>,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn censor_channel(
            origin,
            curator_id: T::CuratorId,
            channel_id: T::ChannelId,
            rationale: Vec<u8>,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn uncensor_video(
            origin,
            curator_id: T::CuratorId,
            video_id: T::VideoId,
            rationale: Vec<u8>
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn uncensor_channel(
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
            params: SeriesParameters<T::VideoId>,
        ) -> DispatchResult {
            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_series(
            origin,
            owner: ChannelOwner<T::MemberId, T::CuratorGroupId, T::DAOId>,
            channel_id: T::ChannelId,
            assets: Vec<NewAsset<ContentParameters<T::ContentId, T::DataObjectTypeId>>>,
            params: SeriesParameters<T::VideoId>,
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
    /// Increment number of channels, maintained by each curator group
    pub fn increment_number_of_channels_owned_by_curator_groups(
        curator_group_ids: BTreeSet<T::CuratorGroupId>,
    ) {
        curator_group_ids.into_iter().for_each(|curator_group_id| {
            Self::increment_number_of_channels_owned_by_curator_group(curator_group_id);
        });
    }

    // TODO: make this private again after used in module
    /// Decrement number of channels, maintained by each curator group
    pub fn decrement_number_of_channels_owned_by_curator_groups(
        curator_group_ids: BTreeSet<T::CuratorGroupId>,
    ) {
        curator_group_ids.into_iter().for_each(|curator_group_id| {
            Self::decrement_number_of_channels_owned_by_curator_group(curator_group_id);
        });
    }

    // TODO: make this private again after used in module
    /// Increment number of channels, maintained by curator group
    pub fn increment_number_of_channels_owned_by_curator_group(
        curator_group_id: T::CuratorGroupId,
    ) {
        <CuratorGroupById<T>>::mutate(curator_group_id, |curator_group| {
            curator_group.increment_number_of_channels_owned_count();
        });
    }

    // TODO: make this private again after used in module
    /// Decrement number of channels, maintained by curator group
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
        Series = Series<<T as StorageOwnership>::ChannelId, <T as Trait>::VideoId>,
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
            ChannelCreationParameters,
        ),
        ChannelUpdated(ChannelId, Vec<NewAsset>, ChannelUpdateParameters),
        ChannelDeleted(ChannelId),

        ChannelCensored(ChannelId, Vec<u8> /* rationale */),
        ChannelUncensored(ChannelId, Vec<u8> /* rationale */),

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

        VideoCreated(VideoId, Vec<NewAsset>, VideoCreationParameters),
        VideoUpdated(VideoId, Vec<NewAsset>, VideoUpdateParameters),
        VideoDeleted(VideoId),

        VideoCensored(VideoId, Vec<u8> /* rationale */),
        VideoUncensored(VideoId, Vec<u8> /* rationale */),

        // Featured Videos
        FeaturedVideosSet(Vec<VideoId>),

        // Video Playlists
        PlaylistCreated(PlaylistId, PlaylistCreationParameters),
        PlaylistUpdated(PlaylistId, PlaylistUpdateParameters),
        PlaylistDeleted(PlaylistId),

        // Series
        SeriesCreated(SeriesId, Vec<NewAsset>, SeriesParameters<VideoId>, Series),
        SeriesUpdated(SeriesId, Vec<NewAsset>, SeriesParameters<VideoId>, Series),
        SeriesDeleted(SeriesId),

        // Persons
        PersonCreated(PersonId, Vec<NewAsset>, PersonCreationParameters),
        PersonUpdated(PersonId, Vec<NewAsset>, PersonUpdateParameters),
        PersonDeleted(PersonId),
    }
);
