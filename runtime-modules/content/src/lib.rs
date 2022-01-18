// Extrinsics list
// - create channel
// - update channel
// - delete channel
// - create video
// - update video
// - delete video
// - update channel chensorship status
// - update video chensorship status
// - create channel category
// - update channel category
// - delete channel category
// - create video category
// - update video category
// - delete video category

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![recursion_limit = "256"]
// Internal Substrate warning (decl_event).
#![allow(clippy::unused_unit, clippy::all)]

#[cfg(test)]
mod tests;
use core::marker::PhantomData;
mod errors;
mod permissions;

use sp_std::cmp::max;
use sp_std::mem::size_of;

pub use errors::*;
pub use permissions::*;

use codec::Codec;
use codec::{Decode, Encode};

pub use storage::{
    BagIdType, DataObjectCreationParameters, DataObjectStorage, DynamicBagIdType, UploadParameters,
    UploadParametersRecord,
};

pub use common::{working_group::WorkingGroup, MembershipTypes, StorageOwnership, Url};
use frame_support::traits::{Currency, ExistenceRequirement, Get};
use frame_support::{
    decl_event, decl_module, decl_storage,
    dispatch::{DispatchError, DispatchResult},
    ensure, Parameter,
};
use frame_system::ensure_signed;

#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};
use sp_arithmetic::traits::{BaseArithmetic, One, Saturating, Zero};
use sp_runtime::traits::{AccountIdConversion, Hash, MaybeSerializeDeserialize, Member};
use sp_runtime::ModuleId;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::vec::Vec;

pub type Balances<T> = balances::Module<T>;
pub type BalanceOf<T> = <Balances<T> as Currency<<T as frame_system::Trait>::AccountId>>::Balance;
type Storage<T> = storage::Module<T>;

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
    + MaybeSerializeDeserialize
    + Eq
    + PartialEq
    + Ord
    + Zero
    + From<u64>
    + Into<u64>
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
    + MembershipTypes
    + balances::Trait
    + storage::Trait
    + minting::Trait
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

    /// The storage type used
    type DataObjectStorage: storage::DataObjectStorage<Self>;

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

    /// Video migrated in each block during migration
    type VideosMigrationsEachBlock: Get<u64>;

    /// Channel migrated in each block during migration
    type ChannelsMigrationsEachBlock: Get<u64>;
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

/// Data structure in order to keep track of the migration
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct MigrationConfigRecord<NumericId> {
    // at each block the videos/channels removed will be those with id in the
    // half open range [current_id, final_id).
    // when migration is triggered final_id will be updated
    // when migration is performed current_id will be updated
    pub current_id: NumericId,
    pub final_id: NumericId,
}

type VideoMigrationConfig<T> = MigrationConfigRecord<<T as Trait>::VideoId>;
type ChannelMigrationConfig<T> = MigrationConfigRecord<<T as storage::Trait>::ChannelId>;

/// The owner of a channel, is the authorized "actor" that can update
/// or delete or transfer a channel and its contents.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum ChannelOwner<MemberId, CuratorGroupId> {
    /// A Member owns the channel
    Member(MemberId),
    /// A specific curation group owns the channel
    CuratorGroup(CuratorGroupId),
}

// Default trait implemented only because its used in a Channel which needs to implement a Default trait
// since it is a StorageValue.
impl<MemberId: Default, CuratorGroupId> Default for ChannelOwner<MemberId, CuratorGroupId> {
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
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelRecord<MemberId: Ord, CuratorGroupId, AccountId, Balance> {
    /// The owner of a channel
    owner: ChannelOwner<MemberId, CuratorGroupId>,
    /// The videos under this channel
    num_videos: u64,
    /// If curators have censored this channel or not
    is_censored: bool,
    /// Reward account where revenue is sent if set.
    reward_account: Option<AccountId>,
    /// collaborator set
    collaborators: BTreeSet<MemberId>,
    /// moderator set
    moderator_set: BTreeSet<MemberId>,
    /// Cumulative cashout
    cumulative_payout_earned: Balance,
}

// Channel alias type for simplification.
pub type Channel<T> = ChannelRecord<
    <T as common::MembershipTypes>::MemberId,
    <T as ContentActorAuthenticator>::CuratorGroupId,
    <T as frame_system::Trait>::AccountId,
    BalanceOf<T>,
>;

/// A request to buy a channel by a new ChannelOwner.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelOwnershipTransferRequestRecord<
    ChannelId,
    MemberId,
    CuratorGroupId,
    Balance,
    AccountId,
> {
    channel_id: ChannelId,
    new_owner: ChannelOwner<MemberId, CuratorGroupId>,
    payment: Balance,
    new_reward_account: Option<AccountId>,
}

// ChannelOwnershipTransferRequest type alias for simplification.
pub type ChannelOwnershipTransferRequest<T> = ChannelOwnershipTransferRequestRecord<
    <T as storage::Trait>::ChannelId,
    <T as common::MembershipTypes>::MemberId,
    <T as ContentActorAuthenticator>::CuratorGroupId,
    BalanceOf<T>,
    <T as frame_system::Trait>::AccountId,
>;

/// Information about channel being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct ChannelCreationParametersRecord<StorageAssets, AccountId, MemberId: Ord> {
    /// Assets referenced by metadata
    assets: Option<StorageAssets>,
    /// Metadata about the channel.
    meta: Option<Vec<u8>>,
    /// optional reward account
    reward_account: Option<AccountId>,
    /// initial collaborator set
    collaborators: BTreeSet<MemberId>,
    /// initial moderator set
    moderator_set: BTreeSet<MemberId>,
}

type ChannelCreationParameters<T> = ChannelCreationParametersRecord<
    StorageAssets<T>,
    <T as frame_system::Trait>::AccountId,
    <T as common::MembershipTypes>::MemberId,
