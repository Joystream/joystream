import { Vec, Option, Tuple, BTreeSet, UInt, BTreeMap } from '@polkadot/types'
import { bool, u8, u32, u64, Null, Bytes } from '@polkadot/types/primitive'
import { JoyStructDecorated, JoyEnum, ChannelId, MemberId, Balance, Hash, BlockNumber } from '../common'
import { DataObjectId, DataObjectCreationParameters } from '../storage'

export class DistributionBucketId extends u64 {}
export class StorageBucketId extends u64 {}
export class OpenAuctionId extends u64 {}
export class CuratorId extends u64 {}
export class CuratorGroupId extends u64 {}
export class ChannelCategoryId extends u64 {}
export class VideoId extends u64 {}
export class VideoCategoryId extends u64 {}
export class MaxNumber extends u32 {}
export class IsCensored extends bool {}
export class ChannelPrivilegeLevel extends u8 {}

// NFT types

export class Royalty extends UInt.with(32, 'Perbill') {}

export class OpenAuctionBid extends JoyStructDecorated({
  amount: Balance,
  made_at_block: BlockNumber,
  auction_id: OpenAuctionId,
}) {}

export class EnglishAuctionBid extends JoyStructDecorated({
  amount: Balance,
  bidder_id: MemberId,
}) {}

export class EnglishAuction extends JoyStructDecorated({
  starting_price: Balance,
  buy_now_price: Option.with(Balance),
  whitelist: BTreeSet.with(MemberId),
  end: BlockNumber,
  auction_duration: BlockNumber,
  extension_period: BlockNumber,
  min_bid_step: Balance,
  top_bid: Option.with(EnglishAuctionBid),
}) {}

export class OpenAuction extends JoyStructDecorated({
  starting_price: Balance,
  buy_now_price: Option.with(Balance),
  whitelist: BTreeSet.with(MemberId),
  bid_lock_duration: BlockNumber,
  auction_id: OpenAuctionId,
}) {}

export class TransactionalStatus extends JoyEnum({
  Idle: Null,
  InitiatedOfferToMember: Tuple.with([MemberId, Option.with(Balance)]),
  EnglishAuction: EnglishAuction,
  OpenAuction: OpenAuction,
  BuyNow: Balance,
}) {}

export class NftOwner extends JoyEnum({
  ChannelOwner: Null,
  Member: MemberId,
}) {}

export class OwnedNft extends JoyStructDecorated({
  owner: NftOwner,
  transactional_status: TransactionalStatus,
  creator_royalty: Option.with(Royalty),
  open_auctions_nonce: OpenAuctionId,
}) {}

export class EnglishAuctionParams extends JoyStructDecorated({
  starting_price: Balance,
  buy_now_price: Option.with(Balance),
  whitelist: BTreeSet.with(MemberId),
  end: BlockNumber,
  auction_duration: BlockNumber,
  extension_period: BlockNumber,
  min_bid_step: Balance,
}) {}

export class OpenAuctionParams extends JoyStructDecorated({
  starting_price: Balance,
  buy_now_price: Option.with(Balance),
  whitelist: BTreeSet.with(MemberId),
  bid_lock_duration: BlockNumber,
}) {}

export class InitTransactionalStatus extends JoyEnum({
  Idle: Null,
  BuyNow: Balance,
  InitiatedOfferToMember: Tuple.with([MemberId, Option.with(Balance)]),
  EnglishAuction: EnglishAuctionParams,
  OpenAuction: OpenAuctionParams,
}) {}

export class NftIssuanceParameters extends JoyStructDecorated({
  royalty: Option.with(Royalty),
  nft_metadata: Bytes,
  non_channel_owner: Option.with(MemberId),
  init_transactional_status: InitTransactionalStatus,
}) {}

export class NftMetadata extends Vec.with(u8) {}

// end of Nft types

// Assets
export class StorageAssets extends JoyStructDecorated({
  object_creation_list: Vec.with(DataObjectCreationParameters),
  expected_data_size_fee: Balance,
}) {}

// Actors
export class ContentActor extends JoyEnum({
  Curator: Tuple.with([CuratorGroupId, CuratorId]),
  Member: MemberId,
  Lead: Null,
}) {}

