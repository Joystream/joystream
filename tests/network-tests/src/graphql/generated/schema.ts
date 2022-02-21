export type Maybe<T> = T | null
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  /** The javascript `Date` as string. Type represents date and time as the ISO Date string. */
  DateTime: any
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: any
  /** GraphQL representation of BigInt */
  BigInt: any
}

/** Represents NFT auction */
export type Auction = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  video: Video
  videoId: Scalars['String']
  initialOwner: Membership
  initialOwnerId: Scalars['String']
  winningMember?: Maybe<Membership>
  winningMemberId?: Maybe<Scalars['String']>
  /** Auction starting price */
  startingPrice: Scalars['BigInt']
  /** Whether auction can be completed instantly */
  buyNowPrice?: Maybe<Scalars['BigInt']>
  /** The type of auction */
  auctionType: AuctionType
  /** Minimal step between auction bids */
  minimalBidStep: Scalars['BigInt']
  lastBid?: Maybe<Bid>
  lastBidId?: Maybe<Scalars['String']>
  bids: Array<Bid>
  /** Block when auction starts */
  startsAtBlock: Scalars['Int']
  /** Block when auction starts */
  endedAtBlock: Scalars['Int']
  /** Is auction canceled */
  isCanceled: Scalars['Boolean']
  /** Is auction completed */
  isCompleted: Scalars['Boolean']
  whitelistedMembers: Array<Membership>
  auctionstartedeventauction?: Maybe<Array<AuctionStartedEvent>>
}

export type AuctionBidCanceledEvent = Event &
  BaseGraphQlObject & {
    /** Hash of the extrinsic which caused the event to be emitted. */
    inExtrinsic?: Maybe<Scalars['String']>
    /** Blocknumber of the block in which the event was emitted. */
    inBlock: Scalars['Int']
    /** Network the block was produced in. */
    network: Network
    /** Index of event in block from which it was emitted. */
    indexInBlock: Scalars['Int']
    /** Filtering options for interface implementers */
    type?: Maybe<EventTypeOptions>
    id: Scalars['ID']
    createdAt: Scalars['DateTime']
    createdById: Scalars['String']
    updatedAt?: Maybe<Scalars['DateTime']>
    updatedById?: Maybe<Scalars['String']>
    deletedAt?: Maybe<Scalars['DateTime']>
    deletedById?: Maybe<Scalars['String']>
    version: Scalars['Int']
    member: Membership
    memberId: Scalars['String']
    video: Video
    videoId: Scalars['String']
  }

export type AuctionBidCanceledEventConnection = {
  totalCount: Scalars['Int']
  edges: Array<AuctionBidCanceledEventEdge>
  pageInfo: PageInfo
}

export type AuctionBidCanceledEventCreateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock: Scalars['Float']
  network: Network
  indexInBlock: Scalars['Float']
  member: Scalars['ID']
  video: Scalars['ID']
}

export type AuctionBidCanceledEventEdge = {
  node: AuctionBidCanceledEvent
  cursor: Scalars['String']
}

export enum AuctionBidCanceledEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  InExtrinsicAsc = 'inExtrinsic_ASC',
  InExtrinsicDesc = 'inExtrinsic_DESC',
  InBlockAsc = 'inBlock_ASC',
  InBlockDesc = 'inBlock_DESC',
  NetworkAsc = 'network_ASC',
  NetworkDesc = 'network_DESC',
  IndexInBlockAsc = 'indexInBlock_ASC',
  IndexInBlockDesc = 'indexInBlock_DESC',
  MemberAsc = 'member_ASC',
  MemberDesc = 'member_DESC',
  VideoAsc = 'video_ASC',
  VideoDesc = 'video_DESC',
}

export type AuctionBidCanceledEventUpdateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock?: Maybe<Scalars['Float']>
  network?: Maybe<Network>
  indexInBlock?: Maybe<Scalars['Float']>
  member?: Maybe<Scalars['ID']>
  video?: Maybe<Scalars['ID']>
}

export type AuctionBidCanceledEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  inExtrinsic_eq?: Maybe<Scalars['String']>
  inExtrinsic_contains?: Maybe<Scalars['String']>
  inExtrinsic_startsWith?: Maybe<Scalars['String']>
  inExtrinsic_endsWith?: Maybe<Scalars['String']>
  inExtrinsic_in?: Maybe<Array<Scalars['String']>>
  inBlock_eq?: Maybe<Scalars['Int']>
  inBlock_gt?: Maybe<Scalars['Int']>
  inBlock_gte?: Maybe<Scalars['Int']>
  inBlock_lt?: Maybe<Scalars['Int']>
  inBlock_lte?: Maybe<Scalars['Int']>
  inBlock_in?: Maybe<Array<Scalars['Int']>>
  network_eq?: Maybe<Network>
  network_in?: Maybe<Array<Network>>
  indexInBlock_eq?: Maybe<Scalars['Int']>
  indexInBlock_gt?: Maybe<Scalars['Int']>
  indexInBlock_gte?: Maybe<Scalars['Int']>
  indexInBlock_lt?: Maybe<Scalars['Int']>
  indexInBlock_lte?: Maybe<Scalars['Int']>
  indexInBlock_in?: Maybe<Array<Scalars['Int']>>
  member?: Maybe<MembershipWhereInput>
  video?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<AuctionBidCanceledEventWhereInput>>
  OR?: Maybe<Array<AuctionBidCanceledEventWhereInput>>
}

export type AuctionBidCanceledEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type AuctionBidMadeEvent = Event &
  BaseGraphQlObject & {
    /** Hash of the extrinsic which caused the event to be emitted. */
    inExtrinsic?: Maybe<Scalars['String']>
    /** Blocknumber of the block in which the event was emitted. */
    inBlock: Scalars['Int']
    /** Network the block was produced in. */
    network: Network
    /** Index of event in block from which it was emitted. */
    indexInBlock: Scalars['Int']
    /** Filtering options for interface implementers */
    type?: Maybe<EventTypeOptions>
    id: Scalars['ID']
    createdAt: Scalars['DateTime']
    createdById: Scalars['String']
    updatedAt?: Maybe<Scalars['DateTime']>
    updatedById?: Maybe<Scalars['String']>
    deletedAt?: Maybe<Scalars['DateTime']>
    deletedById?: Maybe<Scalars['String']>
    version: Scalars['Int']
    member: Membership
    memberId: Scalars['String']
    video: Video
    videoId: Scalars['String']
    /** Bid made. */
    bidAmount: Scalars['BigInt']
    /** Sign of auction duration being extended by making this bid. */
    extendsAuction: Scalars['Boolean']
  }

export type AuctionBidMadeEventConnection = {
  totalCount: Scalars['Int']
  edges: Array<AuctionBidMadeEventEdge>
  pageInfo: PageInfo
}

export type AuctionBidMadeEventCreateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock: Scalars['Float']
  network: Network
  indexInBlock: Scalars['Float']
  member: Scalars['ID']
  video: Scalars['ID']
  bidAmount: Scalars['String']
  extendsAuction: Scalars['Boolean']
}

export type AuctionBidMadeEventEdge = {
  node: AuctionBidMadeEvent
  cursor: Scalars['String']
}

export enum AuctionBidMadeEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  InExtrinsicAsc = 'inExtrinsic_ASC',
  InExtrinsicDesc = 'inExtrinsic_DESC',
  InBlockAsc = 'inBlock_ASC',
  InBlockDesc = 'inBlock_DESC',
  NetworkAsc = 'network_ASC',
  NetworkDesc = 'network_DESC',
  IndexInBlockAsc = 'indexInBlock_ASC',
  IndexInBlockDesc = 'indexInBlock_DESC',
  MemberAsc = 'member_ASC',
  MemberDesc = 'member_DESC',
  VideoAsc = 'video_ASC',
  VideoDesc = 'video_DESC',
  BidAmountAsc = 'bidAmount_ASC',
  BidAmountDesc = 'bidAmount_DESC',
  ExtendsAuctionAsc = 'extendsAuction_ASC',
  ExtendsAuctionDesc = 'extendsAuction_DESC',
}

export type AuctionBidMadeEventUpdateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock?: Maybe<Scalars['Float']>
  network?: Maybe<Network>
  indexInBlock?: Maybe<Scalars['Float']>
  member?: Maybe<Scalars['ID']>
  video?: Maybe<Scalars['ID']>
  bidAmount?: Maybe<Scalars['String']>
  extendsAuction?: Maybe<Scalars['Boolean']>
}

export type AuctionBidMadeEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  inExtrinsic_eq?: Maybe<Scalars['String']>
  inExtrinsic_contains?: Maybe<Scalars['String']>
  inExtrinsic_startsWith?: Maybe<Scalars['String']>
  inExtrinsic_endsWith?: Maybe<Scalars['String']>
  inExtrinsic_in?: Maybe<Array<Scalars['String']>>
  inBlock_eq?: Maybe<Scalars['Int']>
  inBlock_gt?: Maybe<Scalars['Int']>
  inBlock_gte?: Maybe<Scalars['Int']>
  inBlock_lt?: Maybe<Scalars['Int']>
  inBlock_lte?: Maybe<Scalars['Int']>
  inBlock_in?: Maybe<Array<Scalars['Int']>>
  network_eq?: Maybe<Network>
  network_in?: Maybe<Array<Network>>
  indexInBlock_eq?: Maybe<Scalars['Int']>
  indexInBlock_gt?: Maybe<Scalars['Int']>
  indexInBlock_gte?: Maybe<Scalars['Int']>
  indexInBlock_lt?: Maybe<Scalars['Int']>
  indexInBlock_lte?: Maybe<Scalars['Int']>
  indexInBlock_in?: Maybe<Array<Scalars['Int']>>
  bidAmount_eq?: Maybe<Scalars['BigInt']>
  bidAmount_gt?: Maybe<Scalars['BigInt']>
  bidAmount_gte?: Maybe<Scalars['BigInt']>
  bidAmount_lt?: Maybe<Scalars['BigInt']>
  bidAmount_lte?: Maybe<Scalars['BigInt']>
  bidAmount_in?: Maybe<Array<Scalars['BigInt']>>
  extendsAuction_eq?: Maybe<Scalars['Boolean']>
  extendsAuction_in?: Maybe<Array<Scalars['Boolean']>>
  member?: Maybe<MembershipWhereInput>
  video?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<AuctionBidMadeEventWhereInput>>
  OR?: Maybe<Array<AuctionBidMadeEventWhereInput>>
}

export type AuctionBidMadeEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type AuctionCanceledEvent = Event &
  BaseGraphQlObject & {
    /** Hash of the extrinsic which caused the event to be emitted. */
    inExtrinsic?: Maybe<Scalars['String']>
    /** Blocknumber of the block in which the event was emitted. */
    inBlock: Scalars['Int']
    /** Network the block was produced in. */
    network: Network
    /** Index of event in block from which it was emitted. */
    indexInBlock: Scalars['Int']
    /** Filtering options for interface implementers */
    type?: Maybe<EventTypeOptions>
    id: Scalars['ID']
    createdAt: Scalars['DateTime']
    createdById: Scalars['String']
    updatedAt?: Maybe<Scalars['DateTime']>
    updatedById?: Maybe<Scalars['String']>
    deletedAt?: Maybe<Scalars['DateTime']>
    deletedById?: Maybe<Scalars['String']>
    version: Scalars['Int']
    /** Content actor canceling the event. */
    contentActor: ContentActor
    video: Video
    videoId: Scalars['String']
  }

export type AuctionCanceledEventConnection = {
  totalCount: Scalars['Int']
  edges: Array<AuctionCanceledEventEdge>
  pageInfo: PageInfo
}

export type AuctionCanceledEventCreateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock: Scalars['Float']
  network: Network
  indexInBlock: Scalars['Float']
  contentActor: Scalars['JSONObject']
  video: Scalars['ID']
}

export type AuctionCanceledEventEdge = {
  node: AuctionCanceledEvent
  cursor: Scalars['String']
}

export enum AuctionCanceledEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  InExtrinsicAsc = 'inExtrinsic_ASC',
  InExtrinsicDesc = 'inExtrinsic_DESC',
  InBlockAsc = 'inBlock_ASC',
  InBlockDesc = 'inBlock_DESC',
  NetworkAsc = 'network_ASC',
  NetworkDesc = 'network_DESC',
  IndexInBlockAsc = 'indexInBlock_ASC',
  IndexInBlockDesc = 'indexInBlock_DESC',
  VideoAsc = 'video_ASC',
  VideoDesc = 'video_DESC',
}

export type AuctionCanceledEventUpdateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock?: Maybe<Scalars['Float']>
  network?: Maybe<Network>
  indexInBlock?: Maybe<Scalars['Float']>
  contentActor?: Maybe<Scalars['JSONObject']>
  video?: Maybe<Scalars['ID']>
}

export type AuctionCanceledEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  inExtrinsic_eq?: Maybe<Scalars['String']>
  inExtrinsic_contains?: Maybe<Scalars['String']>
  inExtrinsic_startsWith?: Maybe<Scalars['String']>
  inExtrinsic_endsWith?: Maybe<Scalars['String']>
  inExtrinsic_in?: Maybe<Array<Scalars['String']>>
  inBlock_eq?: Maybe<Scalars['Int']>
  inBlock_gt?: Maybe<Scalars['Int']>
  inBlock_gte?: Maybe<Scalars['Int']>
  inBlock_lt?: Maybe<Scalars['Int']>
  inBlock_lte?: Maybe<Scalars['Int']>
  inBlock_in?: Maybe<Array<Scalars['Int']>>
  network_eq?: Maybe<Network>
  network_in?: Maybe<Array<Network>>
  indexInBlock_eq?: Maybe<Scalars['Int']>
  indexInBlock_gt?: Maybe<Scalars['Int']>
  indexInBlock_gte?: Maybe<Scalars['Int']>
  indexInBlock_lt?: Maybe<Scalars['Int']>
  indexInBlock_lte?: Maybe<Scalars['Int']>
  indexInBlock_in?: Maybe<Array<Scalars['Int']>>
  contentActor_json?: Maybe<Scalars['JSONObject']>
  video?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<AuctionCanceledEventWhereInput>>
  OR?: Maybe<Array<AuctionCanceledEventWhereInput>>
}

export type AuctionCanceledEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type AuctionConnection = {
  totalCount: Scalars['Int']
  edges: Array<AuctionEdge>
  pageInfo: PageInfo
}

export type AuctionCreateInput = {
  video: Scalars['ID']
  initialOwner: Scalars['ID']
  winningMember?: Maybe<Scalars['ID']>
  startingPrice: Scalars['String']
  buyNowPrice?: Maybe<Scalars['String']>
  auctionType: Scalars['JSONObject']
  minimalBidStep: Scalars['String']
  lastBid?: Maybe<Scalars['ID']>
  startsAtBlock: Scalars['Float']
  endedAtBlock: Scalars['Float']
  isCanceled: Scalars['Boolean']
  isCompleted: Scalars['Boolean']
}

export type AuctionEdge = {
  node: Auction
  cursor: Scalars['String']
}

export enum AuctionOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  VideoAsc = 'video_ASC',
  VideoDesc = 'video_DESC',
  InitialOwnerAsc = 'initialOwner_ASC',
  InitialOwnerDesc = 'initialOwner_DESC',
  WinningMemberAsc = 'winningMember_ASC',
  WinningMemberDesc = 'winningMember_DESC',
  StartingPriceAsc = 'startingPrice_ASC',
  StartingPriceDesc = 'startingPrice_DESC',
  BuyNowPriceAsc = 'buyNowPrice_ASC',
  BuyNowPriceDesc = 'buyNowPrice_DESC',
  MinimalBidStepAsc = 'minimalBidStep_ASC',
  MinimalBidStepDesc = 'minimalBidStep_DESC',
  LastBidAsc = 'lastBid_ASC',
  LastBidDesc = 'lastBid_DESC',
  StartsAtBlockAsc = 'startsAtBlock_ASC',
  StartsAtBlockDesc = 'startsAtBlock_DESC',
  EndedAtBlockAsc = 'endedAtBlock_ASC',
  EndedAtBlockDesc = 'endedAtBlock_DESC',
  IsCanceledAsc = 'isCanceled_ASC',
  IsCanceledDesc = 'isCanceled_DESC',
  IsCompletedAsc = 'isCompleted_ASC',
  IsCompletedDesc = 'isCompleted_DESC',
}

export type AuctionStartedEvent = Event &
  BaseGraphQlObject & {
    /** Hash of the extrinsic which caused the event to be emitted. */
    inExtrinsic?: Maybe<Scalars['String']>
    /** Blocknumber of the block in which the event was emitted. */
    inBlock: Scalars['Int']
    /** Network the block was produced in. */
    network: Network
    /** Index of event in block from which it was emitted. */
    indexInBlock: Scalars['Int']
    /** Filtering options for interface implementers */
    type?: Maybe<EventTypeOptions>
    id: Scalars['ID']
    createdAt: Scalars['DateTime']
    createdById: Scalars['String']
    updatedAt?: Maybe<Scalars['DateTime']>
    updatedById?: Maybe<Scalars['String']>
    deletedAt?: Maybe<Scalars['DateTime']>
    deletedById?: Maybe<Scalars['String']>
    version: Scalars['Int']
    /** Actor that started this auction. */
    actor: ContentActor
    video: Video
    videoId: Scalars['String']
    auction: Auction
    auctionId: Scalars['String']
  }

export type AuctionStartedEventConnection = {
  totalCount: Scalars['Int']
  edges: Array<AuctionStartedEventEdge>
  pageInfo: PageInfo
}

export type AuctionStartedEventCreateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock: Scalars['Float']
  network: Network
  indexInBlock: Scalars['Float']
  actor: Scalars['JSONObject']
  video: Scalars['ID']
  auction: Scalars['ID']
}

export type AuctionStartedEventEdge = {
  node: AuctionStartedEvent
  cursor: Scalars['String']
}

export enum AuctionStartedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  InExtrinsicAsc = 'inExtrinsic_ASC',
  InExtrinsicDesc = 'inExtrinsic_DESC',
  InBlockAsc = 'inBlock_ASC',
  InBlockDesc = 'inBlock_DESC',
  NetworkAsc = 'network_ASC',
  NetworkDesc = 'network_DESC',
  IndexInBlockAsc = 'indexInBlock_ASC',
  IndexInBlockDesc = 'indexInBlock_DESC',
  VideoAsc = 'video_ASC',
  VideoDesc = 'video_DESC',
  AuctionAsc = 'auction_ASC',
  AuctionDesc = 'auction_DESC',
}

export type AuctionStartedEventUpdateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock?: Maybe<Scalars['Float']>
  network?: Maybe<Network>
  indexInBlock?: Maybe<Scalars['Float']>
  actor?: Maybe<Scalars['JSONObject']>
  video?: Maybe<Scalars['ID']>
  auction?: Maybe<Scalars['ID']>
}

export type AuctionStartedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  inExtrinsic_eq?: Maybe<Scalars['String']>
  inExtrinsic_contains?: Maybe<Scalars['String']>
  inExtrinsic_startsWith?: Maybe<Scalars['String']>
  inExtrinsic_endsWith?: Maybe<Scalars['String']>
  inExtrinsic_in?: Maybe<Array<Scalars['String']>>
  inBlock_eq?: Maybe<Scalars['Int']>
  inBlock_gt?: Maybe<Scalars['Int']>
  inBlock_gte?: Maybe<Scalars['Int']>
  inBlock_lt?: Maybe<Scalars['Int']>
  inBlock_lte?: Maybe<Scalars['Int']>
  inBlock_in?: Maybe<Array<Scalars['Int']>>
  network_eq?: Maybe<Network>
  network_in?: Maybe<Array<Network>>
  indexInBlock_eq?: Maybe<Scalars['Int']>
  indexInBlock_gt?: Maybe<Scalars['Int']>
  indexInBlock_gte?: Maybe<Scalars['Int']>
  indexInBlock_lt?: Maybe<Scalars['Int']>
  indexInBlock_lte?: Maybe<Scalars['Int']>
  indexInBlock_in?: Maybe<Array<Scalars['Int']>>
  actor_json?: Maybe<Scalars['JSONObject']>
  video?: Maybe<VideoWhereInput>
  auction?: Maybe<AuctionWhereInput>
  AND?: Maybe<Array<AuctionStartedEventWhereInput>>
  OR?: Maybe<Array<AuctionStartedEventWhereInput>>
}

export type AuctionStartedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type AuctionType = AuctionTypeEnglish | AuctionTypeOpen

export type AuctionTypeEnglish = {
  /** English auction duration */
  duration: Scalars['Int']
  /** Auction extension time */
  extensionPeriod?: Maybe<Scalars['Int']>
}

export type AuctionTypeOpen = {
  /** Auction bid lock duration */
  bidLockingTime: Scalars['Int']
}

export type AuctionUpdateInput = {
  video?: Maybe<Scalars['ID']>
  initialOwner?: Maybe<Scalars['ID']>
  winningMember?: Maybe<Scalars['ID']>
  startingPrice?: Maybe<Scalars['String']>
  buyNowPrice?: Maybe<Scalars['String']>
  auctionType?: Maybe<Scalars['JSONObject']>
  minimalBidStep?: Maybe<Scalars['String']>
  lastBid?: Maybe<Scalars['ID']>
  startsAtBlock?: Maybe<Scalars['Float']>
  endedAtBlock?: Maybe<Scalars['Float']>
  isCanceled?: Maybe<Scalars['Boolean']>
  isCompleted?: Maybe<Scalars['Boolean']>
}

export type AuctionWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  startingPrice_eq?: Maybe<Scalars['BigInt']>
  startingPrice_gt?: Maybe<Scalars['BigInt']>
  startingPrice_gte?: Maybe<Scalars['BigInt']>
  startingPrice_lt?: Maybe<Scalars['BigInt']>
  startingPrice_lte?: Maybe<Scalars['BigInt']>
  startingPrice_in?: Maybe<Array<Scalars['BigInt']>>
  buyNowPrice_eq?: Maybe<Scalars['BigInt']>
  buyNowPrice_gt?: Maybe<Scalars['BigInt']>
  buyNowPrice_gte?: Maybe<Scalars['BigInt']>
  buyNowPrice_lt?: Maybe<Scalars['BigInt']>
  buyNowPrice_lte?: Maybe<Scalars['BigInt']>
  buyNowPrice_in?: Maybe<Array<Scalars['BigInt']>>
  auctionType_json?: Maybe<Scalars['JSONObject']>
  minimalBidStep_eq?: Maybe<Scalars['BigInt']>
  minimalBidStep_gt?: Maybe<Scalars['BigInt']>
  minimalBidStep_gte?: Maybe<Scalars['BigInt']>
  minimalBidStep_lt?: Maybe<Scalars['BigInt']>
  minimalBidStep_lte?: Maybe<Scalars['BigInt']>
  minimalBidStep_in?: Maybe<Array<Scalars['BigInt']>>
  startsAtBlock_eq?: Maybe<Scalars['Int']>
  startsAtBlock_gt?: Maybe<Scalars['Int']>
  startsAtBlock_gte?: Maybe<Scalars['Int']>
  startsAtBlock_lt?: Maybe<Scalars['Int']>
  startsAtBlock_lte?: Maybe<Scalars['Int']>
  startsAtBlock_in?: Maybe<Array<Scalars['Int']>>
  endedAtBlock_eq?: Maybe<Scalars['Int']>
  endedAtBlock_gt?: Maybe<Scalars['Int']>
  endedAtBlock_gte?: Maybe<Scalars['Int']>
  endedAtBlock_lt?: Maybe<Scalars['Int']>
  endedAtBlock_lte?: Maybe<Scalars['Int']>
  endedAtBlock_in?: Maybe<Array<Scalars['Int']>>
  isCanceled_eq?: Maybe<Scalars['Boolean']>
  isCanceled_in?: Maybe<Array<Scalars['Boolean']>>
  isCompleted_eq?: Maybe<Scalars['Boolean']>
  isCompleted_in?: Maybe<Array<Scalars['Boolean']>>
  video?: Maybe<VideoWhereInput>
  initialOwner?: Maybe<MembershipWhereInput>
  winningMember?: Maybe<MembershipWhereInput>
  lastBid?: Maybe<BidWhereInput>
  bids_none?: Maybe<BidWhereInput>
  bids_some?: Maybe<BidWhereInput>
  bids_every?: Maybe<BidWhereInput>
  whitelistedMembers_none?: Maybe<MembershipWhereInput>
  whitelistedMembers_some?: Maybe<MembershipWhereInput>
  whitelistedMembers_every?: Maybe<MembershipWhereInput>
  auctionstartedeventauction_none?: Maybe<AuctionStartedEventWhereInput>
  auctionstartedeventauction_some?: Maybe<AuctionStartedEventWhereInput>
  auctionstartedeventauction_every?: Maybe<AuctionStartedEventWhereInput>
  AND?: Maybe<Array<AuctionWhereInput>>
  OR?: Maybe<Array<AuctionWhereInput>>
}

export type AuctionWhereUniqueInput = {
  id: Scalars['ID']
}

export type BaseGraphQlObject = {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
}

export type BaseModel = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
}

export type BaseModelUuid = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
}

export type BaseWhereInput = {
  id_eq?: Maybe<Scalars['String']>
  id_in?: Maybe<Array<Scalars['String']>>
  createdAt_eq?: Maybe<Scalars['String']>
  createdAt_lt?: Maybe<Scalars['String']>
  createdAt_lte?: Maybe<Scalars['String']>
  createdAt_gt?: Maybe<Scalars['String']>
  createdAt_gte?: Maybe<Scalars['String']>
  createdById_eq?: Maybe<Scalars['String']>
  updatedAt_eq?: Maybe<Scalars['String']>
  updatedAt_lt?: Maybe<Scalars['String']>
  updatedAt_lte?: Maybe<Scalars['String']>
  updatedAt_gt?: Maybe<Scalars['String']>
  updatedAt_gte?: Maybe<Scalars['String']>
  updatedById_eq?: Maybe<Scalars['String']>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['String']>
  deletedAt_lt?: Maybe<Scalars['String']>
  deletedAt_lte?: Maybe<Scalars['String']>
  deletedAt_gt?: Maybe<Scalars['String']>
  deletedAt_gte?: Maybe<Scalars['String']>
  deletedById_eq?: Maybe<Scalars['String']>
}

