// TODO: solve events' relations to videos and other entites that can be changed or deleted

import { DatabaseManager, EventContext, StoreContext, SubstrateEvent } from '@joystream/hydra-common'
import { genericEventFields, getById, inconsistentState, logger } from '../common'
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
  TransactionalStatus,
  TransactionalStatusInitiatedOfferToMember,
  TransactionalStatusIdle,
  TransactionalStatusBuyNow,
  TransactionalStatusAuction,
  TransactionalStatusUpdate,
  ContentActor,
  ContentActorMember,
  ContentActorCurator,
  ContentActorLead,
  Curator,
  Channel,

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
  NftSlingedBackToTheOriginalArtistEvent,
} from 'query-node/dist/model'
import * as joystreamTypes from '@joystream/types/augment/all/types'
import { Content } from '../../generated/types'
import { FindConditions, In } from 'typeorm'
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
  const entity = await store.get(entityType, { where: { id }, relations })

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

async function getCurrentAuctionFromVideo(
  store: DatabaseManager,
  videoId: string,
  errorMessageForVideo: string,
  errorMessageForAuction: string,
  relations: string[] = []
): Promise<{ video: Video; auction: Auction }> {
  // load video
  const video = await getRequiredExistingEntity(store, Video, videoId.toString(), errorMessageForVideo, [
    'nft',
    'nft.auctions',
    ...relations.map((item) => `nft.auctions.${item}`),
  ])

  // get auction
  const allAuctions = video.nft?.auctions || []
  const auction = allAuctions.length
    ? allAuctions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[allAuctions.length - 1]
    : null

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

async function resetNftTransactionalStatusFromVideo(
  store: DatabaseManager,
  videoId: string,
  errorMessage: string,
  blockNumber: number,
  newOwner?: Membership
) {
  // load NFT
  const nft = await store.get(OwnedNft, { where: { id: videoId.toString() } as FindConditions<OwnedNft> })

  // ensure NFT
  if (!nft) {
    return inconsistentState(errorMessage, videoId.toString())
  }

  if (newOwner) {
    nft.ownerMember = newOwner
  }

  // reset transactional status
  const transactionalStatus = new TransactionalStatusIdle()
  await setNewNftTransactionalStatus(store, nft, transactionalStatus, blockNumber)
}

async function getRequiredExistingEntites<Type extends Video | Membership>(
  store: DatabaseManager,
  entityType: EntityType<Type>,
  ids: string[],
  errorMessage: string
): Promise<Type[]> {
  // load entities
  const entities = await store.getMany(entityType, { where: { id: In(ids) } })

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

  if (contentActor.isLead) {
    return new ContentActorLead()
  }

  logger.error('Not implemented ContentActor type', { contentActor: contentActor.toString() })
  throw new Error('Not-implemented ContentActor type used')
}

async function setNewNftTransactionalStatus(
  store: DatabaseManager,
  nft: OwnedNft,
  transactionalStatus: typeof TransactionalStatus,
  blockNumber: number
) {
  // update transactionalStatus
  nft.transactionalStatus = transactionalStatus

  // save NFT
  await store.save<OwnedNft>(nft)

  // create transactional status update record
  const transactionalStatusUpdate = new TransactionalStatusUpdate({
    nft,
    transactionalStatus: nft.transactionalStatus,
    changedAt: blockNumber,
  })

  // save update record
  await store.save<TransactionalStatusUpdate>(transactionalStatusUpdate)
}

async function finishAuction(store: DatabaseManager, videoId: number, blockNumber: number) {
  // load video and auction
  const { video, auction } = await getCurrentAuctionFromVideo(
    store,
    videoId.toString(),
    `Non-existing video's auction was completed`,
    'Non-existing auction was completed',
    ['lastBid', 'lastBid.bidder']
  )

  // load winner member
  const winnerMemberId = (auction.lastBid as Bid).bidder.id
  const winner = await getRequiredExistingEntity(
    store,
    Membership,
    winnerMemberId.toString(),
    'Non-existing auction winner'
  )

  // update NFT's transactional status
  await resetNftTransactionalStatusFromVideo(
    store,
    videoId.toString(),
    `Non-existing NFT's auction completed`,
    blockNumber,
    winner
  )

  // update auction
  auction.isCompleted = true
  auction.winningMember = winner
  auction.endedAtBlock = blockNumber

  // save auction
  await store.save<Auction>(auction)

  return { video, winner }
}

async function createBid(
  event: SubstrateEvent,
  store: DatabaseManager,
  memberId: number,
  videoId: number,
  bidAmount?: string
) {
  // load member
  const member = await getRequiredExistingEntity(
    store,
    Membership,
    memberId.toString(),
    'Non-existing member bid in auction'
  )

  // load video and auction
  const { video, auction } = await getCurrentAuctionFromVideo(
    store,
    videoId.toString(),
    'Non-existing video got bid',
    'Non-existing auction got bid canceled'
  )

  const amount = bidAmount ? new BN(bidAmount.toString()) : (auction.buyNowPrice as BN)

  // prepare bid record
  const bid = new Bid({
    auction,
    bidder: member,
    amount: amount,
    createdAt: new Date(event.blockTimestamp),
    createdInBlock: event.blockNumber,
    isCanceled: false,
  })

  // save bid
  await store.save<Bid>(bid)

  // update last bid in auction
  auction.lastBid = bid

  await store.save<Auction>(auction)

  return { auction, member, video }
}

export async function createNft(
  store: DatabaseManager,
  video: Video,
  nftIssuanceParameters: joystreamTypes.NftIssuanceParameters,
  blockNumber: number
): Promise<OwnedNft> {
  // load owner
  const ownerMember = nftIssuanceParameters.non_channel_owner.isSome
    ? await getExistingEntity(store, Membership, nftIssuanceParameters.non_channel_owner.unwrap().toString())
    : undefined

  // calculate some values
  const creatorRoyalty = nftIssuanceParameters.royalty.isSome
    ? // TODO: this is causing number overload and needs to be divided by magic constant seen in tests
      // ? nftIssuanceParameters.royalty.unwrap().toNumber()
      1
    : undefined
  const decodedMetadata = nftIssuanceParameters.nft_metadata.toString()

  // load creator channel
  const creatorChannel = (await getById(store, Video, video.getId(), ['channel'])).channel

  // Is NFT owned by channel or some member
  const isOwnedByChannel = !ownerMember

  const channel = await getById(store, Channel, creatorChannel.getId(), ['ownerMember', 'ownerCuratorGroup'])

  // prepare nft record
  const nft = new OwnedNft({
    id: video.id.toString(),
    video: video,
    ownerMember: isOwnedByChannel ? channel.ownerMember || undefined : ownerMember,
    creatorRoyalty,
    ownerCuratorGroup: isOwnedByChannel ? channel.ownerCuratorGroup || undefined : undefined,
    isOwnedByChannel,
    metadata: decodedMetadata,
    creatorChannel: creatorChannel,
    // always start with Idle status to prevent egg-chicken problem between auction+nft; update it later if needed
    transactionalStatus: new TransactionalStatusIdle(),
  })

  // save nft
  await store.save<OwnedNft>(nft)

  // update NFT transactional status
  const transactionalStatus = await convertTransactionalStatus(
    nftIssuanceParameters.init_transactional_status,
    store,
    nft,
    blockNumber
  )
  await setNewNftTransactionalStatus(store, nft, transactionalStatus, blockNumber)

  return nft
}

async function createAuction(
  store: DatabaseManager,
  nft: OwnedNft, // expects `nft.ownerMember` to be available
  auctionParams: joystreamTypes.AuctionParams,
  blockNumber: number
): Promise<Auction> {
  const whitelistedMembers = await getRequiredExistingEntites(
    store,
    Membership,
    Array.from(auctionParams.whitelist.values()).map((item) => item.toString()),
    'Non-existing members whitelisted'
  )

  const startsAtBlock = auctionParams.starts_at.isSome ? auctionParams.starts_at.unwrap().toNumber() : blockNumber
  // prepare auction record
  const auction = new Auction({
    nft: nft,
    initialOwner: nft.ownerMember,
    startingPrice: auctionParams.starting_price,
    buyNowPrice: new BN(auctionParams.buy_now_price.toString()),
    auctionType: createAuctionType(auctionParams.auction_type),
    minimalBidStep: auctionParams.minimal_bid_step,
    startsAtBlock,
    plannedEndAtBlock: auctionParams.auction_type.isEnglish
      ? startsAtBlock + auctionParams.auction_type.asEnglish.auction_duration.toNumber()
      : undefined,
    isCanceled: false,
    isCompleted: false,
    whitelistedMembers,
  })

  // save auction
  await store.save<Auction>(auction)

  return auction
}

export async function convertTransactionalStatus(
  transactionalStatus: joystreamTypes.InitTransactionalStatus,
  store: DatabaseManager,
  nft: OwnedNft,
  blockNumber: number
): Promise<typeof TransactionalStatus> {
  if (transactionalStatus.isIdle) {
    return new TransactionalStatusIdle()
  }

  if (transactionalStatus.isInitiatedOfferToMember) {
    const status = new TransactionalStatusInitiatedOfferToMember()
    status.memberId = transactionalStatus.asInitiatedOfferToMember[0].toNumber()
    if (transactionalStatus.asInitiatedOfferToMember[1].isSome) {
      status.price = transactionalStatus.asInitiatedOfferToMember[1].unwrap().toBn()
    }

    return status
  }

  if (transactionalStatus.isAuction) {
    const auctionParams = transactionalStatus.asAuction

    // create new auction
    const auction = await createAuction(store, nft, auctionParams, blockNumber)

    const status = new TransactionalStatusAuction()
    status.auctionId = auction.id

    return status
  }

  logger.error('Not implemented TransactionalStatus type', { contentActor: transactionalStatus.toString() })
  throw new Error('Not-implemented TransactionalStatus type used')
}

export async function contentNft_AuctionStarted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [contentActor, videoId, auctionParams] = new Content.AuctionStartedEvent(event).params

  // specific event processing

  // load video
  const video = await getRequiredExistingEntity(
    store,
    Video,
    videoId.toString(),
    `Non-existing video's auction started`,
    ['nft', 'nft.ownerMember']
  )

  // ensure NFT has been issued
  if (!video.nft) {
    return inconsistentState('Non-existing NFT auctioned', video.id.toString())
  }

  const nft = video.nft

  const auction = await createAuction(store, nft, auctionParams, event.blockNumber)

  // update NFT transactional status
  const transactionalStatus = new TransactionalStatusAuction()
  transactionalStatus.auctionId = auction.id
  await setNewNftTransactionalStatus(store, nft, transactionalStatus, event.blockNumber)

  // common event processing - second

  const announcingPeriodStartedEvent = new AuctionStartedEvent({
    ...genericEventFields(event),

    actor: await convertContentActor(store, contentActor),
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

  const [actor, videoId, nftIssuanceParameters] = new Content.NftIssuedEvent(event).params

  // specific event processing

  // load video
  const video = await getRequiredExistingEntity(store, Video, videoId.toString(), 'NFT for non-existing video issed', [
    'channel',
  ])

  // prepare and save nft record
  const nft = await createNft(store, video, nftIssuanceParameters, event.blockNumber)

  // common event processing - second

  const announcingPeriodStartedEvent = new NftIssuedEvent({
    ...genericEventFields(event),

    contentActor: await convertContentActor(store, actor),
    video,
    royalty: nft.creatorRoyalty,
    metadata: nft.metadata,
    newOwner: nft.ownerMember,
  })

  await store.save<NftIssuedEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_AuctionBidMade({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [memberId, videoId, bidAmount, extendsAuction] = new Content.AuctionBidMadeEvent(event).params

  // specific event processing

  // create record for winning bid
  const { member, video } = await createBid(event, store, memberId.toNumber(), videoId.toNumber(), bidAmount.toString())

  // Ensure if planned auction period would be extended
  if (extendsAuction.valueOf() === true) {
    const { auction } = await getCurrentAuctionFromVideo(
      store,
      videoId.toString(),
      'Non-existing video got new bid',
      'Non-existing auction got new bid'
    )

    const englishAuctionExtensionPeriod = (auction.auctionType as AuctionTypeEnglish).extensionPeriod!
    auction.plannedEndAtBlock = auction.plannedEndAtBlock! + englishAuctionExtensionPeriod
    store.save<Auction>(auction)
  }

  // common event processing - second

  const announcingPeriodStartedEvent = new AuctionBidMadeEvent({
    ...genericEventFields(event),

    member,
    video,
    bidAmount,
    extendsAuction: extendsAuction.valueOf(),
  })

  await store.save<AuctionBidMadeEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_AuctionBidCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [memberId, videoId] = new Content.AuctionBidCanceledEvent(event).params

  // specific event processing

  // load video and auction
  const { video, auction } = await getCurrentAuctionFromVideo(
    store,
    videoId.toString(),
    'Non-existing video got bid canceled',
    'Non-existing auction got bid canceled',
    ['lastBid']
  )

  // ensure bid exists
  if (!auction.lastBid) {
    return inconsistentState('Non-existing bid got canceled', auction.id.toString())
  }

  auction.lastBid.isCanceled = true

  // save auction
  await store.save<Bid>(auction.lastBid)

  // unset auction's last bid
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
  const { video, auction } = await getCurrentAuctionFromVideo(
    store,
    videoId.toString(),
    'Non-existing video got bid canceled',
    'Non-existing auction got bid canceled'
  )

  // update NFT's transactional status
  await resetNftTransactionalStatusFromVideo(
    store,
    videoId.toString(),
    `Non-existing NFT's auction canceled`,
    event.blockNumber
  )

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

  // memberId ignored here because it references member that called extrinsic - that can be anyone!
  const [, /* memberId */ videoId] = new Content.EnglishAuctionCompletedEvent(event).params

  // specific event processing

  const { winner, video } = await finishAuction(store, videoId.toNumber(), event.blockNumber)

  // common event processing - second

  const announcingPeriodStartedEvent = new EnglishAuctionCompletedEvent({
    ...genericEventFields(event),

    winner,
    video,
  })

  await store.save<EnglishAuctionCompletedEvent>(announcingPeriodStartedEvent)
}

// called when auction bid's value is higher than buy-now value
export async function contentNft_BidMadeCompletingAuction({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [memberId, videoId] = new Content.BidMadeCompletingAuctionEvent(event).params

  // specific event processing

  // create record for winning bid
  await createBid(event, store, memberId.toNumber(), videoId.toNumber())

  // winish auction and transfer ownership
  const { winner: member, video } = await finishAuction(store, videoId.toNumber(), event.blockNumber)

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

  const { video } = await finishAuction(store, videoId.toNumber(), event.blockNumber)

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

  // update NFT transactional status
  const transactionalStatus = new TransactionalStatusInitiatedOfferToMember()
  transactionalStatus.memberId = memberId.toNumber()
  transactionalStatus.price = price.unwrapOr(undefined)
  await setNewNftTransactionalStatus(store, nft, transactionalStatus, event.blockNumber)

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

  // update NFT's transactional status
  await resetNftTransactionalStatusFromVideo(
    store,
    videoId.toString(),
    `Non-existing NFT's offer accepted`,
    event.blockNumber,
    member
  )

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

  // load video
  const video = await getRequiredExistingEntity(
    store,
    Video,
    videoId.toString(),
    'Non-existing video sell offer was canceled'
  )

  // update NFT's transactional status
  await resetNftTransactionalStatusFromVideo(
    store,
    videoId.toString(),
    `Non-existing NFT's offer canceled`,
    event.blockNumber
  )

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

  const [videoId, contentActor, price] = new Content.NftSellOrderMadeEvent(event).params

  // specific event processing

  // load NFT
  const { video, nft } = await getNftFromVideo(
    store,
    videoId.toString(),
    'Non-existing video was offered',
    'Non-existing nft was offered'
  )

  // update NFT transactional status
  const transactionalStatus = new TransactionalStatusBuyNow()
  transactionalStatus.price = new BN(price.toString())
  await setNewNftTransactionalStatus(store, nft, transactionalStatus, event.blockNumber)

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

  const [videoId, memberId] = new Content.NftBoughtEvent(event).params

  // specific event processing

  // load video
  const video = await getRequiredExistingEntity(store, Video, videoId.toString(), 'Non-existing video was bought')

  // read member
  const winner = new Membership({ id: memberId.toString() })

  // update NFT's transactional status
  await resetNftTransactionalStatusFromVideo(
    store,
    videoId.toString(),
    `Non-existing NFT's auction completed`,
    event.blockNumber,
    winner
  )

  // common event processing - second

  const announcingPeriodStartedEvent = new NftBoughtEvent({
    ...genericEventFields(event),

    video,
    member: winner,
  })

  await store.save<NftBoughtEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_BuyNowCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId, contentActor] = new Content.BuyNowCanceledEvent(event).params

  // specific event processing

  // load video
  const video = await getRequiredExistingEntity(
    store,
    Video,
    videoId.toString(),
    'Non-existing video buy-now was canceled'
  )

  await resetNftTransactionalStatusFromVideo(
    store,
    videoId.toString(),
    `Non-existing NFT's buy-now canceled`,
    event.blockNumber
  )

  // common event processing - second

  const announcingPeriodStartedEvent = new BuyNowCanceledEvent({
    ...genericEventFields(event),

    video,
    contentActor: await convertContentActor(store, contentActor),
  })

  await store.save<BuyNowCanceledEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_NftSlingedBackToTheOriginalArtist({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId, ownerId] = new Content.NftBoughtEvent(event).params

  // load NFT
  const { video, nft } = await getNftFromVideo(
    store,
    videoId.toString(),
    'Non-existing video was slinged',
    'Non-existing nft was slinged'
  )

  // load channel
  const channel = (await getById(store, Video, video.getId(), ['channel'])).channel

  // load channel ownerCuratorGroup (if any)
  const ownerCuratorGroup = (await getById(store, Channel, channel.getId(), ['ownerCuratorGroup'])).ownerCuratorGroup

  nft.ownerMember = undefined
  nft.ownerCuratorGroup = ownerCuratorGroup
  nft.isOwnedByChannel = true
  nft.updatedAt = new Date(event.blockTimestamp)

  store.save<OwnedNft>(nft)

  // common event processing - second

  const nftSlingedBackToTheOriginalArtistEvent = new NftSlingedBackToTheOriginalArtistEvent({
    ...genericEventFields(event),

    video,
    owner: new Membership({ id: ownerId.toString() }),
  })

  await store.save<NftSlingedBackToTheOriginalArtistEvent>(nftSlingedBackToTheOriginalArtistEvent)
}
