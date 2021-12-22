// TODO: solve events' relations to videos and other entites that can be changed or deleted
// TODO: solve transactionalStatus for OwnedNFT + how to set it up for first time auctioned NFT?
// TODO: walkthrough bidding events once again and ensure all data are saved properly

import { EventContext, StoreContext, DatabaseManager } from '@joystream/hydra-common'
import { genericEventFields, inconsistentState } from '../common'
import {
  // entities
  Auction,
  AuctionType,
  AuctionTypeEnglish,
  AuctionTypeOpen,
  Bid,
  Membership,
  OwnedNft,
  Video,

  // events
  AuctionStartedEvent,
  NftIssuedEvent,
  AuctionBidMadeEvent,
  AuctionBidCanceledEvent,
  AuctionCanceledEvent,
  EnglishAuctionCompletedEvent,
  BidMadeCompletingAuctionEvent,
  OpenAuctionBidAcceptedEvent,
  OfferStartedEvent,
  OfferAcceptedEvent,
  OfferCanceledEvent,
  NftSellOrderMadeEvent,
  NftBoughtEvent,
  BuyNowCanceledEvent,
} from 'query-node/dist/model'
import * as joystreamTypes from '@joystream/types/augment/all/types'
import { Content } from '../generated/types'
import BN from 'bn.js'

// definition of generic type for Hydra DatabaseManager's methods
type EntityType<T> = {
  new (...args: any[]): T
}

async function getExistingEntity<Type extends Video | Membership>(
  store: DatabaseManager,
  entityType: EntityType<Type>,
  id: string,
  relations: string[] = []
): Promise<Type | undefined> {
  // load entity
  const entity = await store.get(entityType, { where: { id } })

  return entity
}

async function getRequiredExistingEntity<Type extends Video | Membership>(
  store: DatabaseManager,
  entityType: EntityType<Type>,
  id: string,
  errorMessage: string,
  relations: string[] = []
): Promise<Type> {
  const entity = await getExistingEntity(store, entityType, id, relations)

  // ensure video exists
  if (!entity) {
    return inconsistentState(errorMessage, id)
  }

  return entity
}

async function getAuctionFromVideo(
  store: DatabaseManager,
  videoId: string,
  errorMessageForVideo: string,
  errorMessageForAuction: string
): Promise<{ video: Video; auction: Auction }> {
  // load video
  const video = await getRequiredExistingEntity(store, Video, videoId.toString(), errorMessageForVideo, ['auction'])

  // get auction
  const auction = video.auction

  // ensure auction exists
  if (!auction) {
    return inconsistentState(errorMessageForAuction, videoId)
  }

  return {
    video,
    auction,
  }
}

async function getRequiredExistingEntites<Type extends Video | Membership>(
  store: DatabaseManager,
  entityType: EntityType<Type>,
  ids: string[],
  errorMessage: string
): Promise<Type[]> {
  // load entities
  const entities = await store.getMany(entityType, { where: { id: ids } })

  // assess loaded entity ids
  const loadedEntityIds = entities.map((item) => item.id.toString())

  // ensure all entities exists
  if (loadedEntityIds.length !== ids.length) {
    const missingIds = ids.filter((item) => !loadedEntityIds.includes(item))

    return inconsistentState(errorMessage, missingIds)
  }

  // ensure entities are ordered as requested
  entities.sort((a, b) => ids.indexOf(a.id.toString()) - ids.indexOf(b.id.toString()))

  return entities
}

export async function contentNft_AuctionStarted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [ownerId, videoId, auctionParams] = new Content.AuctionStartedEvent(event).params

  const announcingPeriodStartedEvent = new AuctionStartedEvent({
    ...genericEventFields(event),
  })

  await store.save<AuctionStartedEvent>(announcingPeriodStartedEvent)

  // specific event processing

  // load video
  const video = await getRequiredExistingEntity(
    store,
    Video,
    videoId.toString(),
    `Non-existing video's auction started`
  )

  // load member
  const member = await getRequiredExistingEntity(
    store,
    Membership,
    ownerId.toString(),
    'Non-existing member started video auction'
  )

  const whitelistedMembers = await getRequiredExistingEntites(
    store,
    Membership,
    Array.from(auctionParams.whitelist.values()).map((item) => item.toString()),
    'Non-existing members whitelisted'
  )

  // prepare auction record
  const auction = new Auction({
    video,
    initialOwner: member,
    startingPrice: auctionParams.starting_price,
    buyNowPrice: new BN(auctionParams.buy_now_price.toString()),
    auctionType: createAuctionType(auctionParams.auction_type),
    minimalBidStep: auctionParams.minimal_bid_step,
    startsAtBlock: auctionParams.starts_at.isSome ? auctionParams.starts_at.unwrap().toNumber() : event.blockNumber,
    isCanceled: false,
    isCompleted: false,
    whitelistedMembers,
  })

  // save auction
  await store.save<Auction>(auction)
}

