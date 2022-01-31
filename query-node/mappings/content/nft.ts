// TODO: solve events' relations to videos and other entites that can be changed or deleted

import { EventContext, StoreContext, DatabaseManager } from '@joystream/hydra-common'
import { genericEventFields, inconsistentState, unexpectedData, logger } from '../common'
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
  TransactionalStatusInitiatedOfferToMember,
  TransactionalStatusIdle,
  TransactionalStatusBuyNow,
  TransactionalStatusAuction,
  ContentActor,
  ContentActorMember,
  ContentActorCurator,
  Curator,

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
import { FindConditions } from 'typeorm'
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

async function getNftFromVideo(
  store: DatabaseManager,
  videoId: string,
  errorMessageForVideo: string,
  errorMessageForNft: string
): Promise<{ video: Video; nft: OwnedNft }> {
  // load video
  const video = await getRequiredExistingEntity(store, Video, videoId.toString(), errorMessageForVideo, ['nft'])

  // get auction
  const nft = video.nft

  // ensure auction exists
  if (!nft) {
    return inconsistentState(errorMessageForNft, videoId)
  }

  return {
    video,
    nft,
  }
}

async function resetNftTransactionalStatusFromVideo(store: DatabaseManager, videoId: string, errorMessage: string) {
  // load NFT
  const nft = await store.get(OwnedNft, { where: { video: { id: videoId.toString() } } as FindConditions<OwnedNft> })

  // ensure NFT
  if (!nft) {
    return inconsistentState(errorMessage, videoId.toString())
  }

  // reset transactional status
  nft.transactionalStatus = new TransactionalStatusIdle()

  // save NFT
  await store.save<OwnedNft>(nft)
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

async function convertContentActor(
  store: DatabaseManager,
  contentActor: joystreamTypes.ContentActor
): Promise<typeof ContentActor> {
  if (contentActor.isMember) {
    const memberId = contentActor.asMember.toNumber()
    const member = await store.get(Membership, { where: { id: memberId.toString() } as FindConditions<Membership> })

    // ensure member exists
    if (!member) {
      return inconsistentState(`Actor is non-existing member`, memberId)
    }

    const result = new ContentActorMember()
    result.member = member

    return result
  }

  if (contentActor.isCurator) {
    const curatorId = contentActor.asCurator[1].toNumber()
    const curator = await store.get(Curator, {
      where: { id: curatorId.toString() } as FindConditions<Curator>,
    })

    // ensure curator group exists
    if (!curator) {
      return inconsistentState('Actor is non-existing curator group', curatorId)
    }

    const result = new ContentActorCurator()
    result.curator = curator

    return result
  }

  // contentActor.isLead not supported (not needed) now

  logger.error('Not implemented ContentActor type', { contentActor: contentActor.toString() })
  throw new Error('Not-implemented ContentActor type used')
}

export async function contentNft_AuctionStarted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [ownerId, videoId, auctionParams] = new Content.AuctionStartedEvent(event).params

  // specific event processing

  // load video
  const video = await getRequiredExistingEntity(
    store,
    Video,
    videoId.toString(),
    `Non-existing video's auction started`,
    ['nft']
  )

  // ensure NFT has been issued
  if (!video.nft) {
    return inconsistentState('Non-existing NFT auctioned', video.id.toString())
  }

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

  const transactionalStatus = new TransactionalStatusAuction()
  transactionalStatus.auction = auction

  video.nft.transactionalStatus = transactionalStatus

  // save NFT
  await store.save<OwnedNft>(video.nft)

  // common event processing - second

  const actor = new ContentActorMember()
  actor.member = new Membership({ id: ownerId.toString() })

  const announcingPeriodStartedEvent = new AuctionStartedEvent({
    ...genericEventFields(event),

    actor,
    video,
    auction,
  })

  await store.save<AuctionStartedEvent>(announcingPeriodStartedEvent)
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
    transactionalStatus: new TransactionalStatusIdle(),
  })

  // save nft
  await store.save<OwnedNft>(ownedNft)

  // common event processing - second

  const announcingPeriodStartedEvent = new NftIssuedEvent({
    ...genericEventFields(event),

    contentActor: await convertContentActor(store, actor),
    video,
    royalty: creatorRoyalty,
    metadata: metadata.toString(),
    newOwner,
  })

  await store.save<NftIssuedEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_AuctionBidMade({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [memberId, videoId, bidAmount, extendsAuction] = new Content.AuctionBidMadeEvent(event).params

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

  // common event processing - second

  const announcingPeriodStartedEvent = new AuctionBidMadeEvent({
    ...genericEventFields(event),

    member,
    video,
    bidAmount,
    extendsAuction: extendsAuction.isTrue,
  })

  await store.save<AuctionBidMadeEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_AuctionBidCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [memberId, videoId] = new Content.AuctionBidCanceledEvent(event).params

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

  // common event processing - second

  const announcingPeriodStartedEvent = new AuctionBidCanceledEvent({
    ...genericEventFields(event),

    member: new Membership({ id: memberId.toString() }),
    video,
  })

  await store.save<AuctionBidCanceledEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_AuctionCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [contentActor, videoId] = new Content.AuctionCanceledEvent(event).params

  // specific event processing

  // load video and auction
  const { video, auction } = await getAuctionFromVideo(
    store,
    videoId.toString(),
    'Non-existing video got bid canceled',
    'Non-existing auction got bid canceled'
  )

  // update NFT's transactional status
  await resetNftTransactionalStatusFromVideo(store, videoId.toString(), `Non-existing NFT's auction canceled`)

  // mark auction as canceled
  auction.isCanceled = true

  // save auction
  await store.save<Auction>(auction)

  // common event processing - second

  const announcingPeriodStartedEvent = new AuctionCanceledEvent({
    ...genericEventFields(event),

    contentActor: await convertContentActor(store, contentActor),
    video,
  })

  await store.save<AuctionCanceledEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_EnglishAuctionCompleted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [memberId, videoId] = new Content.EnglishAuctionCompletedEvent(event).params

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

  // update NFT's transactional status
  await resetNftTransactionalStatusFromVideo(store, videoId.toString(), `Non-existing NFT's auction completed`)

  // update auction
  auction.isCompleted = true
  auction.winningMember = member

  // save auction
  await store.save<Auction>(auction)

  // common event processing - second

  const announcingPeriodStartedEvent = new EnglishAuctionCompletedEvent({
    ...genericEventFields(event),

    member,
    video,
  })

  await store.save<EnglishAuctionCompletedEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_BidMadeCompletingAuction({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [memberId, videoId] = new Content.BidMadeCompletingAuctionEvent(event).params

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

  // update NFT's transactional status
  await resetNftTransactionalStatusFromVideo(store, videoId.toString(), `Non-existing NFT's auction completed by bid`)

  // update auction
  auction.isCompleted = true
  auction.winningMember = member

  // save auction
  await store.save<Auction>(auction)

  // common event processing - second

  const announcingPeriodStartedEvent = new BidMadeCompletingAuctionEvent({
    ...genericEventFields(event),

    member,
    video,
  })

  await store.save<BidMadeCompletingAuctionEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_OpenAuctionBidAccepted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [contentActor, videoId] = new Content.OpenAuctionBidAcceptedEvent(event).params

  // specific event processing

  // load video and auction
  const { video, auction } = await getAuctionFromVideo(
    store,
    videoId.toString(),
    `Non-existing video's auction accepted a bid`,
    `Non-existing auction accepted a bid`
  )

  // ensure member won the auction (only contentActor allowed)
  const tmpContentActor = await convertContentActor(store, contentActor)
  if (!(tmpContentActor instanceof ContentActorMember)) {
    return unexpectedData(`Unexpected content actor. Only Members allowed here.`)
  }
  const member = tmpContentActor.member

  // update NFT's transactional status
  await resetNftTransactionalStatusFromVideo(store, videoId.toString(), `Non-existing NFT's auction completed by bid`)

  // update auction
  auction.isCompleted = true
  auction.winningMember = member

  // save auction
  await store.save<Auction>(auction)

  // common event processing - second

  const announcingPeriodStartedEvent = new OpenAuctionBidAcceptedEvent({
    ...genericEventFields(event),

    contentActor: await convertContentActor(store, contentActor),
    video,
  })

  await store.save<OpenAuctionBidAcceptedEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_OfferStarted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId, contentActor, memberId, price] = new Content.OfferStartedEvent(event).params

  // specific event processing

  // load NFT
  const { video, nft } = await getNftFromVideo(
    store,
    videoId.toString(),
    'Non-existing video was offered',
    'Non-existing nft was offered'
  )

  // create offer
  const transactionalStatus = new TransactionalStatusInitiatedOfferToMember()
  transactionalStatus.memberId = memberId.toNumber()
  transactionalStatus.price = price.unwrapOr(undefined)

  // update NFT
  nft.transactionalStatus = transactionalStatus

  // save NFT
  await store.save<OwnedNft>(nft)

  // common event processing - second

  const announcingPeriodStartedEvent = new OfferStartedEvent({
    ...genericEventFields(event),

    video,
    contentActor: await convertContentActor(store, contentActor),
    member: new Membership({ id: memberId.toString() }),
    price: price.unwrapOr(undefined),
  })

  await store.save<OfferStartedEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_OfferAccepted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId] = new Content.OfferAcceptedEvent(event).params

  // specific event processing

  // load NFT
  const { video, nft } = await getNftFromVideo(
    store,
    videoId.toString(),
    'Non-existing video sell offer was accepted',
    'Non-existing nft sell offer was accepted'
  )

  // read member from offer
  const memberId = (nft.transactionalStatus as TransactionalStatusInitiatedOfferToMember).memberId
  const member = new Membership({ id: memberId.toString() })

  // update NFT
  nft.transactionalStatus = new TransactionalStatusIdle()
  nft.ownerMember = member

  // save NFT
  await store.save<OwnedNft>(nft)

  // common event processing - second

  const announcingPeriodStartedEvent = new OfferAcceptedEvent({
    ...genericEventFields(event),

    video,
  })

  await store.save<OfferAcceptedEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_OfferCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId, contentActor] = new Content.OfferCanceledEvent(event).params

  // specific event processing

  // load NFT
  const { video, nft } = await getNftFromVideo(
    store,
    videoId.toString(),
    'Non-existing video sell offer was canceled',
    'Non-existing nft sell offer was canceled'
  )

  // update NFT
  nft.transactionalStatus = new TransactionalStatusIdle()

  // save NFT
  await store.save<OwnedNft>(nft)

  // common event processing - second

  const announcingPeriodStartedEvent = new OfferCanceledEvent({
    ...genericEventFields(event),

    video,
    contentActor: await convertContentActor(store, contentActor),
  })

  await store.save<OfferCanceledEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_NftSellOrderMade({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId, contentActor, price] = new Content.NFTSellOrderMadeEvent(event).params

  // specific event processing

  // load NFT
  const { video, nft } = await getNftFromVideo(
    store,
    videoId.toString(),
    'Non-existing video was offered',
    'Non-existing nft was offered'
  )

  // create buy now offer
  const transactionalStatus = new TransactionalStatusBuyNow()
  transactionalStatus.price = price

  // update NFT
  nft.transactionalStatus = transactionalStatus

  // save NFT
  await store.save<OwnedNft>(nft)

  // common event processing - second

  const announcingPeriodStartedEvent = new NftSellOrderMadeEvent({
    ...genericEventFields(event),

    video,
    contentActor: await convertContentActor(store, contentActor),
    price,
  })

  await store.save<NftSellOrderMadeEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_NftBought({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId, memberId] = new Content.NFTBoughtEvent(event).params

  // specific event processing

  // load NFT
  const { video, nft } = await getNftFromVideo(
    store,
    videoId.toString(),
    'Non-existing video was bought',
    'Non-existing nft was bought'
  )

  // read member
  const member = new Membership({ id: memberId.toString() })

  // update NFT
  nft.transactionalStatus = new TransactionalStatusIdle()
  nft.ownerMember = member

  // save NFT
  await store.save<OwnedNft>(nft)

  // common event processing - second

  const announcingPeriodStartedEvent = new NftBoughtEvent({
    ...genericEventFields(event),

    video,
    member,
  })

  await store.save<NftBoughtEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_BuyNowCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId, contentActor] = new Content.BuyNowCanceledEvent(event).params

  // specific event processing

  // load NFT
  const { video, nft } = await getNftFromVideo(
    store,
    videoId.toString(),
    'Non-existing video was bought',
    'Non-existing nft was bought'
  )

  // update NFT
  nft.transactionalStatus = new TransactionalStatusIdle()

  // save NFT
  await store.save<OwnedNft>(nft)

  // common event processing - second

  const announcingPeriodStartedEvent = new BuyNowCanceledEvent({
    ...genericEventFields(event),

    video,
    contentActor: await convertContentActor(store, contentActor),
  })

  await store.save<BuyNowCanceledEvent>(announcingPeriodStartedEvent)
}
