use crate::*;

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

pub type VideoMigrationConfig<T> = MigrationConfigRecord<<T as Trait>::VideoId>;
pub type ChannelMigrationConfig<T> = MigrationConfigRecord<<T as storage::Trait>::ChannelId>;

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
pub struct ChannelRecord<
    MemberId: Ord + PartialEq,
    CuratorGroupId: PartialEq,
    Balance: PartialEq,
    ChannelPrivilegeLevel,
> {
    /// The owner of a channel
    pub owner: ChannelOwner<MemberId, CuratorGroupId>,
    /// The videos under this channel
    pub num_videos: u64,
    /// collaborator set
    pub collaborators: BTreeSet<MemberId>,
    /// moderator set
    pub moderators: BTreeSet<MemberId>,
    /// Cumulative cashout
    pub cumulative_payout_earned: Balance,
    // Privilege level (curators will have different moderation permissions w.r.t. this channel depending on this value)
    pub privilege_level: ChannelPrivilegeLevel,
    // List of channel features that have been paused by a curator
    pub paused_features: BTreeSet<PausableChannelFeature>,
    /// Transfer status of the channel. Requires to be explicitly accepted.
    pub transfer_status: ChannelTransferStatus<MemberId, CuratorGroupId, Balance>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
/// Defines whether a channel is being transferred. No transfer by the default.
pub enum ChannelTransferStatus<
    MemberId: Ord + PartialEq,
    CuratorGroupId: PartialEq,
    Balance: PartialEq,
> {
    /// Default transfer status: no pending tranfers.
    NoActiveTransfer,

    /// There is ongoing transfer with parameters.
    PendingTransfer(PendingTransfer<MemberId, CuratorGroupId, Balance>),
}

impl<MemberId: Ord + PartialEq, CuratorGroupId: PartialEq, Balance: PartialEq> Default
    for ChannelTransferStatus<MemberId, CuratorGroupId, Balance>
{
    fn default() -> Self {
        ChannelTransferStatus::NoActiveTransfer
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
/// Contains parameters for the pending transfer.
pub struct PendingTransfer<MemberId: Ord, CuratorGroupId, Balance> {
    /// New channel owner.
    pub new_owner: ChannelOwner<MemberId, CuratorGroupId>,
    /// Transfer parameters.
    pub transfer_params: TransferParameters<MemberId, Balance>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
/// Contains parameters for the pending transfer.
pub struct TransferParameters<MemberId: Ord, Balance> {
    /// New set of the channel's collaborators.
    pub new_collaborators: BTreeSet<MemberId>,
    /// Transfer price: can be 0, which means free.
    pub price: Balance,
}

impl<
        MemberId: Ord + PartialEq,
        CuratorGroupId: PartialEq,
        Balance: PartialEq,
        ChannelPrivilegeLevel,
    > ChannelRecord<MemberId, CuratorGroupId, Balance, ChannelPrivilegeLevel>
{
    pub fn ensure_feature_not_paused<T: Trait>(
        &self,
        channel_feautre: PausableChannelFeature,
    ) -> DispatchResult {
        ensure!(
            !self.paused_features.contains(&channel_feautre),
            Error::<T>::ChannelFeaturePaused
        );
        Ok(())
    }

    /// Ensures that the channel has no active transfers.
    pub fn ensure_has_no_active_transfer<T: Trait>(&self) -> DispatchResult {
        ensure!(
            !self.has_active_transfer(),
            Error::<T>::InvalidChannelTransferStatus
        );

        Ok(())
    }

    // Defines whether the channel has ongoing transfer.
    fn has_active_transfer(&self) -> bool {
        self.transfer_status != ChannelTransferStatus::NoActiveTransfer
    }
}

// Channel alias type for simplification.
pub type Channel<T> = ChannelRecord<
    <T as common::MembershipTypes>::MemberId,
    <T as ContentActorAuthenticator>::CuratorGroupId,
    BalanceOf<T>,
    <T as Trait>::ChannelPrivilegeLevel,
>;

/// A request to buy a channel by a new ChannelOwner.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelOwnershipTransferRequestRecord<ChannelId, MemberId, CuratorGroupId, Balance> {
    pub channel_id: ChannelId,
    pub new_owner: ChannelOwner<MemberId, CuratorGroupId>,
    pub payment: Balance,
}

// ChannelOwnershipTransferRequest type alias for simplification.
pub type ChannelOwnershipTransferRequest<T> = ChannelOwnershipTransferRequestRecord<
    <T as storage::Trait>::ChannelId,
    <T as common::MembershipTypes>::MemberId,
    <T as ContentActorAuthenticator>::CuratorGroupId,
    BalanceOf<T>,
>;

/// Information about channel being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct ChannelCreationParametersRecord<StorageAssets, MemberId: Ord, Balance> {
    /// Assets referenced by metadata
    pub assets: Option<StorageAssets>,
    /// Metadata about the channel.
    pub meta: Option<Vec<u8>>,
    /// initial collaborator set
    pub collaborators: BTreeSet<MemberId>,
    /// initial moderator set
    pub moderators: BTreeSet<MemberId>,
    /// Commitment for the dynamic bag deletion prize for the storage pallet.
    pub expected_dynamic_bag_deletion_prize: Balance,
    /// Commitment for the data object deletion prize for the storage pallet.
    pub expected_data_object_deletion_prize: Balance,
}

pub type ChannelCreationParameters<T> = ChannelCreationParametersRecord<
    StorageAssets<T>,
    <T as common::MembershipTypes>::MemberId,
    BalanceOf<T>,
>;

/// Information about channel being updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelUpdateParametersRecord<StorageAssets, DataObjectId: Ord, MemberId: Ord, Balance> {
    /// Asset collection for the channel, referenced by metadata
    pub assets_to_upload: Option<StorageAssets>,
    /// If set, metadata update for the channel.
    pub new_meta: Option<Vec<u8>>,
    /// assets to be removed from channel
    pub assets_to_remove: BTreeSet<DataObjectId>,
    /// collaborator set
    pub collaborators: Option<BTreeSet<MemberId>>,
    /// Commitment for the data object deletion prize for the storage pallet.
    pub expected_data_object_deletion_prize: Balance,
}

pub type ChannelUpdateParameters<T> = ChannelUpdateParametersRecord<
    StorageAssets<T>,
    DataObjectId<T>,
    <T as common::MembershipTypes>::MemberId,
    BalanceOf<T>,
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
#[derive(Encode, Decode, Clone, Default, PartialEq, Eq, Debug)]
pub struct StorageAssetsRecord<Balance> {
    /// Data object parameters.
    pub object_creation_list: Vec<DataObjectCreationParameters>,

    /// Expected data size fee value for this extrinsic call.
    pub expected_data_size_fee: Balance,
}

pub type StorageAssets<T> = StorageAssetsRecord<BalanceOf<T>>;

/// Information about the video being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct VideoCreationParametersRecord<StorageAssets, NftIssuanceParameters, Balance> {
    /// Asset collection for the video
    pub assets: Option<StorageAssets>,
    /// Metadata for the video.
    pub meta: Option<Vec<u8>>,
    /// Comments enabled or not
    pub enable_comments: bool,
    /// Parameters for issuing video Nft
    pub auto_issue_nft: Option<NftIssuanceParameters>,
    /// Commitment for the data object deletion prize for the storage pallet.
    pub expected_data_object_deletion_prize: Balance,
}