/** Represents bid in NFT auction */
export type Bid = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  auction: Auction
  auctionId: Scalars['String']
  bidder: Membership
  bidderId: Scalars['String']
  /** Amount bidded */
  amount: Scalars['BigInt']
  isCanceled: Scalars['Boolean']
  /** Block in which the bid was placed */
  createdInBlock: Scalars['Int']
  auctionlastBid?: Maybe<Array<Auction>>
}

export type BidConnection = {
  totalCount: Scalars['Int']
  edges: Array<BidEdge>
  pageInfo: PageInfo
}

export type BidCreateInput = {
  auction: Scalars['ID']
  bidder: Scalars['ID']
  amount: Scalars['String']
  isCanceled: Scalars['Boolean']
  createdInBlock: Scalars['Float']
}

export type BidEdge = {
  node: Bid
  cursor: Scalars['String']
}

export type BidMadeCompletingAuctionEvent = Event &
  BaseGraphQlObject & {
    /** Hash of the extrinsic which caused the event to be emitted. */
    inExtrinsic?: Maybe<Scalars['String']>
    /** Blocknumber of the block in which the event was emitted. */
    inBlock: Scalars['Int']
    /** Network the block was produced in. */
    network: Network
    /** Index of event in block from which it was emitted. */
    indexInBlock: Scalars['Int']
    /** Filtering options for interface implementers */
    type?: Maybe<EventTypeOptions>
    id: Scalars['ID']
    createdAt: Scalars['DateTime']
    createdById: Scalars['String']
    updatedAt?: Maybe<Scalars['DateTime']>
    updatedById?: Maybe<Scalars['String']>
    deletedAt?: Maybe<Scalars['DateTime']>
    deletedById?: Maybe<Scalars['String']>
    version: Scalars['Int']
    member: Membership
    memberId: Scalars['String']
    video: Video
    videoId: Scalars['String']
  }

export type BidMadeCompletingAuctionEventConnection = {
  totalCount: Scalars['Int']
  edges: Array<BidMadeCompletingAuctionEventEdge>
  pageInfo: PageInfo
}

export type BidMadeCompletingAuctionEventCreateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock: Scalars['Float']
  network: Network
  indexInBlock: Scalars['Float']
  member: Scalars['ID']
  video: Scalars['ID']
}

export type BidMadeCompletingAuctionEventEdge = {
  node: BidMadeCompletingAuctionEvent
  cursor: Scalars['String']
}

export enum BidMadeCompletingAuctionEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  InExtrinsicAsc = 'inExtrinsic_ASC',
  InExtrinsicDesc = 'inExtrinsic_DESC',
  InBlockAsc = 'inBlock_ASC',
  InBlockDesc = 'inBlock_DESC',
  NetworkAsc = 'network_ASC',
  NetworkDesc = 'network_DESC',
  IndexInBlockAsc = 'indexInBlock_ASC',
  IndexInBlockDesc = 'indexInBlock_DESC',
  MemberAsc = 'member_ASC',
  MemberDesc = 'member_DESC',
  VideoAsc = 'video_ASC',
  VideoDesc = 'video_DESC',
}

export type BidMadeCompletingAuctionEventUpdateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock?: Maybe<Scalars['Float']>
  network?: Maybe<Network>
  indexInBlock?: Maybe<Scalars['Float']>
  member?: Maybe<Scalars['ID']>
  video?: Maybe<Scalars['ID']>
}

export type BidMadeCompletingAuctionEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  inExtrinsic_eq?: Maybe<Scalars['String']>
  inExtrinsic_contains?: Maybe<Scalars['String']>
  inExtrinsic_startsWith?: Maybe<Scalars['String']>
  inExtrinsic_endsWith?: Maybe<Scalars['String']>
  inExtrinsic_in?: Maybe<Array<Scalars['String']>>
  inBlock_eq?: Maybe<Scalars['Int']>
  inBlock_gt?: Maybe<Scalars['Int']>
  inBlock_gte?: Maybe<Scalars['Int']>
  inBlock_lt?: Maybe<Scalars['Int']>
  inBlock_lte?: Maybe<Scalars['Int']>
  inBlock_in?: Maybe<Array<Scalars['Int']>>
  network_eq?: Maybe<Network>
  network_in?: Maybe<Array<Network>>
  indexInBlock_eq?: Maybe<Scalars['Int']>
  indexInBlock_gt?: Maybe<Scalars['Int']>
  indexInBlock_gte?: Maybe<Scalars['Int']>
  indexInBlock_lt?: Maybe<Scalars['Int']>
  indexInBlock_lte?: Maybe<Scalars['Int']>
  indexInBlock_in?: Maybe<Array<Scalars['Int']>>
  member?: Maybe<MembershipWhereInput>
  video?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<BidMadeCompletingAuctionEventWhereInput>>
  OR?: Maybe<Array<BidMadeCompletingAuctionEventWhereInput>>
}

export type BidMadeCompletingAuctionEventWhereUniqueInput = {
  id: Scalars['ID']
}

export enum BidOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  AuctionAsc = 'auction_ASC',
  AuctionDesc = 'auction_DESC',
  BidderAsc = 'bidder_ASC',
  BidderDesc = 'bidder_DESC',
  AmountAsc = 'amount_ASC',
  AmountDesc = 'amount_DESC',
  IsCanceledAsc = 'isCanceled_ASC',
  IsCanceledDesc = 'isCanceled_DESC',
  CreatedInBlockAsc = 'createdInBlock_ASC',
  CreatedInBlockDesc = 'createdInBlock_DESC',
}

export type BidUpdateInput = {
  auction?: Maybe<Scalars['ID']>
  bidder?: Maybe<Scalars['ID']>
  amount?: Maybe<Scalars['String']>
  isCanceled?: Maybe<Scalars['Boolean']>
  createdInBlock?: Maybe<Scalars['Float']>
}

export type BidWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  amount_eq?: Maybe<Scalars['BigInt']>
  amount_gt?: Maybe<Scalars['BigInt']>
  amount_gte?: Maybe<Scalars['BigInt']>
  amount_lt?: Maybe<Scalars['BigInt']>
  amount_lte?: Maybe<Scalars['BigInt']>
  amount_in?: Maybe<Array<Scalars['BigInt']>>
  isCanceled_eq?: Maybe<Scalars['Boolean']>
  isCanceled_in?: Maybe<Array<Scalars['Boolean']>>
  createdInBlock_eq?: Maybe<Scalars['Int']>
  createdInBlock_gt?: Maybe<Scalars['Int']>
  createdInBlock_gte?: Maybe<Scalars['Int']>
  createdInBlock_lt?: Maybe<Scalars['Int']>
  createdInBlock_lte?: Maybe<Scalars['Int']>
  createdInBlock_in?: Maybe<Array<Scalars['Int']>>
  auction?: Maybe<AuctionWhereInput>
  bidder?: Maybe<MembershipWhereInput>
  auctionlastBid_none?: Maybe<AuctionWhereInput>
  auctionlastBid_some?: Maybe<AuctionWhereInput>
  auctionlastBid_every?: Maybe<AuctionWhereInput>
  AND?: Maybe<Array<BidWhereInput>>
  OR?: Maybe<Array<BidWhereInput>>
}

export type BidWhereUniqueInput = {
  id: Scalars['ID']
}

export type BuyNowCanceledEvent = Event &
  BaseGraphQlObject & {
    /** Hash of the extrinsic which caused the event to be emitted. */
    inExtrinsic?: Maybe<Scalars['String']>
    /** Blocknumber of the block in which the event was emitted. */
    inBlock: Scalars['Int']
    /** Network the block was produced in. */
    network: Network
    /** Index of event in block from which it was emitted. */
    indexInBlock: Scalars['Int']
    /** Filtering options for interface implementers */
    type?: Maybe<EventTypeOptions>
    id: Scalars['ID']
    createdAt: Scalars['DateTime']
    createdById: Scalars['String']
    updatedAt?: Maybe<Scalars['DateTime']>
    updatedById?: Maybe<Scalars['String']>
    deletedAt?: Maybe<Scalars['DateTime']>
    deletedById?: Maybe<Scalars['String']>
    version: Scalars['Int']
    video: Video
    videoId: Scalars['String']
    /** Content actor acting as NFT owner. */
    contentActor: ContentActor
  }

export type BuyNowCanceledEventConnection = {
  totalCount: Scalars['Int']
  edges: Array<BuyNowCanceledEventEdge>
  pageInfo: PageInfo
}

export type BuyNowCanceledEventCreateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock: Scalars['Float']
  network: Network
  indexInBlock: Scalars['Float']
  video: Scalars['ID']
  contentActor: Scalars['JSONObject']
}

export type BuyNowCanceledEventEdge = {
  node: BuyNowCanceledEvent
  cursor: Scalars['String']
}

export enum BuyNowCanceledEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  InExtrinsicAsc = 'inExtrinsic_ASC',
  InExtrinsicDesc = 'inExtrinsic_DESC',
  InBlockAsc = 'inBlock_ASC',
  InBlockDesc = 'inBlock_DESC',
  NetworkAsc = 'network_ASC',
  NetworkDesc = 'network_DESC',
  IndexInBlockAsc = 'indexInBlock_ASC',
  IndexInBlockDesc = 'indexInBlock_DESC',
  VideoAsc = 'video_ASC',
  VideoDesc = 'video_DESC',
}

export type BuyNowCanceledEventUpdateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock?: Maybe<Scalars['Float']>
  network?: Maybe<Network>
  indexInBlock?: Maybe<Scalars['Float']>
  video?: Maybe<Scalars['ID']>
  contentActor?: Maybe<Scalars['JSONObject']>
}

export type BuyNowCanceledEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  inExtrinsic_eq?: Maybe<Scalars['String']>
  inExtrinsic_contains?: Maybe<Scalars['String']>
  inExtrinsic_startsWith?: Maybe<Scalars['String']>
  inExtrinsic_endsWith?: Maybe<Scalars['String']>
  inExtrinsic_in?: Maybe<Array<Scalars['String']>>
  inBlock_eq?: Maybe<Scalars['Int']>
  inBlock_gt?: Maybe<Scalars['Int']>
  inBlock_gte?: Maybe<Scalars['Int']>
  inBlock_lt?: Maybe<Scalars['Int']>
  inBlock_lte?: Maybe<Scalars['Int']>
  inBlock_in?: Maybe<Array<Scalars['Int']>>
  network_eq?: Maybe<Network>
  network_in?: Maybe<Array<Network>>
  indexInBlock_eq?: Maybe<Scalars['Int']>
  indexInBlock_gt?: Maybe<Scalars['Int']>
  indexInBlock_gte?: Maybe<Scalars['Int']>
  indexInBlock_lt?: Maybe<Scalars['Int']>
  indexInBlock_lte?: Maybe<Scalars['Int']>
  indexInBlock_in?: Maybe<Array<Scalars['Int']>>
  contentActor_json?: Maybe<Scalars['JSONObject']>
  video?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<BuyNowCanceledEventWhereInput>>
  OR?: Maybe<Array<BuyNowCanceledEventWhereInput>>
}

export type BuyNowCanceledEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type ContentActor = ContentActorCurator | ContentActorMember | ContentActorLead | ContentActorCollaborator

export type ContentActorCollaborator = {
  /** Type needs to have at least one non-relation entity. This value is not used. */
  dummy?: Maybe<Scalars['Int']>
  member?: Maybe<Membership>
}

export type ContentActorCurator = {
  /** Type needs to have at least one non-relation entity. This value is not used. */
  dummy?: Maybe<Scalars['Int']>
  curator?: Maybe<Curator>
}

export type ContentActorLead = {
  /** Type needs to have at least one non-relation entity. This value is not used. */
  dummy?: Maybe<Scalars['Int']>
}

export type ContentActorMember = {
  /** Type needs to have at least one non-relation entity. This value is not used. */
  dummy?: Maybe<Scalars['Int']>
  member?: Maybe<Membership>
}

export enum Continent {
  Af = 'AF',
  Na = 'NA',
  Oc = 'OC',
  An = 'AN',
  As = 'AS',
  Eu = 'EU',
  Sa = 'SA',
}

export type Curator = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Type needs to have at least one non-relation entity. This value is not used. */
  dummy?: Maybe<Scalars['Int']>
  curatorGroups: Array<CuratorGroup>
}

export type CuratorConnection = {
  totalCount: Scalars['Int']
  edges: Array<CuratorEdge>
  pageInfo: PageInfo
}

export type CuratorCreateInput = {
  dummy?: Maybe<Scalars['Float']>
}

export type CuratorEdge = {
  node: Curator
  cursor: Scalars['String']
}

export type CuratorGroup = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Is group active or not */
  isActive: Scalars['Boolean']
  curators: Array<Curator>
  channels: Array<Channel>
  ownednftownerCuratorGroup?: Maybe<Array<OwnedNft>>
}

export type CuratorGroupConnection = {
  totalCount: Scalars['Int']
  edges: Array<CuratorGroupEdge>
  pageInfo: PageInfo
}

export type CuratorGroupCreateInput = {
  isActive: Scalars['Boolean']
}

export type CuratorGroupEdge = {
  node: CuratorGroup
  cursor: Scalars['String']
}

export enum CuratorGroupOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  IsActiveAsc = 'isActive_ASC',
  IsActiveDesc = 'isActive_DESC',
}

export type CuratorGroupUpdateInput = {
  isActive?: Maybe<Scalars['Boolean']>
}

export type CuratorGroupWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  isActive_eq?: Maybe<Scalars['Boolean']>
  isActive_in?: Maybe<Array<Scalars['Boolean']>>
  curators_none?: Maybe<CuratorWhereInput>
  curators_some?: Maybe<CuratorWhereInput>
  curators_every?: Maybe<CuratorWhereInput>
  channels_none?: Maybe<ChannelWhereInput>
  channels_some?: Maybe<ChannelWhereInput>
  channels_every?: Maybe<ChannelWhereInput>
  ownednftownerCuratorGroup_none?: Maybe<OwnedNftWhereInput>
  ownednftownerCuratorGroup_some?: Maybe<OwnedNftWhereInput>
  ownednftownerCuratorGroup_every?: Maybe<OwnedNftWhereInput>
  AND?: Maybe<Array<CuratorGroupWhereInput>>
  OR?: Maybe<Array<CuratorGroupWhereInput>>
}

export type CuratorGroupWhereUniqueInput = {
  id: Scalars['ID']
}

export enum CuratorOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  DummyAsc = 'dummy_ASC',
  DummyDesc = 'dummy_DESC',
}

export type CuratorUpdateInput = {
  dummy?: Maybe<Scalars['Float']>
}

export type CuratorWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  dummy_eq?: Maybe<Scalars['Int']>
  dummy_gt?: Maybe<Scalars['Int']>
  dummy_gte?: Maybe<Scalars['Int']>
  dummy_lt?: Maybe<Scalars['Int']>
  dummy_lte?: Maybe<Scalars['Int']>
  dummy_in?: Maybe<Array<Scalars['Int']>>
  curatorGroups_none?: Maybe<CuratorGroupWhereInput>
  curatorGroups_some?: Maybe<CuratorGroupWhereInput>
  curatorGroups_every?: Maybe<CuratorGroupWhereInput>
  AND?: Maybe<Array<CuratorWhereInput>>
  OR?: Maybe<Array<CuratorWhereInput>>
}

export type CuratorWhereUniqueInput = {
  id: Scalars['ID']
}

export type DataObjectType =
  | DataObjectTypeChannelAvatar
  | DataObjectTypeChannelCoverPhoto
  | DataObjectTypeVideoMedia
  | DataObjectTypeVideoThumbnail
  | DataObjectTypeUnknown

export type DataObjectTypeChannelAvatar = {
  /** Related channel entity */
  channel?: Maybe<Channel>
}

export type DataObjectTypeChannelCoverPhoto = {
  /** Related channel entity */
  channel?: Maybe<Channel>
}

export type DataObjectTypeUnknown = {
  phantom?: Maybe<Scalars['Int']>
}

export type DataObjectTypeVideoMedia = {
  /** Related video entity */
  video?: Maybe<Video>
}

export type DataObjectTypeVideoThumbnail = {
  /** Related video entity */
  video?: Maybe<Video>
}

export type DeleteResponse = {
  id: Scalars['ID']
}

export type DistributionBucket = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  family: DistributionBucketFamily
  familyId: Scalars['String']
  /** Bucket index within the family */
  bucketIndex: Scalars['Int']
  operators: Array<DistributionBucketOperator>
  /** Whether the bucket is accepting any new bags */
  acceptingNewBags: Scalars['Boolean']
  /** Whether the bucket is currently distributing content */
  distributing: Scalars['Boolean']
  bags: Array<StorageBag>
}

export type DistributionBucketConnection = {
  totalCount: Scalars['Int']
  edges: Array<DistributionBucketEdge>
  pageInfo: PageInfo
}

export type DistributionBucketCreateInput = {
  family: Scalars['ID']
  bucketIndex: Scalars['Float']
  acceptingNewBags: Scalars['Boolean']
  distributing: Scalars['Boolean']
}

export type DistributionBucketEdge = {
  node: DistributionBucket
  cursor: Scalars['String']
}

export type DistributionBucketFamily = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  metadata?: Maybe<DistributionBucketFamilyMetadata>
  metadataId?: Maybe<Scalars['String']>
  buckets: Array<DistributionBucket>
}

export type DistributionBucketFamilyConnection = {
  totalCount: Scalars['Int']
  edges: Array<DistributionBucketFamilyEdge>
  pageInfo: PageInfo
}

export type DistributionBucketFamilyCreateInput = {
  metadata?: Maybe<Scalars['ID']>
}

export type DistributionBucketFamilyEdge = {
  node: DistributionBucketFamily
  cursor: Scalars['String']
}

export type DistributionBucketFamilyGeographicArea = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Geographical area (continent / country / subdivision) */
  area: GeographicalArea
  distributionBucketFamilyMetadata: DistributionBucketFamilyMetadata
  distributionBucketFamilyMetadataId: Scalars['String']
}

export type DistributionBucketFamilyGeographicAreaConnection = {
  totalCount: Scalars['Int']
  edges: Array<DistributionBucketFamilyGeographicAreaEdge>
  pageInfo: PageInfo
}

export type DistributionBucketFamilyGeographicAreaCreateInput = {
  area: Scalars['JSONObject']
  distributionBucketFamilyMetadata: Scalars['ID']
}

export type DistributionBucketFamilyGeographicAreaEdge = {
  node: DistributionBucketFamilyGeographicArea
  cursor: Scalars['String']
}

export enum DistributionBucketFamilyGeographicAreaOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  DistributionBucketFamilyMetadataAsc = 'distributionBucketFamilyMetadata_ASC',
  DistributionBucketFamilyMetadataDesc = 'distributionBucketFamilyMetadata_DESC',
}

export type DistributionBucketFamilyGeographicAreaUpdateInput = {
  area?: Maybe<Scalars['JSONObject']>
  distributionBucketFamilyMetadata?: Maybe<Scalars['ID']>
}

export type DistributionBucketFamilyGeographicAreaWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  area_json?: Maybe<Scalars['JSONObject']>
  distributionBucketFamilyMetadata?: Maybe<DistributionBucketFamilyMetadataWhereInput>
  AND?: Maybe<Array<DistributionBucketFamilyGeographicAreaWhereInput>>
  OR?: Maybe<Array<DistributionBucketFamilyGeographicAreaWhereInput>>
}

export type DistributionBucketFamilyGeographicAreaWhereUniqueInput = {
  id: Scalars['ID']
}

export type DistributionBucketFamilyMetadata = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Name of the geographical region covered by the family (ie.: us-east-1) */
  region?: Maybe<Scalars['String']>
  /** Optional, more specific description of the region covered by the family */
  description?: Maybe<Scalars['String']>
  areas: Array<DistributionBucketFamilyGeographicArea>
  /** List of targets (hosts/ips) best suited latency measurements for the family */
  latencyTestTargets?: Maybe<Array<Scalars['String']>>
  distributionbucketfamilymetadata?: Maybe<Array<DistributionBucketFamily>>
}

export type DistributionBucketFamilyMetadataConnection = {
  totalCount: Scalars['Int']
  edges: Array<DistributionBucketFamilyMetadataEdge>
  pageInfo: PageInfo
}

export type DistributionBucketFamilyMetadataCreateInput = {
  region?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  latencyTestTargets?: Maybe<Array<Scalars['String']>>
}

export type DistributionBucketFamilyMetadataEdge = {
  node: DistributionBucketFamilyMetadata
  cursor: Scalars['String']
}

export enum DistributionBucketFamilyMetadataOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  RegionAsc = 'region_ASC',
  RegionDesc = 'region_DESC',
  DescriptionAsc = 'description_ASC',
  DescriptionDesc = 'description_DESC',
}

export type DistributionBucketFamilyMetadataUpdateInput = {
  region?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  latencyTestTargets?: Maybe<Array<Scalars['String']>>
}

export type DistributionBucketFamilyMetadataWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  region_eq?: Maybe<Scalars['String']>
  region_contains?: Maybe<Scalars['String']>
  region_startsWith?: Maybe<Scalars['String']>
  region_endsWith?: Maybe<Scalars['String']>
  region_in?: Maybe<Array<Scalars['String']>>
  description_eq?: Maybe<Scalars['String']>
  description_contains?: Maybe<Scalars['String']>
  description_startsWith?: Maybe<Scalars['String']>
  description_endsWith?: Maybe<Scalars['String']>
  description_in?: Maybe<Array<Scalars['String']>>
  latencyTestTargets_containsAll?: Maybe<Array<Scalars['String']>>
  latencyTestTargets_containsNone?: Maybe<Array<Scalars['String']>>
  latencyTestTargets_containsAny?: Maybe<Array<Scalars['String']>>
  areas_none?: Maybe<DistributionBucketFamilyGeographicAreaWhereInput>
  areas_some?: Maybe<DistributionBucketFamilyGeographicAreaWhereInput>
  areas_every?: Maybe<DistributionBucketFamilyGeographicAreaWhereInput>
  distributionbucketfamilymetadata_none?: Maybe<DistributionBucketFamilyWhereInput>
  distributionbucketfamilymetadata_some?: Maybe<DistributionBucketFamilyWhereInput>
  distributionbucketfamilymetadata_every?: Maybe<DistributionBucketFamilyWhereInput>
  AND?: Maybe<Array<DistributionBucketFamilyMetadataWhereInput>>
  OR?: Maybe<Array<DistributionBucketFamilyMetadataWhereInput>>
}

export type DistributionBucketFamilyMetadataWhereUniqueInput = {
  id: Scalars['ID']
}

export enum DistributionBucketFamilyOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  MetadataAsc = 'metadata_ASC',
  MetadataDesc = 'metadata_DESC',
}

export type DistributionBucketFamilyUpdateInput = {
  metadata?: Maybe<Scalars['ID']>
}

export type DistributionBucketFamilyWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  metadata?: Maybe<DistributionBucketFamilyMetadataWhereInput>
  buckets_none?: Maybe<DistributionBucketWhereInput>
  buckets_some?: Maybe<DistributionBucketWhereInput>
  buckets_every?: Maybe<DistributionBucketWhereInput>
  AND?: Maybe<Array<DistributionBucketFamilyWhereInput>>
  OR?: Maybe<Array<DistributionBucketFamilyWhereInput>>
}

export type DistributionBucketFamilyWhereUniqueInput = {
  id: Scalars['ID']
}

export type DistributionBucketOperator = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  distributionBucket: DistributionBucket
  distributionBucketId: Scalars['String']
  /** ID of the distribution group worker */
  workerId: Scalars['Int']
  /** Current operator status */
  status: DistributionBucketOperatorStatus
  metadata?: Maybe<DistributionBucketOperatorMetadata>
  metadataId?: Maybe<Scalars['String']>
}

export type DistributionBucketOperatorConnection = {
  totalCount: Scalars['Int']
  edges: Array<DistributionBucketOperatorEdge>
  pageInfo: PageInfo
}

export type DistributionBucketOperatorCreateInput = {
  distributionBucket: Scalars['ID']
  workerId: Scalars['Float']
  status: DistributionBucketOperatorStatus
  metadata?: Maybe<Scalars['ID']>
}

export type DistributionBucketOperatorEdge = {
  node: DistributionBucketOperator
  cursor: Scalars['String']
}

export type DistributionBucketOperatorMetadata = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Root distributor node api endpoint */
  nodeEndpoint?: Maybe<Scalars['String']>
  nodeLocation?: Maybe<NodeLocationMetadata>
  nodeLocationId?: Maybe<Scalars['String']>
  /** Additional information about the node/operator */
  extra?: Maybe<Scalars['String']>
  distributionbucketoperatormetadata?: Maybe<Array<DistributionBucketOperator>>
}

export type DistributionBucketOperatorMetadataConnection = {
  totalCount: Scalars['Int']
  edges: Array<DistributionBucketOperatorMetadataEdge>
  pageInfo: PageInfo
}

export type DistributionBucketOperatorMetadataCreateInput = {
  nodeEndpoint?: Maybe<Scalars['String']>
  nodeLocation?: Maybe<Scalars['ID']>
  extra?: Maybe<Scalars['String']>
}

export type DistributionBucketOperatorMetadataEdge = {
  node: DistributionBucketOperatorMetadata
  cursor: Scalars['String']
}

export enum DistributionBucketOperatorMetadataOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  NodeEndpointAsc = 'nodeEndpoint_ASC',
  NodeEndpointDesc = 'nodeEndpoint_DESC',
  NodeLocationAsc = 'nodeLocation_ASC',
  NodeLocationDesc = 'nodeLocation_DESC',
  ExtraAsc = 'extra_ASC',
  ExtraDesc = 'extra_DESC',
}

export type DistributionBucketOperatorMetadataUpdateInput = {
  nodeEndpoint?: Maybe<Scalars['String']>
  nodeLocation?: Maybe<Scalars['ID']>
  extra?: Maybe<Scalars['String']>
}

export type DistributionBucketOperatorMetadataWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  nodeEndpoint_eq?: Maybe<Scalars['String']>
  nodeEndpoint_contains?: Maybe<Scalars['String']>
  nodeEndpoint_startsWith?: Maybe<Scalars['String']>
  nodeEndpoint_endsWith?: Maybe<Scalars['String']>
  nodeEndpoint_in?: Maybe<Array<Scalars['String']>>
  extra_eq?: Maybe<Scalars['String']>
  extra_contains?: Maybe<Scalars['String']>
  extra_startsWith?: Maybe<Scalars['String']>
  extra_endsWith?: Maybe<Scalars['String']>
  extra_in?: Maybe<Array<Scalars['String']>>
  nodeLocation?: Maybe<NodeLocationMetadataWhereInput>
  distributionbucketoperatormetadata_none?: Maybe<DistributionBucketOperatorWhereInput>
  distributionbucketoperatormetadata_some?: Maybe<DistributionBucketOperatorWhereInput>
  distributionbucketoperatormetadata_every?: Maybe<DistributionBucketOperatorWhereInput>
  AND?: Maybe<Array<DistributionBucketOperatorMetadataWhereInput>>
  OR?: Maybe<Array<DistributionBucketOperatorMetadataWhereInput>>
}

export type DistributionBucketOperatorMetadataWhereUniqueInput = {
  id: Scalars['ID']
}

export enum DistributionBucketOperatorOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  DistributionBucketAsc = 'distributionBucket_ASC',
  DistributionBucketDesc = 'distributionBucket_DESC',
  WorkerIdAsc = 'workerId_ASC',
  WorkerIdDesc = 'workerId_DESC',
  StatusAsc = 'status_ASC',
  StatusDesc = 'status_DESC',
  MetadataAsc = 'metadata_ASC',
  MetadataDesc = 'metadata_DESC',
}

export enum DistributionBucketOperatorStatus {
  Invited = 'INVITED',
  Active = 'ACTIVE',
}

export type DistributionBucketOperatorUpdateInput = {
  distributionBucket?: Maybe<Scalars['ID']>
  workerId?: Maybe<Scalars['Float']>
  status?: Maybe<DistributionBucketOperatorStatus>
  metadata?: Maybe<Scalars['ID']>
}

export type DistributionBucketOperatorWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  workerId_eq?: Maybe<Scalars['Int']>
  workerId_gt?: Maybe<Scalars['Int']>
  workerId_gte?: Maybe<Scalars['Int']>
  workerId_lt?: Maybe<Scalars['Int']>
  workerId_lte?: Maybe<Scalars['Int']>
  workerId_in?: Maybe<Array<Scalars['Int']>>
  status_eq?: Maybe<DistributionBucketOperatorStatus>
  status_in?: Maybe<Array<DistributionBucketOperatorStatus>>
  distributionBucket?: Maybe<DistributionBucketWhereInput>
  metadata?: Maybe<DistributionBucketOperatorMetadataWhereInput>
  AND?: Maybe<Array<DistributionBucketOperatorWhereInput>>
  OR?: Maybe<Array<DistributionBucketOperatorWhereInput>>
}

export type DistributionBucketOperatorWhereUniqueInput = {
  id: Scalars['ID']
}

export enum DistributionBucketOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  FamilyAsc = 'family_ASC',
  FamilyDesc = 'family_DESC',
  BucketIndexAsc = 'bucketIndex_ASC',
  BucketIndexDesc = 'bucketIndex_DESC',
  AcceptingNewBagsAsc = 'acceptingNewBags_ASC',
  AcceptingNewBagsDesc = 'acceptingNewBags_DESC',
  DistributingAsc = 'distributing_ASC',
  DistributingDesc = 'distributing_DESC',
}

export type DistributionBucketUpdateInput = {
  family?: Maybe<Scalars['ID']>
  bucketIndex?: Maybe<Scalars['Float']>
  acceptingNewBags?: Maybe<Scalars['Boolean']>
  distributing?: Maybe<Scalars['Boolean']>
}

export type DistributionBucketWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  bucketIndex_eq?: Maybe<Scalars['Int']>
  bucketIndex_gt?: Maybe<Scalars['Int']>
  bucketIndex_gte?: Maybe<Scalars['Int']>
  bucketIndex_lt?: Maybe<Scalars['Int']>
  bucketIndex_lte?: Maybe<Scalars['Int']>
  bucketIndex_in?: Maybe<Array<Scalars['Int']>>
  acceptingNewBags_eq?: Maybe<Scalars['Boolean']>
  acceptingNewBags_in?: Maybe<Array<Scalars['Boolean']>>
  distributing_eq?: Maybe<Scalars['Boolean']>
  distributing_in?: Maybe<Array<Scalars['Boolean']>>
  family?: Maybe<DistributionBucketFamilyWhereInput>
  operators_none?: Maybe<DistributionBucketOperatorWhereInput>
  operators_some?: Maybe<DistributionBucketOperatorWhereInput>
  operators_every?: Maybe<DistributionBucketOperatorWhereInput>
  bags_none?: Maybe<StorageBagWhereInput>
  bags_some?: Maybe<StorageBagWhereInput>
  bags_every?: Maybe<StorageBagWhereInput>
  AND?: Maybe<Array<DistributionBucketWhereInput>>
  OR?: Maybe<Array<DistributionBucketWhereInput>>
}

export type DistributionBucketWhereUniqueInput = {
  id: Scalars['ID']
}

export type EnglishAuctionCompletedEvent = Event &
  BaseGraphQlObject & {
    /** Hash of the extrinsic which caused the event to be emitted. */
    inExtrinsic?: Maybe<Scalars['String']>
    /** Blocknumber of the block in which the event was emitted. */
    inBlock: Scalars['Int']
    /** Network the block was produced in. */
    network: Network
    /** Index of event in block from which it was emitted. */
    indexInBlock: Scalars['Int']
    /** Filtering options for interface implementers */
    type?: Maybe<EventTypeOptions>
    id: Scalars['ID']
    createdAt: Scalars['DateTime']
    createdById: Scalars['String']
    updatedAt?: Maybe<Scalars['DateTime']>
    updatedById?: Maybe<Scalars['String']>
    deletedAt?: Maybe<Scalars['DateTime']>
    deletedById?: Maybe<Scalars['String']>
    version: Scalars['Int']
    member: Membership
    memberId: Scalars['String']
    video: Video
    videoId: Scalars['String']
  }

export type EnglishAuctionCompletedEventConnection = {
  totalCount: Scalars['Int']
  edges: Array<EnglishAuctionCompletedEventEdge>
  pageInfo: PageInfo
}

export type EnglishAuctionCompletedEventCreateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock: Scalars['Float']
  network: Network
  indexInBlock: Scalars['Float']
  member: Scalars['ID']
  video: Scalars['ID']
}

export type EnglishAuctionCompletedEventEdge = {
  node: EnglishAuctionCompletedEvent
  cursor: Scalars['String']
}

export enum EnglishAuctionCompletedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  InExtrinsicAsc = 'inExtrinsic_ASC',
  InExtrinsicDesc = 'inExtrinsic_DESC',
  InBlockAsc = 'inBlock_ASC',
  InBlockDesc = 'inBlock_DESC',
  NetworkAsc = 'network_ASC',
  NetworkDesc = 'network_DESC',
  IndexInBlockAsc = 'indexInBlock_ASC',
  IndexInBlockDesc = 'indexInBlock_DESC',
  MemberAsc = 'member_ASC',
  MemberDesc = 'member_DESC',
  VideoAsc = 'video_ASC',
  VideoDesc = 'video_DESC',
}

export type EnglishAuctionCompletedEventUpdateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock?: Maybe<Scalars['Float']>
  network?: Maybe<Network>
  indexInBlock?: Maybe<Scalars['Float']>
  member?: Maybe<Scalars['ID']>
  video?: Maybe<Scalars['ID']>
}

export type EnglishAuctionCompletedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  inExtrinsic_eq?: Maybe<Scalars['String']>
  inExtrinsic_contains?: Maybe<Scalars['String']>
  inExtrinsic_startsWith?: Maybe<Scalars['String']>
  inExtrinsic_endsWith?: Maybe<Scalars['String']>
  inExtrinsic_in?: Maybe<Array<Scalars['String']>>
  inBlock_eq?: Maybe<Scalars['Int']>
  inBlock_gt?: Maybe<Scalars['Int']>
  inBlock_gte?: Maybe<Scalars['Int']>
  inBlock_lt?: Maybe<Scalars['Int']>
  inBlock_lte?: Maybe<Scalars['Int']>
  inBlock_in?: Maybe<Array<Scalars['Int']>>
  network_eq?: Maybe<Network>
  network_in?: Maybe<Array<Network>>
  indexInBlock_eq?: Maybe<Scalars['Int']>
  indexInBlock_gt?: Maybe<Scalars['Int']>
  indexInBlock_gte?: Maybe<Scalars['Int']>
  indexInBlock_lt?: Maybe<Scalars['Int']>
  indexInBlock_lte?: Maybe<Scalars['Int']>
  indexInBlock_in?: Maybe<Array<Scalars['Int']>>
  member?: Maybe<MembershipWhereInput>
  video?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<EnglishAuctionCompletedEventWhereInput>>
  OR?: Maybe<Array<EnglishAuctionCompletedEventWhereInput>>
}

export type EnglishAuctionCompletedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type Event = {
  /** Hash of the extrinsic which caused the event to be emitted */
  inExtrinsic?: Maybe<Scalars['String']>
  /** Blocknumber of the block in which the event was emitted. */
  inBlock: Scalars['Int']
  /** Network the block was produced in */
  network: Network
  /** Index of event in block from which it was emitted. */
  indexInBlock: Scalars['Int']
  /** Filtering options for interface implementers */
  type?: Maybe<EventTypeOptions>
}

export type EventCreateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock: Scalars['Float']
  network: Network
  indexInBlock: Scalars['Float']
  type?: Maybe<EventTypeOptions>
}

export enum EventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  InExtrinsicAsc = 'inExtrinsic_ASC',
  InExtrinsicDesc = 'inExtrinsic_DESC',
  InBlockAsc = 'inBlock_ASC',
  InBlockDesc = 'inBlock_DESC',
  NetworkAsc = 'network_ASC',
  NetworkDesc = 'network_DESC',
  IndexInBlockAsc = 'indexInBlock_ASC',
  IndexInBlockDesc = 'indexInBlock_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
}

export enum EventTypeOptions {
  AuctionBidCanceledEvent = 'AuctionBidCanceledEvent',
  AuctionBidMadeEvent = 'AuctionBidMadeEvent',
  AuctionCanceledEvent = 'AuctionCanceledEvent',
  AuctionStartedEvent = 'AuctionStartedEvent',
  BidMadeCompletingAuctionEvent = 'BidMadeCompletingAuctionEvent',
  BuyNowCanceledEvent = 'BuyNowCanceledEvent',
  EnglishAuctionCompletedEvent = 'EnglishAuctionCompletedEvent',
  NftBoughtEvent = 'NftBoughtEvent',
  NftIssuedEvent = 'NftIssuedEvent',
  OfferAcceptedEvent = 'OfferAcceptedEvent',
  OfferCanceledEvent = 'OfferCanceledEvent',
  OfferStartedEvent = 'OfferStartedEvent',
  OpenAuctionBidAcceptedEvent = 'OpenAuctionBidAcceptedEvent',
}

export type EventUpdateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock?: Maybe<Scalars['Float']>
  network?: Maybe<Network>
  indexInBlock?: Maybe<Scalars['Float']>
  type?: Maybe<EventTypeOptions>
}

export type EventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  inExtrinsic_eq?: Maybe<Scalars['String']>
  inExtrinsic_contains?: Maybe<Scalars['String']>
  inExtrinsic_startsWith?: Maybe<Scalars['String']>
  inExtrinsic_endsWith?: Maybe<Scalars['String']>
  inExtrinsic_in?: Maybe<Array<Scalars['String']>>
  inBlock_eq?: Maybe<Scalars['Int']>
  inBlock_gt?: Maybe<Scalars['Int']>
  inBlock_gte?: Maybe<Scalars['Int']>
  inBlock_lt?: Maybe<Scalars['Int']>
  inBlock_lte?: Maybe<Scalars['Int']>
  inBlock_in?: Maybe<Array<Scalars['Int']>>
  network_eq?: Maybe<Network>
  network_in?: Maybe<Array<Network>>
  indexInBlock_eq?: Maybe<Scalars['Int']>
  indexInBlock_gt?: Maybe<Scalars['Int']>
  indexInBlock_gte?: Maybe<Scalars['Int']>
  indexInBlock_lt?: Maybe<Scalars['Int']>
  indexInBlock_lte?: Maybe<Scalars['Int']>
  indexInBlock_in?: Maybe<Array<Scalars['Int']>>
  type_eq?: Maybe<EventTypeOptions>
  type_in?: Maybe<Array<EventTypeOptions>>
  AND?: Maybe<Array<EventWhereInput>>
  OR?: Maybe<Array<EventWhereInput>>
}

export type EventWhereUniqueInput = {
  id: Scalars['ID']
}

export type GeoCoordinates = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  latitude: Scalars['Float']
  longitude: Scalars['Float']
  nodelocationmetadatacoordinates?: Maybe<Array<NodeLocationMetadata>>
}

export type GeoCoordinatesConnection = {
  totalCount: Scalars['Int']
  edges: Array<GeoCoordinatesEdge>
  pageInfo: PageInfo
}

export type GeoCoordinatesCreateInput = {
  latitude: Scalars['Float']
  longitude: Scalars['Float']
}

export type GeoCoordinatesEdge = {
  node: GeoCoordinates
  cursor: Scalars['String']
}

export enum GeoCoordinatesOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  LatitudeAsc = 'latitude_ASC',
  LatitudeDesc = 'latitude_DESC',
  LongitudeAsc = 'longitude_ASC',
  LongitudeDesc = 'longitude_DESC',
}

export type GeoCoordinatesUpdateInput = {
  latitude?: Maybe<Scalars['Float']>
  longitude?: Maybe<Scalars['Float']>
}

export type GeoCoordinatesWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  latitude_eq?: Maybe<Scalars['Float']>
  latitude_gt?: Maybe<Scalars['Float']>
  latitude_gte?: Maybe<Scalars['Float']>
  latitude_lt?: Maybe<Scalars['Float']>
  latitude_lte?: Maybe<Scalars['Float']>
  latitude_in?: Maybe<Array<Scalars['Float']>>
  longitude_eq?: Maybe<Scalars['Float']>
  longitude_gt?: Maybe<Scalars['Float']>
  longitude_gte?: Maybe<Scalars['Float']>
  longitude_lt?: Maybe<Scalars['Float']>
  longitude_lte?: Maybe<Scalars['Float']>
  longitude_in?: Maybe<Array<Scalars['Float']>>
  nodelocationmetadatacoordinates_none?: Maybe<NodeLocationMetadataWhereInput>
  nodelocationmetadatacoordinates_some?: Maybe<NodeLocationMetadataWhereInput>
  nodelocationmetadatacoordinates_every?: Maybe<NodeLocationMetadataWhereInput>
  AND?: Maybe<Array<GeoCoordinatesWhereInput>>
  OR?: Maybe<Array<GeoCoordinatesWhereInput>>
}

export type GeoCoordinatesWhereUniqueInput = {
  id: Scalars['ID']
}

export type GeographicalArea = GeographicalAreaContinent | GeographicalAreaCountry | GeographicalAreaSubdivistion

export type GeographicalAreaContinent = {
  code?: Maybe<Continent>
}

export type GeographicalAreaContinentCreateInput = {
  code?: Maybe<Continent>
}

export type GeographicalAreaContinentUpdateInput = {
  code?: Maybe<Continent>
}

export type GeographicalAreaContinentWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  code_eq?: Maybe<Continent>
  code_in?: Maybe<Array<Continent>>
  AND?: Maybe<Array<GeographicalAreaContinentWhereInput>>
  OR?: Maybe<Array<GeographicalAreaContinentWhereInput>>
}

export type GeographicalAreaContinentWhereUniqueInput = {
  id: Scalars['ID']
}

export type GeographicalAreaCountry = {
  /** ISO 3166-1 alpha-2 country code */
  code?: Maybe<Scalars['String']>
}

export type GeographicalAreaSubdivistion = {
  /** ISO 3166-2 subdivision code */
  code?: Maybe<Scalars['String']>
}

export type Channel = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  ownerMember?: Maybe<Membership>
  ownerMemberId?: Maybe<Scalars['String']>
  ownerCuratorGroup?: Maybe<CuratorGroup>
  ownerCuratorGroupId?: Maybe<Scalars['String']>
  category?: Maybe<ChannelCategory>
  categoryId?: Maybe<Scalars['String']>
  /** Reward account where revenue is sent if set. */
  rewardAccount?: Maybe<Scalars['String']>
  /** The title of the Channel */
  title?: Maybe<Scalars['String']>
  /** The description of a Channel */
  description?: Maybe<Scalars['String']>
  /** Count of channel's videos with an uploaded asset that are public and not censored. */
  activeVideosCounter: Scalars['Int']
  coverPhoto?: Maybe<StorageDataObject>
  coverPhotoId?: Maybe<Scalars['String']>
  avatarPhoto?: Maybe<StorageDataObject>
  avatarPhotoId?: Maybe<Scalars['String']>
  /** Flag signaling whether a channel is public. */
  isPublic?: Maybe<Scalars['Boolean']>
  /** Flag signaling whether a channel is censored. */
  isCensored: Scalars['Boolean']
  language?: Maybe<Language>
  languageId?: Maybe<Scalars['String']>
  videos: Array<Video>
  /** Number of the block the channel was created in */
  createdInBlock: Scalars['Int']
  collaborators: Array<Membership>
}

export type ChannelCategoriesByNameFtsOutput = {
  item: ChannelCategoriesByNameSearchResult
  rank: Scalars['Float']
  isTypeOf: Scalars['String']
  highlight: Scalars['String']
}

export type ChannelCategoriesByNameSearchResult = ChannelCategory

/** Category of media channel */
export type ChannelCategory = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** The name of the category */
  name?: Maybe<Scalars['String']>
  /** Count of channel's videos with an uploaded asset that are public and not censored. */
  activeVideosCounter: Scalars['Int']
  channels: Array<Channel>
  createdInBlock: Scalars['Int']
}

export type ChannelCategoryConnection = {
  totalCount: Scalars['Int']
  edges: Array<ChannelCategoryEdge>
  pageInfo: PageInfo
}

export type ChannelCategoryCreateInput = {
  name?: Maybe<Scalars['String']>
  activeVideosCounter: Scalars['Float']
  createdInBlock: Scalars['Float']
}

export type ChannelCategoryEdge = {
  node: ChannelCategory
  cursor: Scalars['String']
}

export enum ChannelCategoryOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  ActiveVideosCounterAsc = 'activeVideosCounter_ASC',
  ActiveVideosCounterDesc = 'activeVideosCounter_DESC',
  CreatedInBlockAsc = 'createdInBlock_ASC',
  CreatedInBlockDesc = 'createdInBlock_DESC',
}

export type ChannelCategoryUpdateInput = {
  name?: Maybe<Scalars['String']>
  activeVideosCounter?: Maybe<Scalars['Float']>
  createdInBlock?: Maybe<Scalars['Float']>
}

export type ChannelCategoryWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  name_eq?: Maybe<Scalars['String']>
  name_contains?: Maybe<Scalars['String']>
  name_startsWith?: Maybe<Scalars['String']>
  name_endsWith?: Maybe<Scalars['String']>
  name_in?: Maybe<Array<Scalars['String']>>
  activeVideosCounter_eq?: Maybe<Scalars['Int']>
  activeVideosCounter_gt?: Maybe<Scalars['Int']>
  activeVideosCounter_gte?: Maybe<Scalars['Int']>
  activeVideosCounter_lt?: Maybe<Scalars['Int']>
  activeVideosCounter_lte?: Maybe<Scalars['Int']>
  activeVideosCounter_in?: Maybe<Array<Scalars['Int']>>
  createdInBlock_eq?: Maybe<Scalars['Int']>
  createdInBlock_gt?: Maybe<Scalars['Int']>
  createdInBlock_gte?: Maybe<Scalars['Int']>
  createdInBlock_lt?: Maybe<Scalars['Int']>
  createdInBlock_lte?: Maybe<Scalars['Int']>
  createdInBlock_in?: Maybe<Array<Scalars['Int']>>
  channels_none?: Maybe<ChannelWhereInput>
  channels_some?: Maybe<ChannelWhereInput>
  channels_every?: Maybe<ChannelWhereInput>
  AND?: Maybe<Array<ChannelCategoryWhereInput>>
  OR?: Maybe<Array<ChannelCategoryWhereInput>>
}

export type ChannelCategoryWhereUniqueInput = {
  id: Scalars['ID']
}

export type ChannelConnection = {
  totalCount: Scalars['Int']
  edges: Array<ChannelEdge>
  pageInfo: PageInfo
}

export type ChannelCreateInput = {
  ownerMember?: Maybe<Scalars['ID']>
  ownerCuratorGroup?: Maybe<Scalars['ID']>
  category?: Maybe<Scalars['ID']>
  rewardAccount?: Maybe<Scalars['String']>
  title?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  activeVideosCounter: Scalars['Float']
  coverPhoto?: Maybe<Scalars['ID']>
  avatarPhoto?: Maybe<Scalars['ID']>
  isPublic?: Maybe<Scalars['Boolean']>
  isCensored: Scalars['Boolean']
  language?: Maybe<Scalars['ID']>
  createdInBlock: Scalars['Float']
}

export type ChannelEdge = {
  node: Channel
  cursor: Scalars['String']
}

export enum ChannelOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  OwnerMemberAsc = 'ownerMember_ASC',
  OwnerMemberDesc = 'ownerMember_DESC',
  OwnerCuratorGroupAsc = 'ownerCuratorGroup_ASC',
  OwnerCuratorGroupDesc = 'ownerCuratorGroup_DESC',
  CategoryAsc = 'category_ASC',
  CategoryDesc = 'category_DESC',
  RewardAccountAsc = 'rewardAccount_ASC',
  RewardAccountDesc = 'rewardAccount_DESC',
  TitleAsc = 'title_ASC',
  TitleDesc = 'title_DESC',
  DescriptionAsc = 'description_ASC',
  DescriptionDesc = 'description_DESC',
  ActiveVideosCounterAsc = 'activeVideosCounter_ASC',
  ActiveVideosCounterDesc = 'activeVideosCounter_DESC',
  CoverPhotoAsc = 'coverPhoto_ASC',
  CoverPhotoDesc = 'coverPhoto_DESC',
  AvatarPhotoAsc = 'avatarPhoto_ASC',
  AvatarPhotoDesc = 'avatarPhoto_DESC',
  IsPublicAsc = 'isPublic_ASC',
  IsPublicDesc = 'isPublic_DESC',
  IsCensoredAsc = 'isCensored_ASC',
  IsCensoredDesc = 'isCensored_DESC',
  LanguageAsc = 'language_ASC',
  LanguageDesc = 'language_DESC',
  CreatedInBlockAsc = 'createdInBlock_ASC',
  CreatedInBlockDesc = 'createdInBlock_DESC',
}

export type ChannelUpdateInput = {
  ownerMember?: Maybe<Scalars['ID']>
  ownerCuratorGroup?: Maybe<Scalars['ID']>
  category?: Maybe<Scalars['ID']>
  rewardAccount?: Maybe<Scalars['String']>
  title?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  activeVideosCounter?: Maybe<Scalars['Float']>
  coverPhoto?: Maybe<Scalars['ID']>
  avatarPhoto?: Maybe<Scalars['ID']>
  isPublic?: Maybe<Scalars['Boolean']>
  isCensored?: Maybe<Scalars['Boolean']>
  language?: Maybe<Scalars['ID']>
  createdInBlock?: Maybe<Scalars['Float']>
}

export type ChannelWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  rewardAccount_eq?: Maybe<Scalars['String']>
  rewardAccount_contains?: Maybe<Scalars['String']>
  rewardAccount_startsWith?: Maybe<Scalars['String']>
  rewardAccount_endsWith?: Maybe<Scalars['String']>
  rewardAccount_in?: Maybe<Array<Scalars['String']>>
  title_eq?: Maybe<Scalars['String']>
  title_contains?: Maybe<Scalars['String']>
  title_startsWith?: Maybe<Scalars['String']>
  title_endsWith?: Maybe<Scalars['String']>
  title_in?: Maybe<Array<Scalars['String']>>
  description_eq?: Maybe<Scalars['String']>
  description_contains?: Maybe<Scalars['String']>
  description_startsWith?: Maybe<Scalars['String']>
  description_endsWith?: Maybe<Scalars['String']>
  description_in?: Maybe<Array<Scalars['String']>>
  activeVideosCounter_eq?: Maybe<Scalars['Int']>
  activeVideosCounter_gt?: Maybe<Scalars['Int']>
  activeVideosCounter_gte?: Maybe<Scalars['Int']>
  activeVideosCounter_lt?: Maybe<Scalars['Int']>
  activeVideosCounter_lte?: Maybe<Scalars['Int']>
  activeVideosCounter_in?: Maybe<Array<Scalars['Int']>>
  isPublic_eq?: Maybe<Scalars['Boolean']>
  isPublic_in?: Maybe<Array<Scalars['Boolean']>>
  isCensored_eq?: Maybe<Scalars['Boolean']>
  isCensored_in?: Maybe<Array<Scalars['Boolean']>>
  createdInBlock_eq?: Maybe<Scalars['Int']>
  createdInBlock_gt?: Maybe<Scalars['Int']>
  createdInBlock_gte?: Maybe<Scalars['Int']>
  createdInBlock_lt?: Maybe<Scalars['Int']>
  createdInBlock_lte?: Maybe<Scalars['Int']>
  createdInBlock_in?: Maybe<Array<Scalars['Int']>>
  ownerMember?: Maybe<MembershipWhereInput>
  ownerCuratorGroup?: Maybe<CuratorGroupWhereInput>
  category?: Maybe<ChannelCategoryWhereInput>
  coverPhoto?: Maybe<StorageDataObjectWhereInput>
  avatarPhoto?: Maybe<StorageDataObjectWhereInput>
  language?: Maybe<LanguageWhereInput>
  videos_none?: Maybe<VideoWhereInput>
  videos_some?: Maybe<VideoWhereInput>
  videos_every?: Maybe<VideoWhereInput>
  collaborators_none?: Maybe<MembershipWhereInput>
  collaborators_some?: Maybe<MembershipWhereInput>
  collaborators_every?: Maybe<MembershipWhereInput>
  AND?: Maybe<Array<ChannelWhereInput>>
  OR?: Maybe<Array<ChannelWhereInput>>
}

