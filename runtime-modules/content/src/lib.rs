// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![recursion_limit = "256"]

#[cfg(test)]
mod tests;
use core::marker::PhantomData;
mod errors;
mod permissions;

pub use errors::*;
pub use permissions::*;

use core::{cmp::max, hash::Hash, mem::size_of};

use codec::Codec;
use codec::{Decode, Encode};

use frame_support::traits::{Currency, ExistenceRequirement, Get};
use frame_support::{
    decl_event, decl_module, decl_storage,
    dispatch::{DispatchError, DispatchResult},
    ensure, Parameter,
};
use frame_system::ensure_signed;
#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};
use sp_arithmetic::traits::{BaseArithmetic, One, Zero};
use sp_runtime::traits::{AccountIdConversion, MaybeSerializeDeserialize, Member, Saturating};
use sp_runtime::ModuleId;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::vec;
use sp_std::vec::Vec;

pub use common::storage::{
    ContentParameters as ContentParametersRecord, StorageObjectOwner as StorageObjectOwnerRecord,
    StorageSystem,
};

pub use common::{working_group::WorkingGroup, MembershipTypes, StorageOwnership, Url};

pub type Balances<T> = balances::Module<T>;
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

pub(crate) type ContentId<T> = <T as StorageOwnership>::ContentId;

pub(crate) type DataObjectTypeId<T> = <T as StorageOwnership>::DataObjectTypeId;

pub(crate) type ContentParameters<T> = ContentParametersRecord<ContentId<T>, DataObjectTypeId<T>>;

pub(crate) type StorageObjectOwner<T> = StorageObjectOwnerRecord<
    <T as MembershipTypes>::MemberId,
    <T as StorageOwnership>::ChannelId,
    <T as StorageOwnership>::DAOId,
>;

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

/// Operations with local pallet account.
pub trait ModuleAccount<T: balances::Trait> {
    /// The module id, used for deriving its sovereign account ID.
    type ModuleId: Get<ModuleId>;

    /// The account ID of the module account.
    fn module_account_id() -> T::AccountId {
        Self::ModuleId::get().into_sub_account(Vec::<u8>::new())
    }

    /// Transfer tokens from the module account to the destination account (spends from
    /// module account).
    fn withdraw(dest_account_id: &T::AccountId, amount: BalanceOf<T>) -> DispatchResult {
        <Balances<T> as Currency<T::AccountId>>::transfer(
            &Self::module_account_id(),
            dest_account_id,
            amount,
            ExistenceRequirement::AllowDeath,
        )
    }

    /// Transfer tokens from the destination account to the module account (fills module account).
    fn deposit(src_account_id: &T::AccountId, amount: BalanceOf<T>) -> DispatchResult {
        <Balances<T> as Currency<T::AccountId>>::transfer(
            src_account_id,
            &Self::module_account_id(),
            amount,
            ExistenceRequirement::AllowDeath,
        )
    }

    /// Displays usable balance for the module account.
    fn usable_balance() -> BalanceOf<T> {
        <Balances<T>>::usable_balance(&Self::module_account_id())
    }
}

/// Implementation of the ModuleAccountHandler.
pub struct ModuleAccountHandler<T: balances::Trait, ModId: Get<ModuleId>> {
    /// Phantom marker for the trait.
    trait_marker: PhantomData<T>,

    /// Phantom marker for the module id type.
    module_id_marker: PhantomData<ModId>,
}

impl<T: balances::Trait, ModId: Get<ModuleId>> ModuleAccount<T> for ModuleAccountHandler<T, ModId> {
    type ModuleId = ModId;
}

/// Local module account handler.
pub type ContentTreasury<T> = ModuleAccountHandler<T, <T as Trait>::ModuleId>;

/// Module configuration trait for Content Directory Module
pub trait Trait:
    frame_system::Trait
    + ContentActorAuthenticator
    + Clone
    + StorageOwnership
    + MembershipTypes
    + balances::Trait
{
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

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

    // Type that handles asset uploads to storage frame_system
    type StorageSystem: StorageSystem<Self>;

    /// Type of PostId
    type PostId: NumericIdentifier;

    /// Type of PostId
    type ReactionId: NumericIdentifier;

    /// Max Number of moderators
    type MaxModerators: Get<u64>;

    /// Price per byte
    type PricePerByte: Get<<Self as balances::Trait>::Balance>;

    /// Cleanup Margin used in bloat bond calculation
    type CleanupMargin: Get<<Self as balances::Trait>::Balance>;

    // TODO: make it a function of the create_post extrinsic weights when weights will be established
    /// Cleanup Cost used in bloat bond calculation
    type CleanupCost: Get<<Self as balances::Trait>::Balance>;

    /// Content Module Id
    type ModuleId: Get<ModuleId>;

    /// Refund cap during cleanup
    type BloatBondCap: Get<u32>;

    // hash computation
    fn hash_of<E: Encode>(e: &E) -> Self::Hash;
}