pub type VideoCreationParameters<T> =
    VideoCreationParametersRecord<StorageAssets<T>, NftIssuanceParameters<T>, BalanceOf<T>>;

/// Information about the video being updated
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoUpdateParametersRecord<
    StorageAssets,
    DataObjectId: Ord,
    NftIssuanceParameters,
    Balance,
> {
    /// Assets referenced by metadata
    pub assets_to_upload: Option<StorageAssets>,
    /// If set, metadata update for the video.
    pub new_meta: Option<Vec<u8>>,
    /// video assets to be removed from channel
    pub assets_to_remove: BTreeSet<DataObjectId>,
    /// If set enable/disable comments to video
    pub enable_comments: Option<bool>,
    /// Parameters for updating Nft along with video
    pub auto_issue_nft: Option<NftIssuanceParameters>,
    /// Commitment for the data object deletion prize for the storage pallet.
    pub expected_data_object_deletion_prize: Balance,
}

pub type VideoUpdateParameters<T> = VideoUpdateParametersRecord<
    StorageAssets<T>,
    DataObjectId<T>,
    NftIssuanceParameters<T>,
    BalanceOf<T>,
>;

/// A video which belongs to a channel. A video may be part of a series or playlist.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoRecord<ChannelId, VideoPostId, OwnedNft> {
    /// channel the video is in
    pub in_channel: ChannelId,
    /// enable or not comments
    pub enable_comments: bool,
    /// First post to a video works as a description
    pub video_post_id: Option<VideoPostId>,
    /// Whether nft for this video have been issued.
    pub nft_status: Option<OwnedNft>,
}