export class ChannelOwner extends JoyEnum({
  Member: MemberId,
  Curators: CuratorGroupId,
}) {}

// Agent permissions

export class ChannelActionPermission extends JoyEnum({
  UpdateChannelMetadata: Null,
  ManageNonVideoChannelAssets: Null,
  ManageChannelCollaborators: Null,
  UpdateVideoMetadata: Null,
  AddVideo: Null,
  ManageVideoAssets: Null,
  DeleteChannel: Null,
  DeleteVideo: Null,
  ManageVideoNfts: Null,
  AgentRemark: Null,
  TransferChannel: Null,
  ClaimChannelReward: Null,
  WithdrawFromChannelBalance: Null,
}) {}

export class ChannelAgentPermissions extends BTreeSet.with(ChannelActionPermission) {}

// Moderation

export class PausableChannelFeature extends JoyEnum({
  ChannelFundsTransfer: Null,
  CreatorCashout: Null,
  VideoNftIssuance: Null,
  VideoCreation: Null,
  VideoUpdate: Null,
  ChannelUpdate: Null,
  CreatorTokenIssuance: Null,
}) {}

export class ContentModerationAction extends JoyEnum({
  HideVideo: Null,
  HideChannel: Null,
  ChangeChannelFeatureStatus: PausableChannelFeature,
  DeleteVideo: Null,
  DeleteChannel: Null,
  DeleteVideoAssets: bool,
  DeleteNonVideoChannelAssets: Null,
}) {}

export class ContentModerationActionsSet extends BTreeSet.with(ContentModerationAction) {}

export class ModerationPermissionsByLevel extends BTreeMap.with(ChannelPrivilegeLevel, ContentModerationActionsSet) {}

export class CuratorGroup extends JoyStructDecorated({
  curators: BTreeMap.with(CuratorId, ChannelAgentPermissions),
  active: bool,
  permissions_by_level: ModerationPermissionsByLevel,
}) {}

// Channel transfers

export class TransferParameters extends JoyStructDecorated({
  new_collaborators: BTreeSet.with(MemberId),
  price: Balance,
}) {}

export class ChannelTransferStatus_PendingTransfer extends JoyStructDecorated({
  new_owner: ChannelOwner,
  transfer_params: TransferParameters,
}) {}

export class ChannelTransferStatus extends JoyEnum({
  NoActiveTransfer: Null,
  PendingTransfer: ChannelTransferStatus_PendingTransfer,
}) {}

export class ChannelOwnershipTransferRequest extends JoyStructDecorated({
  channel_id: ChannelId,
  new_owner: ChannelOwner,
  payment: Balance,
}) {}

// Nft limits

export class NftLimitId extends JoyEnum({
  GlobalDaily: Null,
  GlobalWeekly: Null,
  ChannelDaily: ChannelId,
  ChannelWeekly: ChannelId,
}) {}

export class LimitPerPeriod extends JoyStructDecorated({
  limit: u64,
  block_number_period: BlockNumber,
}) {}

export class NftCounter extends JoyStructDecorated({
  counter: u64,
  last_updated: BlockNumber,
}) {}

// Channel creation/update

export class Channel extends JoyStructDecorated({
  owner: ChannelOwner,
  num_videos: u64,
  collaborators: BTreeMap.with(MemberId, ChannelAgentPermissions),
  cumulative_payout_earned: Balance,
  privilege_level: ChannelPrivilegeLevel,
  paused_features: BTreeSet.with(PausableChannelFeature),
  transfer_status: ChannelTransferStatus,
  data_objects: BTreeSet.with(DataObjectId),
  daily_nft_limit: LimitPerPeriod,
  weekly_nft_limit: LimitPerPeriod,
  daily_nft_counter: NftCounter,
  weekly_nft_counter: NftCounter,
}) {}

export class ChannelCreationParameters extends JoyStructDecorated({
  assets: Option.with(StorageAssets),
  meta: Option.with(Bytes),
  collaborators: BTreeMap.with(MemberId, ChannelAgentPermissions),
  storage_buckets: BTreeSet.with(StorageBucketId),
  distribution_Bucket: BTreeSet.with(DistributionBucketId),
  expected_dynamic_bag_deletion_prize: Balance,
  expected_data_object_deletion_prize: Balance,
}) {}

