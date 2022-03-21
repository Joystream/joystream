import { Vec, Option, Tuple, BTreeSet, UInt, BTreeMap } from '@polkadot/types'
import { bool, u8, u32, u64, Null, Bytes } from '@polkadot/types/primitive'
import { JoyStructDecorated, JoyEnum, ChannelId, MemberId, Balance, Hash, BlockNumber } from '../common'
import { DataObjectId, DataObjectCreationParameters } from '../storage'

export class OpenAuctionId extends u64 {}
export class CuratorId extends u64 {}
export class CuratorGroupId extends u64 {}
export class ChannelCategoryId extends u64 {}
export class VideoId extends u64 {}
export class VideoCategoryId extends u64 {}
export class MaxNumber extends u32 {}
export class IsCensored extends bool {}
export class VideoPostId extends u64 {}
export class ReactionId extends u64 {}
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
  top_bid: Option.with(EnglishAuctionBid),
  whitelist: BTreeSet.with(MemberId),
  extension_period: BlockNumber,
  auction_duration: BlockNumber,
  min_bid_step: Balance,
  end: BlockNumber,
}) {}

export class OpenAuction extends JoyStructDecorated({
  starting_price: Balance,
  buy_now_price: Option.with(Balance),
  whitelist: BTreeSet.with(MemberId),
  bid_lock_duration: BlockNumber,
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
  DeleteVideoAssets: Null,
  DeleteNftVideoAssets: Null,
  DeleteChannelAssets: Null,
}) {}

export class ContentModerationActionsSet extends BTreeSet.with(ContentModerationAction) {}

export class ModerationPermissionsByLevel extends BTreeMap.with(ChannelPrivilegeLevel, ContentModerationActionsSet) {}

export class CuratorGroup extends JoyStructDecorated({
  curators: BTreeSet.with(CuratorId),
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

// Channel creation/update

export class Channel extends JoyStructDecorated({
  owner: ChannelOwner,
  num_videos: u64,
  collaborators: BTreeSet.with(MemberId),
  moderators: BTreeSet.with(MemberId),
  cumulative_payout_earned: Balance,
  privilege_level: ChannelPrivilegeLevel,
  paused_features: BTreeSet.with(PausableChannelFeature),
  transfer_status: ChannelTransferStatus,
  data_objects: BTreeSet.with(DataObjectId),
}) {}

export class ChannelCreationParameters extends JoyStructDecorated({
  assets: Option.with(StorageAssets),
  meta: Option.with(Bytes),
  collaborators: BTreeSet.with(MemberId),
  moderators: BTreeSet.with(MemberId),
}) {}

export class ChannelUpdateParameters extends JoyStructDecorated({
  assets_to_upload: Option.with(StorageAssets),
  new_meta: Option.with(Bytes),
  assets_to_remove: BTreeSet.with(DataObjectId),
  collaborators: Option.with(BTreeSet.with(MemberId)),
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
  enable_comments: bool,
  video_post_id: Option.with(VideoPostId),
  nft_status: Option.with(OwnedNft),
  data_objects: BTreeSet.with(DataObjectId),
}) {}

export class VideoCreationParameters extends JoyStructDecorated({
  assets: Option.with(StorageAssets),
  meta: Option.with(Bytes),
  enable_comments: bool,
  auto_issue_nft: Option.with(NftIssuanceParameters),
}) {}

export class VideoUpdateParameters extends JoyStructDecorated({
  assets_to_upload: Option.with(StorageAssets),
  new_meta: Option.with(Bytes),
  assets_to_remove: BTreeSet.with(DataObjectId),
  enable_comments: Option.with(bool),
  auto_issue_nft: Option.with(NftIssuanceParameters),
}) {}

// Video posts

export class VideoPostType extends JoyEnum({
  Description: Null,
  Comment: VideoPostId,
}) {}

export class VideoPost extends JoyStructDecorated({
  author: ContentActor,
  bloat_bond: Balance,
  replies_count: VideoPostId,
  post_type: VideoPostType,
  video_reference: VideoId,
}) {}

export class VideoPostCreationParameters extends JoyStructDecorated({
  post_type: VideoPostType,
  video_reference: VideoId,
}) {}

export class VideoPostDeletionParameters extends JoyStructDecorated({
  witness: Option.with(Hash),
  rationale: Option.with(Bytes),
}) {}

export class ModeratorSet extends BTreeSet.with(MemberId) {}

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
  VideoPostId,
  ReactionId,
  VideoPostType,
  VideoPost,
  Side,
  ProofElement,
  VideoPostCreationParameters,
  VideoPostDeletionParameters,
  PullPayment,
  ModeratorSet,
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
}

export default contentTypes
