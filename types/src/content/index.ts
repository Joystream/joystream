import { Vec, Option, Tuple, BTreeSet, BTreeMap, UInt } from '@polkadot/types'
import { bool, u8, u32, u64, u128, Null, Bytes } from '@polkadot/types/primitive'
import { JoyStructDecorated, JoyEnum, ChannelId, MemberId, Balance, Hash, BlockNumber, BalanceOf } from '../common'

import { GenericAccountId as AccountId } from '@polkadot/types/generic/AccountId'
import { DataObjectId, DataObjectCreationParameters } from '../storage'

export class CuratorId extends u64 { }
export class CuratorGroupId extends u64 { }
export class ChannelCategoryId extends u64 { }
export class VideoId extends u64 { }
export class VideoCategoryId extends u64 { }
export class MaxNumber extends u32 { }
export class IsCensored extends bool { }
export class VideoPostId extends u64 { }
export class ReactionId extends u64 { }
export class CurrencyOf extends BalanceOf { }
export class CurrencyAmount extends CurrencyOf { }

// NFT types

export class Royalty extends UInt { }
export class IsExtended extends bool { }

export class EnglishAuctionDetails extends JoyStructDecorated({
    extension_period: BlockNumber,
    auction_duration: BlockNumber,
    bid_step: Balance,
}) { }

export class OpenAuctionDetails extends JoyStructDecorated({
    bid_lock_duration: BlockNumber,
}) { }

export class AuctionType extends JoyEnum({
    English: EnglishAuctionDetails,
    Open: OpenAuctionDetails,
}) { }

export class Bid extends JoyStructDecorated({
    amount: Balance,
    made_at_block: BlockNumber,
}) { }

export class Auction extends JoyStructDecorated({
    starting_price: Balance,
    buy_now_price: Option.with(Balance),
    auction_type: AuctionType,
    minimal_bid_step: Balance,
    last_bid: Option.with(Bid),
    starts_at: BlockNumber,
    whitelist: BTreeSet.with(MemberId),
}) { }

export class TransactionalStatus extends JoyEnum({
    Idle: Null,
    InitiatedOfferToMember: Tuple.with([MemberId, Option.with(Balance)]),
    Auction,
    BuyNow: Balance,
}) { }

export class NftOwner extends JoyEnum({
    ChannelOwner: Null,
    Member: MemberId,
}) { }

export class OwnedNft extends JoyStructDecorated({
    owner: NftOwner,
    transactional_status: TransactionalStatus,
    creator_royalty: Option.with(Royalty),
}) { }

export class AuctionParams extends JoyStructDecorated({
    auction_type: AuctionType,
    starting_price: Balance,
    minimal_bid_step: Balance,
    buy_now_price: Option.with(Balance),
    starts_at: Option.with(BlockNumber),
    whitelist: BTreeSet.with(MemberId),
}) { }

export class InitTransactionalStatus extends JoyEnum({
    Idle: Null,
    InitiatedOfferToMember: Tuple.with([MemberId, Option.with(Balance)]),
    BuyNow: Balance,
    Auction: AuctionParams,
}) { }

export class NftIssuanceParameters extends JoyStructDecorated({
    royalty: Option.with(Royalty),
    nft_metadata: Bytes,
    non_channel_owner: Option.with(MemberId),
    init_transactional_status: InitTransactionalStatus,
}) { }

// end of Nft types

export class StorageAssets extends JoyStructDecorated({
    object_creation_list: Vec.with(DataObjectCreationParameters),
    expected_data_size_fee: Balance,
}) { }

export class CuratorGroup extends JoyStructDecorated({
    curators: BTreeSet.with(CuratorId),
    active: bool,
}) { }

export class ContentActor extends JoyEnum({
    Curator: Tuple.with([CuratorGroupId, CuratorId]),
    Member: MemberId,
    Lead: Null,
}) { }

export class ChannelOwner extends JoyEnum({
    Member: MemberId,
    Curators: CuratorGroupId,
}) { }

export class Channel extends JoyStructDecorated({
    owner: ChannelOwner,
    num_videos: u64,
    is_censored: bool,
    reward_account: Option.with(AccountId),
    collaborators: BTreeSet.with(MemberId),
    moderators: BTreeSet.with(MemberId),
    cumulative_payout_earned: Balance,
}) { }