export class ChannelUpdateParameters extends JoyStructDecorated({
  assets_to_upload: Option.with(StorageAssets),
  new_meta: Option.with(Bytes),
  assets_to_remove: BTreeSet.with(DataObjectId),
  collaborators: Option.with(BTreeMap.with(MemberId, ChannelAgentPermissions)),
  expected_data_object_deletion_prize: Balance,
}) {}

// Channel category creation/update

export class ChannelCategory extends JoyStructDecorated({
  // No runtime information is currently stored for a Category.
}) {}

export class ChannelCategoryCreationParameters extends JoyStructDecorated({
  meta: Bytes,
}) {}

export class ChannelCategoryUpdateParameters extends JoyStructDecorated({
  new_meta: Bytes,
}) {}

// Video category creation/update

export class VideoCategory extends JoyStructDecorated({
  // No runtime information is currently stored for a Category.
}) {}

export class VideoCategoryCreationParameters extends JoyStructDecorated({
  meta: Bytes,
}) {}

export class VideoCategoryUpdateParameters extends JoyStructDecorated({
  new_meta: Bytes,
}) {}

// Video creation/update

export class Video extends JoyStructDecorated({
  in_channel: ChannelId,
  nft_status: Option.with(OwnedNft),
  data_objects: BTreeSet.with(DataObjectId),
}) {}

export class VideoCreationParameters extends JoyStructDecorated({
  assets: Option.with(StorageAssets),
  meta: Option.with(Bytes),
  auto_issue_nft: Option.with(NftIssuanceParameters),
  expected_data_object_deletion_prize: Balance,
}) {}

export class VideoUpdateParameters extends JoyStructDecorated({
  assets_to_upload: Option.with(StorageAssets),
  new_meta: Option.with(Bytes),
  assets_to_remove: BTreeSet.with(DataObjectId),
  auto_issue_nft: Option.with(NftIssuanceParameters),
  expected_data_object_deletion_prize: Balance,
}) {}

// Channel payouts

export class Side extends JoyEnum({
  Left: Null,
  Right: Null,
}) {}

export class ProofElement extends JoyStructDecorated({
  hash: Hash,
  side: Side,
}) {}

export class PullPayment extends JoyStructDecorated({
  channel_id: ChannelId,
  cumulative_payout_claimed: Balance,
  reason: Hash,
}) {}

export const contentTypes = {
  CuratorId,
  CuratorGroupId,
  CuratorGroup,
  ContentActor,
  StorageAssets,
  Channel,
  ChannelOwner,
  ChannelCategoryId,
  ChannelCategory,
  ChannelCategoryCreationParameters,
  ChannelCategoryUpdateParameters,
  ChannelCreationParameters,
  ChannelUpdateParameters,
  Video,
  VideoId,
  VideoCategoryId,
  VideoCategory,
  VideoCategoryCreationParameters,
  VideoCategoryUpdateParameters,
  VideoCreationParameters,
  VideoUpdateParameters,
  MaxNumber,
  IsCensored,
  // Added in Olympia:
  Side,
  ProofElement,
  PullPayment,
  // Nft
  Royalty,
  EnglishAuctionParams,
  OpenAuctionParams,
  EnglishAuction,
  OpenAuction,
  OpenAuctionBid,
  EnglishAuctionBid,
  TransactionalStatus,
  NftOwner,
  OwnedNft,
  InitTransactionalStatus,
  NftIssuanceParameters,
  NftMetadata,
  OpenAuctionId,
  // Moderation
  ChannelPrivilegeLevel,
  PausableChannelFeature,
  ContentModerationAction,
  ContentModerationActionsSet,
  ModerationPermissionsByLevel,
  // Transfers
  TransferParameters,
  ChannelTransferStatus_PendingTransfer,
  ChannelTransferStatus,
  // Agent permissions
  ChannelActionPermission,
  ChannelAgentPermissions,
  // Nft limits
  NftLimitId,
  LimitPerPeriod,
  NftCounter,
}

export default contentTypes
