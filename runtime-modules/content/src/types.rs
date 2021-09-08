use crate::*;

pub(crate) type ContentId<T> = <T as StorageOwnership>::ContentId;

pub(crate) type DataObjectTypeId<T> = <T as StorageOwnership>::DataObjectTypeId;

pub(crate) type ContentParameters<T> = ContentParametersRecord<ContentId<T>, DataObjectTypeId<T>>;

pub(crate) type StorageObjectOwner<T> = StorageObjectOwnerRecord<
    MemberId<T>,
    <T as StorageOwnership>::ChannelId,
    <T as StorageOwnership>::DAOId,
>;

/// Type, used in diffrent numeric constraints representations
pub type MaxNumber = u32;

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
pub enum ContentOwner<MemberId, CuratorGroupId, DAOId> {
    /// A Member owns the channel
    Member(MemberId),
    /// A specific curation group owns the channel
    CuratorGroup(CuratorGroupId),
    // Native DAO owns the channel
    Dao(DAOId),
}

// simplification type
pub(crate) type ActorToContentOwnerResult<T> = Result<
    ContentOwner<
        MemberId<T>,
        <T as ContentActorAuthenticator>::CuratorGroupId,
        <T as StorageOwnership>::DAOId,
    >,
    Error<T>,
>;

// Default trait implemented only because its used in a Channel which needs to implement a Default trait
// since it is a StorageValue.
impl<MemberId: Default, CuratorGroupId, DAOId> Default
    for ContentOwner<MemberId, CuratorGroupId, DAOId>
{
    fn default() -> Self {
        ContentOwner::Member(MemberId::default())
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
    pub owner: ContentOwner<MemberId, CuratorGroupId, DAOId>,
    /// The videos under this channel
    pub videos: Vec<VideoId>,
    /// The playlists under this channel
    pub playlists: Vec<PlaylistId>,
    /// The series under this channel
    pub series: Vec<SeriesId>,
    /// If curators have censored this channel or not
    pub is_censored: bool,
    /// Reward account where revenue is sent if set.
    pub reward_account: Option<AccountId>,
}

// Channel alias type for simplification.
pub type Channel<T> = ChannelRecord<
    MemberId<T>,
    <T as ContentActorAuthenticator>::CuratorGroupId,
    <T as StorageOwnership>::DAOId,
    <T as frame_system::Trait>::AccountId,
    <T as Trait>::VideoId,
    <T as Trait>::PlaylistId,
    <T as Trait>::SeriesId,
>;

/// A request to buy a channel by a new ContentOwner.
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
    pub channel_id: ChannelId,
    pub new_owner: ContentOwner<MemberId, CuratorGroupId, DAOId>,
    pub payment: Balance,
    pub new_reward_account: Option<AccountId>,
}

/// ChannelOwnershipTransferRequest type alias for simplification.
pub type ChannelOwnershipTransferRequest<T> = ChannelOwnershipTransferRequestRecord<
    <T as StorageOwnership>::ChannelId,
    MemberId<T>,
    <T as ContentActorAuthenticator>::CuratorGroupId,
    <T as StorageOwnership>::DAOId,
    BalanceOf<T>,
    <T as frame_system::Trait>::AccountId,
>;

/// Information about channel being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct ChannelCreationParameters<ContentParameters, AccountId> {
    /// Assets referenced by metadata
    pub assets: Vec<NewAsset<ContentParameters>>,
    /// Metadata about the channel.
    pub meta: Vec<u8>,
    /// optional reward account
    pub reward_account: Option<AccountId>,
}

/// Information about channel being updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelUpdateParameters<ContentParameters, AccountId> {
    /// Assets referenced by metadata
    pub assets: Option<Vec<NewAsset<ContentParameters>>>,
    /// If set, metadata update for the channel.
    pub new_meta: Option<Vec<u8>>,
    /// If set, updates the reward account of the channel
    pub reward_account: Option<Option<AccountId>>,
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

/// Information about the video category being updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoCategoryUpdateParameters {
    // Because it is the only field it is not an Option
    /// Metadata update for the video category.
    pub new_meta: Vec<u8>,
}

/// Information about the video being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct VideoCreationParameters<ContentParameters> {
    /// Assets referenced by metadata
    pub assets: Vec<NewAsset<ContentParameters>>,
    /// Metadata for the video.
    pub meta: Vec<u8>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoUpdateParameters<ContentParameters> {
    /// Assets referenced by metadata
    pub assets: Option<Vec<NewAsset<ContentParameters>>>,
    /// If set, metadata update for the video.
    pub new_meta: Option<Vec<u8>>,
}

/// A video which belongs to a channel. A video may be part of a series or playlist.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct VideoRecord<
    AccountId: Default + Ord,
    ChannelId,
    SeriesId,
    BlockNumber: BaseArithmetic + Copy,
    MemberId: Default + Copy + Ord,
    CuratorGroupId: Default + Copy,
    DAOId: Default + Copy,
    Balance: Default,