// create auction type variant from raw runtime auction type
function createAuctionType(rawAuctionType: joystreamTypes.AuctionType): typeof AuctionType {
  // auction type `english`
  if (rawAuctionType.isEnglish) {
    const rawType = rawAuctionType.asEnglish

    // prepare auction variant
    const auctionType = new AuctionTypeEnglish()
    auctionType.duration = rawType.auction_duration.toNumber()
    auctionType.extensionPeriod = rawType.extension_period.toNumber()
    return auctionType
  }

  // auction type `open`
  const rawType = rawAuctionType.asOpen

  // prepare auction variant
  const auctionType = new AuctionTypeOpen()
  auctionType.bidLockingTime = rawType.bid_lock_duration.toNumber()
  return auctionType
}

export async function contentNft_NftIssued({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [actor, videoId, royalty, metadata, mbNewOwnerId] = new Content.NftIssuedEvent(event).params

  const announcingPeriodStartedEvent = new NftIssuedEvent({
    ...genericEventFields(event),
  })

  await store.save<NftIssuedEvent>(announcingPeriodStartedEvent)

  // specific event processing

  // load video
  const video = await getRequiredExistingEntity(store, Video, videoId.toString(), 'Non-existing video auction started')

  // load owner
  const newOwner = await getExistingEntity(store, Membership, mbNewOwnerId.toString())

  const creatorRoyalty = royalty.isSome ? royalty.unwrap().toNumber() : undefined

  // prepare nft record
  const ownedNft = new OwnedNft({
    video,
    ownerMember: newOwner,
    creatorRoyalty,
    metadata: metadata.toString(),
  })

  // save nft
  await store.save<OwnedNft>(ownedNft)
}

export async function contentNft_AuctionBidMade({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [memberId, videoId, bidAmount, extendsAuction] = new Content.AuctionBidMadeEvent(event).params

  const announcingPeriodStartedEvent = new AuctionBidMadeEvent({
    ...genericEventFields(event),
  })

  await store.save<AuctionBidMadeEvent>(announcingPeriodStartedEvent)

  // specific event processing

  // load member
  const member = await getRequiredExistingEntity(
    store,
    Membership,
    memberId.toString(),
    'Non-existing member bid in auction'
  )

  // load video and auction
  const { video, auction } = await getAuctionFromVideo(
    store,
    videoId.toString(),
    'Non-existing video got bid',
    'Non-existing auction got bid canceled'
  )

  // prepare bid record
  const bid = new Bid({
    auction,
    bidder: member,
    amount: new BN(bidAmount.toString()),
    createdAt: new Date(event.blockTimestamp),
    createdInBlock: event.blockNumber,
    isCanceled: false,
  })

  // save bid
  await store.save<Bid>(bid)

  // update last bid in auction
  auction.lastBid = bid

  await store.save<Auction>(auction)
}

export async function contentNft_AuctionBidCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [memberId, videoId] = new Content.AuctionBidCanceledEvent(event).params

  const announcingPeriodStartedEvent = new AuctionBidCanceledEvent({
    ...genericEventFields(event),
  })

  await store.save<AuctionBidCanceledEvent>(announcingPeriodStartedEvent)

  // specific event processing

  // load video and auction
  const { video, auction } = await getAuctionFromVideo(
    store,
    videoId.toString(),
    'Non-existing video got bid canceled',
    'Non-existing auction got bid canceled'
  )

  // ensure bid exists
  if (!auction.lastBid) {
    return inconsistentState('Non-existing bid got canceled', auction.id.toString())
  }

  // TOOD: should bid placed before `lastBid` be loaded and replaced here?
  // update auction's last bid
  auction.lastBid = undefined

  // save auction
  await store.save<Auction>(auction)
}

export async function contentNft_AuctionCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [contentActor, videoId] = new Content.AuctionCanceledEvent(event).params

  const announcingPeriodStartedEvent = new AuctionCanceledEvent({
    ...genericEventFields(event),
  })

  await store.save<AuctionCanceledEvent>(announcingPeriodStartedEvent)

  // specific event processing

  // load video and auction
  const { video, auction } = await getAuctionFromVideo(
    store,
    videoId.toString(),
    'Non-existing video got bid canceled',
    'Non-existing auction got bid canceled'
  )

  // mark auction as canceled
  auction.isCanceled = true

  // save auction
  await store.save<Auction>(auction)
}

