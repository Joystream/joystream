use crate::*;
use sp_std::collections::btree_map::BTreeMap;
#[cfg(feature = "std")]
use strum_macros::EnumIter;

/// Defines NFT limit ID type for global and channel NFT limits and counters.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Copy)]
pub enum NftLimitId<ChannelId> {
    /// Global daily NFT counter ID.
    GlobalDaily,

    /// Global weekly NFT counter ID.
    GlobalWeekly,

    /// Channel daily NFT counter ID.
    ChannelDaily(ChannelId),

    /// Channel weekly NFT counter ID.
    ChannelWeekly(ChannelId),
}

// Default trait implemented for the NftLimitId. Required by Substrate.
impl<ChannelId> Default for NftLimitId<ChannelId> {
    fn default() -> Self {
        Self::GlobalDaily
    }
}

/// All periods that nft limits apply to
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Copy)]
pub enum NftLimitPeriod {
    Daily,
    Weekly,
}

// Default trait implemented for the NftLimitPeriod.
impl Default for NftLimitPeriod {
    fn default() -> Self {
        Self::Daily
    }
}

/// Defines limit for object for a defined period.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default, Copy)]
pub struct LimitPerPeriod<BlockNumber> {
    /// Limit for objects.
    pub limit: u64,

    /// Period in blocks for active limit.
    pub block_number_period: BlockNumber,
}

/// Defines limit for object for a defined period.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug, Default)]
pub struct NftCounter<BlockNumber: BaseArithmetic + Copy> {
    /// Counter for objects.
    pub counter: u64,

    /// Last updated block number for this counter.
    pub last_updated: BlockNumber,
}

impl<BlockNumber: BaseArithmetic + Copy> NftCounter<BlockNumber> {
    // Defines whether the counter is valid for the current block.
    pub(crate) fn is_current_period(
        &self,
        current_block: BlockNumber,
        period_length: BlockNumber,
    ) -> bool {
        if period_length.is_zero() {
            return false;
        }

        let last_updated_period_number = self.last_updated / period_length;
        let current_period_number = current_block / period_length;

        last_updated_period_number == current_period_number
    }

    // Defines whether the counter is valid for the current block.
    pub(crate) fn update_for_current_period(
        &mut self,
        current_block: BlockNumber,
        period_length: BlockNumber,
    ) {
        if self.is_current_period(current_block, period_length) {
            self.counter += 1;
        } else {
            self.counter = 1;
        }

        self.last_updated = current_block;
    }
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

#[cfg_attr(feature = "std", derive(Serialize, Deserialize, EnumIter))]
#[derive(Encode, Decode, Clone, Copy, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub enum ChannelActionPermission {
    /// Allows updating channel metadata through `update_channel` tx
    UpdateChannelMetadata,
    /// Allows adding/setting/unsetting/removing channel assets through `update_channel` tx
    ManageNonVideoChannelAssets,
    /// Allows adding/updating/removing channel collaborators through `update_channel`, provided that:
    /// - all affected collaborators currently have permissions that are a subset of sender agent permissions
    /// - all affected collaborators will have permissions that are a subset of sender agent permissions AFTER the update
    ManageChannelCollaborators,
    /// Allows updating video metadata through `update_video` tx
    UpdateVideoMetadata,
    /// Allows adding a new video through `create_video` tx:
    /// - allows including new assets, even without `ManageVideoAssets` permissions
    /// - does not allow issuing an nft through optional `auto_issue_nft` parameter
    ///   (unless `ManageVideoNfts` permissions are also granted)
    AddVideo,
    /// Allows adding/setting/unsetting/removing video assets through `update_video` tx
    ManageVideoAssets,
    /// Allows deleting the channel through `delete_channel` tx
    /// (provided it has no assets, otherwise ManageNonVideoChannelAssets needs to be additionally granted)
    DeleteChannel,
    /// Allows deleting a video through `delete_video` tx
    /// (provided it has no assets, otherwise ManageVideoAssets needs to be additionally granted)
    DeleteVideo,
    /// Allows managing video nfts owned by the channel, this includes actions such as:
    /// - issuing nft through `issue_nft` / `create_video` / `update_video`
    /// - starting nft auctions: `start_open_auction`, `start_english_auction`
    /// - canceling nft auctions: `cancel_english_auction`, `cancel_open_auction`
    /// - `offer_nft`
    /// - `cancel_offer`,
    /// - `sell_nft`
    /// - `cancel_buy_now`,
    /// - `update_buy_now_price`,
    /// - `pick_open_auction_winner`
    /// - `nft_owner_remark`
    /// - `destroy_nft`
    ManageVideoNfts,
    /// Allows executing `channel_agent_remark` for given channel
    AgentRemark,
    /// Allows updating channel transfer status through `update_channel_transfer_status` tx
    TransferChannel,
    /// Allows claiming channel reward through `claim_channel_reward` tx
    // TODO: or `claim_and_withdraw_channel_reward` tx (provided `WithdrawFromChannelBalance` permission is also granted)
    ClaimChannelReward,
    // TODO: Allows withdrawing channel balance through `withdraw_from_channel_balance` tx
    // or `claim_and_withdraw_channel_reward` tx (provided `ClaimChannelReward` permission is also granted)
    WithdrawFromChannelBalance,
}