export type ChannelWhereUniqueInput = {
  id: Scalars['ID']
}

export type Language = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Language identifier ISO 639-1 */
  iso: Scalars['String']
  createdInBlock: Scalars['Int']
  channellanguage?: Maybe<Array<Channel>>
  videolanguage?: Maybe<Array<Video>>
}

export type LanguageConnection = {
  totalCount: Scalars['Int']
  edges: Array<LanguageEdge>
  pageInfo: PageInfo
}

export type LanguageCreateInput = {
  iso: Scalars['String']
  createdInBlock: Scalars['Float']
}

export type LanguageEdge = {
  node: Language
  cursor: Scalars['String']
}

export enum LanguageOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  IsoAsc = 'iso_ASC',
  IsoDesc = 'iso_DESC',
  CreatedInBlockAsc = 'createdInBlock_ASC',
  CreatedInBlockDesc = 'createdInBlock_DESC',
}

export type LanguageUpdateInput = {
  iso?: Maybe<Scalars['String']>
  createdInBlock?: Maybe<Scalars['Float']>
}

export type LanguageWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  iso_eq?: Maybe<Scalars['String']>
  iso_contains?: Maybe<Scalars['String']>
  iso_startsWith?: Maybe<Scalars['String']>
  iso_endsWith?: Maybe<Scalars['String']>
  iso_in?: Maybe<Array<Scalars['String']>>
  createdInBlock_eq?: Maybe<Scalars['Int']>
  createdInBlock_gt?: Maybe<Scalars['Int']>
  createdInBlock_gte?: Maybe<Scalars['Int']>
  createdInBlock_lt?: Maybe<Scalars['Int']>
  createdInBlock_lte?: Maybe<Scalars['Int']>
  createdInBlock_in?: Maybe<Array<Scalars['Int']>>
  channellanguage_none?: Maybe<ChannelWhereInput>
  channellanguage_some?: Maybe<ChannelWhereInput>
  channellanguage_every?: Maybe<ChannelWhereInput>
  videolanguage_none?: Maybe<VideoWhereInput>
  videolanguage_some?: Maybe<VideoWhereInput>
  videolanguage_every?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<LanguageWhereInput>>
  OR?: Maybe<Array<LanguageWhereInput>>
}

export type LanguageWhereUniqueInput = {
  id: Scalars['ID']
}

export type License = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** License code defined by Joystream */
  code?: Maybe<Scalars['Int']>
  /** Attribution (if required by the license) */
  attribution?: Maybe<Scalars['String']>
  /** Custom license content */
  customText?: Maybe<Scalars['String']>
  videolicense?: Maybe<Array<Video>>
}

export type LicenseConnection = {
  totalCount: Scalars['Int']
  edges: Array<LicenseEdge>
  pageInfo: PageInfo
}

export type LicenseCreateInput = {
  code?: Maybe<Scalars['Float']>
  attribution?: Maybe<Scalars['String']>
  customText?: Maybe<Scalars['String']>
}

export type LicenseEdge = {
  node: License
  cursor: Scalars['String']
}

export enum LicenseOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  CodeAsc = 'code_ASC',
  CodeDesc = 'code_DESC',
  AttributionAsc = 'attribution_ASC',
  AttributionDesc = 'attribution_DESC',
  CustomTextAsc = 'customText_ASC',
  CustomTextDesc = 'customText_DESC',
}

export type LicenseUpdateInput = {
  code?: Maybe<Scalars['Float']>
  attribution?: Maybe<Scalars['String']>
  customText?: Maybe<Scalars['String']>
}

export type LicenseWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  code_eq?: Maybe<Scalars['Int']>
  code_gt?: Maybe<Scalars['Int']>
  code_gte?: Maybe<Scalars['Int']>
  code_lt?: Maybe<Scalars['Int']>
  code_lte?: Maybe<Scalars['Int']>
  code_in?: Maybe<Array<Scalars['Int']>>
  attribution_eq?: Maybe<Scalars['String']>
  attribution_contains?: Maybe<Scalars['String']>
  attribution_startsWith?: Maybe<Scalars['String']>
  attribution_endsWith?: Maybe<Scalars['String']>
  attribution_in?: Maybe<Array<Scalars['String']>>
  customText_eq?: Maybe<Scalars['String']>
  customText_contains?: Maybe<Scalars['String']>
  customText_startsWith?: Maybe<Scalars['String']>
  customText_endsWith?: Maybe<Scalars['String']>
  customText_in?: Maybe<Array<Scalars['String']>>
  videolicense_none?: Maybe<VideoWhereInput>
  videolicense_some?: Maybe<VideoWhereInput>
  videolicense_every?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<LicenseWhereInput>>
  OR?: Maybe<Array<LicenseWhereInput>>
}

export type LicenseWhereUniqueInput = {
  id: Scalars['ID']
}

export type MembersByHandleFtsOutput = {
  item: MembersByHandleSearchResult
  rank: Scalars['Float']
  isTypeOf: Scalars['String']
  highlight: Scalars['String']
}

export type MembersByHandleSearchResult = Membership

/** Stored information about a registered user */
export type Membership = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** The unique handle chosen by member */
  handle: Scalars['String']
  /** A Url to member's Avatar image */
  avatarUri?: Maybe<Scalars['String']>
  /** Short text chosen by member to share information about themselves */
  about?: Maybe<Scalars['String']>
  /** Member's controller account id */
  controllerAccount: Scalars['String']
  /** Member's root account id */
  rootAccount: Scalars['String']
  /** Blocknumber when member was registered */
  createdInBlock: Scalars['Int']
  /** How the member was registered */
  entry: MembershipEntryMethod
  /** The type of subscription the member has purchased if any. */
  subscription?: Maybe<Scalars['Int']>
  channels: Array<Channel>
  collaboratorInChannels: Array<Channel>
  whitelistedInAuctions: Array<Auction>
  ownedNfts: Array<OwnedNft>
  auctioninitialOwner?: Maybe<Array<Auction>>
  auctionwinningMember?: Maybe<Array<Auction>>
  auctionbidcanceledeventmember?: Maybe<Array<AuctionBidCanceledEvent>>
  auctionbidmadeeventmember?: Maybe<Array<AuctionBidMadeEvent>>
  bidbidder?: Maybe<Array<Bid>>
  bidmadecompletingauctioneventmember?: Maybe<Array<BidMadeCompletingAuctionEvent>>
  englishauctioncompletedeventmember?: Maybe<Array<EnglishAuctionCompletedEvent>>
  nftboughteventmember?: Maybe<Array<NftBoughtEvent>>
  nftissuedeventnewOwner?: Maybe<Array<NftIssuedEvent>>
  offerstartedeventmember?: Maybe<Array<OfferStartedEvent>>
}

export type MembershipConnection = {
  totalCount: Scalars['Int']
  edges: Array<MembershipEdge>
  pageInfo: PageInfo
}

export type MembershipCreateInput = {
  handle: Scalars['String']
  avatarUri?: Maybe<Scalars['String']>
  about?: Maybe<Scalars['String']>
  controllerAccount: Scalars['String']
  rootAccount: Scalars['String']
  createdInBlock: Scalars['Float']
  entry: MembershipEntryMethod
  subscription?: Maybe<Scalars['Float']>
}

export type MembershipEdge = {
  node: Membership
  cursor: Scalars['String']
}

export enum MembershipEntryMethod {
  Paid = 'PAID',
  Screening = 'SCREENING',
  Genesis = 'GENESIS',
}

export enum MembershipOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  HandleAsc = 'handle_ASC',
  HandleDesc = 'handle_DESC',
  AvatarUriAsc = 'avatarUri_ASC',
  AvatarUriDesc = 'avatarUri_DESC',
  AboutAsc = 'about_ASC',
  AboutDesc = 'about_DESC',
  ControllerAccountAsc = 'controllerAccount_ASC',
  ControllerAccountDesc = 'controllerAccount_DESC',
  RootAccountAsc = 'rootAccount_ASC',
  RootAccountDesc = 'rootAccount_DESC',
  CreatedInBlockAsc = 'createdInBlock_ASC',
  CreatedInBlockDesc = 'createdInBlock_DESC',
  EntryAsc = 'entry_ASC',
  EntryDesc = 'entry_DESC',
  SubscriptionAsc = 'subscription_ASC',
  SubscriptionDesc = 'subscription_DESC',
}

export type MembershipUpdateInput = {
  handle?: Maybe<Scalars['String']>
  avatarUri?: Maybe<Scalars['String']>
  about?: Maybe<Scalars['String']>
  controllerAccount?: Maybe<Scalars['String']>
  rootAccount?: Maybe<Scalars['String']>
  createdInBlock?: Maybe<Scalars['Float']>
  entry?: Maybe<MembershipEntryMethod>
  subscription?: Maybe<Scalars['Float']>
}

export type MembershipWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  handle_eq?: Maybe<Scalars['String']>
  handle_contains?: Maybe<Scalars['String']>
  handle_startsWith?: Maybe<Scalars['String']>
  handle_endsWith?: Maybe<Scalars['String']>
  handle_in?: Maybe<Array<Scalars['String']>>
  avatarUri_eq?: Maybe<Scalars['String']>
  avatarUri_contains?: Maybe<Scalars['String']>
  avatarUri_startsWith?: Maybe<Scalars['String']>
  avatarUri_endsWith?: Maybe<Scalars['String']>
  avatarUri_in?: Maybe<Array<Scalars['String']>>
  about_eq?: Maybe<Scalars['String']>
  about_contains?: Maybe<Scalars['String']>
  about_startsWith?: Maybe<Scalars['String']>
  about_endsWith?: Maybe<Scalars['String']>
  about_in?: Maybe<Array<Scalars['String']>>
  controllerAccount_eq?: Maybe<Scalars['String']>
  controllerAccount_contains?: Maybe<Scalars['String']>
  controllerAccount_startsWith?: Maybe<Scalars['String']>
  controllerAccount_endsWith?: Maybe<Scalars['String']>
  controllerAccount_in?: Maybe<Array<Scalars['String']>>
  rootAccount_eq?: Maybe<Scalars['String']>
  rootAccount_contains?: Maybe<Scalars['String']>
  rootAccount_startsWith?: Maybe<Scalars['String']>
  rootAccount_endsWith?: Maybe<Scalars['String']>
  rootAccount_in?: Maybe<Array<Scalars['String']>>
  createdInBlock_eq?: Maybe<Scalars['Int']>
  createdInBlock_gt?: Maybe<Scalars['Int']>
  createdInBlock_gte?: Maybe<Scalars['Int']>
  createdInBlock_lt?: Maybe<Scalars['Int']>
  createdInBlock_lte?: Maybe<Scalars['Int']>
  createdInBlock_in?: Maybe<Array<Scalars['Int']>>
  entry_eq?: Maybe<MembershipEntryMethod>
  entry_in?: Maybe<Array<MembershipEntryMethod>>
  subscription_eq?: Maybe<Scalars['Int']>
  subscription_gt?: Maybe<Scalars['Int']>
  subscription_gte?: Maybe<Scalars['Int']>
  subscription_lt?: Maybe<Scalars['Int']>
  subscription_lte?: Maybe<Scalars['Int']>
  subscription_in?: Maybe<Array<Scalars['Int']>>
  channels_none?: Maybe<ChannelWhereInput>
  channels_some?: Maybe<ChannelWhereInput>
  channels_every?: Maybe<ChannelWhereInput>
  collaboratorInChannels_none?: Maybe<ChannelWhereInput>
  collaboratorInChannels_some?: Maybe<ChannelWhereInput>
  collaboratorInChannels_every?: Maybe<ChannelWhereInput>
  whitelistedInAuctions_none?: Maybe<AuctionWhereInput>
  whitelistedInAuctions_some?: Maybe<AuctionWhereInput>
  whitelistedInAuctions_every?: Maybe<AuctionWhereInput>
  ownedNfts_none?: Maybe<OwnedNftWhereInput>
  ownedNfts_some?: Maybe<OwnedNftWhereInput>
  ownedNfts_every?: Maybe<OwnedNftWhereInput>
  auctioninitialOwner_none?: Maybe<AuctionWhereInput>
  auctioninitialOwner_some?: Maybe<AuctionWhereInput>
  auctioninitialOwner_every?: Maybe<AuctionWhereInput>
  auctionwinningMember_none?: Maybe<AuctionWhereInput>
  auctionwinningMember_some?: Maybe<AuctionWhereInput>
  auctionwinningMember_every?: Maybe<AuctionWhereInput>
  auctionbidcanceledeventmember_none?: Maybe<AuctionBidCanceledEventWhereInput>
  auctionbidcanceledeventmember_some?: Maybe<AuctionBidCanceledEventWhereInput>
  auctionbidcanceledeventmember_every?: Maybe<AuctionBidCanceledEventWhereInput>
  auctionbidmadeeventmember_none?: Maybe<AuctionBidMadeEventWhereInput>
  auctionbidmadeeventmember_some?: Maybe<AuctionBidMadeEventWhereInput>
  auctionbidmadeeventmember_every?: Maybe<AuctionBidMadeEventWhereInput>
  bidbidder_none?: Maybe<BidWhereInput>
  bidbidder_some?: Maybe<BidWhereInput>
  bidbidder_every?: Maybe<BidWhereInput>
  bidmadecompletingauctioneventmember_none?: Maybe<BidMadeCompletingAuctionEventWhereInput>
  bidmadecompletingauctioneventmember_some?: Maybe<BidMadeCompletingAuctionEventWhereInput>
  bidmadecompletingauctioneventmember_every?: Maybe<BidMadeCompletingAuctionEventWhereInput>
  englishauctioncompletedeventmember_none?: Maybe<EnglishAuctionCompletedEventWhereInput>
  englishauctioncompletedeventmember_some?: Maybe<EnglishAuctionCompletedEventWhereInput>
  englishauctioncompletedeventmember_every?: Maybe<EnglishAuctionCompletedEventWhereInput>
  nftboughteventmember_none?: Maybe<NftBoughtEventWhereInput>
  nftboughteventmember_some?: Maybe<NftBoughtEventWhereInput>
  nftboughteventmember_every?: Maybe<NftBoughtEventWhereInput>
  nftissuedeventnewOwner_none?: Maybe<NftIssuedEventWhereInput>
  nftissuedeventnewOwner_some?: Maybe<NftIssuedEventWhereInput>
  nftissuedeventnewOwner_every?: Maybe<NftIssuedEventWhereInput>
  offerstartedeventmember_none?: Maybe<OfferStartedEventWhereInput>
  offerstartedeventmember_some?: Maybe<OfferStartedEventWhereInput>
  offerstartedeventmember_every?: Maybe<OfferStartedEventWhereInput>
  AND?: Maybe<Array<MembershipWhereInput>>
  OR?: Maybe<Array<MembershipWhereInput>>
}

export type MembershipWhereUniqueInput = {
  id?: Maybe<Scalars['ID']>
  handle?: Maybe<Scalars['String']>
}

export enum Network {
  Giza = 'GIZA',
  Babylon = 'BABYLON',
  Alexandria = 'ALEXANDRIA',
  Rome = 'ROME',
}

export type NftBoughtEvent = Event &
  BaseGraphQlObject & {
    /** Hash of the extrinsic which caused the event to be emitted. */
    inExtrinsic?: Maybe<Scalars['String']>
    /** Blocknumber of the block in which the event was emitted. */
    inBlock: Scalars['Int']
    /** Network the block was produced in. */
    network: Network
    /** Index of event in block from which it was emitted. */
    indexInBlock: Scalars['Int']
    /** Filtering options for interface implementers */
    type?: Maybe<EventTypeOptions>
    id: Scalars['ID']
    createdAt: Scalars['DateTime']
    createdById: Scalars['String']
    updatedAt?: Maybe<Scalars['DateTime']>
    updatedById?: Maybe<Scalars['String']>
    deletedAt?: Maybe<Scalars['DateTime']>
    deletedById?: Maybe<Scalars['String']>
    version: Scalars['Int']
    video: Video
    videoId: Scalars['String']
    member: Membership
    memberId: Scalars['String']
  }

export type NftBoughtEventConnection = {
  totalCount: Scalars['Int']
  edges: Array<NftBoughtEventEdge>
  pageInfo: PageInfo
}

export type NftBoughtEventCreateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock: Scalars['Float']
  network: Network
  indexInBlock: Scalars['Float']
  video: Scalars['ID']
  member: Scalars['ID']
}

export type NftBoughtEventEdge = {
  node: NftBoughtEvent
  cursor: Scalars['String']
}

export enum NftBoughtEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  InExtrinsicAsc = 'inExtrinsic_ASC',
  InExtrinsicDesc = 'inExtrinsic_DESC',
  InBlockAsc = 'inBlock_ASC',
  InBlockDesc = 'inBlock_DESC',
  NetworkAsc = 'network_ASC',
  NetworkDesc = 'network_DESC',
  IndexInBlockAsc = 'indexInBlock_ASC',
  IndexInBlockDesc = 'indexInBlock_DESC',
  VideoAsc = 'video_ASC',
  VideoDesc = 'video_DESC',
  MemberAsc = 'member_ASC',
  MemberDesc = 'member_DESC',
}

export type NftBoughtEventUpdateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock?: Maybe<Scalars['Float']>
  network?: Maybe<Network>
  indexInBlock?: Maybe<Scalars['Float']>
  video?: Maybe<Scalars['ID']>
  member?: Maybe<Scalars['ID']>
}

export type NftBoughtEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  inExtrinsic_eq?: Maybe<Scalars['String']>
  inExtrinsic_contains?: Maybe<Scalars['String']>
  inExtrinsic_startsWith?: Maybe<Scalars['String']>
  inExtrinsic_endsWith?: Maybe<Scalars['String']>
  inExtrinsic_in?: Maybe<Array<Scalars['String']>>
  inBlock_eq?: Maybe<Scalars['Int']>
  inBlock_gt?: Maybe<Scalars['Int']>
  inBlock_gte?: Maybe<Scalars['Int']>
  inBlock_lt?: Maybe<Scalars['Int']>
  inBlock_lte?: Maybe<Scalars['Int']>
  inBlock_in?: Maybe<Array<Scalars['Int']>>
  network_eq?: Maybe<Network>
  network_in?: Maybe<Array<Network>>
  indexInBlock_eq?: Maybe<Scalars['Int']>
  indexInBlock_gt?: Maybe<Scalars['Int']>
  indexInBlock_gte?: Maybe<Scalars['Int']>
  indexInBlock_lt?: Maybe<Scalars['Int']>
  indexInBlock_lte?: Maybe<Scalars['Int']>
  indexInBlock_in?: Maybe<Array<Scalars['Int']>>
  video?: Maybe<VideoWhereInput>
  member?: Maybe<MembershipWhereInput>
  AND?: Maybe<Array<NftBoughtEventWhereInput>>
  OR?: Maybe<Array<NftBoughtEventWhereInput>>
}

export type NftBoughtEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type NftIssuedEvent = Event &
  BaseGraphQlObject & {
    /** Hash of the extrinsic which caused the event to be emitted. */
    inExtrinsic?: Maybe<Scalars['String']>
    /** Blocknumber of the block in which the event was emitted. */
    inBlock: Scalars['Int']
    /** Network the block was produced in. */
    network: Network
    /** Index of event in block from which it was emitted. */
    indexInBlock: Scalars['Int']
    /** Filtering options for interface implementers */
    type?: Maybe<EventTypeOptions>
    id: Scalars['ID']
    createdAt: Scalars['DateTime']
    createdById: Scalars['String']
    updatedAt?: Maybe<Scalars['DateTime']>
    updatedById?: Maybe<Scalars['String']>
    deletedAt?: Maybe<Scalars['DateTime']>
    deletedById?: Maybe<Scalars['String']>
    version: Scalars['Int']
    /** Content actor that issued the NFT. */
    contentActor: ContentActor
    video: Video
    videoId: Scalars['String']
    /** Royalty for the NFT/video. */
    royalty?: Maybe<Scalars['Float']>
    /** NFT's metadata. */
    metadata: Scalars['String']
    newOwner?: Maybe<Membership>
    newOwnerId?: Maybe<Scalars['String']>
  }

export type NftIssuedEventConnection = {
  totalCount: Scalars['Int']
  edges: Array<NftIssuedEventEdge>
  pageInfo: PageInfo
}

export type NftIssuedEventCreateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock: Scalars['Float']
  network: Network
  indexInBlock: Scalars['Float']
  contentActor: Scalars['JSONObject']
  video: Scalars['ID']
  royalty?: Maybe<Scalars['Float']>
  metadata: Scalars['String']
  newOwner?: Maybe<Scalars['ID']>
}

export type NftIssuedEventEdge = {
  node: NftIssuedEvent
  cursor: Scalars['String']
}

export enum NftIssuedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  InExtrinsicAsc = 'inExtrinsic_ASC',
  InExtrinsicDesc = 'inExtrinsic_DESC',
  InBlockAsc = 'inBlock_ASC',
  InBlockDesc = 'inBlock_DESC',
  NetworkAsc = 'network_ASC',
  NetworkDesc = 'network_DESC',
  IndexInBlockAsc = 'indexInBlock_ASC',
  IndexInBlockDesc = 'indexInBlock_DESC',
  VideoAsc = 'video_ASC',
  VideoDesc = 'video_DESC',
  RoyaltyAsc = 'royalty_ASC',
  RoyaltyDesc = 'royalty_DESC',
  MetadataAsc = 'metadata_ASC',
  MetadataDesc = 'metadata_DESC',
  NewOwnerAsc = 'newOwner_ASC',
  NewOwnerDesc = 'newOwner_DESC',
}

export type NftIssuedEventUpdateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock?: Maybe<Scalars['Float']>
  network?: Maybe<Network>
  indexInBlock?: Maybe<Scalars['Float']>
  contentActor?: Maybe<Scalars['JSONObject']>
  video?: Maybe<Scalars['ID']>
  royalty?: Maybe<Scalars['Float']>
  metadata?: Maybe<Scalars['String']>
  newOwner?: Maybe<Scalars['ID']>
}

export type NftIssuedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  inExtrinsic_eq?: Maybe<Scalars['String']>
  inExtrinsic_contains?: Maybe<Scalars['String']>
  inExtrinsic_startsWith?: Maybe<Scalars['String']>
  inExtrinsic_endsWith?: Maybe<Scalars['String']>
  inExtrinsic_in?: Maybe<Array<Scalars['String']>>
  inBlock_eq?: Maybe<Scalars['Int']>
  inBlock_gt?: Maybe<Scalars['Int']>
  inBlock_gte?: Maybe<Scalars['Int']>
  inBlock_lt?: Maybe<Scalars['Int']>
  inBlock_lte?: Maybe<Scalars['Int']>
  inBlock_in?: Maybe<Array<Scalars['Int']>>
  network_eq?: Maybe<Network>
  network_in?: Maybe<Array<Network>>
  indexInBlock_eq?: Maybe<Scalars['Int']>
  indexInBlock_gt?: Maybe<Scalars['Int']>
  indexInBlock_gte?: Maybe<Scalars['Int']>
  indexInBlock_lt?: Maybe<Scalars['Int']>
  indexInBlock_lte?: Maybe<Scalars['Int']>
  indexInBlock_in?: Maybe<Array<Scalars['Int']>>
  contentActor_json?: Maybe<Scalars['JSONObject']>
  royalty_eq?: Maybe<Scalars['Float']>
  royalty_gt?: Maybe<Scalars['Float']>
  royalty_gte?: Maybe<Scalars['Float']>
  royalty_lt?: Maybe<Scalars['Float']>
  royalty_lte?: Maybe<Scalars['Float']>
  royalty_in?: Maybe<Array<Scalars['Float']>>
  metadata_eq?: Maybe<Scalars['String']>
  metadata_contains?: Maybe<Scalars['String']>
  metadata_startsWith?: Maybe<Scalars['String']>
  metadata_endsWith?: Maybe<Scalars['String']>
  metadata_in?: Maybe<Array<Scalars['String']>>
  video?: Maybe<VideoWhereInput>
  newOwner?: Maybe<MembershipWhereInput>
  AND?: Maybe<Array<NftIssuedEventWhereInput>>
  OR?: Maybe<Array<NftIssuedEventWhereInput>>
}

export type NftIssuedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type NftSellOrderMadeEvent = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Hash of the extrinsic which caused the event to be emitted. */
  inExtrinsic?: Maybe<Scalars['String']>
  /** Blocknumber of the block in which the event was emitted. */
  inBlock: Scalars['Int']
  /** Network the block was produced in. */
  network: Network
  /** Index of event in block from which it was emitted. */
  indexInBlock: Scalars['Int']
  video: Video
  videoId: Scalars['String']
  /** Content actor acting as NFT owner. */
  contentActor: ContentActor
  /** Offer's price. */
  price: Scalars['BigInt']
}

export type NftSellOrderMadeEventConnection = {
  totalCount: Scalars['Int']
  edges: Array<NftSellOrderMadeEventEdge>
  pageInfo: PageInfo
}

export type NftSellOrderMadeEventCreateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock: Scalars['Float']
  network: Network
  indexInBlock: Scalars['Float']
  video: Scalars['ID']
  contentActor: Scalars['JSONObject']
  price: Scalars['String']
}

export type NftSellOrderMadeEventEdge = {
  node: NftSellOrderMadeEvent
  cursor: Scalars['String']
}

export enum NftSellOrderMadeEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  InExtrinsicAsc = 'inExtrinsic_ASC',
  InExtrinsicDesc = 'inExtrinsic_DESC',
  InBlockAsc = 'inBlock_ASC',
  InBlockDesc = 'inBlock_DESC',
  NetworkAsc = 'network_ASC',
  NetworkDesc = 'network_DESC',
  IndexInBlockAsc = 'indexInBlock_ASC',
  IndexInBlockDesc = 'indexInBlock_DESC',
  VideoAsc = 'video_ASC',
  VideoDesc = 'video_DESC',
  PriceAsc = 'price_ASC',
  PriceDesc = 'price_DESC',
}

export type NftSellOrderMadeEventUpdateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock?: Maybe<Scalars['Float']>
  network?: Maybe<Network>
  indexInBlock?: Maybe<Scalars['Float']>
  video?: Maybe<Scalars['ID']>
  contentActor?: Maybe<Scalars['JSONObject']>
  price?: Maybe<Scalars['String']>
}

export type NftSellOrderMadeEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  inExtrinsic_eq?: Maybe<Scalars['String']>
  inExtrinsic_contains?: Maybe<Scalars['String']>
  inExtrinsic_startsWith?: Maybe<Scalars['String']>
  inExtrinsic_endsWith?: Maybe<Scalars['String']>
  inExtrinsic_in?: Maybe<Array<Scalars['String']>>
  inBlock_eq?: Maybe<Scalars['Int']>
  inBlock_gt?: Maybe<Scalars['Int']>
  inBlock_gte?: Maybe<Scalars['Int']>
  inBlock_lt?: Maybe<Scalars['Int']>
  inBlock_lte?: Maybe<Scalars['Int']>
  inBlock_in?: Maybe<Array<Scalars['Int']>>
  network_eq?: Maybe<Network>
  network_in?: Maybe<Array<Network>>
  indexInBlock_eq?: Maybe<Scalars['Int']>
  indexInBlock_gt?: Maybe<Scalars['Int']>
  indexInBlock_gte?: Maybe<Scalars['Int']>
  indexInBlock_lt?: Maybe<Scalars['Int']>
  indexInBlock_lte?: Maybe<Scalars['Int']>
  indexInBlock_in?: Maybe<Array<Scalars['Int']>>
  contentActor_json?: Maybe<Scalars['JSONObject']>
  price_eq?: Maybe<Scalars['BigInt']>
  price_gt?: Maybe<Scalars['BigInt']>
  price_gte?: Maybe<Scalars['BigInt']>
  price_lt?: Maybe<Scalars['BigInt']>
  price_lte?: Maybe<Scalars['BigInt']>
  price_in?: Maybe<Array<Scalars['BigInt']>>
  video?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<NftSellOrderMadeEventWhereInput>>
  OR?: Maybe<Array<NftSellOrderMadeEventWhereInput>>
}

export type NftSellOrderMadeEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type NodeLocationMetadata = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** ISO 3166-1 alpha-2 country code (2 letters) */
  countryCode?: Maybe<Scalars['String']>
  /** City name */
  city?: Maybe<Scalars['String']>
  coordinates?: Maybe<GeoCoordinates>
  coordinatesId?: Maybe<Scalars['String']>
  distributionbucketoperatormetadatanodeLocation?: Maybe<Array<DistributionBucketOperatorMetadata>>
  storagebucketoperatormetadatanodeLocation?: Maybe<Array<StorageBucketOperatorMetadata>>
}

export type NodeLocationMetadataConnection = {
  totalCount: Scalars['Int']
  edges: Array<NodeLocationMetadataEdge>
  pageInfo: PageInfo
}

export type NodeLocationMetadataCreateInput = {
  countryCode?: Maybe<Scalars['String']>
  city?: Maybe<Scalars['String']>
  coordinates?: Maybe<Scalars['ID']>
}

export type NodeLocationMetadataEdge = {
  node: NodeLocationMetadata
  cursor: Scalars['String']
}

export enum NodeLocationMetadataOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  CountryCodeAsc = 'countryCode_ASC',
  CountryCodeDesc = 'countryCode_DESC',
  CityAsc = 'city_ASC',
  CityDesc = 'city_DESC',
  CoordinatesAsc = 'coordinates_ASC',
  CoordinatesDesc = 'coordinates_DESC',
}

export type NodeLocationMetadataUpdateInput = {
  countryCode?: Maybe<Scalars['String']>
  city?: Maybe<Scalars['String']>
  coordinates?: Maybe<Scalars['ID']>
}

export type NodeLocationMetadataWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  countryCode_eq?: Maybe<Scalars['String']>
  countryCode_contains?: Maybe<Scalars['String']>
  countryCode_startsWith?: Maybe<Scalars['String']>
  countryCode_endsWith?: Maybe<Scalars['String']>
  countryCode_in?: Maybe<Array<Scalars['String']>>
  city_eq?: Maybe<Scalars['String']>
  city_contains?: Maybe<Scalars['String']>
  city_startsWith?: Maybe<Scalars['String']>
  city_endsWith?: Maybe<Scalars['String']>
  city_in?: Maybe<Array<Scalars['String']>>
  coordinates?: Maybe<GeoCoordinatesWhereInput>
  distributionbucketoperatormetadatanodeLocation_none?: Maybe<DistributionBucketOperatorMetadataWhereInput>
  distributionbucketoperatormetadatanodeLocation_some?: Maybe<DistributionBucketOperatorMetadataWhereInput>
  distributionbucketoperatormetadatanodeLocation_every?: Maybe<DistributionBucketOperatorMetadataWhereInput>
  storagebucketoperatormetadatanodeLocation_none?: Maybe<StorageBucketOperatorMetadataWhereInput>
  storagebucketoperatormetadatanodeLocation_some?: Maybe<StorageBucketOperatorMetadataWhereInput>
  storagebucketoperatormetadatanodeLocation_every?: Maybe<StorageBucketOperatorMetadataWhereInput>
  AND?: Maybe<Array<NodeLocationMetadataWhereInput>>
  OR?: Maybe<Array<NodeLocationMetadataWhereInput>>
}

export type NodeLocationMetadataWhereUniqueInput = {
  id: Scalars['ID']
}

export type OfferAcceptedEvent = Event &
  BaseGraphQlObject & {
    /** Hash of the extrinsic which caused the event to be emitted. */
    inExtrinsic?: Maybe<Scalars['String']>
    /** Blocknumber of the block in which the event was emitted. */
    inBlock: Scalars['Int']
    /** Network the block was produced in. */
    network: Network
    /** Index of event in block from which it was emitted. */
    indexInBlock: Scalars['Int']
    /** Filtering options for interface implementers */
    type?: Maybe<EventTypeOptions>
    id: Scalars['ID']
    createdAt: Scalars['DateTime']
    createdById: Scalars['String']
    updatedAt?: Maybe<Scalars['DateTime']>
    updatedById?: Maybe<Scalars['String']>
    deletedAt?: Maybe<Scalars['DateTime']>
    deletedById?: Maybe<Scalars['String']>
    version: Scalars['Int']
    video: Video
    videoId: Scalars['String']
  }

export type OfferAcceptedEventConnection = {
  totalCount: Scalars['Int']
  edges: Array<OfferAcceptedEventEdge>
  pageInfo: PageInfo
}

export type OfferAcceptedEventCreateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock: Scalars['Float']
  network: Network
  indexInBlock: Scalars['Float']
  video: Scalars['ID']
}

export type OfferAcceptedEventEdge = {
  node: OfferAcceptedEvent
  cursor: Scalars['String']
}

export enum OfferAcceptedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  InExtrinsicAsc = 'inExtrinsic_ASC',
  InExtrinsicDesc = 'inExtrinsic_DESC',
  InBlockAsc = 'inBlock_ASC',
  InBlockDesc = 'inBlock_DESC',
  NetworkAsc = 'network_ASC',
  NetworkDesc = 'network_DESC',
  IndexInBlockAsc = 'indexInBlock_ASC',
  IndexInBlockDesc = 'indexInBlock_DESC',
  VideoAsc = 'video_ASC',
  VideoDesc = 'video_DESC',
}

export type OfferAcceptedEventUpdateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock?: Maybe<Scalars['Float']>
  network?: Maybe<Network>
  indexInBlock?: Maybe<Scalars['Float']>
  video?: Maybe<Scalars['ID']>
}

export type OfferAcceptedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  inExtrinsic_eq?: Maybe<Scalars['String']>
  inExtrinsic_contains?: Maybe<Scalars['String']>
  inExtrinsic_startsWith?: Maybe<Scalars['String']>
  inExtrinsic_endsWith?: Maybe<Scalars['String']>
  inExtrinsic_in?: Maybe<Array<Scalars['String']>>
  inBlock_eq?: Maybe<Scalars['Int']>
  inBlock_gt?: Maybe<Scalars['Int']>
  inBlock_gte?: Maybe<Scalars['Int']>
  inBlock_lt?: Maybe<Scalars['Int']>
  inBlock_lte?: Maybe<Scalars['Int']>
  inBlock_in?: Maybe<Array<Scalars['Int']>>
  network_eq?: Maybe<Network>
  network_in?: Maybe<Array<Network>>
  indexInBlock_eq?: Maybe<Scalars['Int']>
  indexInBlock_gt?: Maybe<Scalars['Int']>
  indexInBlock_gte?: Maybe<Scalars['Int']>
  indexInBlock_lt?: Maybe<Scalars['Int']>
  indexInBlock_lte?: Maybe<Scalars['Int']>
  indexInBlock_in?: Maybe<Array<Scalars['Int']>>
  video?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<OfferAcceptedEventWhereInput>>
  OR?: Maybe<Array<OfferAcceptedEventWhereInput>>
}

export type OfferAcceptedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type OfferCanceledEvent = Event &
  BaseGraphQlObject & {
    /** Hash of the extrinsic which caused the event to be emitted. */
    inExtrinsic?: Maybe<Scalars['String']>
    /** Blocknumber of the block in which the event was emitted. */
    inBlock: Scalars['Int']
    /** Network the block was produced in. */
    network: Network
    /** Index of event in block from which it was emitted. */
    indexInBlock: Scalars['Int']
    /** Filtering options for interface implementers */
    type?: Maybe<EventTypeOptions>
    id: Scalars['ID']
    createdAt: Scalars['DateTime']
    createdById: Scalars['String']
    updatedAt?: Maybe<Scalars['DateTime']>
    updatedById?: Maybe<Scalars['String']>
    deletedAt?: Maybe<Scalars['DateTime']>
    deletedById?: Maybe<Scalars['String']>
    version: Scalars['Int']
    video: Video
    videoId: Scalars['String']
    /** Content actor acting as NFT owner. */
    contentActor: ContentActor
  }

export type OfferCanceledEventConnection = {
  totalCount: Scalars['Int']
  edges: Array<OfferCanceledEventEdge>
  pageInfo: PageInfo
}

export type OfferCanceledEventCreateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock: Scalars['Float']
  network: Network
  indexInBlock: Scalars['Float']
  video: Scalars['ID']
  contentActor: Scalars['JSONObject']
}

export type OfferCanceledEventEdge = {
  node: OfferCanceledEvent
  cursor: Scalars['String']
}

export enum OfferCanceledEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  InExtrinsicAsc = 'inExtrinsic_ASC',
  InExtrinsicDesc = 'inExtrinsic_DESC',
  InBlockAsc = 'inBlock_ASC',
  InBlockDesc = 'inBlock_DESC',
  NetworkAsc = 'network_ASC',
  NetworkDesc = 'network_DESC',
  IndexInBlockAsc = 'indexInBlock_ASC',
  IndexInBlockDesc = 'indexInBlock_DESC',
  VideoAsc = 'video_ASC',
  VideoDesc = 'video_DESC',
}

export type OfferCanceledEventUpdateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock?: Maybe<Scalars['Float']>
  network?: Maybe<Network>
  indexInBlock?: Maybe<Scalars['Float']>
  video?: Maybe<Scalars['ID']>
  contentActor?: Maybe<Scalars['JSONObject']>
}

export type OfferCanceledEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  inExtrinsic_eq?: Maybe<Scalars['String']>
  inExtrinsic_contains?: Maybe<Scalars['String']>
  inExtrinsic_startsWith?: Maybe<Scalars['String']>
  inExtrinsic_endsWith?: Maybe<Scalars['String']>
  inExtrinsic_in?: Maybe<Array<Scalars['String']>>
  inBlock_eq?: Maybe<Scalars['Int']>
  inBlock_gt?: Maybe<Scalars['Int']>
  inBlock_gte?: Maybe<Scalars['Int']>
  inBlock_lt?: Maybe<Scalars['Int']>
  inBlock_lte?: Maybe<Scalars['Int']>
  inBlock_in?: Maybe<Array<Scalars['Int']>>
  network_eq?: Maybe<Network>
  network_in?: Maybe<Array<Network>>
  indexInBlock_eq?: Maybe<Scalars['Int']>
  indexInBlock_gt?: Maybe<Scalars['Int']>
  indexInBlock_gte?: Maybe<Scalars['Int']>
  indexInBlock_lt?: Maybe<Scalars['Int']>
  indexInBlock_lte?: Maybe<Scalars['Int']>
  indexInBlock_in?: Maybe<Array<Scalars['Int']>>
  contentActor_json?: Maybe<Scalars['JSONObject']>
  video?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<OfferCanceledEventWhereInput>>
  OR?: Maybe<Array<OfferCanceledEventWhereInput>>
}

export type OfferCanceledEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type OfferStartedEvent = Event &
  BaseGraphQlObject & {
    /** Hash of the extrinsic which caused the event to be emitted. */
    inExtrinsic?: Maybe<Scalars['String']>
    /** Blocknumber of the block in which the event was emitted. */
    inBlock: Scalars['Int']
    /** Network the block was produced in. */
    network: Network
    /** Index of event in block from which it was emitted. */
    indexInBlock: Scalars['Int']
    /** Filtering options for interface implementers */
    type?: Maybe<EventTypeOptions>
    id: Scalars['ID']
    createdAt: Scalars['DateTime']
    createdById: Scalars['String']
    updatedAt?: Maybe<Scalars['DateTime']>
    updatedById?: Maybe<Scalars['String']>
    deletedAt?: Maybe<Scalars['DateTime']>
    deletedById?: Maybe<Scalars['String']>
    version: Scalars['Int']
    video: Video
    videoId: Scalars['String']
    /** Content actor acting as NFT owner. */
    contentActor: ContentActor
    member: Membership
    memberId: Scalars['String']
    /** Offer's price. */
    price?: Maybe<Scalars['BigInt']>
  }

export type OfferStartedEventConnection = {
  totalCount: Scalars['Int']
  edges: Array<OfferStartedEventEdge>
  pageInfo: PageInfo
}

export type OfferStartedEventCreateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock: Scalars['Float']
  network: Network
  indexInBlock: Scalars['Float']
  video: Scalars['ID']
  contentActor: Scalars['JSONObject']
  member: Scalars['ID']
  price?: Maybe<Scalars['String']>
}

export type OfferStartedEventEdge = {
  node: OfferStartedEvent
  cursor: Scalars['String']
}

export enum OfferStartedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  InExtrinsicAsc = 'inExtrinsic_ASC',
  InExtrinsicDesc = 'inExtrinsic_DESC',
  InBlockAsc = 'inBlock_ASC',
  InBlockDesc = 'inBlock_DESC',
  NetworkAsc = 'network_ASC',
  NetworkDesc = 'network_DESC',
  IndexInBlockAsc = 'indexInBlock_ASC',
  IndexInBlockDesc = 'indexInBlock_DESC',
  VideoAsc = 'video_ASC',
  VideoDesc = 'video_DESC',
  MemberAsc = 'member_ASC',
  MemberDesc = 'member_DESC',
  PriceAsc = 'price_ASC',
  PriceDesc = 'price_DESC',
}

export type OfferStartedEventUpdateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock?: Maybe<Scalars['Float']>
  network?: Maybe<Network>
  indexInBlock?: Maybe<Scalars['Float']>
  video?: Maybe<Scalars['ID']>
  contentActor?: Maybe<Scalars['JSONObject']>
  member?: Maybe<Scalars['ID']>
  price?: Maybe<Scalars['String']>
}

export type OfferStartedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  inExtrinsic_eq?: Maybe<Scalars['String']>
  inExtrinsic_contains?: Maybe<Scalars['String']>
  inExtrinsic_startsWith?: Maybe<Scalars['String']>
  inExtrinsic_endsWith?: Maybe<Scalars['String']>
  inExtrinsic_in?: Maybe<Array<Scalars['String']>>
  inBlock_eq?: Maybe<Scalars['Int']>
  inBlock_gt?: Maybe<Scalars['Int']>
  inBlock_gte?: Maybe<Scalars['Int']>
  inBlock_lt?: Maybe<Scalars['Int']>
  inBlock_lte?: Maybe<Scalars['Int']>
  inBlock_in?: Maybe<Array<Scalars['Int']>>
  network_eq?: Maybe<Network>
  network_in?: Maybe<Array<Network>>
  indexInBlock_eq?: Maybe<Scalars['Int']>
  indexInBlock_gt?: Maybe<Scalars['Int']>
  indexInBlock_gte?: Maybe<Scalars['Int']>
  indexInBlock_lt?: Maybe<Scalars['Int']>
  indexInBlock_lte?: Maybe<Scalars['Int']>
  indexInBlock_in?: Maybe<Array<Scalars['Int']>>
  contentActor_json?: Maybe<Scalars['JSONObject']>
  price_eq?: Maybe<Scalars['BigInt']>
  price_gt?: Maybe<Scalars['BigInt']>
  price_gte?: Maybe<Scalars['BigInt']>
  price_lt?: Maybe<Scalars['BigInt']>
  price_lte?: Maybe<Scalars['BigInt']>
  price_in?: Maybe<Array<Scalars['BigInt']>>
  video?: Maybe<VideoWhereInput>
  member?: Maybe<MembershipWhereInput>
  AND?: Maybe<Array<OfferStartedEventWhereInput>>
  OR?: Maybe<Array<OfferStartedEventWhereInput>>
}

export type OfferStartedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type OpenAuctionBidAcceptedEvent = Event &
  BaseGraphQlObject & {
    /** Hash of the extrinsic which caused the event to be emitted. */
    inExtrinsic?: Maybe<Scalars['String']>
    /** Blocknumber of the block in which the event was emitted. */
    inBlock: Scalars['Int']
    /** Network the block was produced in. */
    network: Network
    /** Index of event in block from which it was emitted. */
    indexInBlock: Scalars['Int']
    /** Filtering options for interface implementers */
    type?: Maybe<EventTypeOptions>
    id: Scalars['ID']
    createdAt: Scalars['DateTime']
    createdById: Scalars['String']
    updatedAt?: Maybe<Scalars['DateTime']>
    updatedById?: Maybe<Scalars['String']>
    deletedAt?: Maybe<Scalars['DateTime']>
    deletedById?: Maybe<Scalars['String']>
    version: Scalars['Int']
    /** Content actor canceling the event. */
    contentActor: ContentActor
    video: Video
    videoId: Scalars['String']
  }

export type OpenAuctionBidAcceptedEventConnection = {
  totalCount: Scalars['Int']
  edges: Array<OpenAuctionBidAcceptedEventEdge>
  pageInfo: PageInfo
}

export type OpenAuctionBidAcceptedEventCreateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock: Scalars['Float']
  network: Network
  indexInBlock: Scalars['Float']
  contentActor: Scalars['JSONObject']
  video: Scalars['ID']
}

export type OpenAuctionBidAcceptedEventEdge = {
  node: OpenAuctionBidAcceptedEvent
  cursor: Scalars['String']
}

export enum OpenAuctionBidAcceptedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  InExtrinsicAsc = 'inExtrinsic_ASC',
  InExtrinsicDesc = 'inExtrinsic_DESC',
  InBlockAsc = 'inBlock_ASC',
  InBlockDesc = 'inBlock_DESC',
  NetworkAsc = 'network_ASC',
  NetworkDesc = 'network_DESC',
  IndexInBlockAsc = 'indexInBlock_ASC',
  IndexInBlockDesc = 'indexInBlock_DESC',
  VideoAsc = 'video_ASC',
  VideoDesc = 'video_DESC',
}

export type OpenAuctionBidAcceptedEventUpdateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock?: Maybe<Scalars['Float']>
  network?: Maybe<Network>
  indexInBlock?: Maybe<Scalars['Float']>
  contentActor?: Maybe<Scalars['JSONObject']>
  video?: Maybe<Scalars['ID']>
}

export type OpenAuctionBidAcceptedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  inExtrinsic_eq?: Maybe<Scalars['String']>
  inExtrinsic_contains?: Maybe<Scalars['String']>
  inExtrinsic_startsWith?: Maybe<Scalars['String']>
  inExtrinsic_endsWith?: Maybe<Scalars['String']>
  inExtrinsic_in?: Maybe<Array<Scalars['String']>>
  inBlock_eq?: Maybe<Scalars['Int']>
  inBlock_gt?: Maybe<Scalars['Int']>
  inBlock_gte?: Maybe<Scalars['Int']>
  inBlock_lt?: Maybe<Scalars['Int']>
  inBlock_lte?: Maybe<Scalars['Int']>
  inBlock_in?: Maybe<Array<Scalars['Int']>>
  network_eq?: Maybe<Network>
  network_in?: Maybe<Array<Network>>
  indexInBlock_eq?: Maybe<Scalars['Int']>
  indexInBlock_gt?: Maybe<Scalars['Int']>
  indexInBlock_gte?: Maybe<Scalars['Int']>
  indexInBlock_lt?: Maybe<Scalars['Int']>
  indexInBlock_lte?: Maybe<Scalars['Int']>
  indexInBlock_in?: Maybe<Array<Scalars['Int']>>
  contentActor_json?: Maybe<Scalars['JSONObject']>
  video?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<OpenAuctionBidAcceptedEventWhereInput>>
  OR?: Maybe<Array<OpenAuctionBidAcceptedEventWhereInput>>
}

export type OpenAuctionBidAcceptedEventWhereUniqueInput = {
  id: Scalars['ID']
}

/** Represents NFT details */
export type OwnedNft = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  video: Video
  videoId: Scalars['String']
  ownerMember?: Maybe<Membership>
  ownerMemberId?: Maybe<Scalars['String']>
  ownerCuratorGroup?: Maybe<CuratorGroup>
  ownerCuratorGroupId?: Maybe<Scalars['String']>
  /** NFT's metadata */
  metadata: Scalars['String']
  /** NFT transactional status */
  transactionalStatus: TransactionalStatus
  /** Creator royalty */
  creatorRoyalty: Scalars['Float']
  videonft?: Maybe<Array<Video>>
}

export type OwnedNftConnection = {
  totalCount: Scalars['Int']
  edges: Array<OwnedNftEdge>
  pageInfo: PageInfo
}

export type OwnedNftCreateInput = {
  video: Scalars['ID']
  ownerMember?: Maybe<Scalars['ID']>
  ownerCuratorGroup?: Maybe<Scalars['ID']>
  metadata: Scalars['String']
  transactionalStatus: Scalars['JSONObject']
  creatorRoyalty: Scalars['Float']
}

export type OwnedNftEdge = {
  node: OwnedNft
  cursor: Scalars['String']
}

export enum OwnedNftOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  VideoAsc = 'video_ASC',
  VideoDesc = 'video_DESC',
  OwnerMemberAsc = 'ownerMember_ASC',
  OwnerMemberDesc = 'ownerMember_DESC',
  OwnerCuratorGroupAsc = 'ownerCuratorGroup_ASC',
  OwnerCuratorGroupDesc = 'ownerCuratorGroup_DESC',
  MetadataAsc = 'metadata_ASC',
  MetadataDesc = 'metadata_DESC',
  CreatorRoyaltyAsc = 'creatorRoyalty_ASC',
  CreatorRoyaltyDesc = 'creatorRoyalty_DESC',
}

export type OwnedNftUpdateInput = {
  video?: Maybe<Scalars['ID']>
  ownerMember?: Maybe<Scalars['ID']>
  ownerCuratorGroup?: Maybe<Scalars['ID']>
  metadata?: Maybe<Scalars['String']>
  transactionalStatus?: Maybe<Scalars['JSONObject']>
  creatorRoyalty?: Maybe<Scalars['Float']>
}

export type OwnedNftWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  metadata_eq?: Maybe<Scalars['String']>
  metadata_contains?: Maybe<Scalars['String']>
  metadata_startsWith?: Maybe<Scalars['String']>
  metadata_endsWith?: Maybe<Scalars['String']>
  metadata_in?: Maybe<Array<Scalars['String']>>
  transactionalStatus_json?: Maybe<Scalars['JSONObject']>
  creatorRoyalty_eq?: Maybe<Scalars['Float']>
  creatorRoyalty_gt?: Maybe<Scalars['Float']>
  creatorRoyalty_gte?: Maybe<Scalars['Float']>
  creatorRoyalty_lt?: Maybe<Scalars['Float']>
  creatorRoyalty_lte?: Maybe<Scalars['Float']>
  creatorRoyalty_in?: Maybe<Array<Scalars['Float']>>
  video?: Maybe<VideoWhereInput>
  ownerMember?: Maybe<MembershipWhereInput>
  ownerCuratorGroup?: Maybe<CuratorGroupWhereInput>
  videonft_none?: Maybe<VideoWhereInput>
  videonft_some?: Maybe<VideoWhereInput>
  videonft_every?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<OwnedNftWhereInput>>
  OR?: Maybe<Array<OwnedNftWhereInput>>
}

export type OwnedNftWhereUniqueInput = {
  id: Scalars['ID']
}

export type PageInfo = {
  hasNextPage: Scalars['Boolean']
  hasPreviousPage: Scalars['Boolean']
  startCursor?: Maybe<Scalars['String']>
  endCursor?: Maybe<Scalars['String']>
}

export type ProcessorState = {
  lastCompleteBlock: Scalars['Float']
  lastProcessedEvent: Scalars['String']
  indexerHead: Scalars['Float']
  chainHead: Scalars['Float']
}

