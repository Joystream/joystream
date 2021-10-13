use crate::*;

/// Specifies how a new asset will be provided on creating and updating
/// Channels, Videos, Series and Person
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum NewAssetsRecord<Balance> {
    /// Upload to the storage frame_system
    Upload(CreationUploadParameters<Balance>),
    /// Multiple url strings pointing at an asset
    Urls(Vec<AssetUrls>),
}

pub type NewAssets<T> = NewAssetsRecord<<T as balances::Trait>::Balance>;

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

// simplification type
pub(crate) type ActorToChannelOwnerResult<T> = Result<
    ChannelOwner<
        <T as membership::Trait>::MemberId,
        <T as ContentActorAuthenticator>::CuratorGroupId,
    >,
    Error<T>,
>;

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
pub struct ChannelRecord<MemberId, CuratorGroupId, AccountId> {
    /// The owner of a channel
    pub owner: ChannelOwner<MemberId, CuratorGroupId>,
    /// The videos under this channel
    pub num_videos: u64,
    /// The nfts under this channel
    pub num_nfts: u64,
    /// If curators have censored this channel or not
    pub is_censored: bool,
    /// Reward account where revenue is sent if set.
    pub reward_account: Option<AccountId>,
    /// Account for withdrawing deletion prize funds
    pub deletion_prize_source_account_id: AccountId,
    /// Number of asset held in storage
    pub num_assets: u64,
}

impl<MemberId, CuratorGroupId, AccountId> ChannelRecord<MemberId, CuratorGroupId, AccountId> {
    /// Ensure censorship status have been changed
    pub fn ensure_censorship_status_changed<T: Trait>(&self, is_censored: bool) -> DispatchResult {
        ensure!(
            self.is_censored != is_censored,
            Error::<T>::ChannelCensorshipStatusDidNotChange
        );
        Ok(())
    }
}

// Channel alias type for simplification.
pub type Channel<T> = ChannelRecord<
    <T as membership::Trait>::MemberId,
    <T as ContentActorAuthenticator>::CuratorGroupId,
    <T as frame_system::Trait>::AccountId,
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
    <T as membership::Trait>::MemberId,
    <T as ContentActorAuthenticator>::CuratorGroupId,
    BalanceOf<T>,
    <T as frame_system::Trait>::AccountId,
>;

/// Information about channel being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct ChannelCreationParametersRecord<NewAssets, AccountId> {
    /// Asset collection for the channel, referenced by metadata
    pub assets: NewAssets,
    /// Metadata about the channel.
    meta: Vec<u8>,
    /// optional reward account
    pub reward_account: Option<AccountId>,
}

pub type ChannelCreationParameters<T> =
    ChannelCreationParametersRecord<NewAssets<T>, <T as frame_system::Trait>::AccountId>;

/// Information about channel being updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelUpdateParametersRecord<NewAssets, AccountId> {
    /// Asset collection for the channel, referenced by metadata    
    pub assets: Option<NewAssets>,
    /// If set, metadata update for the channel.
    new_meta: Option<Vec<u8>>,
    /// If set, updates the reward account of the channel
    pub reward_account: Option<Option<AccountId>>,
}

pub type ChannelUpdateParameters<T> =
    ChannelUpdateParametersRecord<NewAssets<T>, <T as frame_system::Trait>::AccountId>;

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
pub struct CreationUploadParameters<Balance> {
    /// Data object parameters.
    pub object_creation_list: Vec<DataObjectCreationParameters>,

    /// Expected data size fee value for this extrinsic call.
    pub expected_data_size_fee: Balance,
}

/// Information about the video being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct VideoCreationParametersRecord<NewAssets> {
    /// Asset collection for the video
    pub assets: NewAssets,
    /// Metadata for the video.
    meta: Vec<u8>,
}

pub type VideoCreationParameters<T> = VideoCreationParametersRecord<NewAssets<T>>;

/// Information about the video being updated
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoUpdateParametersRecord<NewAssets> {
    /// Assets referenced by metadata
    pub assets: Option<NewAssets>,
    /// If set, metadata update for the video.
    new_meta: Option<Vec<u8>>,
}

pub type VideoUpdateParameters<T> = VideoUpdateParametersRecord<NewAssets<T>>;

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
pub enum EpisodeParameters<VideoId, NewAssets> {
    /// A new video is being added as the episode.
    NewVideo(VideoCreationParametersRecord<NewAssets>),
    /// An existing video is being made into an episode.
    ExistingVideo(VideoId),
}