/// Specifies how a new asset will be provided on creating and updating
/// Channels, Videos, Series and Person
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum NewAsset<ContentParameters> {
    /// Upload to the storage frame_system
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

// simplification type
pub(crate) type ActorToChannelOwnerResult<T> = Result<
    ChannelOwner<
        <T as MembershipTypes>::MemberId,
        <T as ContentActorAuthenticator>::CuratorGroupId,
        <T as StorageOwnership>::DAOId,
    >,
    Error<T>,
>;

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
pub struct ChannelRecord<
    MemberId: Ord,
    CuratorGroupId,
    DAOId,
    AccountId,
    VideoId,
    PlaylistId,
    SeriesId,
> {
    /// The owner of a channel
    owner: ChannelOwner<MemberId, CuratorGroupId, DAOId>,
    /// The videos under this channel
    pub videos: Vec<VideoId>,
    /// The playlists under this channel
    playlists: Vec<PlaylistId>,
    /// The series under this channel
    series: Vec<SeriesId>,
    /// If curators have censored this channel or not
    is_censored: bool,
    /// Reward account where revenue is sent if set.
    reward_account: Option<AccountId>,
    /// moderator set
    moderator_set: BTreeSet<MemberId>,
}

// Channel alias type for simplification.
pub type Channel<T> = ChannelRecord<
    <T as MembershipTypes>::MemberId,
    <T as ContentActorAuthenticator>::CuratorGroupId,
    <T as StorageOwnership>::DAOId,
    <T as frame_system::Trait>::AccountId,
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
    AccountId,
> {
    channel_id: ChannelId,
    new_owner: ChannelOwner<MemberId, CuratorGroupId, DAOId>,
    payment: Balance,
    new_reward_account: Option<AccountId>,
}

// ChannelOwnershipTransferRequest type alias for simplification.
pub type ChannelOwnershipTransferRequest<T> = ChannelOwnershipTransferRequestRecord<
    <T as StorageOwnership>::ChannelId,
    <T as MembershipTypes>::MemberId,
    <T as ContentActorAuthenticator>::CuratorGroupId,
    <T as StorageOwnership>::DAOId,
    BalanceOf<T>,
    <T as frame_system::Trait>::AccountId,
>;

/// Information about channel being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct ChannelCreationParameters_<ContentParameters, AccountId, MemberId: Ord> {
    /// Assets referenced by metadata
    assets: Vec<NewAsset<ContentParameters>>,
    /// Metadata about the channel.
    meta: Vec<u8>,
    /// optional reward account
    reward_account: Option<AccountId>,
    /// optional moderator set
    moderator_set: Option<BTreeSet<MemberId>>,
}

type ChannelCreationParameters<T> = ChannelCreationParameters_<
    ContentParameters<T>,
    <T as frame_system::Trait>::AccountId,
    <T as MembershipTypes>::MemberId,
>;

/// Information about channel being updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelUpdateParameters<ContentParameters, AccountId> {
    /// Assets referenced by metadata
    assets: Option<Vec<NewAsset<ContentParameters>>>,
    /// If set, metadata update for the channel.
    new_meta: Option<Vec<u8>>,
    /// If set, updates the reward account of the channel
    reward_account: Option<Option<AccountId>>,
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
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct VideoCreationParameters<ContentParameters> {
    /// Assets referenced by metadata
    assets: Vec<NewAsset<ContentParameters>>,
    /// Metadata for the video.
    meta: Vec<u8>,
    /// Comments enabled or not
    enable_comments: bool,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoUpdateParameters<ContentParameters> {
    /// Assets referenced by metadata
    assets: Option<Vec<NewAsset<ContentParameters>>>,
    /// If set, metadata update for the video.
    new_meta: Option<Vec<u8>>,
    /// If set enable/disable comments to video
    enable_comments: Option<bool>,
}

/// A video which belongs to a channel. A video may be part of a series or playlist.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoRecord<ChannelId, SeriesId, PostId> {
    /// Channel to which the video belongs
    pub in_channel: ChannelId,

    // keep track of which season the video is in if it is an 'episode'
    // - prevent removing a video if it is in a season (because order is important)
    pub in_series: Option<SeriesId>,

    /// Whether the curators have censored the video or not.
    pub is_censored: bool,

    /// enable or not comments
    pub enable_comments: bool,

    /// First post to a video works as a description
    pub video_post_id: Option<PostId>,
}

pub type Video<T> =
    VideoRecord<<T as StorageOwnership>::ChannelId, <T as Trait>::SeriesId, <T as Trait>::PostId>;
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
    // It is the only field so its not an Option
    /// Metadata update for the playlist.
    new_meta: Vec<u8>,
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
pub enum EpisodeParameters<VideoId, ContentParameters> {
    /// A new video is being added as the episode.
    NewVideo(VideoCreationParameters<ContentParameters>),
    /// An existing video is being made into an episode.
    ExistingVideo(VideoId),
}

/// Information about the season being created or updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct SeasonParameters<VideoId, ContentParameters> {
    /// Season assets referenced by metadata
    assets: Option<Vec<NewAsset<ContentParameters>>>,
    // ?? It might just be more straighforward to always provide full list of episodes at cost of larger tx.
    /// If set, updates the episodes of a season. Extends the number of episodes in a season
    /// when length of new_episodes is greater than previously set. Last elements must all be
    /// 'Some' in that case.
    /// Will truncate existing season when length of new_episodes is less than previously set.
    episodes: Option<Vec<Option<EpisodeParameters<VideoId, ContentParameters>>>>,
    /// If set, Metadata update for season.
    meta: Option<Vec<u8>>,
}

/// Information about the series being created or updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct SeriesParameters<VideoId, ContentParameters> {
    /// Series assets referenced by metadata
    assets: Option<Vec<NewAsset<ContentParameters>>>,
    // ?? It might just be more straighforward to always provide full list of seasons at cost of larger tx.
    /// If set, updates the seasons of a series. Extend a series when length of seasons is
    /// greater than previoulsy set. Last elements must all be 'Some' in that case.
    /// Will truncate existing series when length of seasons is less than previously set.
    seasons: Option<Vec<Option<SeasonParameters<VideoId, ContentParameters>>>>,
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
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct PersonCreationParameters<ContentParameters> {
    /// Assets referenced by metadata
    assets: Vec<NewAsset<ContentParameters>>,
    /// Metadata for person.
    meta: Vec<u8>,
}

/// Information for Persion being updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PersonUpdateParameters<ContentParameters> {
    /// Assets referenced by metadata
    assets: Option<Vec<NewAsset<ContentParameters>>>,
    /// Metadata to update person.
    new_meta: Option<Vec<u8>>,
}

/// A Person represents a real person that may be associated with a video.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Person<MemberId> {
    /// Who can update or delete this person.
    controlled_by: PersonController<MemberId>,
}