export type Query = {
  auctionBidCanceledEvents: Array<AuctionBidCanceledEvent>
  auctionBidCanceledEventByUniqueInput?: Maybe<AuctionBidCanceledEvent>
  auctionBidCanceledEventsConnection: AuctionBidCanceledEventConnection
  auctionBidMadeEvents: Array<AuctionBidMadeEvent>
  auctionBidMadeEventByUniqueInput?: Maybe<AuctionBidMadeEvent>
  auctionBidMadeEventsConnection: AuctionBidMadeEventConnection
  auctionCanceledEvents: Array<AuctionCanceledEvent>
  auctionCanceledEventByUniqueInput?: Maybe<AuctionCanceledEvent>
  auctionCanceledEventsConnection: AuctionCanceledEventConnection
  auctionStartedEvents: Array<AuctionStartedEvent>
  auctionStartedEventByUniqueInput?: Maybe<AuctionStartedEvent>
  auctionStartedEventsConnection: AuctionStartedEventConnection
  auctions: Array<Auction>
  auctionByUniqueInput?: Maybe<Auction>
  auctionsConnection: AuctionConnection
  bidMadeCompletingAuctionEvents: Array<BidMadeCompletingAuctionEvent>
  bidMadeCompletingAuctionEventByUniqueInput?: Maybe<BidMadeCompletingAuctionEvent>
  bidMadeCompletingAuctionEventsConnection: BidMadeCompletingAuctionEventConnection
  bids: Array<Bid>
  bidByUniqueInput?: Maybe<Bid>
  bidsConnection: BidConnection
  buyNowCanceledEvents: Array<BuyNowCanceledEvent>
  buyNowCanceledEventByUniqueInput?: Maybe<BuyNowCanceledEvent>
  buyNowCanceledEventsConnection: BuyNowCanceledEventConnection
  curatorGroups: Array<CuratorGroup>
  curatorGroupByUniqueInput?: Maybe<CuratorGroup>
  curatorGroupsConnection: CuratorGroupConnection
  curators: Array<Curator>
  curatorByUniqueInput?: Maybe<Curator>
  curatorsConnection: CuratorConnection
  distributionBucketFamilyGeographicAreas: Array<DistributionBucketFamilyGeographicArea>
  distributionBucketFamilyGeographicAreaByUniqueInput?: Maybe<DistributionBucketFamilyGeographicArea>
  distributionBucketFamilyGeographicAreasConnection: DistributionBucketFamilyGeographicAreaConnection
  distributionBucketFamilyMetadata: Array<DistributionBucketFamilyMetadata>
  distributionBucketFamilyMetadataByUniqueInput?: Maybe<DistributionBucketFamilyMetadata>
  distributionBucketFamilyMetadataConnection: DistributionBucketFamilyMetadataConnection
  distributionBucketFamilies: Array<DistributionBucketFamily>
  distributionBucketFamilyByUniqueInput?: Maybe<DistributionBucketFamily>
  distributionBucketFamiliesConnection: DistributionBucketFamilyConnection
  distributionBucketOperatorMetadata: Array<DistributionBucketOperatorMetadata>
  distributionBucketOperatorMetadataByUniqueInput?: Maybe<DistributionBucketOperatorMetadata>
  distributionBucketOperatorMetadataConnection: DistributionBucketOperatorMetadataConnection
  distributionBucketOperators: Array<DistributionBucketOperator>
  distributionBucketOperatorByUniqueInput?: Maybe<DistributionBucketOperator>
  distributionBucketOperatorsConnection: DistributionBucketOperatorConnection
  distributionBuckets: Array<DistributionBucket>
  distributionBucketByUniqueInput?: Maybe<DistributionBucket>
  distributionBucketsConnection: DistributionBucketConnection
  englishAuctionCompletedEvents: Array<EnglishAuctionCompletedEvent>
  englishAuctionCompletedEventByUniqueInput?: Maybe<EnglishAuctionCompletedEvent>
  englishAuctionCompletedEventsConnection: EnglishAuctionCompletedEventConnection
  events: Array<Event>
  geoCoordinates: Array<GeoCoordinates>
  geoCoordinatesByUniqueInput?: Maybe<GeoCoordinates>
  geoCoordinatesConnection: GeoCoordinatesConnection
  channelCategories: Array<ChannelCategory>
  channelCategoryByUniqueInput?: Maybe<ChannelCategory>
  channelCategoriesConnection: ChannelCategoryConnection
  channels: Array<Channel>
  channelByUniqueInput?: Maybe<Channel>
  channelsConnection: ChannelConnection
  languages: Array<Language>
  languageByUniqueInput?: Maybe<Language>
  languagesConnection: LanguageConnection
  licenses: Array<License>
  licenseByUniqueInput?: Maybe<License>
  licensesConnection: LicenseConnection
  memberships: Array<Membership>
  membershipByUniqueInput?: Maybe<Membership>
  membershipsConnection: MembershipConnection
  nftBoughtEvents: Array<NftBoughtEvent>
  nftBoughtEventByUniqueInput?: Maybe<NftBoughtEvent>
  nftBoughtEventsConnection: NftBoughtEventConnection
  nftIssuedEvents: Array<NftIssuedEvent>
  nftIssuedEventByUniqueInput?: Maybe<NftIssuedEvent>
  nftIssuedEventsConnection: NftIssuedEventConnection
  nftSellOrderMadeEvents: Array<NftSellOrderMadeEvent>
  nftSellOrderMadeEventByUniqueInput?: Maybe<NftSellOrderMadeEvent>
  nftSellOrderMadeEventsConnection: NftSellOrderMadeEventConnection
  nodeLocationMetadata: Array<NodeLocationMetadata>
  nodeLocationMetadataByUniqueInput?: Maybe<NodeLocationMetadata>
  nodeLocationMetadataConnection: NodeLocationMetadataConnection
  offerAcceptedEvents: Array<OfferAcceptedEvent>
  offerAcceptedEventByUniqueInput?: Maybe<OfferAcceptedEvent>
  offerAcceptedEventsConnection: OfferAcceptedEventConnection
  offerCanceledEvents: Array<OfferCanceledEvent>
  offerCanceledEventByUniqueInput?: Maybe<OfferCanceledEvent>
  offerCanceledEventsConnection: OfferCanceledEventConnection
  offerStartedEvents: Array<OfferStartedEvent>
  offerStartedEventByUniqueInput?: Maybe<OfferStartedEvent>
  offerStartedEventsConnection: OfferStartedEventConnection
  openAuctionBidAcceptedEvents: Array<OpenAuctionBidAcceptedEvent>
  openAuctionBidAcceptedEventByUniqueInput?: Maybe<OpenAuctionBidAcceptedEvent>
  openAuctionBidAcceptedEventsConnection: OpenAuctionBidAcceptedEventConnection
  ownedNfts: Array<OwnedNft>
  ownedNftByUniqueInput?: Maybe<OwnedNft>
  ownedNftsConnection: OwnedNftConnection
  channelCategoriesByName: Array<ChannelCategoriesByNameFtsOutput>
  membersByHandle: Array<MembersByHandleFtsOutput>
  search: Array<SearchFtsOutput>
  videoCategoriesByName: Array<VideoCategoriesByNameFtsOutput>
  storageBags: Array<StorageBag>
  storageBagByUniqueInput?: Maybe<StorageBag>
  storageBagsConnection: StorageBagConnection
  storageBucketOperatorMetadata: Array<StorageBucketOperatorMetadata>
  storageBucketOperatorMetadataByUniqueInput?: Maybe<StorageBucketOperatorMetadata>
  storageBucketOperatorMetadataConnection: StorageBucketOperatorMetadataConnection
  storageBuckets: Array<StorageBucket>
  storageBucketByUniqueInput?: Maybe<StorageBucket>
  storageBucketsConnection: StorageBucketConnection
  storageDataObjects: Array<StorageDataObject>
  storageDataObjectByUniqueInput?: Maybe<StorageDataObject>
  storageDataObjectsConnection: StorageDataObjectConnection
  storageSystemParameters: Array<StorageSystemParameters>
  storageSystemParametersByUniqueInput?: Maybe<StorageSystemParameters>
  storageSystemParametersConnection: StorageSystemParametersConnection
  videoCategories: Array<VideoCategory>
  videoCategoryByUniqueInput?: Maybe<VideoCategory>
  videoCategoriesConnection: VideoCategoryConnection
  videoMediaEncodings: Array<VideoMediaEncoding>
  videoMediaEncodingByUniqueInput?: Maybe<VideoMediaEncoding>
  videoMediaEncodingsConnection: VideoMediaEncodingConnection
  videoMediaMetadata: Array<VideoMediaMetadata>
  videoMediaMetadataByUniqueInput?: Maybe<VideoMediaMetadata>
  videoMediaMetadataConnection: VideoMediaMetadataConnection
  videos: Array<Video>
  videoByUniqueInput?: Maybe<Video>
  videosConnection: VideoConnection
  workers: Array<Worker>
  workerByUniqueInput?: Maybe<Worker>
  workersConnection: WorkerConnection
}

export type QueryAuctionBidCanceledEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<AuctionBidCanceledEventWhereInput>
  orderBy?: Maybe<Array<AuctionBidCanceledEventOrderByInput>>
}

export type QueryAuctionBidCanceledEventByUniqueInputArgs = {
  where: AuctionBidCanceledEventWhereUniqueInput
}

export type QueryAuctionBidCanceledEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<AuctionBidCanceledEventWhereInput>
  orderBy?: Maybe<Array<AuctionBidCanceledEventOrderByInput>>
}

export type QueryAuctionBidMadeEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<AuctionBidMadeEventWhereInput>
  orderBy?: Maybe<Array<AuctionBidMadeEventOrderByInput>>
}

export type QueryAuctionBidMadeEventByUniqueInputArgs = {
  where: AuctionBidMadeEventWhereUniqueInput
}

export type QueryAuctionBidMadeEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<AuctionBidMadeEventWhereInput>
  orderBy?: Maybe<Array<AuctionBidMadeEventOrderByInput>>
}

export type QueryAuctionCanceledEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<AuctionCanceledEventWhereInput>
  orderBy?: Maybe<Array<AuctionCanceledEventOrderByInput>>
}

export type QueryAuctionCanceledEventByUniqueInputArgs = {
  where: AuctionCanceledEventWhereUniqueInput
}

export type QueryAuctionCanceledEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<AuctionCanceledEventWhereInput>
  orderBy?: Maybe<Array<AuctionCanceledEventOrderByInput>>
}

export type QueryAuctionStartedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<AuctionStartedEventWhereInput>
  orderBy?: Maybe<Array<AuctionStartedEventOrderByInput>>
}

export type QueryAuctionStartedEventByUniqueInputArgs = {
  where: AuctionStartedEventWhereUniqueInput
}

export type QueryAuctionStartedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<AuctionStartedEventWhereInput>
  orderBy?: Maybe<Array<AuctionStartedEventOrderByInput>>
}

export type QueryAuctionsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<AuctionWhereInput>
  orderBy?: Maybe<Array<AuctionOrderByInput>>
}

export type QueryAuctionByUniqueInputArgs = {
  where: AuctionWhereUniqueInput
}

export type QueryAuctionsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<AuctionWhereInput>
  orderBy?: Maybe<Array<AuctionOrderByInput>>
}

export type QueryBidMadeCompletingAuctionEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<BidMadeCompletingAuctionEventWhereInput>
  orderBy?: Maybe<Array<BidMadeCompletingAuctionEventOrderByInput>>
}

export type QueryBidMadeCompletingAuctionEventByUniqueInputArgs = {
  where: BidMadeCompletingAuctionEventWhereUniqueInput
}

export type QueryBidMadeCompletingAuctionEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<BidMadeCompletingAuctionEventWhereInput>
  orderBy?: Maybe<Array<BidMadeCompletingAuctionEventOrderByInput>>
}

export type QueryBidsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<BidWhereInput>
  orderBy?: Maybe<Array<BidOrderByInput>>
}

export type QueryBidByUniqueInputArgs = {
  where: BidWhereUniqueInput
}

export type QueryBidsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<BidWhereInput>
  orderBy?: Maybe<Array<BidOrderByInput>>
}

export type QueryBuyNowCanceledEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<BuyNowCanceledEventWhereInput>
  orderBy?: Maybe<Array<BuyNowCanceledEventOrderByInput>>
}

export type QueryBuyNowCanceledEventByUniqueInputArgs = {
  where: BuyNowCanceledEventWhereUniqueInput
}

export type QueryBuyNowCanceledEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<BuyNowCanceledEventWhereInput>
  orderBy?: Maybe<Array<BuyNowCanceledEventOrderByInput>>
}

export type QueryCuratorGroupsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<CuratorGroupWhereInput>
  orderBy?: Maybe<Array<CuratorGroupOrderByInput>>
}

export type QueryCuratorGroupByUniqueInputArgs = {
  where: CuratorGroupWhereUniqueInput
}

export type QueryCuratorGroupsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<CuratorGroupWhereInput>
  orderBy?: Maybe<Array<CuratorGroupOrderByInput>>
}

export type QueryCuratorsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<CuratorWhereInput>
  orderBy?: Maybe<Array<CuratorOrderByInput>>
}

export type QueryCuratorByUniqueInputArgs = {
  where: CuratorWhereUniqueInput
}

export type QueryCuratorsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<CuratorWhereInput>
  orderBy?: Maybe<Array<CuratorOrderByInput>>
}

export type QueryDistributionBucketFamilyGeographicAreasArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<DistributionBucketFamilyGeographicAreaWhereInput>
  orderBy?: Maybe<Array<DistributionBucketFamilyGeographicAreaOrderByInput>>
}

export type QueryDistributionBucketFamilyGeographicAreaByUniqueInputArgs = {
  where: DistributionBucketFamilyGeographicAreaWhereUniqueInput
}

export type QueryDistributionBucketFamilyGeographicAreasConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<DistributionBucketFamilyGeographicAreaWhereInput>
  orderBy?: Maybe<Array<DistributionBucketFamilyGeographicAreaOrderByInput>>
}

export type QueryDistributionBucketFamilyMetadataArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<DistributionBucketFamilyMetadataWhereInput>
  orderBy?: Maybe<Array<DistributionBucketFamilyMetadataOrderByInput>>
}

export type QueryDistributionBucketFamilyMetadataByUniqueInputArgs = {
  where: DistributionBucketFamilyMetadataWhereUniqueInput
}

export type QueryDistributionBucketFamilyMetadataConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<DistributionBucketFamilyMetadataWhereInput>
  orderBy?: Maybe<Array<DistributionBucketFamilyMetadataOrderByInput>>
}

export type QueryDistributionBucketFamiliesArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<DistributionBucketFamilyWhereInput>
  orderBy?: Maybe<Array<DistributionBucketFamilyOrderByInput>>
}

export type QueryDistributionBucketFamilyByUniqueInputArgs = {
  where: DistributionBucketFamilyWhereUniqueInput
}

export type QueryDistributionBucketFamiliesConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<DistributionBucketFamilyWhereInput>
  orderBy?: Maybe<Array<DistributionBucketFamilyOrderByInput>>
}

export type QueryDistributionBucketOperatorMetadataArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<DistributionBucketOperatorMetadataWhereInput>
  orderBy?: Maybe<Array<DistributionBucketOperatorMetadataOrderByInput>>
}

export type QueryDistributionBucketOperatorMetadataByUniqueInputArgs = {
  where: DistributionBucketOperatorMetadataWhereUniqueInput
}

export type QueryDistributionBucketOperatorMetadataConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<DistributionBucketOperatorMetadataWhereInput>
  orderBy?: Maybe<Array<DistributionBucketOperatorMetadataOrderByInput>>
}

export type QueryDistributionBucketOperatorsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<DistributionBucketOperatorWhereInput>
  orderBy?: Maybe<Array<DistributionBucketOperatorOrderByInput>>
}

export type QueryDistributionBucketOperatorByUniqueInputArgs = {
  where: DistributionBucketOperatorWhereUniqueInput
}

export type QueryDistributionBucketOperatorsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<DistributionBucketOperatorWhereInput>
  orderBy?: Maybe<Array<DistributionBucketOperatorOrderByInput>>
}

export type QueryDistributionBucketsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<DistributionBucketWhereInput>
  orderBy?: Maybe<Array<DistributionBucketOrderByInput>>
}

export type QueryDistributionBucketByUniqueInputArgs = {
  where: DistributionBucketWhereUniqueInput
}

export type QueryDistributionBucketsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<DistributionBucketWhereInput>
  orderBy?: Maybe<Array<DistributionBucketOrderByInput>>
}

export type QueryEnglishAuctionCompletedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<EnglishAuctionCompletedEventWhereInput>
  orderBy?: Maybe<Array<EnglishAuctionCompletedEventOrderByInput>>
}

export type QueryEnglishAuctionCompletedEventByUniqueInputArgs = {
  where: EnglishAuctionCompletedEventWhereUniqueInput
}

export type QueryEnglishAuctionCompletedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<EnglishAuctionCompletedEventWhereInput>
  orderBy?: Maybe<Array<EnglishAuctionCompletedEventOrderByInput>>
}

export type QueryEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<EventWhereInput>
  orderBy?: Maybe<Array<EventOrderByInput>>
}

export type QueryGeoCoordinatesArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<GeoCoordinatesWhereInput>
  orderBy?: Maybe<Array<GeoCoordinatesOrderByInput>>
}

export type QueryGeoCoordinatesByUniqueInputArgs = {
  where: GeoCoordinatesWhereUniqueInput
}

export type QueryGeoCoordinatesConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<GeoCoordinatesWhereInput>
  orderBy?: Maybe<Array<GeoCoordinatesOrderByInput>>
}

export type QueryChannelCategoriesArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<ChannelCategoryWhereInput>
  orderBy?: Maybe<Array<ChannelCategoryOrderByInput>>
}

export type QueryChannelCategoryByUniqueInputArgs = {
  where: ChannelCategoryWhereUniqueInput
}

export type QueryChannelCategoriesConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<ChannelCategoryWhereInput>
  orderBy?: Maybe<Array<ChannelCategoryOrderByInput>>
}

export type QueryChannelsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<ChannelWhereInput>
  orderBy?: Maybe<Array<ChannelOrderByInput>>
}

export type QueryChannelByUniqueInputArgs = {
  where: ChannelWhereUniqueInput
}

export type QueryChannelsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<ChannelWhereInput>
  orderBy?: Maybe<Array<ChannelOrderByInput>>
}

export type QueryLanguagesArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<LanguageWhereInput>
  orderBy?: Maybe<Array<LanguageOrderByInput>>
}

export type QueryLanguageByUniqueInputArgs = {
  where: LanguageWhereUniqueInput
}

export type QueryLanguagesConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<LanguageWhereInput>
  orderBy?: Maybe<Array<LanguageOrderByInput>>
}

export type QueryLicensesArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<LicenseWhereInput>
  orderBy?: Maybe<Array<LicenseOrderByInput>>
}

export type QueryLicenseByUniqueInputArgs = {
  where: LicenseWhereUniqueInput
}

export type QueryLicensesConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<LicenseWhereInput>
  orderBy?: Maybe<Array<LicenseOrderByInput>>
}

export type QueryMembershipsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<MembershipWhereInput>
  orderBy?: Maybe<Array<MembershipOrderByInput>>
}

export type QueryMembershipByUniqueInputArgs = {
  where: MembershipWhereUniqueInput
}

export type QueryMembershipsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<MembershipWhereInput>
  orderBy?: Maybe<Array<MembershipOrderByInput>>
}

export type QueryNftBoughtEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<NftBoughtEventWhereInput>
  orderBy?: Maybe<Array<NftBoughtEventOrderByInput>>
}

export type QueryNftBoughtEventByUniqueInputArgs = {
  where: NftBoughtEventWhereUniqueInput
}

export type QueryNftBoughtEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<NftBoughtEventWhereInput>
  orderBy?: Maybe<Array<NftBoughtEventOrderByInput>>
}

export type QueryNftIssuedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<NftIssuedEventWhereInput>
  orderBy?: Maybe<Array<NftIssuedEventOrderByInput>>
}

export type QueryNftIssuedEventByUniqueInputArgs = {
  where: NftIssuedEventWhereUniqueInput
}

export type QueryNftIssuedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<NftIssuedEventWhereInput>
  orderBy?: Maybe<Array<NftIssuedEventOrderByInput>>
}

export type QueryNftSellOrderMadeEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<NftSellOrderMadeEventWhereInput>
  orderBy?: Maybe<Array<NftSellOrderMadeEventOrderByInput>>
}

export type QueryNftSellOrderMadeEventByUniqueInputArgs = {
  where: NftSellOrderMadeEventWhereUniqueInput
}

export type QueryNftSellOrderMadeEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<NftSellOrderMadeEventWhereInput>
  orderBy?: Maybe<Array<NftSellOrderMadeEventOrderByInput>>
}

export type QueryNodeLocationMetadataArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<NodeLocationMetadataWhereInput>
  orderBy?: Maybe<Array<NodeLocationMetadataOrderByInput>>
}

export type QueryNodeLocationMetadataByUniqueInputArgs = {
  where: NodeLocationMetadataWhereUniqueInput
}

export type QueryNodeLocationMetadataConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<NodeLocationMetadataWhereInput>
  orderBy?: Maybe<Array<NodeLocationMetadataOrderByInput>>
}

export type QueryOfferAcceptedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<OfferAcceptedEventWhereInput>
  orderBy?: Maybe<Array<OfferAcceptedEventOrderByInput>>
}

export type QueryOfferAcceptedEventByUniqueInputArgs = {
  where: OfferAcceptedEventWhereUniqueInput
}

export type QueryOfferAcceptedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<OfferAcceptedEventWhereInput>
  orderBy?: Maybe<Array<OfferAcceptedEventOrderByInput>>
}

export type QueryOfferCanceledEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<OfferCanceledEventWhereInput>
  orderBy?: Maybe<Array<OfferCanceledEventOrderByInput>>
}

export type QueryOfferCanceledEventByUniqueInputArgs = {
  where: OfferCanceledEventWhereUniqueInput
}

export type QueryOfferCanceledEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<OfferCanceledEventWhereInput>
  orderBy?: Maybe<Array<OfferCanceledEventOrderByInput>>
}

export type QueryOfferStartedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<OfferStartedEventWhereInput>
  orderBy?: Maybe<Array<OfferStartedEventOrderByInput>>
}

export type QueryOfferStartedEventByUniqueInputArgs = {
  where: OfferStartedEventWhereUniqueInput
}

export type QueryOfferStartedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<OfferStartedEventWhereInput>
  orderBy?: Maybe<Array<OfferStartedEventOrderByInput>>
}

export type QueryOpenAuctionBidAcceptedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<OpenAuctionBidAcceptedEventWhereInput>
  orderBy?: Maybe<Array<OpenAuctionBidAcceptedEventOrderByInput>>
}

export type QueryOpenAuctionBidAcceptedEventByUniqueInputArgs = {
  where: OpenAuctionBidAcceptedEventWhereUniqueInput
}

export type QueryOpenAuctionBidAcceptedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<OpenAuctionBidAcceptedEventWhereInput>
  orderBy?: Maybe<Array<OpenAuctionBidAcceptedEventOrderByInput>>
}

export type QueryOwnedNftsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<OwnedNftWhereInput>
  orderBy?: Maybe<Array<OwnedNftOrderByInput>>
}

export type QueryOwnedNftByUniqueInputArgs = {
  where: OwnedNftWhereUniqueInput
}

export type QueryOwnedNftsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<OwnedNftWhereInput>
  orderBy?: Maybe<Array<OwnedNftOrderByInput>>
}

export type QueryChannelCategoriesByNameArgs = {
  whereChannelCategory?: Maybe<ChannelCategoryWhereInput>
  skip?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  text: Scalars['String']
}

export type QueryMembersByHandleArgs = {
  whereMembership?: Maybe<MembershipWhereInput>
  skip?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  text: Scalars['String']
}

export type QuerySearchArgs = {
  whereVideo?: Maybe<VideoWhereInput>
  whereChannel?: Maybe<ChannelWhereInput>
  skip?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  text: Scalars['String']
}

export type QueryVideoCategoriesByNameArgs = {
  whereVideoCategory?: Maybe<VideoCategoryWhereInput>
  skip?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  text: Scalars['String']
}

export type QueryStorageBagsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StorageBagWhereInput>
  orderBy?: Maybe<Array<StorageBagOrderByInput>>
}

export type QueryStorageBagByUniqueInputArgs = {
  where: StorageBagWhereUniqueInput
}

export type QueryStorageBagsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StorageBagWhereInput>
  orderBy?: Maybe<Array<StorageBagOrderByInput>>
}

export type QueryStorageBucketOperatorMetadataArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StorageBucketOperatorMetadataWhereInput>
  orderBy?: Maybe<Array<StorageBucketOperatorMetadataOrderByInput>>
}

export type QueryStorageBucketOperatorMetadataByUniqueInputArgs = {
  where: StorageBucketOperatorMetadataWhereUniqueInput
}

export type QueryStorageBucketOperatorMetadataConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StorageBucketOperatorMetadataWhereInput>
  orderBy?: Maybe<Array<StorageBucketOperatorMetadataOrderByInput>>
}

export type QueryStorageBucketsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StorageBucketWhereInput>
  orderBy?: Maybe<Array<StorageBucketOrderByInput>>
}

export type QueryStorageBucketByUniqueInputArgs = {
  where: StorageBucketWhereUniqueInput
}

export type QueryStorageBucketsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StorageBucketWhereInput>
  orderBy?: Maybe<Array<StorageBucketOrderByInput>>
}

export type QueryStorageDataObjectsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StorageDataObjectWhereInput>
  orderBy?: Maybe<Array<StorageDataObjectOrderByInput>>
}

export type QueryStorageDataObjectByUniqueInputArgs = {
  where: StorageDataObjectWhereUniqueInput
}

export type QueryStorageDataObjectsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StorageDataObjectWhereInput>
  orderBy?: Maybe<Array<StorageDataObjectOrderByInput>>
}

export type QueryStorageSystemParametersArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StorageSystemParametersWhereInput>
  orderBy?: Maybe<Array<StorageSystemParametersOrderByInput>>
}

export type QueryStorageSystemParametersByUniqueInputArgs = {
  where: StorageSystemParametersWhereUniqueInput
}

export type QueryStorageSystemParametersConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StorageSystemParametersWhereInput>
  orderBy?: Maybe<Array<StorageSystemParametersOrderByInput>>
}

export type QueryVideoCategoriesArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<VideoCategoryWhereInput>
  orderBy?: Maybe<Array<VideoCategoryOrderByInput>>
}

export type QueryVideoCategoryByUniqueInputArgs = {
  where: VideoCategoryWhereUniqueInput
}

export type QueryVideoCategoriesConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<VideoCategoryWhereInput>
  orderBy?: Maybe<Array<VideoCategoryOrderByInput>>
}

export type QueryVideoMediaEncodingsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<VideoMediaEncodingWhereInput>
  orderBy?: Maybe<Array<VideoMediaEncodingOrderByInput>>
}

export type QueryVideoMediaEncodingByUniqueInputArgs = {
  where: VideoMediaEncodingWhereUniqueInput
}

export type QueryVideoMediaEncodingsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<VideoMediaEncodingWhereInput>
  orderBy?: Maybe<Array<VideoMediaEncodingOrderByInput>>
}

export type QueryVideoMediaMetadataArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<VideoMediaMetadataWhereInput>
  orderBy?: Maybe<Array<VideoMediaMetadataOrderByInput>>
}

export type QueryVideoMediaMetadataByUniqueInputArgs = {
  where: VideoMediaMetadataWhereUniqueInput
}

export type QueryVideoMediaMetadataConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<VideoMediaMetadataWhereInput>
  orderBy?: Maybe<Array<VideoMediaMetadataOrderByInput>>
}

export type QueryVideosArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<VideoWhereInput>
  orderBy?: Maybe<Array<VideoOrderByInput>>
}

export type QueryVideoByUniqueInputArgs = {
  where: VideoWhereUniqueInput
}

export type QueryVideosConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<VideoWhereInput>
  orderBy?: Maybe<Array<VideoOrderByInput>>
}

export type QueryWorkersArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<WorkerWhereInput>
  orderBy?: Maybe<Array<WorkerOrderByInput>>
}

export type QueryWorkerByUniqueInputArgs = {
  where: WorkerWhereUniqueInput
}

export type QueryWorkersConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<WorkerWhereInput>
  orderBy?: Maybe<Array<WorkerOrderByInput>>
}

export type SearchFtsOutput = {
  item: SearchSearchResult
  rank: Scalars['Float']
  isTypeOf: Scalars['String']
  highlight: Scalars['String']
}

export type SearchSearchResult = Channel | Video

export type StandardDeleteResponse = {
  id: Scalars['ID']
}

export type StorageBag = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  objects: Array<StorageDataObject>
  storageBuckets: Array<StorageBucket>
  distributionBuckets: Array<DistributionBucket>
  /** Owner of the storage bag */
  owner: StorageBagOwner
}

export type StorageBagConnection = {
  totalCount: Scalars['Int']
  edges: Array<StorageBagEdge>
  pageInfo: PageInfo
}

export type StorageBagCreateInput = {
  owner: Scalars['JSONObject']
}

export type StorageBagEdge = {
  node: StorageBag
  cursor: Scalars['String']
}

export enum StorageBagOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
}

export type StorageBagOwner =
  | StorageBagOwnerCouncil
  | StorageBagOwnerWorkingGroup
  | StorageBagOwnerMember
  | StorageBagOwnerChannel
  | StorageBagOwnerDao

export type StorageBagOwnerCouncil = {
  phantom?: Maybe<Scalars['Int']>
}

export type StorageBagOwnerDao = {
  daoId?: Maybe<Scalars['Int']>
}

export type StorageBagOwnerChannel = {
  channelId?: Maybe<Scalars['Int']>
}

export type StorageBagOwnerMember = {
  memberId?: Maybe<Scalars['Int']>
}

export type StorageBagOwnerWorkingGroup = {
  workingGroupId?: Maybe<Scalars['String']>
}

export type StorageBagUpdateInput = {
  owner?: Maybe<Scalars['JSONObject']>
}

export type StorageBagWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  owner_json?: Maybe<Scalars['JSONObject']>
  objects_none?: Maybe<StorageDataObjectWhereInput>
  objects_some?: Maybe<StorageDataObjectWhereInput>
  objects_every?: Maybe<StorageDataObjectWhereInput>
  storageBuckets_none?: Maybe<StorageBucketWhereInput>
  storageBuckets_some?: Maybe<StorageBucketWhereInput>
  storageBuckets_every?: Maybe<StorageBucketWhereInput>
  distributionBuckets_none?: Maybe<DistributionBucketWhereInput>
  distributionBuckets_some?: Maybe<DistributionBucketWhereInput>
  distributionBuckets_every?: Maybe<DistributionBucketWhereInput>
  AND?: Maybe<Array<StorageBagWhereInput>>
  OR?: Maybe<Array<StorageBagWhereInput>>
}

export type StorageBagWhereUniqueInput = {
  id: Scalars['ID']
}

export type StorageBucket = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Current bucket operator status */
  operatorStatus: StorageBucketOperatorStatus
  operatorMetadata?: Maybe<StorageBucketOperatorMetadata>
  operatorMetadataId?: Maybe<Scalars['String']>
  /** Whether the bucket is accepting any new storage bags */
  acceptingNewBags: Scalars['Boolean']
  bags: Array<StorageBag>
  /** Bucket's data object size limit in bytes */
  dataObjectsSizeLimit: Scalars['BigInt']
  /** Bucket's data object count limit */
  dataObjectCountLimit: Scalars['BigInt']
  /** Number of assigned data objects */
  dataObjectsCount: Scalars['BigInt']
  /** Total size of assigned data objects */
  dataObjectsSize: Scalars['BigInt']
}

export type StorageBucketConnection = {
  totalCount: Scalars['Int']
  edges: Array<StorageBucketEdge>
  pageInfo: PageInfo
}

export type StorageBucketCreateInput = {
  operatorStatus: Scalars['JSONObject']
  operatorMetadata?: Maybe<Scalars['ID']>
  acceptingNewBags: Scalars['Boolean']
  dataObjectsSizeLimit: Scalars['String']
  dataObjectCountLimit: Scalars['String']
  dataObjectsCount: Scalars['String']
  dataObjectsSize: Scalars['String']
}

export type StorageBucketEdge = {
  node: StorageBucket
  cursor: Scalars['String']
}

export type StorageBucketOperatorMetadata = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Root node endpoint */
  nodeEndpoint?: Maybe<Scalars['String']>
  nodeLocation?: Maybe<NodeLocationMetadata>
  nodeLocationId?: Maybe<Scalars['String']>
  /** Additional information about the node/operator */
  extra?: Maybe<Scalars['String']>
  storagebucketoperatorMetadata?: Maybe<Array<StorageBucket>>
}

export type StorageBucketOperatorMetadataConnection = {
  totalCount: Scalars['Int']
  edges: Array<StorageBucketOperatorMetadataEdge>
  pageInfo: PageInfo
}

export type StorageBucketOperatorMetadataCreateInput = {
  nodeEndpoint?: Maybe<Scalars['String']>
  nodeLocation?: Maybe<Scalars['ID']>
  extra?: Maybe<Scalars['String']>
}

export type StorageBucketOperatorMetadataEdge = {
  node: StorageBucketOperatorMetadata
  cursor: Scalars['String']
}

export enum StorageBucketOperatorMetadataOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  NodeEndpointAsc = 'nodeEndpoint_ASC',
  NodeEndpointDesc = 'nodeEndpoint_DESC',
  NodeLocationAsc = 'nodeLocation_ASC',
  NodeLocationDesc = 'nodeLocation_DESC',
  ExtraAsc = 'extra_ASC',
  ExtraDesc = 'extra_DESC',
}

export type StorageBucketOperatorMetadataUpdateInput = {
  nodeEndpoint?: Maybe<Scalars['String']>
  nodeLocation?: Maybe<Scalars['ID']>
  extra?: Maybe<Scalars['String']>
}

export type StorageBucketOperatorMetadataWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  nodeEndpoint_eq?: Maybe<Scalars['String']>
  nodeEndpoint_contains?: Maybe<Scalars['String']>
  nodeEndpoint_startsWith?: Maybe<Scalars['String']>
  nodeEndpoint_endsWith?: Maybe<Scalars['String']>
  nodeEndpoint_in?: Maybe<Array<Scalars['String']>>
  extra_eq?: Maybe<Scalars['String']>
  extra_contains?: Maybe<Scalars['String']>
  extra_startsWith?: Maybe<Scalars['String']>
  extra_endsWith?: Maybe<Scalars['String']>
  extra_in?: Maybe<Array<Scalars['String']>>
  nodeLocation?: Maybe<NodeLocationMetadataWhereInput>
  storagebucketoperatorMetadata_none?: Maybe<StorageBucketWhereInput>
  storagebucketoperatorMetadata_some?: Maybe<StorageBucketWhereInput>
  storagebucketoperatorMetadata_every?: Maybe<StorageBucketWhereInput>
  AND?: Maybe<Array<StorageBucketOperatorMetadataWhereInput>>
  OR?: Maybe<Array<StorageBucketOperatorMetadataWhereInput>>
}

export type StorageBucketOperatorMetadataWhereUniqueInput = {
  id: Scalars['ID']
}

export type StorageBucketOperatorStatus =
  | StorageBucketOperatorStatusMissing
  | StorageBucketOperatorStatusInvited
  | StorageBucketOperatorStatusActive

export type StorageBucketOperatorStatusActive = {
  workerId: Scalars['Int']
  transactorAccountId: Scalars['String']
}

export type StorageBucketOperatorStatusInvited = {
  workerId: Scalars['Int']
}

export type StorageBucketOperatorStatusMissing = {
  phantom?: Maybe<Scalars['Int']>
}

export enum StorageBucketOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  OperatorMetadataAsc = 'operatorMetadata_ASC',
  OperatorMetadataDesc = 'operatorMetadata_DESC',
  AcceptingNewBagsAsc = 'acceptingNewBags_ASC',
  AcceptingNewBagsDesc = 'acceptingNewBags_DESC',
  DataObjectsSizeLimitAsc = 'dataObjectsSizeLimit_ASC',
  DataObjectsSizeLimitDesc = 'dataObjectsSizeLimit_DESC',
  DataObjectCountLimitAsc = 'dataObjectCountLimit_ASC',
  DataObjectCountLimitDesc = 'dataObjectCountLimit_DESC',
  DataObjectsCountAsc = 'dataObjectsCount_ASC',
  DataObjectsCountDesc = 'dataObjectsCount_DESC',
  DataObjectsSizeAsc = 'dataObjectsSize_ASC',
  DataObjectsSizeDesc = 'dataObjectsSize_DESC',
}

export type StorageBucketUpdateInput = {
  operatorStatus?: Maybe<Scalars['JSONObject']>
  operatorMetadata?: Maybe<Scalars['ID']>
  acceptingNewBags?: Maybe<Scalars['Boolean']>
  dataObjectsSizeLimit?: Maybe<Scalars['String']>
  dataObjectCountLimit?: Maybe<Scalars['String']>
  dataObjectsCount?: Maybe<Scalars['String']>
  dataObjectsSize?: Maybe<Scalars['String']>
}

export type StorageBucketWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  operatorStatus_json?: Maybe<Scalars['JSONObject']>
  acceptingNewBags_eq?: Maybe<Scalars['Boolean']>
  acceptingNewBags_in?: Maybe<Array<Scalars['Boolean']>>
  dataObjectsSizeLimit_eq?: Maybe<Scalars['BigInt']>
  dataObjectsSizeLimit_gt?: Maybe<Scalars['BigInt']>
  dataObjectsSizeLimit_gte?: Maybe<Scalars['BigInt']>
  dataObjectsSizeLimit_lt?: Maybe<Scalars['BigInt']>
  dataObjectsSizeLimit_lte?: Maybe<Scalars['BigInt']>
  dataObjectsSizeLimit_in?: Maybe<Array<Scalars['BigInt']>>
  dataObjectCountLimit_eq?: Maybe<Scalars['BigInt']>
  dataObjectCountLimit_gt?: Maybe<Scalars['BigInt']>
  dataObjectCountLimit_gte?: Maybe<Scalars['BigInt']>
  dataObjectCountLimit_lt?: Maybe<Scalars['BigInt']>
  dataObjectCountLimit_lte?: Maybe<Scalars['BigInt']>
  dataObjectCountLimit_in?: Maybe<Array<Scalars['BigInt']>>
  dataObjectsCount_eq?: Maybe<Scalars['BigInt']>
  dataObjectsCount_gt?: Maybe<Scalars['BigInt']>
  dataObjectsCount_gte?: Maybe<Scalars['BigInt']>
  dataObjectsCount_lt?: Maybe<Scalars['BigInt']>
  dataObjectsCount_lte?: Maybe<Scalars['BigInt']>
  dataObjectsCount_in?: Maybe<Array<Scalars['BigInt']>>
  dataObjectsSize_eq?: Maybe<Scalars['BigInt']>
  dataObjectsSize_gt?: Maybe<Scalars['BigInt']>
  dataObjectsSize_gte?: Maybe<Scalars['BigInt']>
  dataObjectsSize_lt?: Maybe<Scalars['BigInt']>
  dataObjectsSize_lte?: Maybe<Scalars['BigInt']>
  dataObjectsSize_in?: Maybe<Array<Scalars['BigInt']>>
  operatorMetadata?: Maybe<StorageBucketOperatorMetadataWhereInput>
  bags_none?: Maybe<StorageBagWhereInput>
  bags_some?: Maybe<StorageBagWhereInput>
  bags_every?: Maybe<StorageBagWhereInput>
  AND?: Maybe<Array<StorageBucketWhereInput>>
  OR?: Maybe<Array<StorageBucketWhereInput>>
}

export type StorageBucketWhereUniqueInput = {
  id: Scalars['ID']
}

export type StorageDataObject = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Whether the data object was uploaded and accepted by the storage provider */
  isAccepted: Scalars['Boolean']
  /** Data object size in bytes */
  size: Scalars['BigInt']
  storageBag: StorageBag
  storageBagId: Scalars['String']
  /** IPFS content hash */
  ipfsHash: Scalars['String']
  /** The type of the asset that the data object represents (if known) */
  type: DataObjectType
  /** Prize for removing the data object */
  deletionPrize: Scalars['BigInt']
  /** If the object is no longer used as an asset - the time at which it was unset (if known) */
  unsetAt?: Maybe<Scalars['DateTime']>
  videoThumbnail?: Maybe<Video>
  videoMedia?: Maybe<Video>
  channelcoverPhoto?: Maybe<Array<Channel>>
  channelavatarPhoto?: Maybe<Array<Channel>>
}

export type StorageDataObjectConnection = {
  totalCount: Scalars['Int']
  edges: Array<StorageDataObjectEdge>
  pageInfo: PageInfo
}

export type StorageDataObjectCreateInput = {
  isAccepted: Scalars['Boolean']
  size: Scalars['String']
  storageBag: Scalars['ID']
  ipfsHash: Scalars['String']
  type: Scalars['JSONObject']
  deletionPrize: Scalars['String']
  unsetAt?: Maybe<Scalars['DateTime']>
}

export type StorageDataObjectEdge = {
  node: StorageDataObject
  cursor: Scalars['String']
}

export enum StorageDataObjectOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  IsAcceptedAsc = 'isAccepted_ASC',
  IsAcceptedDesc = 'isAccepted_DESC',
  SizeAsc = 'size_ASC',
  SizeDesc = 'size_DESC',
  StorageBagAsc = 'storageBag_ASC',
  StorageBagDesc = 'storageBag_DESC',
  IpfsHashAsc = 'ipfsHash_ASC',
  IpfsHashDesc = 'ipfsHash_DESC',
  DeletionPrizeAsc = 'deletionPrize_ASC',
  DeletionPrizeDesc = 'deletionPrize_DESC',
  UnsetAtAsc = 'unsetAt_ASC',
  UnsetAtDesc = 'unsetAt_DESC',
}

export type StorageDataObjectUpdateInput = {
  isAccepted?: Maybe<Scalars['Boolean']>
  size?: Maybe<Scalars['String']>
  storageBag?: Maybe<Scalars['ID']>
  ipfsHash?: Maybe<Scalars['String']>
  type?: Maybe<Scalars['JSONObject']>
  deletionPrize?: Maybe<Scalars['String']>
  unsetAt?: Maybe<Scalars['DateTime']>
}

export type StorageDataObjectWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  isAccepted_eq?: Maybe<Scalars['Boolean']>
  isAccepted_in?: Maybe<Array<Scalars['Boolean']>>
  size_eq?: Maybe<Scalars['BigInt']>
  size_gt?: Maybe<Scalars['BigInt']>
  size_gte?: Maybe<Scalars['BigInt']>
  size_lt?: Maybe<Scalars['BigInt']>
  size_lte?: Maybe<Scalars['BigInt']>
  size_in?: Maybe<Array<Scalars['BigInt']>>
  ipfsHash_eq?: Maybe<Scalars['String']>
  ipfsHash_contains?: Maybe<Scalars['String']>
  ipfsHash_startsWith?: Maybe<Scalars['String']>
  ipfsHash_endsWith?: Maybe<Scalars['String']>
  ipfsHash_in?: Maybe<Array<Scalars['String']>>
  type_json?: Maybe<Scalars['JSONObject']>
  deletionPrize_eq?: Maybe<Scalars['BigInt']>
  deletionPrize_gt?: Maybe<Scalars['BigInt']>
  deletionPrize_gte?: Maybe<Scalars['BigInt']>
  deletionPrize_lt?: Maybe<Scalars['BigInt']>
  deletionPrize_lte?: Maybe<Scalars['BigInt']>
  deletionPrize_in?: Maybe<Array<Scalars['BigInt']>>
  unsetAt_eq?: Maybe<Scalars['DateTime']>
  unsetAt_lt?: Maybe<Scalars['DateTime']>
  unsetAt_lte?: Maybe<Scalars['DateTime']>
  unsetAt_gt?: Maybe<Scalars['DateTime']>
  unsetAt_gte?: Maybe<Scalars['DateTime']>
  storageBag?: Maybe<StorageBagWhereInput>
  videoThumbnail?: Maybe<VideoWhereInput>
  videoMedia?: Maybe<VideoWhereInput>
  channelcoverPhoto_none?: Maybe<ChannelWhereInput>
  channelcoverPhoto_some?: Maybe<ChannelWhereInput>
  channelcoverPhoto_every?: Maybe<ChannelWhereInput>
  channelavatarPhoto_none?: Maybe<ChannelWhereInput>
  channelavatarPhoto_some?: Maybe<ChannelWhereInput>
  channelavatarPhoto_every?: Maybe<ChannelWhereInput>
  AND?: Maybe<Array<StorageDataObjectWhereInput>>
  OR?: Maybe<Array<StorageDataObjectWhereInput>>
}

export type StorageDataObjectWhereUniqueInput = {
  id: Scalars['ID']
}

/** Global storage system parameters */
export type StorageSystemParameters = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Blacklisted content hashes */
  blacklist: Array<Scalars['String']>
  /** How many buckets can be assigned to store a bag */
  storageBucketsPerBagLimit: Scalars['Int']
  /** How many buckets can be assigned to distribute a bag */
  distributionBucketsPerBagLimit: Scalars['Int']
  /** Whether the uploading is globally blocked */
  uploadingBlocked: Scalars['Boolean']
  /** Additional fee for storing 1 MB of data */
  dataObjectFeePerMb: Scalars['BigInt']
  /** Global max. number of objects a storage bucket can store (can also be further limitted the provider) */
  storageBucketMaxObjectsCountLimit: Scalars['BigInt']
  /** Global max. size of objects a storage bucket can store (can also be further limitted the provider) */
  storageBucketMaxObjectsSizeLimit: Scalars['BigInt']
  /** ID of the next data object when created */
  nextDataObjectId: Scalars['BigInt']
}

export type StorageSystemParametersConnection = {
  totalCount: Scalars['Int']
  edges: Array<StorageSystemParametersEdge>
  pageInfo: PageInfo
}

export type StorageSystemParametersCreateInput = {
  blacklist: Array<Scalars['String']>
  storageBucketsPerBagLimit: Scalars['Float']
  distributionBucketsPerBagLimit: Scalars['Float']
  uploadingBlocked: Scalars['Boolean']
  dataObjectFeePerMb: Scalars['String']
  storageBucketMaxObjectsCountLimit: Scalars['String']
  storageBucketMaxObjectsSizeLimit: Scalars['String']
  nextDataObjectId: Scalars['String']
}

export type StorageSystemParametersEdge = {
  node: StorageSystemParameters
  cursor: Scalars['String']
}

export enum StorageSystemParametersOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  StorageBucketsPerBagLimitAsc = 'storageBucketsPerBagLimit_ASC',
  StorageBucketsPerBagLimitDesc = 'storageBucketsPerBagLimit_DESC',
  DistributionBucketsPerBagLimitAsc = 'distributionBucketsPerBagLimit_ASC',
  DistributionBucketsPerBagLimitDesc = 'distributionBucketsPerBagLimit_DESC',
  UploadingBlockedAsc = 'uploadingBlocked_ASC',
  UploadingBlockedDesc = 'uploadingBlocked_DESC',
  DataObjectFeePerMbAsc = 'dataObjectFeePerMb_ASC',
  DataObjectFeePerMbDesc = 'dataObjectFeePerMb_DESC',
  StorageBucketMaxObjectsCountLimitAsc = 'storageBucketMaxObjectsCountLimit_ASC',
  StorageBucketMaxObjectsCountLimitDesc = 'storageBucketMaxObjectsCountLimit_DESC',
  StorageBucketMaxObjectsSizeLimitAsc = 'storageBucketMaxObjectsSizeLimit_ASC',
  StorageBucketMaxObjectsSizeLimitDesc = 'storageBucketMaxObjectsSizeLimit_DESC',
  NextDataObjectIdAsc = 'nextDataObjectId_ASC',
  NextDataObjectIdDesc = 'nextDataObjectId_DESC',
}

export type StorageSystemParametersUpdateInput = {
  blacklist?: Maybe<Array<Scalars['String']>>
  storageBucketsPerBagLimit?: Maybe<Scalars['Float']>
  distributionBucketsPerBagLimit?: Maybe<Scalars['Float']>
  uploadingBlocked?: Maybe<Scalars['Boolean']>
  dataObjectFeePerMb?: Maybe<Scalars['String']>
  storageBucketMaxObjectsCountLimit?: Maybe<Scalars['String']>
  storageBucketMaxObjectsSizeLimit?: Maybe<Scalars['String']>
  nextDataObjectId?: Maybe<Scalars['String']>
}

export type StorageSystemParametersWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  blacklist_containsAll?: Maybe<Array<Scalars['String']>>
  blacklist_containsNone?: Maybe<Array<Scalars['String']>>
  blacklist_containsAny?: Maybe<Array<Scalars['String']>>
  storageBucketsPerBagLimit_eq?: Maybe<Scalars['Int']>
  storageBucketsPerBagLimit_gt?: Maybe<Scalars['Int']>
  storageBucketsPerBagLimit_gte?: Maybe<Scalars['Int']>
  storageBucketsPerBagLimit_lt?: Maybe<Scalars['Int']>
  storageBucketsPerBagLimit_lte?: Maybe<Scalars['Int']>
  storageBucketsPerBagLimit_in?: Maybe<Array<Scalars['Int']>>
  distributionBucketsPerBagLimit_eq?: Maybe<Scalars['Int']>
  distributionBucketsPerBagLimit_gt?: Maybe<Scalars['Int']>
  distributionBucketsPerBagLimit_gte?: Maybe<Scalars['Int']>
  distributionBucketsPerBagLimit_lt?: Maybe<Scalars['Int']>
  distributionBucketsPerBagLimit_lte?: Maybe<Scalars['Int']>
  distributionBucketsPerBagLimit_in?: Maybe<Array<Scalars['Int']>>
  uploadingBlocked_eq?: Maybe<Scalars['Boolean']>
  uploadingBlocked_in?: Maybe<Array<Scalars['Boolean']>>
  dataObjectFeePerMb_eq?: Maybe<Scalars['BigInt']>
  dataObjectFeePerMb_gt?: Maybe<Scalars['BigInt']>
  dataObjectFeePerMb_gte?: Maybe<Scalars['BigInt']>
  dataObjectFeePerMb_lt?: Maybe<Scalars['BigInt']>
  dataObjectFeePerMb_lte?: Maybe<Scalars['BigInt']>
  dataObjectFeePerMb_in?: Maybe<Array<Scalars['BigInt']>>
  storageBucketMaxObjectsCountLimit_eq?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsCountLimit_gt?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsCountLimit_gte?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsCountLimit_lt?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsCountLimit_lte?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsCountLimit_in?: Maybe<Array<Scalars['BigInt']>>
  storageBucketMaxObjectsSizeLimit_eq?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsSizeLimit_gt?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsSizeLimit_gte?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsSizeLimit_lt?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsSizeLimit_lte?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsSizeLimit_in?: Maybe<Array<Scalars['BigInt']>>
  nextDataObjectId_eq?: Maybe<Scalars['BigInt']>
  nextDataObjectId_gt?: Maybe<Scalars['BigInt']>
  nextDataObjectId_gte?: Maybe<Scalars['BigInt']>
  nextDataObjectId_lt?: Maybe<Scalars['BigInt']>
  nextDataObjectId_lte?: Maybe<Scalars['BigInt']>
  nextDataObjectId_in?: Maybe<Array<Scalars['BigInt']>>
  AND?: Maybe<Array<StorageSystemParametersWhereInput>>
  OR?: Maybe<Array<StorageSystemParametersWhereInput>>
}

export type StorageSystemParametersWhereUniqueInput = {
  id: Scalars['ID']
}

export type Subscription = {
  stateSubscription: ProcessorState
}

export type TransactionalStatus =
  | TransactionalStatusIdle
  | TransactionalStatusInitiatedOfferToMember
  | TransactionalStatusAuction
  | TransactionalStatusBuyNow

export type TransactionalStatusAuction = {
  /** Type needs to have at least one non-relation entity. This value is not used. */
  dummy?: Maybe<Scalars['Int']>
  /** Auction */
  auction?: Maybe<Auction>
}

export type TransactionalStatusBuyNow = {
  price: Scalars['Float']
}

export type TransactionalStatusIdle = {
  /** Type needs to have at least one non-relation entity. This value is not used. */
  dummy?: Maybe<Scalars['Int']>
}

export type TransactionalStatusInitiatedOfferToMember = {
  /** Member identifier */
  memberId: Scalars['Int']
  /** Whether member should pay to accept offer (optional) */
  price?: Maybe<Scalars['Float']>
}