export async function contentNft_EnglishAuctionCompleted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [memberId, videoId] = new Content.EnglishAuctionCompletedEvent(event).params

  const announcingPeriodStartedEvent = new EnglishAuctionCompletedEvent({
    ...genericEventFields(event),
  })

  await store.save<EnglishAuctionCompletedEvent>(announcingPeriodStartedEvent)

  // specific event processing

  // load member
  const member = await getRequiredExistingEntity(
    store,
    Membership,
    memberId.toString(),
    'Non-existing english-type auction was completed'
  )

  // load video and auction
  const { video, auction } = await getAuctionFromVideo(
    store,
    videoId.toString(),
    `Non-existing video's english-type auction was completed`,
    'Non-existing english-type auction was completed'
  )

  // update auction
  auction.isCompleted = true
  auction.winningMember = member

  // save auction
  await store.save<Auction>(auction)
}

export async function contentNft_BidMadeCompletingAuction({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [memberId, videoId] = new Content.BidMadeCompletingAuctionEvent(event).params

  const announcingPeriodStartedEvent = new BidMadeCompletingAuctionEvent({
    ...genericEventFields(event),
  })

  await store.save<BidMadeCompletingAuctionEvent>(announcingPeriodStartedEvent)

  // specific event processing

  // load member
  const member = await getRequiredExistingEntity(
    store,
    Membership,
    memberId.toString(),
    'Non-existing auction was completed by buy-now bid'
  )

  // load video and auction
  const { video, auction } = await getAuctionFromVideo(
    store,
    videoId.toString(),
    `Non-existing video's auction was completed by buy-now bid`,
    `Non-existing auction was completed by buy-now bid`
  )

  // update auction
  auction.isCompleted = true
  auction.winningMember = member

  // save auction
  await store.save<Auction>(auction)
}

export async function contentNft_OpenAuctionBidAccepted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [contentActor, video] = new Content.OpenAuctionBidAcceptedEvent(event).params

  const announcingPeriodStartedEvent = new OpenAuctionBidAcceptedEvent({
    ...genericEventFields(event),
  })

  await store.save<OpenAuctionBidAcceptedEvent>(announcingPeriodStartedEvent)

  // specific event processing

  // TODO: what exactly should happen here?
}

export async function contentNft_OfferStarted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [video, contentActor, member, price] = new Content.OfferStartedEvent(event).params

  const announcingPeriodStartedEvent = new OfferStartedEvent({
    ...genericEventFields(event),
  })

  await store.save<OfferStartedEvent>(announcingPeriodStartedEvent)

  // specific event processing
}

export async function contentNft_OfferAccepted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [video] = new Content.OfferAcceptedEvent(event).params

  const announcingPeriodStartedEvent = new OfferAcceptedEvent({
    ...genericEventFields(event),
  })

  await store.save<OfferAcceptedEvent>(announcingPeriodStartedEvent)

  // specific event processing
}

export async function contentNft_OfferCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [video, contentActor] = new Content.OfferCanceledEvent(event).params

  const announcingPeriodStartedEvent = new OfferCanceledEvent({
    ...genericEventFields(event),
  })

  await store.save<OfferCanceledEvent>(announcingPeriodStartedEvent)

  // specific event processing
}

export async function contentNft_NftSellOrderMade({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [video, contentActor, price] = new Content.NFTSellOrderMadeEvent(event).params

  const announcingPeriodStartedEvent = new NftSellOrderMadeEvent({
    ...genericEventFields(event),
  })

  await store.save<NftSellOrderMadeEvent>(announcingPeriodStartedEvent)

  // specific event processing
}

export async function contentNft_NftBought({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [video, member] = new Content.NFTBoughtEvent(event).params

  const announcingPeriodStartedEvent = new NftBoughtEvent({
    ...genericEventFields(event),
  })

  await store.save<NftBoughtEvent>(announcingPeriodStartedEvent)

  // specific event processing
}

export async function contentNft_BuyNowCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [video, contentActor] = new Content.BuyNowCanceledEvent(event).params

  const announcingPeriodStartedEvent = new BuyNowCanceledEvent({
    ...genericEventFields(event),
  })

  await store.save<BuyNowCanceledEvent>(announcingPeriodStartedEvent)

  // specific event processing
}