export class ChannelCreationParameters extends JoyStructDecorated({
    assets: Option.with(StorageAssets),
    meta: Option.with(Bytes),
    reward_account: Option.with(AccountId),
    collaborators: BTreeSet.with(MemberId),
    moderators: BTreeSet.with(MemberId),
}) { }

export class ChannelUpdateParameters extends JoyStructDecorated({
    assets_to_upload: Option.with(StorageAssets),
    new_meta: Option.with(Bytes),
    reward_account: Option.with(Option.with(AccountId)),
    assets_to_remove: BTreeSet.with(DataObjectId),
    collaborators: Option.with(BTreeSet.with(MemberId)),
}) { }

export class ChannelOwnershipTransferRequest extends JoyStructDecorated({
    channel_id: ChannelId,
    new_owner: ChannelOwner,
    payment: Balance,
    new_reward_account: Option.with(AccountId),
}) { }

export class ChannelCategory extends JoyStructDecorated({
    // No runtime information is currently stored for a Category.
}) { }

export class ChannelCategoryCreationParameters extends JoyStructDecorated({
    meta: Bytes,
}) { }

export class ChannelCategoryUpdateParameters extends JoyStructDecorated({
    new_meta: Bytes,
}) { }

export class VideoCategory extends JoyStructDecorated({
    // No runtime information is currently stored for a Category.
}) { }

export class VideoCategoryCreationParameters extends JoyStructDecorated({
    meta: Bytes,
}) { }

export class VideoCategoryUpdateParameters extends JoyStructDecorated({
    new_meta: Bytes,
}) { }

export class Video extends JoyStructDecorated({
    in_channel: ChannelId,
    is_censored: bool,
    enable_comments: bool,
    video_post_id: Option.with(VideoPostId),
    nft_status: Option.with(OwnedNft),
}) { }

export class VideoCreationParameters extends JoyStructDecorated({
    assets: Option.with(StorageAssets),
    meta: Option.with(Bytes),
    enable_comments: bool,
    auto_issue_nft: Option.with(NftIssuanceParameters),
}) { }

export class VideoUpdateParameters extends JoyStructDecorated({
    assets_to_upload: Option.with(StorageAssets),
    new_meta: Option.with(Bytes),
    assets_to_remove: BTreeSet.with(DataObjectId),
    enable_comments: Option.with(bool),
}) { }

export class VideoPostType extends JoyEnum({
    Description: Null,
    Comment: VideoPostId,
}) { }

export class VideoPost extends JoyStructDecorated({
    author: ContentActor,
    bloat_bond: Balance,
    replies_count: VideoPostId,
    post_type: VideoPostType,
    video_reference: VideoId,
}) { }

export class Side extends JoyEnum({
    Left: Null,
    Right: Null,
}) { }

export class ProofElement extends JoyStructDecorated({
    hash: Hash,
    side: Side,
}) { }

export class VideoPostCreationParameters extends JoyStructDecorated({
    post_type: VideoPostType,
    video_reference: VideoId,
}) { }

export class VideoPostDeletionParameters extends JoyStructDecorated({
    witness: Option.with(Hash),
    rationale: Option.with(Bytes),
}) { }

export class PullPayment extends JoyStructDecorated({
    channel_id: ChannelId,
    cumulative_payout_claimed: Balance,
    reason: Hash,
}) { }

export class ModeratorSet extends BTreeSet.with(MemberId) { }

export class NftMetadata extends Vec.with(u8) { }

export class AuctionRecord extends JoyStructDecorated({
    starting_price: u128, // Balance
    buy_now_price: u128, // Balance
    auction_type: AuctionType,
    starts_at: Option.with(u32), // Option<BlockNumber>
    whitelist: BTreeSet.with(MemberId),
    bid_list: BTreeMap.with(MemberId, Bid),
}) { }

export class NFTOwner extends JoyEnum({
    ChannelOwner: Null,
    Member: MemberId,
}) { }

export class OwnedNFT extends JoyStructDecorated({
    owner: NFTOwner,
    transactional_status: TransactionalStatus,
    creator_royalty: Option.with(Royalty),
}) { }

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
    IsExtended,
    EnglishAuctionDetails,
    OpenAuctionDetails,
    AuctionType,
    Bid,
    Auction,
    TransactionalStatus,
    NftOwner,
    OwnedNft,
    AuctionParams,
    CurrencyOf,
    CurrencyAmount,
    InitTransactionalStatus,
    NftIssuanceParameters,
    AuctionRecord,
    NFTOwner,
    OwnedNFT,
    NftMetadata,
}

export default contentTypes