pub type Video<T> =
    VideoRecord<<T as storage::Trait>::ChannelId, <T as Trait>::VideoPostId, Nft<T>>;

pub type DataObjectId<T> = <T as storage::Trait>::DataObjectId;

/// A VideoPost associated to a video
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoPostRecord<ContentActor, Balance, VideoPostId, VideoPostType, VideoId> {
    /// Author of post.
    pub author: ContentActor,

    /// Cleanup pay off
    pub bloat_bond: Balance,

    /// Overall replies counter
    pub replies_count: VideoPostId,

    /// video associated to the post (instead of the body hash as in the blog module)
    pub post_type: VideoPostType,

    /// video reference
    pub video_reference: VideoId,
}

/// alias for VideoPost
pub type VideoPost<T> = VideoPostRecord<
    ContentActor<
        <T as ContentActorAuthenticator>::CuratorGroupId,
        <T as ContentActorAuthenticator>::CuratorId,
        <T as MembershipTypes>::MemberId,
    >,
    BalanceOf<T>,
    <T as Trait>::VideoPostId,
    VideoPostType<T>,
    <T as Trait>::VideoId,
>;

/// VideoPost type structured as linked list with the video post as beginning
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum VideoPostTypeRecord<ParentVideoPostId> {
    /// Equivalent to a video description
    Description,
    /// Comment to a post with specified id
    Comment(ParentVideoPostId),
}

impl<ParentVideoPostId> Default for VideoPostTypeRecord<ParentVideoPostId> {
    fn default() -> Self {
        VideoPostTypeRecord::<ParentVideoPostId>::Description
    }
}

pub type VideoPostType<T> = VideoPostTypeRecord<<T as Trait>::VideoPostId>;

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
    pub hash: Hash,
    // side in which *self* must be adjoined during proof verification
    pub side: Side,
}

// alias for the proof element
pub type ProofElement<T> = ProofElementRecord<<T as frame_system::Trait>::Hash, Side>;

/// An enum in order to differenciate between post author and moderator / owner
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum CleanupActor {
    ChannelOwner,
    Moderator,
    VideoPostAuthor,
}

impl Default for CleanupActor {
    fn default() -> Self {
        CleanupActor::ChannelOwner
    }
}

/// Information on the post being created
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoPostCreationParametersRecord<VideoPostType, VideoId> {
    /// content
    pub post_type: VideoPostType,
    /// video reference
    pub video_reference: VideoId,
}

pub type VideoPostCreationParameters<T> =
    VideoPostCreationParametersRecord<VideoPostType<T>, <T as Trait>::VideoId>;

/// Information on the post being deleted
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoPostDeletionParametersRecord<HashOutput> {
    /// optional witnesses in case of video post deletion
    pub witness: Option<HashOutput>,
    /// rationale in case actor is moderator
    pub rationale: Option<Vec<u8>>,
}