/// A Post associated to a video
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PostRecord<ContentActor, Balance, PostId, PostType, VideoId> {
    /// Author of post.
    pub author: ContentActor,

    /// Cleanup pay off
    pub bloat_bond: Balance,

    /// Overall replies counter
    pub replies_count: PostId,

    /// video associated to the post (instead of the body hash as in the blog module)
    pub post_type: PostType,

    /// video reference
    pub video_reference: VideoId,
}

/// alias for Post
pub type Post<T> = PostRecord<
    ContentActor<
        <T as ContentActorAuthenticator>::CuratorGroupId,
        <T as ContentActorAuthenticator>::CuratorId,
        <T as MembershipTypes>::MemberId,
    >,
    <T as balances::Trait>::Balance,
    <T as Trait>::PostId,
    PostType<T>,
    <T as Trait>::VideoId,
>;

/// Post type structured as linked list with the video post as beginning
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum PostTypeRecord<ParentPostId> {
    /// Equivalent to a video description
    VideoPost,

    /// Comment to a post with specified id
    Comment(ParentPostId),
}

impl<ParentPostId> Default for PostTypeRecord<ParentPostId> {
    fn default() -> Self {
        PostTypeRecord::<ParentPostId>::VideoPost
    }
}

pub type PostType<T> = PostTypeRecord<<T as Trait>::PostId>;

/// An enum in order to differenciate between post author and moderator / owner
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum CleanupActor {
    ChannelOwner,
    Moderator,
    PostAuthor,
}

impl Default for CleanupActor {
    fn default() -> Self {
        CleanupActor::ChannelOwner
    }
}

/// Information on the post being created
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PostCreationParametersRecord<PostType, VideoId> {
    /// content
    post_type: PostType,

    /// video reference
    video_reference: VideoId,
}

pub type PostCreationParameters<T> =
    PostCreationParametersRecord<PostType<T>, <T as Trait>::VideoId>;

/// Information on the post being deleted
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PostDeletionParameters<Hash> {
    /// optional witnesses in case of video post deletion
    witness: Option<Hash>,
    /// rationale in case actor is moderator
    rationale: Option<Vec<u8>>,
}