> {
    pub in_channel: ChannelId,
    // keep track of which season the video is in if it is an 'episode'
    // - prevent removing a video if it is in a season (because order is important)
    pub in_series: Option<SeriesId>,
    /// Whether the curators have censored the video or not.
    pub is_censored: bool,
    /// Whether nft for this video have been issued.
    pub nft_status: NFTStatus<AccountId, BlockNumber, MemberId, CuratorGroupId, DAOId, Balance>,
}

impl<
        AccountId: Default + Ord,
        ChannelId: Clone,
        SeriesId: Clone,
        BlockNumber: BaseArithmetic + Copy,
        MemberId: Default + Copy + PartialEq + Ord,
        CuratorGroupId: Default + Copy + PartialEq,
        DAOId: Default + Copy + PartialEq,
        Balance: Clone + Default,
    >
    VideoRecord<
        AccountId,
        ChannelId,
        SeriesId,
        BlockNumber,
        MemberId,
        CuratorGroupId,
        DAOId,
        Balance,
    >
{
    /// Ensure nft status is set to NoneIssued
    pub fn ensure_none_issued<T: Trait>(&self) -> DispatchResult {
        if let NFTStatus::NoneIssued = self.nft_status {
            Ok(())
        } else {
            Err(Error::<T>::NFTAlreadyExists.into())
        }
    }

    /// Ensure given NFTOwner is nft owner
    pub fn ensure_nft_ownership<T: Trait>(
        &self,
        owner: &ContentOwner<MemberId, CuratorGroupId, DAOId>,
    ) -> DispatchResult {
        if let NFTStatus::Owned(owned_nft) = &self.nft_status {
            ensure!(owned_nft.is_owner(owner), Error::<T>::DoesNotOwnNFT);
        }
        Ok(())
    }

    /// Check whether nft transactional status is set to `Auction`
    pub fn is_nft_auction_started(&self) -> bool {
        matches!(
            self.nft_status,
            NFTStatus::Owned(OwnedNFT {
                transactional_status: TransactionalStatus::Auction(..),
                ..
            })
        )
    }

    /// Ensure nft is in auction state
    pub fn ensure_nft_auction_state<T: Trait>(
        &self,
    ) -> Result<AuctionRecord<BlockNumber, Balance, MemberId>, Error<T>> {
        if let NFTStatus::Owned(OwnedNFT {
            transactional_status: TransactionalStatus::Auction(auction),
            ..
        }) = &self.nft_status
        {
            Ok(auction.clone())
        } else {
            Err(Error::<T>::NotInAuctionState.into())
        }
    }

    /// Get nft auction record
    pub fn get_nft_auction(&self) -> Option<AuctionRecord<BlockNumber, Balance, MemberId>> {
        if let NFTStatus::Owned(OwnedNFT {
            transactional_status: TransactionalStatus::Auction(ref auction),
            ..
        }) = self.nft_status
        {
            Some(auction.clone())
        } else {
            None
        }
    }

    /// Get nft auction record by reference
    pub fn get_nft_auction_ref(&self) -> Option<&AuctionRecord<BlockNumber, Balance, MemberId>> {
        if let NFTStatus::Owned(OwnedNFT {
            transactional_status: TransactionalStatus::Auction(ref auction),
            ..
        }) = self.nft_status
        {
            Some(auction)
        } else {
            None
        }
    }

    /// Get nft auction record by mutable reference
    pub fn get_nft_auction_ref_mut(
        &mut self,
    ) -> Option<&mut AuctionRecord<BlockNumber, Balance, MemberId>> {
        if let NFTStatus::Owned(OwnedNFT {
            transactional_status: TransactionalStatus::Auction(ref mut auction),
            ..
        }) = self.nft_status
        {
            Some(auction)
        } else {
            None
        }
    }

    ///  Ensure nft transactional status is set to `Idle`
    pub fn ensure_nft_transactional_status_is_idle<T: Trait>(&self) -> DispatchResult {
        let is_idle = matches!(
            self.nft_status,
            NFTStatus::Owned(OwnedNFT {
                transactional_status: TransactionalStatus::Idle,
                ..
            })
        );
        ensure!(is_idle, Error::<T>::NftIsNotIdle);
        Ok(())
    }

    /// Sets nft transactional status to `BuyNow`
    pub fn set_buy_now_transactionl_status(
        mut self,
        participant_account_id: AccountId,
        buy_now_price: Balance,
    ) -> Self {
        if let NFTStatus::Owned(owned_nft) = &mut self.nft_status {
            let order_details = OrderDetails::new(participant_account_id, buy_now_price);
            owned_nft.transactional_status = TransactionalStatus::BuyNow(order_details);
        }
        self
    }

    /// Sets nft transactional status to provided `Auction`
    pub fn set_auction_transactional_status(
        mut self,
        auction: AuctionRecord<BlockNumber, Balance, MemberId>,
    ) -> Self {
        if let NFTStatus::Owned(owned_nft) = &mut self.nft_status {
            owned_nft.transactional_status = TransactionalStatus::Auction(auction);
        }
        self
    }

    /// Set nft transactional status to `Idle`
    pub fn set_idle_transactional_status(mut self) -> Self {
        if let NFTStatus::Owned(owned_nft) = &mut self.nft_status {
            owned_nft.transactional_status = TransactionalStatus::Idle;
        }
        self
    }

    /// Set nft transactional status to `InitiatedOfferToMember`
    pub fn set_pending_offer_transactional_status(
        mut self,
        to: MemberId,
        offer_details: Option<OrderDetails<AccountId, Balance>>,
    ) -> Self {
        if let NFTStatus::Owned(owned_nft) = &mut self.nft_status {
            owned_nft.transactional_status =
                TransactionalStatus::InitiatedOfferToMember(to, offer_details);
        }
        self
    }

    /// Whether pending tansfer exist
    pub fn is_pending_offer_transactional_status(&self) -> bool {
        matches!(
            self.nft_status,
            NFTStatus::Owned(OwnedNFT {
                transactional_status: TransactionalStatus::InitiatedOfferToMember(..),
                ..
            })
        )
    }

    /// Ensure NFT has pending offer
    pub fn ensure_pending_offer_exists<T: Trait>(&self) -> DispatchResult {
        ensure!(
            self.is_pending_offer_transactional_status(),
            Error::<T>::PendingTransferDoesNotExist
        );
        Ok(())
    }
}