/// Information about the season being created or updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct SeasonParameters<VideoId, NewAssets> {
    /// Season assets referenced by metadata
    pub assets: Option<NewAssets>,
    // ?? It might just be more straighforward to always provide full list of episodes at cost of larger tx.
    /// If set, updates the episodes of a season. Extends the number of episodes in a season
    /// when length of new_episodes is greater than previously set. Last elements must all be
    /// 'Some' in that case.
    /// Will truncate existing season when length of new_episodes is less than previously set.
    episodes: Option<Vec<Option<EpisodeParameters<VideoId, NewAssets>>>>,

    meta: Option<Vec<u8>>,
}

/// Information about the series being created or updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct SeriesParameters<VideoId, NewAssets> {
    /// Series assets referenced by metadata
    pub assets: Option<NewAssets>,
    // ?? It might just be more straighforward to always provide full list of seasons at cost of larger tx.
    /// If set, updates the seasons of a series. Extend a series when length of seasons is
    /// greater than previoulsy set. Last elements must all be 'Some' in that case.
    /// Will truncate existing series when length of seasons is less than previously set.
    seasons: Option<Vec<Option<SeasonParameters<VideoId, NewAssets>>>>,
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
pub struct PersonCreationParameters<NewAssets> {
    /// Assets referenced by metadata
    pub assets: NewAssets,
    /// Metadata for person.
    meta: Vec<u8>,
}

/// Information for Persion being updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PersonUpdateParameters<NewAssets> {
    /// Assets referenced by metadata
    pub assets: Option<NewAssets>,
    /// Metadata to update person.
    new_meta: Option<Vec<u8>>,
}

/// A Person represents a real person that may be associated with a video.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Person<MemberId> {
    /// Who can update or delete this person.
    pub controlled_by: PersonController<MemberId>,
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
    pub meta: Vec<u8>,
}

/// A video which belongs to a channel. A video may be part of a series or playlist.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoRecord<
    ChannelId,
    SeriesId,
    DataObjectId: Ord,
    BlockNumber: BaseArithmetic + Copy,
    MemberId: Default + Copy + Ord,
    AccountId: Default + Clone + Ord,
    Balance: Default + Clone,
> {
    pub in_channel: ChannelId,
    // keep track of which season the video is in if it is an 'episode'
    // - prevent removing a video if it is in a season (because order is important)
    pub in_series: Option<SeriesId>,
    /// Whether the curators have censored the video or not.
    pub is_censored: bool,
    /// storage parameters used during deletion
    pub maybe_data_objects_id_set: Option<BTreeSet<DataObjectId>>,
    /// Whether nft for this video have been issued.
    pub nft_status: Option<OwnedNFT<BlockNumber, MemberId, AccountId, Balance>>,
}

impl<
        ChannelId: Clone,
        SeriesId: Clone,
        DataObjectId: Ord,
        BlockNumber: BaseArithmetic + Copy,
        MemberId: Default + Copy + PartialEq + Ord,
        AccountId: Default + Clone + PartialEq + Ord,
        Balance: Clone + Default,
    > VideoRecord<ChannelId, SeriesId, DataObjectId, BlockNumber, MemberId, AccountId, Balance>
{
    /// Ensure nft is not issued
    pub fn ensure_nft_is_not_issued<T: Trait>(&self) -> DispatchResult {
        ensure!(self.nft_status.is_none(), Error::<T>::NFTDoesNotExist);
        Ok(())
    }

    /// Ensure nft is issued
    pub fn ensure_nft_is_issued<T: Trait>(
        &self,
    ) -> Result<OwnedNFT<BlockNumber, MemberId, AccountId, Balance>, Error<T>> {
        if let Some(owned_nft) = &self.nft_status {
            Ok(owned_nft.to_owned())
        } else {
            Err(Error::<T>::NFTAlreadyExists)
        }
    }

    /// Set video nft status
    pub fn set_nft_status(
        mut self,
        nft: OwnedNFT<BlockNumber, MemberId, AccountId, Balance>,
    ) -> Self {
        self.nft_status = Some(nft);
        self
    }

    /// Ensure censorship status have been changed
    pub fn ensure_censorship_status_changed<T: Trait>(&self, is_censored: bool) -> DispatchResult {
        ensure!(
            self.is_censored != is_censored,
            Error::<T>::VideoCensorshipStatusDidNotChange
        );
        Ok(())
    }
}

/// Video alias type for simplification.
pub type Video<T> = VideoRecord<
    <T as storage::Trait>::ChannelId,
    <T as Trait>::SeriesId,
    <T as storage::Trait>::DataObjectId,
    <T as frame_system::Trait>::BlockNumber,
    MemberId<T>,
    <T as frame_system::Trait>::AccountId,
    BalanceOf<T>,
>;