pub type VideoPostDeletionParameters<T> =
    VideoPostDeletionParametersRecord<<T as frame_system::Trait>::Hash>;

/// Payment claim by a channel
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Copy, Clone, PartialEq, Eq, Debug)]
pub struct PullPaymentElement<ChannelId, Balance, Hash> {
    pub channel_id: ChannelId,
    pub cumulative_payout_claimed: Balance,
    pub reason: Hash,
}

pub type PullPayment<T> = PullPaymentElement<
    <T as storage::Trait>::ChannelId,
    BalanceOf<T>,
    <T as frame_system::Trait>::Hash,
>;

impl<ChannelId: Clone, VideoPostId: Clone, OwnedNft: Clone>
    VideoRecord<ChannelId, VideoPostId, OwnedNft>
{
    /// Ensure nft is not issued
    pub fn ensure_nft_is_not_issued<T: Trait>(&self) -> DispatchResult {
        ensure!(self.nft_status.is_none(), Error::<T>::NftAlreadyExists);
        Ok(())
    }

    /// Ensure nft is issued
    pub fn ensure_nft_is_issued<T: Trait>(&self) -> Result<OwnedNft, Error<T>> {
        if let Some(owned_nft) = &self.nft_status {
            Ok(owned_nft.clone())
        } else {
            Err(Error::<T>::NftDoesNotExist)
        }
    }

    /// Set video nft status
    pub fn set_nft_status(&mut self, nft: OwnedNft) {
        self.nft_status = Some(nft);
    }
}

/// Operations with local pallet account.
pub trait ModuleAccount<T: Trait> {
    /// The module id, used for deriving its sovereign account ID.
    type ModuleId: Get<ModuleId>;

    /// The account ID of the module account.
    fn account_for_channel(channel_id: T::ChannelId) -> T::AccountId {
        Self::ModuleId::get().into_sub_account(("CHANNEL", channel_id))
    }

    /// The account ID of the module account.
    fn module_account_id() -> T::AccountId {
        Self::ModuleId::get().into_sub_account("TREASURY")
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

    /// Deposit amount to internal creator account: infallible
    fn deposit_to_channel_account(channel_id: T::ChannelId, amount: BalanceOf<T>) {
        let _ = <Balances<T> as Currency<T::AccountId>>::deposit_creating(
            &Self::account_for_channel(channel_id),
            amount,
        );
    }

    /// Displays usable balance for the module account.
    fn usable_balance() -> BalanceOf<T> {
        <Balances<T>>::usable_balance(&Self::module_account_id())
    }

    /// Mints the reward into the destination account provided
    fn transfer_reward(dest_account_id: &T::AccountId, amount: BalanceOf<T>) {
        let _ = <Balances<T> as Currency<T::AccountId>>::deposit_creating(dest_account_id, amount);
    }
}

/// Implementation of the ModuleAccountHandler.
pub struct ModuleAccountHandler<T: balances::Trait, ModId: Get<ModuleId>> {
    /// Phantom marker for the trait.
    trait_marker: PhantomData<T>,

    /// Phantom marker for the module id type.
    module_id_marker: PhantomData<ModId>,
}

impl<T: Trait, ModId: Get<ModuleId>> ModuleAccount<T> for ModuleAccountHandler<T, ModId> {
    type ModuleId = ModId;
}

/// Type Aliases
pub type ContentTreasury<T> = ModuleAccountHandler<T, <T as Trait>::ModuleId>;
pub type Balances<T> = balances::Module<T>;
pub type BalanceOf<T> = <Balances<T> as Currency<<T as frame_system::Trait>::AccountId>>::Balance;
pub type DynBagId<T> =
    DynamicBagIdType<<T as common::MembershipTypes>::MemberId, <T as storage::Trait>::ChannelId>;
pub type Storage<T> = storage::Module<T>;

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