>;

/// Information about channel being updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelUpdateParametersRecord<StorageAssets, AccountId, DataObjectId: Ord, MemberId: Ord>
{
    /// Asset collection for the channel, referenced by metadata
    assets_to_upload: Option<StorageAssets>,
    /// If set, metadata update for the channel.
    new_meta: Option<Vec<u8>>,
    /// If set, updates the reward account of the channel
    reward_account: Option<Option<AccountId>>,
    /// assets to be removed from channel
    assets_to_remove: BTreeSet<DataObjectId>,
    /// collaborator set
    collaborators: Option<BTreeSet<MemberId>>,
}

type ChannelUpdateParameters<T> = ChannelUpdateParametersRecord<
    StorageAssets<T>,
    <T as frame_system::Trait>::AccountId,
    DataObjectId<T>,
    <T as common::MembershipTypes>::MemberId,
>;

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

/// Information regarding the content being uploaded
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct StorageAssetsRecord<Balance> {
    /// Data object parameters.
    pub object_creation_list: Vec<DataObjectCreationParameters>,

    /// Expected data size fee value for this extrinsic call.
    pub expected_data_size_fee: Balance,
}

type StorageAssets<T> = StorageAssetsRecord<BalanceOf<T>>;

/// Information about the video being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct VideoCreationParametersRecord<StorageAssets> {
    /// Asset collection for the video
    assets: Option<StorageAssets>,
    /// Metadata for the video.
    meta: Option<Vec<u8>>,
    /// Comments enabled or not
    enable_comments: bool,
}

type VideoCreationParameters<T> = VideoCreationParametersRecord<StorageAssets<T>>;

/// Information about the video being updated
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoUpdateParametersRecord<StorageAssets, DataObjectId: Ord> {
    /// Assets referenced by metadata
    assets_to_upload: Option<StorageAssets>,
    /// If set, metadata update for the video.
    new_meta: Option<Vec<u8>>,
    /// video assets to be removed from channel
    assets_to_remove: BTreeSet<DataObjectId>,
    /// If set enable/disable comments to video
    enable_comments: Option<bool>,
}

type VideoUpdateParameters<T> = VideoUpdateParametersRecord<StorageAssets<T>, DataObjectId<T>>;

/// A video which belongs to a channel. A video may be part of a series or playlist.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoRecord<ChannelId, SeriesId, PostId> {
    pub in_channel: ChannelId,

    pub in_series: Option<SeriesId>,

    /// Whether the curators have censored the video or not.
    pub is_censored: bool,

    /// enable or not comments
    pub enable_comments: bool,

    /// First post to a video works as a description
    pub video_post_id: Option<PostId>,
}

pub type Video<T> =
    VideoRecord<<T as storage::Trait>::ChannelId, <T as Trait>::SeriesId, <T as Trait>::PostId>;

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
pub enum EpisodeParameters<VideoId, StorageAssets> {
    /// A new video is being added as the episode.
    NewVideo(VideoCreationParametersRecord<StorageAssets>),
    /// An existing video is being made into an episode.
    ExistingVideo(VideoId),
}

/// Information about the season being created or updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct SeasonParameters<VideoId, StorageAssets> {
    /// Season assets referenced by metadata
    assets: Option<StorageAssets>,
    // ?? It might just be more straighforward to always provide full list of episodes at cost of larger tx.
    /// If set, updates the episodes of a season. Extends the number of episodes in a season
    /// when length of new_episodes is greater than previously set. Last elements must all be
    /// 'Some' in that case.
    /// Will truncate existing season when length of new_episodes is less than previously set.
    episodes: Option<Vec<Option<EpisodeParameters<VideoId, StorageAssets>>>>,

    meta: Option<Vec<u8>>,
}

/// Information about the series being created or updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct SeriesParameters<VideoId, StorageAssets> {
    /// Series assets referenced by metadata
    assets: Option<StorageAssets>,
    // ?? It might just be more straighforward to always provide full list of seasons at cost of larger tx.
    /// If set, updates the seasons of a series. Extend a series when length of seasons is
    /// greater than previoulsy set. Last elements must all be 'Some' in that case.
    /// Will truncate existing series when length of seasons is less than previously set.
    seasons: Option<Vec<Option<SeasonParameters<VideoId, StorageAssets>>>>,
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

/// The actor the caller/origin is trying to act as for Person creation and update and delete calls.
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

/// Default trait implemented only because its used in Person which needs to implement a Default trait
/// since it is a StorageValue.
impl<MemberId: Default> Default for PersonController<MemberId> {
    fn default() -> Self {
        PersonController::Member(MemberId::default())
    }
}

/// Information for Person being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct PersonCreationParameters<StorageAssets> {
    /// Assets referenced by metadata
    assets: StorageAssets,
    /// Metadata for person.
    meta: Vec<u8>,
}

/// Information for Persion being updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PersonUpdateParameters<StorageAssets> {
    /// Assets referenced by metadata
    assets: Option<StorageAssets>,
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

type DataObjectId<T> = <T as storage::Trait>::DataObjectId;
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
    BalanceOf<T>,
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

/// Side used to construct hash values during merkle proof verification
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug)]
pub enum Side {
    Left,
    Right,
}

impl Default for Side {
    fn default() -> Self {
        Side::Right
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
/// Element used in for channel payout
pub struct ProofElementRecord<Hash, Side> {
    // Node hash
    hash: Hash,

    // side in which *self* must be adjoined during proof verification
    side: Side,
}

// alias for the proof element
pub type ProofElement<T> = ProofElementRecord<<T as frame_system::Trait>::Hash, Side>;

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
pub struct PostDeletionParametersRecord<HashOutput> {
    /// optional witnesses in case of video post deletion
    witness: Option<HashOutput>,
    /// rationale in case actor is moderator
    rationale: Option<Vec<u8>>,
}

pub type PostDeletionParameters<T> = PostDeletionParametersRecord<<T as frame_system::Trait>::Hash>;

/// Payment claim by a channel
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Copy, Clone, PartialEq, Eq, Debug)]
pub struct PullPaymentElement<ChannelId, Balance, Hash> {
    channel_id: ChannelId,
    cumulative_payout_claimed: Balance,
    reason: Hash,
}