decl_storage! {
    trait Store for Module<T: Trait> as Content {
        pub ChannelById get(fn channel_by_id): map hasher(blake2_128_concat) T::ChannelId => Channel<T>;

        pub ChannelCategoryById get(fn channel_category_by_id): map hasher(blake2_128_concat) T::ChannelCategoryId => ChannelCategory;

        pub VideoById get(fn video_by_id): map hasher(blake2_128_concat) T::VideoId => Video<T>;

        pub VideoCategoryById get(fn video_category_by_id): map hasher(blake2_128_concat) T::VideoCategoryId => VideoCategory;

        pub PlaylistById get(fn playlist_by_id): map hasher(blake2_128_concat) T::PlaylistId => Playlist<T::ChannelId>;

        pub SeriesById get(fn series_by_id): map hasher(blake2_128_concat) T::SeriesId => Series<T::ChannelId, T::VideoId>;

        pub PersonById get(fn person_by_id): map hasher(blake2_128_concat) T::PersonId => Person<T::MemberId>;

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

        pub PostById get(fn post_by_id) : double_map hasher(blake2_128_concat) T::VideoId,
            hasher(blake2_128_concat) T::PostId => Post<T>;

        pub NextPostId get(fn next_post_id): T::PostId;

        pub VideoPostIdByVideoId get(fn video_post_by_video_id): map hasher(blake2_128_concat)
            T::VideoId => T::PostId;

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
        ) {

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
        }

        /// Set `is_active` status for curator group under given `curator_group_id`
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_curator_group_status(
            origin,
            curator_group_id: T::CuratorGroupId,
            is_active: bool,
        ) {

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
        }

        /// Add curator to curator group under given `curator_group_id`
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn add_curator_to_group(
            origin,
            curator_group_id: T::CuratorGroupId,
            curator_id: T::CuratorId,
        ) {

            // Ensure given origin is lead
            ensure_is_lead::<T>(origin)?;

            // Ensure curator group under provided curator_group_id already exist, retrieve corresponding one
            let curator_group = Self::ensure_curator_group_exists(&curator_group_id)?;

            // Ensure that curator_id is infact a worker in content working group
            ensure_is_valid_curator_id::<T>(&curator_id)?;

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
        }

        /// Remove curator from a given curator group
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn remove_curator_from_group(
            origin,
            curator_group_id: T::CuratorGroupId,
            curator_id: T::CuratorId,
        ) {

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
        }

        // TODO: Add Option<reward_account> to ChannelCreationParameters ?
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_channel(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            params: ChannelCreationParameters<T>,
        ) {
            ensure_actor_authorized_to_create_channel::<T>(
                origin,
                &actor,
            )?;

            // The channel owner will be..
            let channel_owner = actor_to_channel_owner::<T>(&actor)?;

            // Pick out the assets to be uploaded to storage frame_system
            let content_parameters: Vec<ContentParameters<T>> = Self::pick_content_parameters_from_assets(&params.assets);

            let channel_id = NextChannelId::<T>::get();

            let object_owner = StorageObjectOwner::<T>::Channel(channel_id);

            //
            // == MUTATION SAFE ==
            //

            // This should be first mutation
            // Try add assets to storage
            T::StorageSystem::atomically_add_content(
                object_owner,
                content_parameters,
            )?;

            // Only increment next channel id if adding content was successful
            NextChannelId::<T>::mutate(|id| *id += T::ChannelId::one());

            let channel: Channel<T> = ChannelRecord {
                owner: channel_owner,
                videos: vec![],
                playlists: vec![],
                series: vec![],
                is_censored: false,
                reward_account: params.reward_account.clone(),
                moderator_set: params.moderator_set.clone().unwrap_or(BTreeSet::new()),
            };
            ChannelById::<T>::insert(channel_id, channel.clone());

            Self::deposit_event(RawEvent::ChannelCreated(actor, channel_id, channel, params));
        }

        // Include Option<AccountId> in ChannelUpdateParameters to update reward_account
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_channel(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            params: ChannelUpdateParameters<ContentParameters<T>, T::AccountId>,
        ) {
            // check that channel exists
            let channel = Self::ensure_channel_exists(&channel_id)?;

            ensure_actor_authorized_to_update_channel::<T>(
                origin,
                &actor,
                &channel.owner,
            )?;

            // Pick out the assets to be uploaded to storage frame_system
            let new_assets = if let Some(assets) = &params.assets {
                let upload_parameters: Vec<ContentParameters<T>> = Self::pick_content_parameters_from_assets(assets);

                let object_owner = StorageObjectOwner::<T>::Channel(channel_id);

                // check assets can be uploaded to storage.
                // update can_add_content() to only take &refrences
                T::StorageSystem::can_add_content(
                    object_owner.clone(),
                    upload_parameters.clone(),
                )?;

                Some((upload_parameters, object_owner))
            } else {
                None
            };

            //
            // == MUTATION SAFE ==
            //

            let mut channel = channel;

            // Maybe update the reward account
            if let Some(reward_account) = &params.reward_account {
                channel.reward_account = reward_account.clone();
            }

            // Update the channel
            ChannelById::<T>::insert(channel_id, channel.clone());

            // add assets to storage
            // This should not fail because of prior can_add_content() check!
            if let Some((upload_parameters, object_owner)) = new_assets {
                T::StorageSystem::atomically_add_content(
                    object_owner,
                    upload_parameters,
                )?;
            }

            Self::deposit_event(RawEvent::ChannelUpdated(actor, channel_id, channel, params));
        }

        /// Remove assets of a channel from storage
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn remove_channel_assets(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            assets: Vec<ContentId<T>>,
        ) {
            // check that channel exists
            let channel = Self::ensure_channel_exists(&channel_id)?;

            ensure_actor_authorized_to_update_channel::<T>(
                origin,
                &actor,
                &channel.owner,
            )?;

            let object_owner = StorageObjectOwner::<T>::Channel(channel_id);

            //
            // == MUTATION SAFE ==
            //

            T::StorageSystem::atomically_remove_content(&object_owner, &assets)?;

            Self::deposit_event(RawEvent::ChannelAssetsRemoved(actor, channel_id, assets));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_channel_censorship_status(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            is_censored: bool,
            rationale: Vec<u8>,
        ) {
            // check that channel exists
            let channel = Self::ensure_channel_exists(&channel_id)?;

            if channel.is_censored == is_censored {
                return Ok(())
            }

            ensure_actor_authorized_to_censor::<T>(
                origin,
                &actor,
                &channel.owner,
            )?;

            //
            // == MUTATION SAFE ==
            //

            let mut channel = channel;

            channel.is_censored = is_censored;

            // TODO: unset the reward account ? so no revenue can be earned for censored channels?

            // Update the channel
            ChannelById::<T>::insert(channel_id, channel);

            Self::deposit_event(RawEvent::ChannelCensorshipStatusUpdated(actor, channel_id, is_censored, rationale));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_channel_category(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            params: ChannelCategoryCreationParameters,
        ) {
            ensure_actor_authorized_to_manage_categories::<T>(
                origin,
                &actor
            )?;

            //
            // == MUTATION SAFE ==
            //

            let category_id = Self::next_channel_category_id();
            NextChannelCategoryId::<T>::mutate(|id| *id += T::ChannelCategoryId::one());

            let category = ChannelCategory {};
            ChannelCategoryById::<T>::insert(category_id, category.clone());

            Self::deposit_event(RawEvent::ChannelCategoryCreated(category_id, category, params));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_channel_category(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            category_id: T::ChannelCategoryId,
            params: ChannelCategoryUpdateParameters,
        ) {
            ensure_actor_authorized_to_manage_categories::<T>(
                origin,
                &actor
            )?;

            Self::ensure_channel_category_exists(&category_id)?;

            Self::deposit_event(RawEvent::ChannelCategoryUpdated(actor, category_id, params));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_channel_category(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            category_id: T::ChannelCategoryId,
        ) {
            ensure_actor_authorized_to_manage_categories::<T>(
                origin,
                &actor
            )?;

            Self::ensure_channel_category_exists(&category_id)?;

            ChannelCategoryById::<T>::remove(&category_id);

            Self::deposit_event(RawEvent::ChannelCategoryDeleted(actor, category_id));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_video(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            params: VideoCreationParameters<ContentParameters<T>>,
        ) {
            // check that channel exists
            let channel = Self::ensure_channel_exists(&channel_id)?;

            ensure_actor_authorized_to_update_channel::<T>(
                origin,
                &actor,
                &channel.owner,
            )?;

            // Pick out the assets to be uploaded to storage frame_system
            let content_parameters: Vec<ContentParameters<T>> = Self::pick_content_parameters_from_assets(&params.assets);

            let video_id = NextVideoId::<T>::get();

            let object_owner = StorageObjectOwner::<T>::Channel(channel_id);

            // This should be first mutation
            // Try add assets to storage
            T::StorageSystem::atomically_add_content(
                object_owner,
                content_parameters,
            )?;

            //
            // == MUTATION SAFE ==
            //

            let video = Video::<T> {
                in_channel: channel_id,
                // keep track of which season the video is in if it is an 'episode'
                // - prevent removing a video if it is in a season (because order is important)
                in_series: None,
                /// Whether the curators have censored the video or not.
                is_censored: false,
                /// comments enabled or not
                enable_comments: params.enable_comments,
        video_post_id:  None,
            };

            VideoById::<T>::insert(video_id, video);

            // Only increment next video id if adding content was successful
            NextVideoId::<T>::mutate(|id| *id += T::VideoId::one());

            // Add recently added video id to the channel
            ChannelById::<T>::mutate(channel_id, |channel| {
                channel.videos.push(video_id);
            });

            Self::deposit_event(RawEvent::VideoCreated(actor, channel_id, video_id, params));

        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_video(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            params: VideoUpdateParameters<ContentParameters<T>>,
        ) {
            // check that video exists, retrieve corresponding channel id.
            let channel_id = Self::ensure_video_exists(&video_id)?.in_channel;

            ensure_actor_authorized_to_update_channel::<T>(
                origin,
                &actor,
                &Self::channel_by_id(channel_id).owner,
            )?;

            // Pick out the assets to be uploaded to storage frame_system
            let new_assets = if let Some(assets) = &params.assets {
                let upload_parameters: Vec<ContentParameters<T>> = Self::pick_content_parameters_from_assets(assets);

                let object_owner = StorageObjectOwner::<T>::Channel(channel_id);

                // check assets can be uploaded to storage.
                // update can_add_content() to only take &refrences
                T::StorageSystem::can_add_content(
                    object_owner.clone(),
                    upload_parameters.clone(),
                )?;

                Some((upload_parameters, object_owner))
            } else {
                None
            };

            //
            // == MUTATION SAFE ==
            //

            // add assets to storage
            // This should not fail because of prior can_add_content() check!
            if let Some((upload_parameters, object_owner)) = new_assets {
                T::StorageSystem::atomically_add_content(
                    object_owner,
                    upload_parameters,
                )?;
            }

            Self::deposit_event(RawEvent::VideoUpdated(actor, video_id, params));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_video(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
        ) {

        let sender = ensure_signed(origin.clone())?;

            // check that video exists
            let video = Self::ensure_video_exists(&video_id)?;

            let channel_id = video.in_channel;

            ensure_actor_authorized_to_update_channel::<T>(
                origin,
                &actor,
                // The channel owner will be..
                &Self::channel_by_id(channel_id).owner,
            )?;

            Self::ensure_video_can_be_removed(video)?;

            // bloat bond logic: channel owner is refunded
            Self::video_deletion_cleanup_logic(&sender, video_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Remove video
            VideoById::<T>::remove(video_id);

            // Remove all comments related
            <PostById<T>>::remove_prefix(video_id);

            // Update corresponding channel
            // Remove recently deleted video from the channel
            ChannelById::<T>::mutate(channel_id, |channel| {
                if let Some(index) = channel.videos.iter().position(|x| *x == video_id) {
                    channel.videos.remove(index);
                }
            });

            Self::deposit_event(RawEvent::VideoDeleted(actor, video_id));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_playlist(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _channel_id: T::ChannelId,
            _params: PlaylistCreationParameters,
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_playlist(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _playlist: T::PlaylistId,
            _params: PlaylistUpdateParameters,
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_playlist(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _channel_id: T::ChannelId,
            _playlist: T::PlaylistId,
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn set_featured_videos(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            list: Vec<T::VideoId>
        ) {
            // can only be set by lead
            ensure_actor_authorized_to_set_featured_videos::<T>(
                origin,
                &actor,
            )?;

            //
            // == MUTATION SAFE ==
            //

            Self::deposit_event(RawEvent::FeaturedVideosSet(actor, list));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_video_category(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            params: VideoCategoryCreationParameters,
        ) {
            ensure_actor_authorized_to_manage_categories::<T>(
                origin,
                &actor
            )?;

            //
            // == MUTATION SAFE ==
            //

            let category_id = Self::next_video_category_id();
            NextVideoCategoryId::<T>::mutate(|id| *id += T::VideoCategoryId::one());

            let category = VideoCategory {};
            VideoCategoryById::<T>::insert(category_id, category);

            Self::deposit_event(RawEvent::VideoCategoryCreated(actor, category_id, params));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_video_category(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            category_id: T::VideoCategoryId,
            params: VideoCategoryUpdateParameters,
        ) {
            ensure_actor_authorized_to_manage_categories::<T>(
                origin,
                &actor
            )?;

            Self::ensure_video_category_exists(&category_id)?;

            Self::deposit_event(RawEvent::VideoCategoryUpdated(actor, category_id, params));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_video_category(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            category_id: T::VideoCategoryId,
        ) {
            ensure_actor_authorized_to_manage_categories::<T>(
                origin,
                &actor
            )?;

            Self::ensure_video_category_exists(&category_id)?;

            VideoCategoryById::<T>::remove(&category_id);

            Self::deposit_event(RawEvent::VideoCategoryDeleted(actor, category_id));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_person(
            _origin,
            _actor: PersonActor<T::MemberId, T::CuratorId>,
            _params: PersonCreationParameters<ContentParameters<T>>,
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_person(
            _origin,
            _actor: PersonActor<T::MemberId, T::CuratorId>,
            _person: T::PersonId,
            _params: PersonUpdateParameters<ContentParameters<T>>,
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_person(
            _origin,
            _actor: PersonActor<T::MemberId, T::CuratorId>,
            _person: T::PersonId,
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn add_person_to_video(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _video_id: T::VideoId,
            _person: T::PersonId
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn remove_person_from_video(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _video_id: T::VideoId
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_video_censorship_status(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            is_censored: bool,
            rationale: Vec<u8>,
        ) -> DispatchResult {
            // check that video exists
            let video = Self::ensure_video_exists(&video_id)?;

            ensure_actor_authorized_to_censor::<T>(
                origin,
                &actor,
                // The channel owner will be..
                &Self::channel_by_id(video.in_channel).owner,
            )?;

            //
            // == MUTATION SAFE ==
            //

            let mut video = video;

            video.is_censored = is_censored;

            // Update the video
            VideoById::<T>::insert(video_id, video);

            Self::deposit_event(
                RawEvent::VideoCensorshipStatusUpdated(
                    actor,
                    video_id,
                    is_censored,
                    rationale
            ));

            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_series(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _channel_id: T::ChannelId,
            _params: SeriesParameters<T::VideoId, ContentParameters<T>>,
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_series(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _channel_id: T::ChannelId,
            _params: SeriesParameters<T::VideoId, ContentParameters<T>>,
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_series(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _series: T::SeriesId,
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_post(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            params: PostCreationParameters<T>,
        ) -> DispatchResult {

            let sender = ensure_signed(origin.clone())?;

            // ensure channel is valid
            let video = Self::ensure_video_exists(&params.video_reference)?;
            let owner = ChannelById::<T>::get(video.in_channel).owner;

            match params.post_type {
                PostType::<T>::Comment(parent_id) => {
                    ensure!(video.enable_comments, Error::<T>::CommentsDisabled);
                    Self::ensure_post_exists( params.video_reference, parent_id).map(|_| ())?;
                    ensure_actor_authorized_to_add_comment::<T>(&sender, &actor)?
                },
                PostType::<T>::VideoPost => ensure_actor_authorized_to_add_video_post::<T>(
                    &sender,
                    &actor,
                    &owner
                )?
            };

            let initial_bloat_bond = Self::compute_initial_bloat_bond();
            let post_id = <NextPostId<T>>::get();

            let post = Post::<T> {
                author: actor,
                bloat_bond: initial_bloat_bond,
                replies_count: T::PostId::zero(),
                video_reference: params.video_reference.clone(),
                post_type: params.post_type.clone(),
            };

            //
            // == MUTATION SAFE ==
            //

            <ContentTreasury<T>>::deposit(&sender, initial_bloat_bond.clone())?;

            <NextPostId<T>>::mutate(|x| *x = x.saturating_add(One::one()));
            <PostById<T>>::insert(&params.video_reference, &post_id, post.clone());

            // increment replies count in the parent post
            match params.post_type {
                PostType::<T>::Comment(parent_id) => <PostById<T>>::mutate(
                    &params.video_reference,
                    parent_id,
                    |x| x.replies_count = x.replies_count.saturating_add(One::one())),
                PostType::<T>::VideoPost => VideoById::<T>::mutate(
                    &params.video_reference,
                    |video| video.video_post_id = Some(post_id.clone())),
            };

            // deposit event
            Self::deposit_event(RawEvent::PostCreated(post, post_id, actor));

            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn edit_post_text(
            origin,
            video_id: T::VideoId,
            post_id: T::PostId,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            new_text: Vec<u8>,
        ) {
            let sender = ensure_signed(origin.clone())?;
            let post = Self::ensure_post_exists(video_id, post_id)?;
            let video = VideoById::<T>::get(video_id);
            let channel = ChannelById::<T>::get(video.in_channel);

            match post.post_type {
                PostType::<T>::VideoPost => ensure_actor_authorized_to_edit_video_post::<T>(
                    &sender,
                    &actor,
                    &channel.owner
                )?,
                PostType::<T>::Comment(_) => ensure_actor_authorized_to_edit_comment::<T>(
                    &sender,
                    &actor,
                    &post
                )?
            };

            // deposit event
            Self::deposit_event(RawEvent::PostTextUpdated(actor, new_text, post_id, video_id));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_post(
            origin,
            post_id: T::PostId,
            video_id: T::VideoId,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            params: PostDeletionParameters<<T as frame_system::Trait>::Hash>,
        ) {
            let sender = ensure_signed(origin.clone())?;
            let post = Self::ensure_post_exists(video_id, post_id)?;
            let video = VideoById::<T>::get(video_id);
            let channel = ChannelById::<T>::get(video.in_channel);

            let cleanup_actor = match post.post_type {
                PostType::<T>::VideoPost => {
                    Self::ensure_witness_verification(
                        params.witness,
                        post.replies_count,
                    )?;
                    ensure_actor_authorized_to_remove_video_post::<T>(&sender, &actor,&channel)?;
                    CleanupActor::ChannelOwner
                },
                PostType::<T>::Comment(_) => {
                    let cleanup_actor = ensure_actor_authorized_to_remove_comment::<T>(
                        &sender,
                        &actor,
                        &channel,
                        &post
                    )?;
                    if let CleanupActor::Moderator = &cleanup_actor {
                        ensure!(
                            params.rationale.is_some(),
                            Error::<T>::RationaleNotProvidedByModerator
                        );
                    }
                    cleanup_actor
                }
            };

            //
            // == MUTATION_SAFE ==
            //

            Self::refund(&sender, cleanup_actor, post.bloat_bond.clone())?;

            match post.post_type {
                PostType::<T>::Comment(parent_id) => {
                    PostById::<T>::remove(&video_id, &post_id);
                    <PostById<T>>::mutate(&video_id, &parent_id, |x| {
                        x.replies_count = x.replies_count.saturating_sub(One::one())
                    });
                }
                PostType::<T>::VideoPost => PostById::<T>::remove_prefix(&video_id),
            }

            // deposit event
            Self::deposit_event(
                RawEvent::PostDeleted(
                    post,
                    post_id,
                    video_id,
                    actor,
            ));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        fn react_to_post(
            origin,
            member_id: T::MemberId,
            post_id: T::PostId,
            reaction_id: T::ReactionId,
        ) {
            let sender = ensure_signed(origin)?;
            ensure_member_auth_success::<T>(&member_id, &sender)?;

            //
            // == MUTATION_SAFE ==
            //

            Self::deposit_event(RawEvent::ReactionToPost(member_id, post_id, reaction_id));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        fn react_to_video(
            origin,
            member_id: T::MemberId,
            video_id: T::VideoId,
            reaction_id: T::ReactionId,
        ) {
            let sender = ensure_signed(origin)?;
            ensure_member_auth_success::<T>(&member_id, &sender)?;

            //
            // == MUTATION_SAFE ==
            //

            Self::deposit_event(RawEvent::ReactionToVideo(member_id, video_id, reaction_id));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        fn update_moderator_set(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            new_moderator_set: BTreeSet<T::MemberId>,
            channel_id: T::ChannelId
        ) {
            // ensure (origin, actor) is channel owner
            let owner = Self::ensure_channel_exists(&channel_id)?.owner;
            ensure_actor_authorized_to_update_channel::<T>(
                origin,
                &actor,
                // The channel owner will be..
                &owner,
            )?;

            //
            // == MUTATION_SAFE ==
            //

            <ChannelById<T>>::mutate(channel_id, |x| x.moderator_set = new_moderator_set.clone());

            Self::deposit_event(
                RawEvent::ModeratorSetUpdated(
                    channel_id,
                    new_moderator_set
                ));
            }
    }
}

impl<T: Trait> Module<T> {
    /// Ensure `CuratorGroup` under given id exists
    fn ensure_curator_group_under_given_id_exists(
        curator_group_id: &T::CuratorGroupId,
    ) -> Result<(), Error<T>> {
        ensure!(
            <CuratorGroupById<T>>::contains_key(curator_group_id),
            Error::<T>::CuratorGroupDoesNotExist
        );
        Ok(())
    }

    /// Ensure `CuratorGroup` under given id exists, return corresponding one
    fn ensure_curator_group_exists(
        curator_group_id: &T::CuratorGroupId,
    ) -> Result<CuratorGroup<T>, Error<T>> {
        Self::ensure_curator_group_under_given_id_exists(curator_group_id)?;
        Ok(Self::curator_group_by_id(curator_group_id))
    }

    fn ensure_channel_exists(channel_id: &T::ChannelId) -> Result<Channel<T>, Error<T>> {
        ensure!(
            ChannelById::<T>::contains_key(channel_id),
            Error::<T>::ChannelDoesNotExist
        );
        Ok(ChannelById::<T>::get(channel_id))
    }

    fn ensure_video_exists(video_id: &T::VideoId) -> Result<Video<T>, Error<T>> {
        ensure!(
            VideoById::<T>::contains_key(video_id),
            Error::<T>::VideoDoesNotExist
        );
        Ok(VideoById::<T>::get(video_id))
    }

    // Ensure given video is not in season
    fn ensure_video_can_be_removed(video: Video<T>) -> DispatchResult {
        ensure!(video.in_series.is_none(), Error::<T>::VideoInSeason);
        Ok(())
    }

    fn ensure_channel_category_exists(
        channel_category_id: &T::ChannelCategoryId,
    ) -> Result<ChannelCategory, Error<T>> {
        ensure!(
            ChannelCategoryById::<T>::contains_key(channel_category_id),
            Error::<T>::CategoryDoesNotExist
        );
        Ok(ChannelCategoryById::<T>::get(channel_category_id))
    }

    fn ensure_video_category_exists(
        video_category_id: &T::VideoCategoryId,
    ) -> Result<VideoCategory, Error<T>> {
        ensure!(
            VideoCategoryById::<T>::contains_key(video_category_id),
            Error::<T>::CategoryDoesNotExist
        );
        Ok(VideoCategoryById::<T>::get(video_category_id))
    }

    fn pick_content_parameters_from_assets(
        assets: &[NewAsset<ContentParameters<T>>],
    ) -> Vec<ContentParameters<T>> {
        assets
            .iter()
            .filter_map(|asset| match asset {
                NewAsset::Upload(content_parameters) => Some(content_parameters.clone()),
                _ => None,
            })
            .collect()
    }

    fn ensure_post_exists(video_id: T::VideoId, post_id: T::PostId) -> Result<Post<T>, Error<T>> {
        ensure!(
            PostById::<T>::contains_key(video_id, post_id),
            Error::<T>::PostDoesNotExist
        );
        Ok(PostById::<T>::get(video_id, post_id))
    }

    fn not_implemented() -> DispatchResult {
        Err(Error::<T>::FeatureNotImplemented.into())
    }

    fn refund(
        sender: &<T as frame_system::Trait>::AccountId,
        cleanup_actor: CleanupActor,
        bloat_bond: <T as balances::Trait>::Balance,
    ) -> DispatchResult {
        match cleanup_actor {
            CleanupActor::PostAuthor => {
                let cap = <T as balances::Trait>::Balance::from(T::BloatBondCap::get());

                // if cap is exceeded, refund cap and burn the difference
                if bloat_bond > cap {
                    let diff = bloat_bond.saturating_sub(cap);
                    ContentTreasury::<T>::withdraw(&sender, cap)?;
                    let _ = balances::Module::<T>::burn(diff);
                } else {
                    ContentTreasury::<T>::withdraw(&sender, bloat_bond)?;
                }
            }
            _ => {
                let _ = balances::Module::<T>::burn(bloat_bond);
            }
        }
        Ok(())
    }

    fn video_deletion_cleanup_logic(sender: &T::AccountId, video_id: T::VideoId) -> DispatchResult {
        if <VideoPostIdByVideoId<T>>::contains_key(video_id) {
            let post_id = <VideoPostIdByVideoId<T>>::get(video_id);
            let bloat_bond = <PostById<T>>::get(video_id, post_id).bloat_bond;
            Self::refund(&sender, CleanupActor::PostAuthor, bloat_bond)?;
        }
        Ok(())
    }

    fn compute_initial_bloat_bond() -> <T as balances::Trait>::Balance {
        let storage_price =
            T::PricePerByte::get().saturating_mul((size_of::<Post<T>>() as u32).into());

        let cleanup_cost = T::CleanupCost::get().saturating_add(T::CleanupMargin::get());

        max(storage_price, cleanup_cost)
    }

    fn ensure_witness_verification(
        witness: Option<<T as frame_system::Trait>::Hash>,
        replies_count: T::PostId,
    ) -> DispatchResult {
        // If we are trying to delete a video post we need witness verification
        match witness {
            None => {
                return Err(Error::<T>::WitnessNotProvided.into());
            }
            Some(witness) => {
                ensure!(
                    T::hash_of(&replies_count) == witness,
                    Error::<T>::WitnessVerificationFailed,
                );
            }
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
        ContentActor = ContentActor<
            <T as ContentActorAuthenticator>::CuratorGroupId,
            <T as ContentActorAuthenticator>::CuratorId,
            <T as MembershipTypes>::MemberId,
        >,
        CuratorGroupId = <T as ContentActorAuthenticator>::CuratorGroupId,
        CuratorId = <T as ContentActorAuthenticator>::CuratorId,
        VideoId = <T as Trait>::VideoId,
        VideoCategoryId = <T as Trait>::VideoCategoryId,
        ChannelId = <T as StorageOwnership>::ChannelId,
        NewAsset = NewAsset<ContentParameters<T>>,
        ChannelCategoryId = <T as Trait>::ChannelCategoryId,
        ChannelOwnershipTransferRequestId = <T as Trait>::ChannelOwnershipTransferRequestId,
        PlaylistId = <T as Trait>::PlaylistId,
        SeriesId = <T as Trait>::SeriesId,
        PersonId = <T as Trait>::PersonId,
        ChannelOwnershipTransferRequest = ChannelOwnershipTransferRequest<T>,
        Series = Series<<T as StorageOwnership>::ChannelId, <T as Trait>::VideoId>,
        Channel = Channel<T>,
        ContentParameters = ContentParameters<T>,
        AccountId = <T as frame_system::Trait>::AccountId,
        ContentId = ContentId<T>,
        IsCensored = bool,
        Post = Post<T>,
        PostId = <T as Trait>::PostId,
        MemberId = <T as MembershipTypes>::MemberId,
        ReactionId = <T as Trait>::ReactionId,
        ModeratorSet = BTreeSet<<T as MembershipTypes>::MemberId>,
        ChannelCreationParameters = ChannelCreationParameters<T>,
    {
        // Curators
        CuratorGroupCreated(CuratorGroupId),
        CuratorGroupStatusSet(CuratorGroupId, bool /* active status */),
        CuratorAdded(CuratorGroupId, CuratorId),
        CuratorRemoved(CuratorGroupId, CuratorId),

        // Channels
        ChannelCreated(ContentActor, ChannelId, Channel, ChannelCreationParameters),
        ChannelUpdated(
            ContentActor,
            ChannelId,
            Channel,
            ChannelUpdateParameters<ContentParameters, AccountId>,
        ),
        ChannelAssetsRemoved(ContentActor, ChannelId, Vec<ContentId>),

        ChannelCensorshipStatusUpdated(
            ContentActor,
            ChannelId,
            IsCensored,
            Vec<u8>, /* rationale */
        ),

        // Channel Ownership Transfers
        ChannelOwnershipTransferRequested(
            ContentActor,
            ChannelOwnershipTransferRequestId,
            ChannelOwnershipTransferRequest,
        ),
        ChannelOwnershipTransferRequestWithdrawn(ContentActor, ChannelOwnershipTransferRequestId),
        ChannelOwnershipTransferred(ContentActor, ChannelOwnershipTransferRequestId),

        // Channel Categories
        ChannelCategoryCreated(
            ChannelCategoryId,
            ChannelCategory,
            ChannelCategoryCreationParameters,
        ),
        ChannelCategoryUpdated(
            ContentActor,
            ChannelCategoryId,
            ChannelCategoryUpdateParameters,
        ),
        ChannelCategoryDeleted(ContentActor, ChannelCategoryId),

        // Videos
        VideoCategoryCreated(
            ContentActor,
            VideoCategoryId,
            VideoCategoryCreationParameters,
        ),
        VideoCategoryUpdated(ContentActor, VideoCategoryId, VideoCategoryUpdateParameters),
        VideoCategoryDeleted(ContentActor, VideoCategoryId),

        VideoCreated(
            ContentActor,
            ChannelId,
            VideoId,
            VideoCreationParameters<ContentParameters>,
        ),
        VideoUpdated(
            ContentActor,
            VideoId,
            VideoUpdateParameters<ContentParameters>,
        ),
        VideoDeleted(ContentActor, VideoId),

        VideoCensorshipStatusUpdated(
            ContentActor,
            VideoId,
            IsCensored,
            Vec<u8>, /* rationale */
        ),

        // Featured Videos
        FeaturedVideosSet(ContentActor, Vec<VideoId>),

        // Video Playlists
        PlaylistCreated(ContentActor, PlaylistId, PlaylistCreationParameters),
        PlaylistUpdated(ContentActor, PlaylistId, PlaylistUpdateParameters),
        PlaylistDeleted(ContentActor, PlaylistId),

        // Series
        SeriesCreated(
            ContentActor,
            SeriesId,
            Vec<NewAsset>,
            SeriesParameters<VideoId, ContentParameters>,
            Series,
        ),
        SeriesUpdated(
            ContentActor,
            SeriesId,
            Vec<NewAsset>,
            SeriesParameters<VideoId, ContentParameters>,
            Series,
        ),
        SeriesDeleted(ContentActor, SeriesId),

        // Persons
        PersonCreated(
            ContentActor,
            PersonId,
            Vec<NewAsset>,
            PersonCreationParameters<ContentParameters>,
        ),
        PersonUpdated(
            ContentActor,
            PersonId,
            Vec<NewAsset>,
            PersonUpdateParameters<ContentParameters>,
        ),
        PersonDeleted(ContentActor, PersonId),

        // Posts & Replies
        PostCreated(Post, PostId, ContentActor),
        PostTextUpdated(ContentActor, Vec<u8>, PostId, VideoId),
        PostDeleted(Post, PostId, VideoId, ContentActor),
        ReactionToPost(MemberId, PostId, ReactionId),
        ReactionToVideo(MemberId, VideoId, ReactionId),
        ModeratorSetUpdated(ChannelId, ModeratorSet),
    }
);