export type Video = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  channel: Channel
  channelId: Scalars['String']
  category?: Maybe<VideoCategory>
  categoryId?: Maybe<Scalars['String']>
  /** The title of the video */
  title?: Maybe<Scalars['String']>
  /** The description of the Video */
  description?: Maybe<Scalars['String']>
  /** Video duration in seconds */
  duration?: Maybe<Scalars['Int']>
  thumbnailPhoto?: Maybe<StorageDataObject>
  thumbnailPhotoId?: Maybe<Scalars['String']>
  language?: Maybe<Language>
  languageId?: Maybe<Scalars['String']>
  /** Whether or not Video contains marketing */
  hasMarketing?: Maybe<Scalars['Boolean']>
  /** If the Video was published on other platform before beeing published on Joystream - the original publication date */
  publishedBeforeJoystream?: Maybe<Scalars['DateTime']>
  /** Whether the Video is supposed to be publically displayed */
  isPublic?: Maybe<Scalars['Boolean']>
  /** Flag signaling whether a video is censored. */
  isCensored: Scalars['Boolean']
  nft?: Maybe<OwnedNft>
  nftId?: Maybe<Scalars['String']>
  /** Whether the Video contains explicit material. */
  isExplicit?: Maybe<Scalars['Boolean']>
  license?: Maybe<License>
  licenseId?: Maybe<Scalars['String']>
  media?: Maybe<StorageDataObject>
  mediaId?: Maybe<Scalars['String']>
  mediaMetadata?: Maybe<VideoMediaMetadata>
  mediaMetadataId?: Maybe<Scalars['String']>
  createdInBlock: Scalars['Int']
  /** Is video featured or not */
  isFeatured: Scalars['Boolean']
  auction?: Maybe<Auction>
  auctionbidcanceledeventvideo?: Maybe<Array<AuctionBidCanceledEvent>>
  auctionbidmadeeventvideo?: Maybe<Array<AuctionBidMadeEvent>>
  auctioncanceledeventvideo?: Maybe<Array<AuctionCanceledEvent>>
  auctionstartedeventvideo?: Maybe<Array<AuctionStartedEvent>>
  bidmadecompletingauctioneventvideo?: Maybe<Array<BidMadeCompletingAuctionEvent>>
  buynowcanceledeventvideo?: Maybe<Array<BuyNowCanceledEvent>>
  englishauctioncompletedeventvideo?: Maybe<Array<EnglishAuctionCompletedEvent>>
  nftboughteventvideo?: Maybe<Array<NftBoughtEvent>>
  nftissuedeventvideo?: Maybe<Array<NftIssuedEvent>>
  nftsellordermadeeventvideo?: Maybe<Array<NftSellOrderMadeEvent>>
  offeracceptedeventvideo?: Maybe<Array<OfferAcceptedEvent>>
  offercanceledeventvideo?: Maybe<Array<OfferCanceledEvent>>
  offerstartedeventvideo?: Maybe<Array<OfferStartedEvent>>
  openauctionbidacceptedeventvideo?: Maybe<Array<OpenAuctionBidAcceptedEvent>>
  ownednftvideo?: Maybe<Array<OwnedNft>>
}

export type VideoCategoriesByNameFtsOutput = {
  item: VideoCategoriesByNameSearchResult
  rank: Scalars['Float']
  isTypeOf: Scalars['String']
  highlight: Scalars['String']
}

export type VideoCategoriesByNameSearchResult = VideoCategory

export type VideoCategory = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** The name of the category */
  name?: Maybe<Scalars['String']>
  /** Count of channel's videos with an uploaded asset that are public and not censored. */
  activeVideosCounter: Scalars['Int']
  videos: Array<Video>
  createdInBlock: Scalars['Int']
}

export type VideoCategoryConnection = {
  totalCount: Scalars['Int']
  edges: Array<VideoCategoryEdge>
  pageInfo: PageInfo
}

export type VideoCategoryCreateInput = {
  name?: Maybe<Scalars['String']>
  activeVideosCounter: Scalars['Float']
  createdInBlock: Scalars['Float']
}

export type VideoCategoryEdge = {
  node: VideoCategory
  cursor: Scalars['String']
}

export enum VideoCategoryOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  ActiveVideosCounterAsc = 'activeVideosCounter_ASC',
  ActiveVideosCounterDesc = 'activeVideosCounter_DESC',
  CreatedInBlockAsc = 'createdInBlock_ASC',
  CreatedInBlockDesc = 'createdInBlock_DESC',
}

export type VideoCategoryUpdateInput = {
  name?: Maybe<Scalars['String']>
  activeVideosCounter?: Maybe<Scalars['Float']>
  createdInBlock?: Maybe<Scalars['Float']>
}

export type VideoCategoryWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  name_eq?: Maybe<Scalars['String']>
  name_contains?: Maybe<Scalars['String']>
  name_startsWith?: Maybe<Scalars['String']>
  name_endsWith?: Maybe<Scalars['String']>
  name_in?: Maybe<Array<Scalars['String']>>
  activeVideosCounter_eq?: Maybe<Scalars['Int']>
  activeVideosCounter_gt?: Maybe<Scalars['Int']>
  activeVideosCounter_gte?: Maybe<Scalars['Int']>
  activeVideosCounter_lt?: Maybe<Scalars['Int']>
  activeVideosCounter_lte?: Maybe<Scalars['Int']>
  activeVideosCounter_in?: Maybe<Array<Scalars['Int']>>
  createdInBlock_eq?: Maybe<Scalars['Int']>
  createdInBlock_gt?: Maybe<Scalars['Int']>
  createdInBlock_gte?: Maybe<Scalars['Int']>
  createdInBlock_lt?: Maybe<Scalars['Int']>
  createdInBlock_lte?: Maybe<Scalars['Int']>
  createdInBlock_in?: Maybe<Array<Scalars['Int']>>
  videos_none?: Maybe<VideoWhereInput>
  videos_some?: Maybe<VideoWhereInput>
  videos_every?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<VideoCategoryWhereInput>>
  OR?: Maybe<Array<VideoCategoryWhereInput>>
}

export type VideoCategoryWhereUniqueInput = {
  id: Scalars['ID']
}

export type VideoConnection = {
  totalCount: Scalars['Int']
  edges: Array<VideoEdge>
  pageInfo: PageInfo
}

export type VideoCreateInput = {
  channel: Scalars['ID']
  category?: Maybe<Scalars['ID']>
  title?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  duration?: Maybe<Scalars['Float']>
  thumbnailPhoto?: Maybe<Scalars['ID']>
  language?: Maybe<Scalars['ID']>
  hasMarketing?: Maybe<Scalars['Boolean']>
  publishedBeforeJoystream?: Maybe<Scalars['DateTime']>
  isPublic?: Maybe<Scalars['Boolean']>
  isCensored: Scalars['Boolean']
  nft?: Maybe<Scalars['ID']>
  isExplicit?: Maybe<Scalars['Boolean']>
  license?: Maybe<Scalars['ID']>
  media?: Maybe<Scalars['ID']>
  mediaMetadata?: Maybe<Scalars['ID']>
  createdInBlock: Scalars['Float']
  isFeatured: Scalars['Boolean']
}

export type VideoEdge = {
  node: Video
  cursor: Scalars['String']
}

export type VideoMediaEncoding = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Encoding of the video media object */
  codecName?: Maybe<Scalars['String']>
  /** Media container format */
  container?: Maybe<Scalars['String']>
  /** Content MIME type */
  mimeMediaType?: Maybe<Scalars['String']>
  videomediametadataencoding?: Maybe<Array<VideoMediaMetadata>>
}

export type VideoMediaEncodingConnection = {
  totalCount: Scalars['Int']
  edges: Array<VideoMediaEncodingEdge>
  pageInfo: PageInfo
}

export type VideoMediaEncodingCreateInput = {
  codecName?: Maybe<Scalars['String']>
  container?: Maybe<Scalars['String']>
  mimeMediaType?: Maybe<Scalars['String']>
}

export type VideoMediaEncodingEdge = {
  node: VideoMediaEncoding
  cursor: Scalars['String']
}

export enum VideoMediaEncodingOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  CodecNameAsc = 'codecName_ASC',
  CodecNameDesc = 'codecName_DESC',
  ContainerAsc = 'container_ASC',
  ContainerDesc = 'container_DESC',
  MimeMediaTypeAsc = 'mimeMediaType_ASC',
  MimeMediaTypeDesc = 'mimeMediaType_DESC',
}

export type VideoMediaEncodingUpdateInput = {
  codecName?: Maybe<Scalars['String']>
  container?: Maybe<Scalars['String']>
  mimeMediaType?: Maybe<Scalars['String']>
}

export type VideoMediaEncodingWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  codecName_eq?: Maybe<Scalars['String']>
  codecName_contains?: Maybe<Scalars['String']>
  codecName_startsWith?: Maybe<Scalars['String']>
  codecName_endsWith?: Maybe<Scalars['String']>
  codecName_in?: Maybe<Array<Scalars['String']>>
  container_eq?: Maybe<Scalars['String']>
  container_contains?: Maybe<Scalars['String']>
  container_startsWith?: Maybe<Scalars['String']>
  container_endsWith?: Maybe<Scalars['String']>
  container_in?: Maybe<Array<Scalars['String']>>
  mimeMediaType_eq?: Maybe<Scalars['String']>
  mimeMediaType_contains?: Maybe<Scalars['String']>
  mimeMediaType_startsWith?: Maybe<Scalars['String']>
  mimeMediaType_endsWith?: Maybe<Scalars['String']>
  mimeMediaType_in?: Maybe<Array<Scalars['String']>>
  videomediametadataencoding_none?: Maybe<VideoMediaMetadataWhereInput>
  videomediametadataencoding_some?: Maybe<VideoMediaMetadataWhereInput>
  videomediametadataencoding_every?: Maybe<VideoMediaMetadataWhereInput>
  AND?: Maybe<Array<VideoMediaEncodingWhereInput>>
  OR?: Maybe<Array<VideoMediaEncodingWhereInput>>
}

export type VideoMediaEncodingWhereUniqueInput = {
  id: Scalars['ID']
}

export type VideoMediaMetadata = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  encoding?: Maybe<VideoMediaEncoding>
  encodingId?: Maybe<Scalars['String']>
  /** Video media width in pixels */
  pixelWidth?: Maybe<Scalars['Int']>
  /** Video media height in pixels */
  pixelHeight?: Maybe<Scalars['Int']>
  /** Video media size in bytes */
  size?: Maybe<Scalars['BigInt']>
  video?: Maybe<Video>
  createdInBlock: Scalars['Int']
}

export type VideoMediaMetadataConnection = {
  totalCount: Scalars['Int']
  edges: Array<VideoMediaMetadataEdge>
  pageInfo: PageInfo
}

export type VideoMediaMetadataCreateInput = {
  encoding?: Maybe<Scalars['ID']>
  pixelWidth?: Maybe<Scalars['Float']>
  pixelHeight?: Maybe<Scalars['Float']>
  size?: Maybe<Scalars['String']>
  createdInBlock: Scalars['Float']
}

export type VideoMediaMetadataEdge = {
  node: VideoMediaMetadata
  cursor: Scalars['String']
}

export enum VideoMediaMetadataOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EncodingAsc = 'encoding_ASC',
  EncodingDesc = 'encoding_DESC',
  PixelWidthAsc = 'pixelWidth_ASC',
  PixelWidthDesc = 'pixelWidth_DESC',
  PixelHeightAsc = 'pixelHeight_ASC',
  PixelHeightDesc = 'pixelHeight_DESC',
  SizeAsc = 'size_ASC',
  SizeDesc = 'size_DESC',
  CreatedInBlockAsc = 'createdInBlock_ASC',
  CreatedInBlockDesc = 'createdInBlock_DESC',
}

export type VideoMediaMetadataUpdateInput = {
  encoding?: Maybe<Scalars['ID']>
  pixelWidth?: Maybe<Scalars['Float']>
  pixelHeight?: Maybe<Scalars['Float']>
  size?: Maybe<Scalars['String']>
  createdInBlock?: Maybe<Scalars['Float']>
}

export type VideoMediaMetadataWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  pixelWidth_eq?: Maybe<Scalars['Int']>
  pixelWidth_gt?: Maybe<Scalars['Int']>
  pixelWidth_gte?: Maybe<Scalars['Int']>
  pixelWidth_lt?: Maybe<Scalars['Int']>
  pixelWidth_lte?: Maybe<Scalars['Int']>
  pixelWidth_in?: Maybe<Array<Scalars['Int']>>
  pixelHeight_eq?: Maybe<Scalars['Int']>
  pixelHeight_gt?: Maybe<Scalars['Int']>
  pixelHeight_gte?: Maybe<Scalars['Int']>
  pixelHeight_lt?: Maybe<Scalars['Int']>
  pixelHeight_lte?: Maybe<Scalars['Int']>
  pixelHeight_in?: Maybe<Array<Scalars['Int']>>
  size_eq?: Maybe<Scalars['BigInt']>
  size_gt?: Maybe<Scalars['BigInt']>
  size_gte?: Maybe<Scalars['BigInt']>
  size_lt?: Maybe<Scalars['BigInt']>
  size_lte?: Maybe<Scalars['BigInt']>
  size_in?: Maybe<Array<Scalars['BigInt']>>
  createdInBlock_eq?: Maybe<Scalars['Int']>
  createdInBlock_gt?: Maybe<Scalars['Int']>
  createdInBlock_gte?: Maybe<Scalars['Int']>
  createdInBlock_lt?: Maybe<Scalars['Int']>
  createdInBlock_lte?: Maybe<Scalars['Int']>
  createdInBlock_in?: Maybe<Array<Scalars['Int']>>
  encoding?: Maybe<VideoMediaEncodingWhereInput>
  video?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<VideoMediaMetadataWhereInput>>
  OR?: Maybe<Array<VideoMediaMetadataWhereInput>>
}

export type VideoMediaMetadataWhereUniqueInput = {
  id: Scalars['ID']
}

export enum VideoOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  ChannelAsc = 'channel_ASC',
  ChannelDesc = 'channel_DESC',
  CategoryAsc = 'category_ASC',
  CategoryDesc = 'category_DESC',
  TitleAsc = 'title_ASC',
  TitleDesc = 'title_DESC',
  DescriptionAsc = 'description_ASC',
  DescriptionDesc = 'description_DESC',
  DurationAsc = 'duration_ASC',
  DurationDesc = 'duration_DESC',
  ThumbnailPhotoAsc = 'thumbnailPhoto_ASC',
  ThumbnailPhotoDesc = 'thumbnailPhoto_DESC',
  LanguageAsc = 'language_ASC',
  LanguageDesc = 'language_DESC',
  HasMarketingAsc = 'hasMarketing_ASC',
  HasMarketingDesc = 'hasMarketing_DESC',
  PublishedBeforeJoystreamAsc = 'publishedBeforeJoystream_ASC',
  PublishedBeforeJoystreamDesc = 'publishedBeforeJoystream_DESC',
  IsPublicAsc = 'isPublic_ASC',
  IsPublicDesc = 'isPublic_DESC',
  IsCensoredAsc = 'isCensored_ASC',
  IsCensoredDesc = 'isCensored_DESC',
  NftAsc = 'nft_ASC',
  NftDesc = 'nft_DESC',
  IsExplicitAsc = 'isExplicit_ASC',
  IsExplicitDesc = 'isExplicit_DESC',
  LicenseAsc = 'license_ASC',
  LicenseDesc = 'license_DESC',
  MediaAsc = 'media_ASC',
  MediaDesc = 'media_DESC',
  MediaMetadataAsc = 'mediaMetadata_ASC',
  MediaMetadataDesc = 'mediaMetadata_DESC',
  CreatedInBlockAsc = 'createdInBlock_ASC',
  CreatedInBlockDesc = 'createdInBlock_DESC',
  IsFeaturedAsc = 'isFeatured_ASC',
  IsFeaturedDesc = 'isFeatured_DESC',
}

export type VideoUpdateInput = {
  channel?: Maybe<Scalars['ID']>
  category?: Maybe<Scalars['ID']>
  title?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  duration?: Maybe<Scalars['Float']>
  thumbnailPhoto?: Maybe<Scalars['ID']>
  language?: Maybe<Scalars['ID']>
  hasMarketing?: Maybe<Scalars['Boolean']>
  publishedBeforeJoystream?: Maybe<Scalars['DateTime']>
  isPublic?: Maybe<Scalars['Boolean']>
  isCensored?: Maybe<Scalars['Boolean']>
  nft?: Maybe<Scalars['ID']>
  isExplicit?: Maybe<Scalars['Boolean']>
  license?: Maybe<Scalars['ID']>
  media?: Maybe<Scalars['ID']>
  mediaMetadata?: Maybe<Scalars['ID']>
  createdInBlock?: Maybe<Scalars['Float']>
  isFeatured?: Maybe<Scalars['Boolean']>
}

export type VideoWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  title_eq?: Maybe<Scalars['String']>
  title_contains?: Maybe<Scalars['String']>
  title_startsWith?: Maybe<Scalars['String']>
  title_endsWith?: Maybe<Scalars['String']>
  title_in?: Maybe<Array<Scalars['String']>>
  description_eq?: Maybe<Scalars['String']>
  description_contains?: Maybe<Scalars['String']>
  description_startsWith?: Maybe<Scalars['String']>
  description_endsWith?: Maybe<Scalars['String']>
  description_in?: Maybe<Array<Scalars['String']>>
  duration_eq?: Maybe<Scalars['Int']>
  duration_gt?: Maybe<Scalars['Int']>
  duration_gte?: Maybe<Scalars['Int']>
  duration_lt?: Maybe<Scalars['Int']>
  duration_lte?: Maybe<Scalars['Int']>
  duration_in?: Maybe<Array<Scalars['Int']>>
  hasMarketing_eq?: Maybe<Scalars['Boolean']>
  hasMarketing_in?: Maybe<Array<Scalars['Boolean']>>
  publishedBeforeJoystream_eq?: Maybe<Scalars['DateTime']>
  publishedBeforeJoystream_lt?: Maybe<Scalars['DateTime']>
  publishedBeforeJoystream_lte?: Maybe<Scalars['DateTime']>
  publishedBeforeJoystream_gt?: Maybe<Scalars['DateTime']>
  publishedBeforeJoystream_gte?: Maybe<Scalars['DateTime']>
  isPublic_eq?: Maybe<Scalars['Boolean']>
  isPublic_in?: Maybe<Array<Scalars['Boolean']>>
  isCensored_eq?: Maybe<Scalars['Boolean']>
  isCensored_in?: Maybe<Array<Scalars['Boolean']>>
  isExplicit_eq?: Maybe<Scalars['Boolean']>
  isExplicit_in?: Maybe<Array<Scalars['Boolean']>>
  createdInBlock_eq?: Maybe<Scalars['Int']>
  createdInBlock_gt?: Maybe<Scalars['Int']>
  createdInBlock_gte?: Maybe<Scalars['Int']>
  createdInBlock_lt?: Maybe<Scalars['Int']>
  createdInBlock_lte?: Maybe<Scalars['Int']>
  createdInBlock_in?: Maybe<Array<Scalars['Int']>>
  isFeatured_eq?: Maybe<Scalars['Boolean']>
  isFeatured_in?: Maybe<Array<Scalars['Boolean']>>
  channel?: Maybe<ChannelWhereInput>
  category?: Maybe<VideoCategoryWhereInput>
  thumbnailPhoto?: Maybe<StorageDataObjectWhereInput>
  language?: Maybe<LanguageWhereInput>
  nft?: Maybe<OwnedNftWhereInput>
  license?: Maybe<LicenseWhereInput>
  media?: Maybe<StorageDataObjectWhereInput>
  mediaMetadata?: Maybe<VideoMediaMetadataWhereInput>
  auction?: Maybe<AuctionWhereInput>
  auctionbidcanceledeventvideo_none?: Maybe<AuctionBidCanceledEventWhereInput>
  auctionbidcanceledeventvideo_some?: Maybe<AuctionBidCanceledEventWhereInput>
  auctionbidcanceledeventvideo_every?: Maybe<AuctionBidCanceledEventWhereInput>
  auctionbidmadeeventvideo_none?: Maybe<AuctionBidMadeEventWhereInput>
  auctionbidmadeeventvideo_some?: Maybe<AuctionBidMadeEventWhereInput>
  auctionbidmadeeventvideo_every?: Maybe<AuctionBidMadeEventWhereInput>
  auctioncanceledeventvideo_none?: Maybe<AuctionCanceledEventWhereInput>
  auctioncanceledeventvideo_some?: Maybe<AuctionCanceledEventWhereInput>
  auctioncanceledeventvideo_every?: Maybe<AuctionCanceledEventWhereInput>
  auctionstartedeventvideo_none?: Maybe<AuctionStartedEventWhereInput>
  auctionstartedeventvideo_some?: Maybe<AuctionStartedEventWhereInput>
  auctionstartedeventvideo_every?: Maybe<AuctionStartedEventWhereInput>
  bidmadecompletingauctioneventvideo_none?: Maybe<BidMadeCompletingAuctionEventWhereInput>
  bidmadecompletingauctioneventvideo_some?: Maybe<BidMadeCompletingAuctionEventWhereInput>
  bidmadecompletingauctioneventvideo_every?: Maybe<BidMadeCompletingAuctionEventWhereInput>
  buynowcanceledeventvideo_none?: Maybe<BuyNowCanceledEventWhereInput>
  buynowcanceledeventvideo_some?: Maybe<BuyNowCanceledEventWhereInput>
  buynowcanceledeventvideo_every?: Maybe<BuyNowCanceledEventWhereInput>
  englishauctioncompletedeventvideo_none?: Maybe<EnglishAuctionCompletedEventWhereInput>
  englishauctioncompletedeventvideo_some?: Maybe<EnglishAuctionCompletedEventWhereInput>
  englishauctioncompletedeventvideo_every?: Maybe<EnglishAuctionCompletedEventWhereInput>
  nftboughteventvideo_none?: Maybe<NftBoughtEventWhereInput>
  nftboughteventvideo_some?: Maybe<NftBoughtEventWhereInput>
  nftboughteventvideo_every?: Maybe<NftBoughtEventWhereInput>
  nftissuedeventvideo_none?: Maybe<NftIssuedEventWhereInput>
  nftissuedeventvideo_some?: Maybe<NftIssuedEventWhereInput>
  nftissuedeventvideo_every?: Maybe<NftIssuedEventWhereInput>
  nftsellordermadeeventvideo_none?: Maybe<NftSellOrderMadeEventWhereInput>
  nftsellordermadeeventvideo_some?: Maybe<NftSellOrderMadeEventWhereInput>
  nftsellordermadeeventvideo_every?: Maybe<NftSellOrderMadeEventWhereInput>
  offeracceptedeventvideo_none?: Maybe<OfferAcceptedEventWhereInput>
  offeracceptedeventvideo_some?: Maybe<OfferAcceptedEventWhereInput>
  offeracceptedeventvideo_every?: Maybe<OfferAcceptedEventWhereInput>
  offercanceledeventvideo_none?: Maybe<OfferCanceledEventWhereInput>
  offercanceledeventvideo_some?: Maybe<OfferCanceledEventWhereInput>
  offercanceledeventvideo_every?: Maybe<OfferCanceledEventWhereInput>
  offerstartedeventvideo_none?: Maybe<OfferStartedEventWhereInput>
  offerstartedeventvideo_some?: Maybe<OfferStartedEventWhereInput>
  offerstartedeventvideo_every?: Maybe<OfferStartedEventWhereInput>
  openauctionbidacceptedeventvideo_none?: Maybe<OpenAuctionBidAcceptedEventWhereInput>
  openauctionbidacceptedeventvideo_some?: Maybe<OpenAuctionBidAcceptedEventWhereInput>
  openauctionbidacceptedeventvideo_every?: Maybe<OpenAuctionBidAcceptedEventWhereInput>
  ownednftvideo_none?: Maybe<OwnedNftWhereInput>
  ownednftvideo_some?: Maybe<OwnedNftWhereInput>
  ownednftvideo_every?: Maybe<OwnedNftWhereInput>
  AND?: Maybe<Array<VideoWhereInput>>
  OR?: Maybe<Array<VideoWhereInput>>
}

export type VideoWhereUniqueInput = {
  id: Scalars['ID']
}

export type Worker = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Sign of worker still being active */
  isActive: Scalars['Boolean']
  /** Runtime identifier */
  workerId: Scalars['String']
  /** Associated working group */
  type: WorkerType
  /** Custom metadata set by provider */
  metadata?: Maybe<Scalars['String']>
}

export type WorkerConnection = {
  totalCount: Scalars['Int']
  edges: Array<WorkerEdge>
  pageInfo: PageInfo
}

export type WorkerCreateInput = {
  isActive: Scalars['Boolean']
  workerId: Scalars['String']
  type: WorkerType
  metadata?: Maybe<Scalars['String']>
}

export type WorkerEdge = {
  node: Worker
  cursor: Scalars['String']
}

export enum WorkerOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  IsActiveAsc = 'isActive_ASC',
  IsActiveDesc = 'isActive_DESC',
  WorkerIdAsc = 'workerId_ASC',
  WorkerIdDesc = 'workerId_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  MetadataAsc = 'metadata_ASC',
  MetadataDesc = 'metadata_DESC',
}

export enum WorkerType {
  Gateway = 'GATEWAY',
  Storage = 'STORAGE',
}

export type WorkerUpdateInput = {
  isActive?: Maybe<Scalars['Boolean']>
  workerId?: Maybe<Scalars['String']>
  type?: Maybe<WorkerType>
  metadata?: Maybe<Scalars['String']>
}

export type WorkerWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  isActive_eq?: Maybe<Scalars['Boolean']>
  isActive_in?: Maybe<Array<Scalars['Boolean']>>
  workerId_eq?: Maybe<Scalars['String']>
  workerId_contains?: Maybe<Scalars['String']>
  workerId_startsWith?: Maybe<Scalars['String']>
  workerId_endsWith?: Maybe<Scalars['String']>
  workerId_in?: Maybe<Array<Scalars['String']>>
  type_eq?: Maybe<WorkerType>
  type_in?: Maybe<Array<WorkerType>>
  metadata_eq?: Maybe<Scalars['String']>
  metadata_contains?: Maybe<Scalars['String']>
  metadata_startsWith?: Maybe<Scalars['String']>
  metadata_endsWith?: Maybe<Scalars['String']>
  metadata_in?: Maybe<Array<Scalars['String']>>
  AND?: Maybe<Array<WorkerWhereInput>>
  OR?: Maybe<Array<WorkerWhereInput>>
}

export type WorkerWhereUniqueInput = {
  id: Scalars['ID']
}