pub type PullPayment<T> = PullPaymentElement<
    <T as storage::Trait>::ChannelId,
    BalanceOf<T>,
    <T as frame_system::Trait>::Hash,
>;

decl_storage! {
    trait Store for Module<T: Trait> as Content {
        pub ChannelById get(fn channel_by_id): map hasher(blake2_128_concat) T::ChannelId => Channel<T>;

        pub ChannelCategoryById get(fn channel_category_by_id):
        map hasher(blake2_128_concat) T::ChannelCategoryId => ChannelCategory;

        pub VideoById get(fn video_by_id): map hasher(blake2_128_concat) T::VideoId => Video<T>;

        pub VideoCategoryById get(fn video_category_by_id):
        map hasher(blake2_128_concat) T::VideoCategoryId => VideoCategory;

        pub PlaylistById get(fn playlist_by_id): map hasher(blake2_128_concat) T::PlaylistId => Playlist<T::ChannelId>;

        pub SeriesById get(fn series_by_id):
        map hasher(blake2_128_concat) T::SeriesId => Series<T::ChannelId, T::VideoId>;

        pub PersonById get(fn person_by_id):
        map hasher(blake2_128_concat) T::PersonId => Person<T::MemberId>;

        pub NextChannelCategoryId get(fn next_channel_category_id) config(): T::ChannelCategoryId;

        pub NextChannelId get(fn next_channel_id) config(): T::ChannelId;

        pub NextVideoCategoryId get(fn next_video_category_id) config(): T::VideoCategoryId;

        pub NextVideoId get(fn next_video_id) config(): T::VideoId;

        pub NextPlaylistId get(fn next_playlist_id) config(): T::PlaylistId;

        pub NextPersonId get(fn next_person_id) config(): T::PersonId;

        pub NextSeriesId get(fn next_series_id) config(): T::SeriesId;

        pub NextChannelOwnershipTransferRequestId get(fn next_channel_transfer_request_id) config():
        T::ChannelOwnershipTransferRequestId;

        pub NextCuratorGroupId get(fn next_curator_group_id) config(): T::CuratorGroupId;

        pub CuratorGroupById get(fn curator_group_by_id):
        map hasher(blake2_128_concat) T::CuratorGroupId => CuratorGroup<T>;

        pub PostById get(fn post_by_id) : double_map hasher(blake2_128_concat) T::VideoId,
        hasher(blake2_128_concat) T::PostId => Post<T>;

        pub NextPostId get(fn next_post_id) config(): T::PostId;

        pub VideoPostIdByVideoId get(fn video_post_by_video_id): map hasher(blake2_128_concat)
            T::VideoId => T::PostId;

        pub ChannelMigration get(fn channel_migration) config(): ChannelMigrationConfig<T>;

        pub VideoMigration get(fn video_migration) config(): VideoMigrationConfig<T>;

        pub Commitment get(fn commitment): <T as frame_system::Trait>::Hash;

        pub MaxRewardAllowed get(fn max_reward_allowed) config(): BalanceOf<T>;

        pub MinCashoutAllowed get(fn min_cashout_allowed) config(): BalanceOf<T>;

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

            let sender = ensure_signed(origin)?;
            // Ensure given origin is lead
            ensure_lead_auth_success::<T>(&sender)?;

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
            let sender = ensure_signed(origin)?;
            // Ensure given origin is lead
            ensure_lead_auth_success::<T>(&sender)?;


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
            let sender = ensure_signed(origin)?;
            // Ensure given origin is lead
            ensure_lead_auth_success::<T>(&sender)?;

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
            let sender = ensure_signed(origin)?;
            // Ensure given origin is lead
            ensure_lead_auth_success::<T>(&sender)?;

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

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_channel(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            params: ChannelCreationParameters<T>,
        ) {
            // ensure migration is done
            ensure!(Self::is_migration_done(), Error::<T>::MigrationNotFinished);

            // channel creator account
            let sender = ensure_signed(origin)?;

            ensure_actor_authorized_to_create_channel::<T>(
                &sender,
                &actor,
            )?;

            // The channel owner will be..
            let channel_owner = actor_to_channel_owner::<T>(&actor)?;

            // next channel id
            let channel_id = NextChannelId::<T>::get();

            // ensure collaborator member ids are valid
            Self::validate_member_set(&params.collaborators)?;

            let upload_params = params.assets.as_ref().map(|assets| {
                Self::construct_upload_parameters(
                    assets,
                    &channel_id,
                    &sender
                )});

            let channel_bag_id = Self::bag_id_for_channel(&channel_id);

            let deletion_prize = storage::DynamicBagDeletionPrize::<T> {
                prize: Zero::zero(), // put 0 for Giza release
                account_id: sender.clone(),
            };

            if Storage::<T>::ensure_bag_exists(&channel_bag_id).is_err() {
                if let Some(params) = upload_params.clone() {
                    Storage::<T>::can_create_dynamic_bag_with_objects_constraints(
                        &DynamicBagIdType::<T::MemberId, T::ChannelId>::Channel(channel_id),
                        &Some(deletion_prize.clone()),
                        &params
                    )?;
                } else {
                    Storage::<T>::can_create_dynamic_bag(
                        &DynamicBagIdType::<T::MemberId, T::ChannelId>::Channel(channel_id),
                        &Some(deletion_prize.clone()),
                    )?;
                }
            }

            //
            // == MUTATION SAFE ==
            //

            if Storage::<T>::ensure_bag_exists(&channel_bag_id).is_err() {
                if let Some(params) = upload_params.clone() {
                    Storage::<T>::create_dynamic_bag_with_objects_constraints(
                        DynamicBagIdType::<T::MemberId, T::ChannelId>::Channel(channel_id),
                        Some(deletion_prize),
                        params,
                    )?;
                    // create_dynamic_bag_with_objects with its can* guard ensures that this invocation succeds
                } else {
                    Storage::<T>::create_dynamic_bag(
                        DynamicBagIdType::<T::MemberId, T::ChannelId>::Channel(channel_id),
                        Some(deletion_prize),
                    )?;
                }
            }

            // this will not fail because can_create_dynamic_bag_with_objects_constraints will check also for successful upload conditions
            if let Some(params) = upload_params.clone() {
                Storage::<T>::upload_data_objects(params)?;
            }

            // Only increment next channel id if adding content was successful
            NextChannelId::<T>::mutate(|id| *id += T::ChannelId::one());

            // channel creation
            let channel: Channel<T> = ChannelRecord {
                owner: channel_owner,
                num_videos: 0u64,
                is_censored: false,
                reward_account: params.reward_account.clone(),
                collaborators: params.collaborators.clone(),
                moderator_set: params.moderator_set.clone(),
                cumulative_payout_earned: BalanceOf::<T>::zero(),
            };

            // add channel to onchain state
            ChannelById::<T>::insert(channel_id, channel.clone());

            Self::deposit_event(RawEvent::ChannelCreated(actor, channel_id, channel, params));
        }

        // Include Option<AccountId> in ChannelUpdateParameters to update reward_account
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_channel(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            params: ChannelUpdateParameters<T>,
        ) {
            let sender = ensure_signed(origin)?;

            // check that channel exists
            let mut channel = Self::ensure_channel_validity(&channel_id)?;

            ensure_actor_authorized_to_update_channel_assets::<T>(
                &sender,
                &actor,
                &channel,
            )?;

            // maybe update the reward account if actor is not a collaborator
            if let Some(reward_account) = params.reward_account.as_ref() {
                ensure_actor_can_manage_reward_account::<T>(&sender, &channel.owner, &actor)?;
                channel.reward_account = reward_account.clone();
            }

            // update collaborator set if actor is not a collaborator
            if let Some(new_collabs) = params.collaborators.as_ref() {
                ensure_actor_can_manage_collaborators::<T>(&sender, &channel.owner, &actor)?;
                // ensure collaborator member ids are valid
                Self::validate_member_set(new_collabs)?;

                channel.collaborators = new_collabs.clone();
            }

            if let Some(upload_assets) = params.assets_to_upload.as_ref() {
                let params = Self::construct_upload_parameters(
                    upload_assets,
                    &channel_id,
                    &sender
                );

                Storage::<T>::can_upload_data_objects(&params)?;
            }

            if !params.assets_to_remove.is_empty() {
                Storage::<T>::can_delete_data_objects(
                    &Self::bag_id_for_channel(&channel_id),
                    &params.assets_to_remove
                )?;
            }

            //
            // == MUTATION SAFE ==
            //

            if let Some(upload_assets) = params.assets_to_upload.as_ref() {
                let params = Self::construct_upload_parameters(
                    upload_assets,
                    &channel_id,
                    &sender
                );

                Storage::<T>::upload_data_objects(params.clone())?;
            }

            if !params.assets_to_remove.is_empty() {
                Storage::<T>::delete_data_objects(
                    sender,
                    Self::bag_id_for_channel(&channel_id),
                    params.assets_to_remove.clone()
                )?;
            }

            // Update the channel
            ChannelById::<T>::insert(channel_id, channel.clone());

            Self::deposit_event(RawEvent::ChannelUpdated(actor, channel_id, channel, params));
        }

        // extrinsics for channel deletion
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_channel(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            channel_id: T::ChannelId,
            num_objects_to_delete: u64,
        ) -> DispatchResult {

            let sender = ensure_signed(origin)?;
            // check that channel exists
            let channel = Self::ensure_channel_validity(&channel_id)?;

            ensure_actor_authorized_to_delete_channel::<T>(
                &sender,
                &actor,
                &channel.owner,
            )?;

            // check that channel videos are 0
            ensure!(channel.num_videos == 0, Error::<T>::ChannelContainsVideos);

            // get bag id for the channel
            let dyn_bag = DynamicBagIdType::<T::MemberId, T::ChannelId>::Channel(channel_id);
            let bag_id = storage::BagIdType::from(dyn_bag.clone());

            // channel has a dynamic bag associated to it -> remove assets from storage
            if let Ok(bag) = T::DataObjectStorage::ensure_bag_exists(&bag_id) {
                // ensure that bag size provided is valid
                ensure!(
                    bag.objects_number == num_objects_to_delete,
                    Error::<T>::InvalidBagSizeSpecified
                );

                // construct collection of assets to be removed
                let assets_to_remove = T::DataObjectStorage::get_data_objects_id(&bag_id);

                if !assets_to_remove.is_empty() {
                    Storage::<T>::can_delete_dynamic_bag_with_objects(
                        &dyn_bag,
                    )?;

                    Storage::<T>::can_delete_data_objects(
                        &bag_id,
                        &assets_to_remove,
                    )?;
                } else {
                    Storage::<T>::can_delete_dynamic_bag(
                        &dyn_bag,
                    )?;
                }

                //
                // == MUTATION SAFE ==
                //

                // remove specified assets from storage
                if !assets_to_remove.is_empty() {
                    Storage::<T>::delete_data_objects(
                        sender.clone(),
                        Self::bag_id_for_channel(&channel_id),
                        assets_to_remove.clone(),
                    )?;
                }

                // delete channel dynamic bag
                Storage::<T>::delete_dynamic_bag(
                    sender,
                    dyn_bag,
                )?;
            }

            // remove channel from on chain state
            ChannelById::<T>::remove(channel_id);

            // deposit event
            Self::deposit_event(RawEvent::ChannelDeleted(actor, channel_id));

            Ok(())
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
            let channel = Self::ensure_channel_validity(&channel_id)?;

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

            ChannelById::<T>::mutate(channel_id, |channel| {
                channel.is_censored = is_censored
            });

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
            params: VideoCreationParameters<T>,
        ) {
            let sender = ensure_signed(origin.clone())?;

            // check that channel exists
            let channel = Self::ensure_channel_validity(&channel_id)?;

            ensure_actor_authorized_to_update_channel_assets::<T>(
                &sender,
                &actor,
                &channel,
            )?;

            // next video id
            let video_id = NextVideoId::<T>::get();

            //
            // == MUTATION SAFE ==
            //

            // upload to storage: check is performed beforehand in the extrinsics so storage state won't be endangered
            if let Some(upload_assets) = params.assets.as_ref() {
                let params = Self::construct_upload_parameters(
                    upload_assets,
                    &channel_id,
                    &sender
                );
                Storage::<T>::upload_data_objects(params)?;
            }

            // create the video struct
            let video: Video<T> = VideoRecord {
                in_channel: channel_id,
                in_series: None,
                is_censored: false,
                enable_comments: params.enable_comments,
                video_post_id:  None,
            };

            // add it to the onchain state
            VideoById::<T>::insert(video_id, video);

            // Only increment next video id
            NextVideoId::<T>::mutate(|id| *id += T::VideoId::one());

            // Add recently added video id to the channel

            ChannelById::<T>::mutate(channel_id, |channel| {
                channel.num_videos = channel.num_videos.saturating_add(1);
            });

            Self::deposit_event(RawEvent::VideoCreated(actor, channel_id, video_id, params));

        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_video(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            params: VideoUpdateParameters<T>,
        ) {
            let sender = ensure_signed(origin.clone())?;
            // check that video exists, retrieve corresponding channel id.
            let video = Self::ensure_video_validity(&video_id)?;

            let channel_id = video.in_channel;
            let channel = ChannelById::<T>::get(&channel_id);

            // Check for permission to update channel assets
            ensure_actor_authorized_to_update_channel_assets::<T>(
                &sender,
                &actor,
                &channel,
            )?;

            if let Some(upload_assets) = params.assets_to_upload.as_ref() {
                let params = Self::construct_upload_parameters(
                    upload_assets,
                    &channel_id,
                    &sender
                );
                Storage::<T>::can_upload_data_objects(&params)?;
            }

            if !params.assets_to_remove.is_empty() {
                Storage::<T>::can_delete_data_objects(
                    &Self::bag_id_for_channel(&channel_id),
                    &params.assets_to_remove,
                )?;
            }

            //
            // == MUTATION SAFE ==
            //

            if let Some(upload_assets) = params.assets_to_upload.as_ref() {
                let params = Self::construct_upload_parameters(
                    upload_assets,
                    &channel_id,
                    &sender
                );
                Storage::<T>::upload_data_objects(params)?;
            }

            if !params.assets_to_remove.is_empty() {
                Storage::<T>::delete_data_objects(
                    sender,
                    Self::bag_id_for_channel(&channel_id),
                    params.assets_to_remove.clone(),
                )?;
            }

            Self::deposit_event(RawEvent::VideoUpdated(actor, video_id, params));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn delete_video(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            video_id: T::VideoId,
            assets_to_remove: BTreeSet<DataObjectId<T>>,
        ) {
            let sender = ensure_signed(origin.clone())?;

            // check that video exists
            let video = Self::ensure_video_validity(&video_id)?;

            // get information regarding channel
            let channel_id = video.in_channel;
            let channel = ChannelById::<T>::get(channel_id);

            ensure_actor_authorized_to_update_channel_assets::<T>(
                &sender,
                &actor,
                &channel,
            )?;

            // ensure video can be removed
            Self::ensure_video_can_be_removed(&video)?;

            if !assets_to_remove.is_empty() {
                Storage::<T>::can_delete_data_objects(
                    &Self::bag_id_for_channel(&channel_id),
                    &assets_to_remove,
                )?;
            }

            // bloat bond logic: channel owner is refunded
            video.video_post_id.as_ref().map(
                |video_post_id| Self::video_deletion_refund_logic(&sender, &video_id, &video_post_id)
            ).transpose()?;

            //
            // == MUTATION SAFE ==
            //

            if !assets_to_remove.is_empty() {
                Storage::<T>::delete_data_objects(
                    sender,
                    Self::bag_id_for_channel(&channel_id),
                    assets_to_remove.clone()
                )?;
            }

            // Remove video
            VideoById::<T>::remove(video_id);

            // Remove all comments related
            <PostById<T>>::remove_prefix(video_id);

            // Update corresponding channel
            // Remove recently deleted video from the channel
            ChannelById::<T>::mutate(channel_id, |channel| {
                channel.num_videos = channel.num_videos.saturating_sub(1)
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
            _params: PersonCreationParameters<StorageAssets<T>>,
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_person(
            _origin,
            _actor: PersonActor<T::MemberId, T::CuratorId>,
            _person: T::PersonId,
            _params: PersonUpdateParameters<StorageAssets<T>>,
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
            let video = Self::ensure_video_validity(&video_id)?;

            ensure_actor_authorized_to_censor::<T>(
                origin,
                &actor,
                // The channel owner will be..
                &Self::channel_by_id(video.in_channel).owner,
            )?;

            //
            // == MUTATION SAFE ==
            //

            // update
            VideoById::<T>::mutate(video_id, |video| {
                video.is_censored = is_censored;
            });

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
            _params: SeriesParameters<T::VideoId, StorageAssets<T>>
        ) {
            Self::not_implemented()?;
        }

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn update_series(
            _origin,
            _actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            _channel_id: T::ChannelId,
            _params: SeriesParameters<T::VideoId, StorageAssets<T>>
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
            let video = Self::ensure_video_validity(&params.video_reference)?;
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

            ensure!(
                Balances::<T>::usable_balance(&sender) >= initial_bloat_bond,
                Error::<T>::UnsufficientBalance,
            );
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
            Self::deposit_event(RawEvent::PostCreated(post, post_id));

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
            params: PostDeletionParameters<T>,
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
                    ensure_actor_authorized_to_remove_video_post::<T>(&sender, &actor, &channel)?;
                    CleanupActor::PostAuthor
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

            ensure!(
                ContentTreasury::<T>::usable_balance() >= post.bloat_bond,
                Error::<T>::InsufficientTreasuryBalance,
            );

            //
            // == MUTATION_SAFE ==
            //

            Self::refund(&sender, cleanup_actor, post.bloat_bond.clone())?;

            match post.post_type {
                PostType::<T>::Comment(parent_id) => {
                    PostById::<T>::remove(&video_id, &post_id);
                    // parent post might have been already deleted
                    if let Ok(mut parent_post) = Self::ensure_post_exists(
                        video_id.clone(),
                        parent_id.clone(),
                    ){
                        parent_post.replies_count =
                            parent_post.replies_count.saturating_sub(T::PostId::one());
                        PostById::<T>::insert(&video_id, &parent_id, parent_post);
                    }
                }
                PostType::<T>::VideoPost => PostById::<T>::remove_prefix(&video_id),
            }

            // deposit event
            Self::deposit_event(
                RawEvent::PostDeleted(
                    post,
                    post_id,
                    actor,
                ));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        fn react_to_post(
            origin,
            member_id: T::MemberId,
            video_id: T::VideoId,
            post_id: T::PostId,
            reaction_id: T::ReactionId,
        ) {
            // post existence verification purposely avoided
            let sender = ensure_signed(origin)?;
            ensure_member_auth_success::<T>(&sender, &member_id)?;

            //
            // == MUTATION_SAFE ==
            //

            Self::deposit_event(RawEvent::ReactionToPost(member_id, video_id, post_id, reaction_id));
        }

        #[weight = 10_000_000] // TODO: adjust weight
        fn react_to_video(
            origin,
            member_id: T::MemberId,
            video_id: T::VideoId,
            reaction_id: T::ReactionId,
        ) {
            // video existence verification purposely avoided
            let sender = ensure_signed(origin)?;
            ensure_member_auth_success::<T>(&sender, &member_id)?;

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
            let sender = ensure_signed(origin)?;
            let owner = Self::ensure_channel_validity(&channel_id)?.owner;

            ensure_actor_can_manage_moderators::<T>(
                &sender,
                &owner,
                &actor,
            )?;

            Self::validate_member_set(&new_moderator_set)?;

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

        fn on_initialize(_n: T::BlockNumber) -> frame_support::weights::Weight {
            Self::perform_video_migration();
            Self::perform_channel_migration();
            10_000_000 // TODO: adjust Weight
        }

        #[weight = 10_000_000] // TODO: adjust Weight
        pub fn update_commitment(
            origin,
            new_commitment: <T as frame_system::Trait>::Hash,
        ) {
            let sender = ensure_signed(origin)?;
            ensure_authorized_to_update_commitment::<T>(&sender)?;

            <Commitment<T>>::put(new_commitment);
            Self::deposit_event(RawEvent::CommitmentUpdated(new_commitment));
        }

        #[weight = 10_000_000] // TODO: adjust Weight
        pub fn claim_channel_reward(
            origin,
            actor: ContentActor<T::CuratorGroupId, T::CuratorId, T::MemberId>,
            proof: Vec<ProofElement<T>>,
            item: PullPayment<T>,
        ) -> DispatchResult {
            let channel = Self::ensure_channel_validity(&item.channel_id)?;

            ensure!(channel.reward_account.is_some(), Error::<T>::RewardAccountNotFoundInChannel);
            ensure_actor_authorized_to_claim_payment::<T>(origin, &actor, &channel.owner)?;

            let cashout = item
                .cumulative_payout_claimed
                .saturating_sub(channel.cumulative_payout_earned);

            ensure!(
                <MaxRewardAllowed<T>>::get() > item.cumulative_payout_claimed,
                Error::<T>::TotalRewardLimitExceeded
            );
            ensure!(<MinCashoutAllowed<T>>::get() < cashout, Error::<T>::UnsufficientCashoutAmount);
            Self::verify_proof(&proof, &item)?;

            //
            // == MUTATION SAFE ==
            //

            Self::transfer_reward(cashout, &channel.reward_account.unwrap());
            ChannelById::<T>::mutate(
                &item.channel_id,
                |channel| channel.cumulative_payout_earned =
                    channel.cumulative_payout_earned.saturating_add(item.cumulative_payout_claimed)
            );

            Self::deposit_event(RawEvent::ChannelRewardUpdated(item.cumulative_payout_claimed, item.channel_id));

            Ok(())
        }

        #[weight = 10_000_000] // TODO: adjust Weight
        pub fn update_max_reward_allowed(origin, amount: BalanceOf<T>) {
            let sender = ensure_signed(origin)?;
            ensure_authorized_to_update_max_reward::<T>(&sender)?;
            <MaxRewardAllowed<T>>::put(amount);
            Self::deposit_event(RawEvent::MaxRewardUpdated(amount));
        }

        #[weight = 10_000_000] // TODO: adjust Weight
        pub fn update_min_cashout_allowed(origin, amount: BalanceOf<T>) {
            let sender = ensure_signed(origin)?;
            ensure_authorized_to_update_min_cashout::<T>(&sender)?;
            <MinCashoutAllowed<T>>::put(amount);
            Self::deposit_event(RawEvent::MinCashoutUpdated(amount));
        }
    }
}

impl<T: Trait> Module<T> {
    /// Migrate Videos
    fn perform_video_migration() {
        let MigrationConfigRecord {
            current_id,
            final_id,
        } = <VideoMigration<T>>::get();

        if current_id < final_id {
            // perform migration procedure
            let next_id = sp_std::cmp::min(
                current_id + T::VideosMigrationsEachBlock::get().into(),
                final_id,
            );

            //
            // == MUTATION SAFE ==
            //

            // clear maps: (iterator are lazy and do nothing unless consumed)
            for id in current_id.into()..next_id.into() {
                <VideoById<T>>::remove(T::VideoId::from(id));
            }

            // edit the current id
            <VideoMigration<T>>::mutate(|value| value.current_id = next_id);
        }
    }

    /// Migrate Channels
    fn perform_channel_migration() {
        let MigrationConfigRecord {
            current_id,
            final_id,
        } = <ChannelMigration<T>>::get();

        if current_id < final_id {
            // perform migration procedure
            let next_id = sp_std::cmp::min(
                current_id + T::ChannelsMigrationsEachBlock::get().into(),
                final_id,
            );

            //
            // == MUTATION SAFE ==
            //

            // clear maps: (iterator are lazy and do nothing unless consumed)
            for id in current_id.into()..next_id.into() {
                <ChannelById<T>>::remove(T::ChannelId::from(id));
            }

            // edit the current id
            <ChannelMigration<T>>::mutate(|value| value.current_id = next_id);
        }
    }

    /// Ensure Channel Migration Finished

    /// Ensure Video Migration Finished
    fn is_migration_done() -> bool {
        let MigrationConfigRecord {
            current_id,
            final_id,
        } = <VideoMigration<T>>::get();

        let video_migration_done = current_id == final_id;

        let MigrationConfigRecord {
            current_id,
            final_id,
        } = <ChannelMigration<T>>::get();

        let channel_migration_done = current_id == final_id;

        return video_migration_done && channel_migration_done;
    }

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

    fn ensure_channel_validity(channel_id: &T::ChannelId) -> Result<Channel<T>, Error<T>> {
        // ensure migration is done
        ensure!(Self::is_migration_done(), Error::<T>::MigrationNotFinished,);

        // ensure channel exists
        ensure!(
            ChannelById::<T>::contains_key(channel_id),
            Error::<T>::ChannelDoesNotExist
        );
        Ok(ChannelById::<T>::get(channel_id))
    }

    fn ensure_video_validity(video_id: &T::VideoId) -> Result<Video<T>, Error<T>> {
        // ensure migration is done
        ensure!(Self::is_migration_done(), Error::<T>::MigrationNotFinished,);

        // ensure video exists
        ensure!(
            VideoById::<T>::contains_key(video_id),
            Error::<T>::VideoDoesNotExist
        );
        Ok(VideoById::<T>::get(video_id))
    }

    // Ensure given video is not in season
    fn ensure_video_can_be_removed(video: &Video<T>) -> DispatchResult {
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

                if bloat_bond > cap {
                    let diff = bloat_bond.saturating_sub(cap);
                    ContentTreasury::<T>::withdraw(sender, cap)?;
                    let _ = balances::Module::<T>::burn(diff);
                } else {
                    ContentTreasury::<T>::withdraw(sender, bloat_bond)?;
                }
            }
            _ => {
                let _ = balances::Module::<T>::burn(bloat_bond);
            }
        }
        Ok(())
    }

    fn bag_id_for_channel(channel_id: &T::ChannelId) -> storage::BagId<T> {
        // retrieve bag id from channel id
        let dyn_bag = DynamicBagIdType::<T::MemberId, T::ChannelId>::Channel(*channel_id);
        BagIdType::from(dyn_bag)
    }

    fn video_deletion_refund_logic(
        sender: &T::AccountId,
        video_id: &T::VideoId,
        video_post_id: &T::PostId,
    ) -> DispatchResult {
        let bloat_bond = <PostById<T>>::get(video_id, video_post_id).bloat_bond;
        Self::refund(&sender, CleanupActor::PostAuthor, bloat_bond)?;
        Ok(())
    }

    fn compute_initial_bloat_bond() -> BalanceOf<T> {
        let storage_price =
            T::PricePerByte::get().saturating_mul((size_of::<Post<T>>() as u32).into());

        let cleanup_cost = T::CleanupCost::get().saturating_add(T::CleanupMargin::get());

        max(storage_price, cleanup_cost)
    }

    fn transfer_reward(_reward: BalanceOf<T>, _address: &<T as frame_system::Trait>::AccountId) {}

    // If we are trying to delete a video post we need witness verification
    fn ensure_witness_verification(
        witness: Option<<T as frame_system::Trait>::Hash>,
        replies_count: T::PostId,
    ) -> DispatchResult {
        let wit_hash = witness.ok_or(Error::<T>::WitnessNotProvided)?;
        ensure!(
            <T as frame_system::Trait>::Hashing::hash_of(&replies_count) == wit_hash,
            Error::<T>::WitnessVerificationFailed,
        );
        Ok(())
    }

    // construct parameters to be upload to storage
    fn construct_upload_parameters(
        assets: &StorageAssets<T>,
        channel_id: &T::ChannelId,
        prize_source_account: &T::AccountId,
    ) -> UploadParameters<T> {
        UploadParameters::<T> {
            bag_id: Self::bag_id_for_channel(channel_id),
            object_creation_list: assets.object_creation_list.clone(),
            deletion_prize_source_account_id: prize_source_account.clone(),
            expected_data_size_fee: assets.expected_data_size_fee,
        }
    }

    fn validate_member_set(members: &BTreeSet<T::MemberId>) -> DispatchResult {
        // check if all members are valid
        let res = members
            .iter()
            .all(|member_id| <T as ContentActorAuthenticator>::validate_member_id(member_id));
        ensure!(res, Error::<T>::InvalidMemberProvided);
        Ok(())
    }

    fn verify_proof(proof: &[ProofElement<T>], item: &PullPayment<T>) -> DispatchResult {
        let candidate_root = proof.iter().fold(
            <T as frame_system::Trait>::Hashing::hash_of(item),
            |hash_v, el| match el.side {
                Side::Right => <T as frame_system::Trait>::Hashing::hash_of(&[hash_v, el.hash]),
                Side::Left => <T as frame_system::Trait>::Hashing::hash_of(&[el.hash, hash_v]),
            },
        );
        ensure!(
            candidate_root == Commitment::<T>::get(),
            Error::<T>::PaymentProofVerificationFailed
        );

        Ok(())
    }

    // Reset Videos and Channels on runtime upgrade but preserving next ids and categories.
    pub fn on_runtime_upgrade() {
        // setting final index triggers migration
        <VideoMigration<T>>::mutate(|config| config.final_id = <NextVideoId<T>>::get());
        <ChannelMigration<T>>::mutate(|config| config.final_id = <NextChannelId<T>>::get());
    }
}

decl_event!(
    pub enum Event<T>
    where
        ContentActor = ContentActor<
            <T as ContentActorAuthenticator>::CuratorGroupId,
            <T as ContentActorAuthenticator>::CuratorId,
            <T as common::MembershipTypes>::MemberId,
        >,
        CuratorGroupId = <T as ContentActorAuthenticator>::CuratorGroupId,
        CuratorId = <T as ContentActorAuthenticator>::CuratorId,
        VideoId = <T as Trait>::VideoId,
        VideoCategoryId = <T as Trait>::VideoCategoryId,
        ChannelId = <T as storage::Trait>::ChannelId,
        ChannelCategoryId = <T as Trait>::ChannelCategoryId,
        ChannelOwnershipTransferRequestId = <T as Trait>::ChannelOwnershipTransferRequestId,
        PlaylistId = <T as Trait>::PlaylistId,
        SeriesId = <T as Trait>::SeriesId,
        PersonId = <T as Trait>::PersonId,
        ChannelOwnershipTransferRequest = ChannelOwnershipTransferRequest<T>,
        Series = Series<<T as storage::Trait>::ChannelId, <T as Trait>::VideoId>,
        Channel = Channel<T>,
        DataObjectId = DataObjectId<T>,
        IsCensored = bool,
        ChannelCreationParameters = ChannelCreationParameters<T>,
        ChannelUpdateParameters = ChannelUpdateParameters<T>,
        VideoCreationParameters = VideoCreationParameters<T>,
        VideoUpdateParameters = VideoUpdateParameters<T>,
        StorageAssets = StorageAssets<T>,
        Post = Post<T>,
        PostId = <T as Trait>::PostId,
        MemberId = <T as MembershipTypes>::MemberId,
        ReactionId = <T as Trait>::ReactionId,
        ModeratorSet = BTreeSet<<T as MembershipTypes>::MemberId>,
        Hash = <T as frame_system::Trait>::Hash,
        Balance = BalanceOf<T>,
    {
        // Curators
        CuratorGroupCreated(CuratorGroupId),
        CuratorGroupStatusSet(CuratorGroupId, bool /* active status */),
        CuratorAdded(CuratorGroupId, CuratorId),
        CuratorRemoved(CuratorGroupId, CuratorId),

        // Channels
        ChannelCreated(ContentActor, ChannelId, Channel, ChannelCreationParameters),
        ChannelUpdated(ContentActor, ChannelId, Channel, ChannelUpdateParameters),
        ChannelAssetsRemoved(ContentActor, ChannelId, BTreeSet<DataObjectId>, Channel),

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

        VideoCreated(ContentActor, ChannelId, VideoId, VideoCreationParameters),
        VideoUpdated(ContentActor, VideoId, VideoUpdateParameters),
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
            StorageAssets,
            SeriesParameters<VideoId, StorageAssets>,
            Series,
        ),
        SeriesUpdated(
            ContentActor,
            SeriesId,
            StorageAssets,
            SeriesParameters<VideoId, StorageAssets>,
            Series,
        ),
        SeriesDeleted(ContentActor, SeriesId),

        // Persons
        PersonCreated(
            ContentActor,
            PersonId,
            StorageAssets,
            PersonCreationParameters<StorageAssets>,
        ),
        PersonUpdated(
            ContentActor,
            PersonId,
            StorageAssets,
            PersonUpdateParameters<StorageAssets>,
        ),
        PersonDeleted(ContentActor, PersonId),
        ChannelDeleted(ContentActor, ChannelId),

        // Posts & Replies
        PostCreated(Post, PostId),
        PostTextUpdated(ContentActor, Vec<u8>, PostId, VideoId),
        PostDeleted(Post, PostId, ContentActor),
        ReactionToPost(MemberId, VideoId, PostId, ReactionId),
        ReactionToVideo(MemberId, VideoId, ReactionId),
        ModeratorSetUpdated(ChannelId, ModeratorSet),

        // Rewards
        CommitmentUpdated(Hash),
        ChannelRewardUpdated(Balance, ChannelId),
        MaxRewardUpdated(Balance),
        MinCashoutUpdated(Balance),
    }
);