/// Video alias type for simplification.
pub type Video<T> = VideoRecord<
    <T as frame_system::Trait>::AccountId,
    <T as StorageOwnership>::ChannelId,
    <T as Trait>::SeriesId,
    <T as frame_system::Trait>::BlockNumber,
    MemberId<T>,
    CuratorGroupId<T>,
    <T as StorageOwnership>::DAOId,
    BalanceOf<T>,
>;

/// Information about the plyalist being created.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PlaylistCreationParameters {
    /// Metadata about the playlist.
    pub meta: Vec<u8>,
}

/// Information about the playlist being updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PlaylistUpdateParameters {
    // It is the only field so its not an Option
    /// Metadata update for the playlist.
    pub new_meta: Vec<u8>,
}

/// A playlist is an ordered collection of videos.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Playlist<ChannelId> {
    /// The channel the playlist belongs to.
    pub in_channel: ChannelId,
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
    pub assets: Option<Vec<NewAsset<ContentParameters>>>,
    // ?? It might just be more straighforward to always provide full list of episodes at cost of larger tx.
    /// If set, updates the episodes of a season. Extends the number of episodes in a season
    /// when length of new_episodes is greater than previously set. Last elements must all be
    /// 'Some' in that case.
    /// Will truncate existing season when length of new_episodes is less than previously set.
    pub episodes: Option<Vec<Option<EpisodeParameters<VideoId, ContentParameters>>>>,
    /// If set, Metadata update for season.
    pub meta: Option<Vec<u8>>,
}

/// Information about the series being created or updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct SeriesParameters<VideoId, ContentParameters> {
    /// Series assets referenced by metadata
    pub assets: Option<Vec<NewAsset<ContentParameters>>>,
    // ?? It might just be more straighforward to always provide full list of seasons at cost of larger tx.
    /// If set, updates the seasons of a series. Extend a series when length of seasons is
    /// greater than previoulsy set. Last elements must all be 'Some' in that case.
    /// Will truncate existing series when length of seasons is less than previously set.
    pub seasons: Option<Vec<Option<SeasonParameters<VideoId, ContentParameters>>>>,
    pub meta: Option<Vec<u8>>,
}

/// A season is an ordered list of videos (episodes).
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Season<VideoId> {
    pub episodes: Vec<VideoId>,
}

/// A series is an ordered list of seasons that belongs to a channel.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Series<ChannelId, VideoId> {
    pub in_channel: ChannelId,
    pub seasons: Vec<Season<VideoId>>,
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
    pub assets: Vec<NewAsset<ContentParameters>>,
    /// Metadata for person.
    pub meta: Vec<u8>,
}

/// Information for Persion being updated.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PersonUpdateParameters<ContentParameters> {
    /// Assets referenced by metadata
    pub assets: Option<Vec<NewAsset<ContentParameters>>>,
    /// Metadata to update person.
    pub new_meta: Option<Vec<u8>>,
}

/// A Person represents a real person that may be associated with a video.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct Person<MemberId> {
    /// Who can update or delete this person.
    pub controlled_by: PersonController<MemberId>,
}