pub type ChannelAgentPermissions = BTreeSet<ChannelActionPermission>;

/// Type representing an owned channel which videos, playlists, and series can belong to.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ChannelRecord<
    MemberId: Ord + PartialEq,
    CuratorGroupId: PartialEq,
    Balance: PartialEq + Zero,
    ChannelPrivilegeLevel,
    DataObjectId: Ord,
    BlockNumber: BaseArithmetic + Copy,
> {
    /// The owner of a channel
    pub owner: ChannelOwner<MemberId, CuratorGroupId>,
    /// The videos under this channel
    pub num_videos: u64,
    /// Map from collaborator's MemberId to collaborator's ChannelAgentPermissions
    pub collaborators: BTreeMap<MemberId, ChannelAgentPermissions>,
    /// Cumulative cashout
    pub cumulative_payout_earned: Balance,
    /// Privilege level (curators will have different moderation permissions w.r.t. this channel depending on this value)
    pub privilege_level: ChannelPrivilegeLevel,
    /// List of channel features that have been paused by a curator
    pub paused_features: BTreeSet<PausableChannelFeature>,
    /// Transfer status of the channel. Requires to be explicitly accepted.
    pub transfer_status: ChannelTransferStatus<MemberId, CuratorGroupId, Balance>,
    /// Set of associated data objects
    pub data_objects: BTreeSet<DataObjectId>,
    /// Channel daily NFT limit.
    pub daily_nft_limit: LimitPerPeriod<BlockNumber>,
    /// Channel weekly NFT limit.
    pub weekly_nft_limit: LimitPerPeriod<BlockNumber>,
    /// Channel daily NFT counter.
    pub daily_nft_counter: NftCounter<BlockNumber>,
    /// Channel weekly NFT counter.
    pub weekly_nft_counter: NftCounter<BlockNumber>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
/// Defines whether a channel is being transferred. No transfer by the default.
pub enum ChannelTransferStatus<
    MemberId: Ord + PartialEq,
    CuratorGroupId: PartialEq,
    Balance: PartialEq + Zero,
> {
    /// Default transfer status: no pending transfers.
    NoActiveTransfer,

    /// There is ongoing transfer with parameters.
    PendingTransfer(PendingTransfer<MemberId, CuratorGroupId, Balance>),
}

impl<MemberId: Ord + PartialEq, CuratorGroupId: PartialEq, Balance: PartialEq + Zero> Default
    for ChannelTransferStatus<MemberId, CuratorGroupId, Balance>
{
    fn default() -> Self {
        ChannelTransferStatus::NoActiveTransfer
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
/// Contains parameters for the pending transfer.
pub struct PendingTransfer<MemberId: Ord, CuratorGroupId, Balance: Zero> {
    /// New channel owner.
    pub new_owner: ChannelOwner<MemberId, CuratorGroupId>,
    /// Transfer parameters.
    pub transfer_params: TransferParameters<MemberId, Balance>,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
/// Contains parameters for the pending transfer.
pub struct TransferParameters<MemberId: Ord, Balance: Zero> {
    /// Channel's new collaborators along with their respective permissions
    pub new_collaborators: BTreeMap<MemberId, ChannelAgentPermissions>,
    /// Transfer price: can be 0, which means free.
    pub price: Balance,
}

impl<MemberId: Ord, Balance: Zero> TransferParameters<MemberId, Balance> {
    // Defines whether the transfer is free.
    pub(crate) fn is_free_of_charge(&self) -> bool {
        self.price.is_zero()
    }
}

impl<
        MemberId: Ord + PartialEq,
        CuratorGroupId: PartialEq,
        Balance: PartialEq + Zero,
        ChannelPrivilegeLevel,
        DataObjectId: Ord,
        BlockNumber: BaseArithmetic + Copy,
    >
    ChannelRecord<
        MemberId,
        CuratorGroupId,
        Balance,
        ChannelPrivilegeLevel,
        DataObjectId,
        BlockNumber,
    >
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

    pub fn get_existing_collaborator_permissions<T: Trait>(
        &self,
        member_id: &MemberId,
    ) -> Result<&ChannelAgentPermissions, DispatchError> {
        self.collaborators
            .get(&member_id)
            .ok_or_else(|| Error::<T>::ActorNotAuthorized.into())
    }

    pub fn increment_channel_nft_counters(&mut self, current_block: BlockNumber) {
        self.daily_nft_counter
            .update_for_current_period(current_block, self.daily_nft_limit.block_number_period);

        self.weekly_nft_counter
            .update_for_current_period(current_block, self.weekly_nft_limit.block_number_period);
    }
}

// Channel alias type for simplification.
pub type Channel<T> = ChannelRecord<
    <T as common::MembershipTypes>::MemberId,
    <T as ContentActorAuthenticator>::CuratorGroupId,
    BalanceOf<T>,
    <T as Trait>::ChannelPrivilegeLevel,
    DataObjectId<T>,
    <T as frame_system::Trait>::BlockNumber,
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
pub struct ChannelCreationParametersRecord<
    StorageAssets,
    MemberId: Ord,
    StorageBucketId: Ord,
    DistributionBucketId: Ord,
    Balance,
> {
    /// Assets referenced by metadata
    pub assets: Option<StorageAssets>,
    /// Metadata about the channel.
    pub meta: Option<Vec<u8>>,
    /// Map from collaborator's MemberId to collaborator's ChannelAgentPermissions
    pub collaborators: BTreeMap<MemberId, ChannelAgentPermissions>,
    /// Storage buckets to assign to a bag.
    pub storage_buckets: BTreeSet<StorageBucketId>,
    /// Distribution buckets to assign to a bag.
    pub distribution_buckets: BTreeSet<DistributionBucketId>,
    /// Commitment for the data object state bloat bond for the storage pallet.
    pub expected_data_object_state_bloat_bond: Balance,
}

pub type ChannelCreationParameters<T> = ChannelCreationParametersRecord<
    StorageAssets<T>,
    <T as common::MembershipTypes>::MemberId,
    <T as storage::Trait>::StorageBucketId,
    storage::DistributionBucketId<T>,
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
    /// Optional, updated map of collaborator_member_id => collaborator_channel_agent_permissions
    pub collaborators: Option<BTreeMap<MemberId, ChannelAgentPermissions>>,
    /// Commitment for the data object state bloat bond for the storage pallet.
    pub expected_data_object_state_bloat_bond: Balance,
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
    /// Parameters for issuing video Nft
    pub auto_issue_nft: Option<NftIssuanceParameters>,
    /// Commitment for the data object state bloat bond for the storage pallet.
    pub expected_data_object_state_bloat_bond: Balance,
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
    /// Parameters for updating Nft along with video
    pub auto_issue_nft: Option<NftIssuanceParameters>,
    /// Commitment for the data object state bloat bond for the storage pallet.
    pub expected_data_object_state_bloat_bond: Balance,
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
pub struct VideoRecord<ChannelId, OwnedNft, DataObjectId: Ord> {
    pub in_channel: ChannelId,
    /// Whether nft for this video have been issued.
    pub nft_status: Option<OwnedNft>,
    /// Set of associated data objects
    pub data_objects: BTreeSet<DataObjectId>,
}

pub type Video<T> = VideoRecord<<T as storage::Trait>::ChannelId, Nft<T>, DataObjectId<T>>;

pub type DataObjectId<T> = <T as storage::Trait>::DataObjectId;

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

impl<ChannelId: Clone, OwnedNft: Clone, DataObjectId: Ord>
    VideoRecord<ChannelId, OwnedNft, DataObjectId>
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

    /// Destroy nft status
    pub fn destroy_nft(&mut self) {
        self.nft_status = None;
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
