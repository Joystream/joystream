// TODO: solve events' relations to videos and other entites that can be changed or deleted

import { DatabaseManager, EventContext, StoreContext, SubstrateEvent } from '@joystream/hydra-common'
import { genericEventFields, inconsistentState, logger, EntityType } from '../common'
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

  // events
  OpenAuctionStartedEvent,
  EnglishAuctionStartedEvent,
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
  BuyNowPriceUpdatedEvent,
  NftSlingedBackToTheOriginalArtistEvent,
} from 'query-node/dist/model'
import * as joystreamTypes from '@joystream/types/augment/all/types'
import { Content } from '../../generated/types'
import { FindConditions } from 'typeorm'
import BN from 'bn.js'
import { PERBILL_ONE_PERCENT } from '../temporaryConstants'
import { convertContentActorToChannelOrNftOwner } from './utils'

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
  errorMessageForNft: string,
  errorMessageForAuction: string,
  relations: string[] = []
): Promise<{ video: Video; auction: Auction; nft: OwnedNft }> {
  // load video
  const video = await getRequiredExistingEntity(store, Video, videoId.toString(), errorMessageForVideo, [
    'nft',
    'nft.auctions',
    ...relations.map((item) => `nft.auctions.${item}`),
  ])

  const nft = video.nft

  if (!nft) {
    return inconsistentState(errorMessageForNft, videoId)
  }

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
    nft,
  }
}

async function getNftFromVideo(
  store: DatabaseManager,
  videoId: string,
  errorMessageForVideo: string,
  errorMessageForNft: string,
  relations?: string[]
): Promise<{ video: Video; nft: OwnedNft }> {
  // load video
  const video = await getRequiredExistingEntity(
    store,
    Video,
    videoId.toString(),
    errorMessageForVideo,
    relations ? relations.concat(['nft']) : ['nft']
  )

  // get nft
  const nft = video.nft

  // ensure nft exists
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
  const nft = await store.get(OwnedNft, {
    where: { id: videoId.toString() } as FindConditions<OwnedNft>,
    relations: ['ownerMember', 'ownerCuratorGroup'],
  })

  // ensure NFT
  if (!nft) {
    return inconsistentState(errorMessage, videoId.toString())
  }

  if (newOwner) {
    nft.ownerMember = newOwner
    nft.ownerCuratorGroup = undefined
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

interface IOpenAuctionWinner {
  bidAmount: BN
  winnerId: number
}

async function finishAuction(
  store: DatabaseManager,
  videoId: number,
  blockNumber: number,
  openAuctionWinner?: IOpenAuctionWinner
) {
  function findOpenAuctionWinningBid(bids: Bid[], bidAmount: BN, winnerId: number, videoId: number): Bid {
    const winningBid = bids.find(
      (bid) => !bid.isCanceled && bid.bidder.id.toString() === winnerId.toString() && bid.amount.eq(bidAmount)
    )

    if (!winningBid) {
      return inconsistentState('Open auction won by non-existing bid', { videoId, bidAmount, winnerId })
    }

    return winningBid
  }

  // load video and auction
  const { video, auction } = await getCurrentAuctionFromVideo(
    store,
    videoId.toString(),
    `Non-existing video's auction was completed`,
    `Non-existing NFT's auction was completed`,
    'Non-existing auction was completed',
    ['topBid', 'topBid.bidder', 'bids', 'bids.bidder']
  )

  const winningBid = openAuctionWinner
    ? findOpenAuctionWinningBid(auction.bids || [], openAuctionWinner.bidAmount, openAuctionWinner.winnerId, videoId)
    : (auction.topBid as Bid)

  // load winner member
  const winnerMemberId = winningBid.bidder.id
  // load bid amount for which NFT is bought
  const boughtPrice = winningBid.amount
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

  return { video, winner, boughtPrice }
}

async function createBid(
  event: SubstrateEvent,
  store: DatabaseManager,
  memberId: number,
  videoId: number,
  bidAmount?: string
): Promise<{
  auction: Auction
  member: Membership
  video: Video
  nft: OwnedNft
  previousTopBid?: Bid
}> {
  // load member
  const member = await getRequiredExistingEntity(
    store,
    Membership,
    memberId.toString(),
    'Non-existing member bid in auction'
  )

  // load video and auction
  const { video, auction, nft } = await getCurrentAuctionFromVideo(
    store,
    videoId.toString(),
    'Non-existing video got bid',
    'Non-existing NFT got bid',
    'Non-existing auction got bid canceled',
    ['topBid', 'bids', 'bids.bidder']
  )

  // cancel any previous bids done by same member
  const cancelledBidsIds: string[] = []
  for (const bid of auction.bids || []) {
    if (!bid.isCanceled && bid.bidder.id.toString() === memberId.toString()) {
      bid.isCanceled = true
      cancelledBidsIds.push(bid.id)

      await store.save<Bid>(bid)
    }
  }

  const amount = bidAmount ? new BN(bidAmount.toString()) : (auction.buyNowPrice as BN)
  const previousTopBid = auction.topBid

  // prepare bid record
  const bid = new Bid({
    auction,
    bidder: member,
    amount: amount,
    createdAt: new Date(event.blockTimestamp),
    createdInBlock: event.blockNumber,
    indexInBlock: event.indexInBlock,
    isCanceled: false,
  })

  // if the auction has no top bid or the new bid is higher, use the new bid
  if (!auction.topBid || auction.topBid.amount.lt(bid.amount)) {
    bid.auctionTopBid = auction
  } else if (cancelledBidsIds.includes(auction.topBid.id)) {
    // current top bid got cancelled, need to update it
    const bidsList = [...(auction.bids || []), bid]
    const newTopBid = findTopBid(bidsList)
    if (newTopBid) {
      newTopBid.auctionTopBid = auction
      await store.save<Bid>(newTopBid)
    }
  }

  await store.save<Bid>(bid)

  return { auction, member, video, nft, previousTopBid }
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
    : video.channel.ownerMember

  // calculate some values
  const creatorRoyalty = nftIssuanceParameters.royalty.isSome
    ? nftIssuanceParameters.royalty.unwrap().div(new BN(PERBILL_ONE_PERCENT)).toNumber()
    : undefined
  const decodedMetadata = nftIssuanceParameters.nft_metadata.toString()

  // Is NFT owned by channel or some member
  const isOwnedByChannel = !ownerMember

  // channel ownerCuratorGroup (if any)
  const ownerCuratorGroup = isOwnedByChannel ? video.channel.ownerCuratorGroup : undefined

  // prepare nft record
  const nft = new OwnedNft({
    id: video.id.toString(),
    video: video,
    ownerMember,
    creatorRoyalty,
    ownerCuratorGroup,
    isOwnedByChannel,
    metadata: decodedMetadata,
    creatorChannel: video.channel,
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

function findTopBid(bids: Bid[]): Bid | undefined {
  return bids.reduce((topBid, bid) => {
    if (bid.isCanceled) {
      return topBid
    }

    if (!topBid) {
      return bid
    }

    if (topBid.amount.gt(bid.amount)) {
      return topBid
    }
    if (topBid.amount.lt(bid.amount)) {
      return bid
    }
    // bids are equal, use the oldest one
    return topBid.createdInBlock < bid.createdInBlock ||
      (topBid.createdInBlock === bid.createdInBlock && topBid.indexInBlock < bid.indexInBlock)
      ? topBid
      : bid
  }, undefined as Bid | undefined)
}

async function createAuction(
  store: DatabaseManager,
  nft: OwnedNft, // expects `nft.ownerMember` to be available
  auctionParams: joystreamTypes.OpenAuctionParams | joystreamTypes.EnglishAuctionParams,
  startsAtBlockNumber: number
): Promise<Auction> {
  const whitelistedMembers = await getRequiredExistingEntites(
    store,
    Membership,
    Array.from(auctionParams.whitelist.values()).map((item) => item.toString()),
    'Non-existing members whitelisted'
  )

  // prepare auction record
  const auction = new Auction({
    nft: nft,
    initialOwner: nft.ownerMember,
    startingPrice: new BN(auctionParams.starting_price.toString()),
    buyNowPrice: new BN(auctionParams.buy_now_price.toString()),
    auctionType: createAuctionType(auctionParams, startsAtBlockNumber),
    startsAtBlock: startsAtBlockNumber,
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

  if (transactionalStatus.isOpenAuction || transactionalStatus.isEnglishAuction) {
    const auctionParams = transactionalStatus.isOpenAuction
      ? transactionalStatus.asOpenAuction
      : transactionalStatus.asEnglishAuction

    // create new auction
    const auctionStart = auctionParams.starts_at.isSome ? auctionParams.starts_at.unwrap().toNumber() : blockNumber
    const auction = await createAuction(store, nft, auctionParams, auctionStart)

    const status = new TransactionalStatusAuction()
    status.auctionId = auction.id

    return status
  }

  if (transactionalStatus.isBuyNow) {
    const status = new TransactionalStatusBuyNow()
    status.price = new BN(transactionalStatus.asBuyNow.toString())

    return status
  }

  logger.error('Not implemented TransactionalStatus type', { contentActor: transactionalStatus.toString() })
  throw new Error('Not-implemented TransactionalStatus type used')
}

export async function contentNft_OpenAuctionStarted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [contentActor, videoId, auctionParams] = new Content.OpenAuctionStartedEvent(event).params

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

  // create auction
  const auctionStart = auctionParams.starts_at.isSome ? auctionParams.starts_at.unwrap().toNumber() : event.blockNumber
  const auction = await createAuction(store, nft, auctionParams, auctionStart)

  // update NFT transactional status
  const transactionalStatus = new TransactionalStatusAuction()
  transactionalStatus.auctionId = auction.id
  await setNewNftTransactionalStatus(store, nft, transactionalStatus, event.blockNumber)

  // common event processing - second

  const announcingPeriodStartedEvent = new OpenAuctionStartedEvent({
    ...genericEventFields(event),

    actor: await convertContentActor(store, contentActor),
    video,
    auction,
    // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
  })

  await store.save<OpenAuctionStartedEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_EnglishAuctionStarted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [contentActor, videoId, auctionParams] = new Content.EnglishAuctionStartedEvent(event).params

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

  // create new auction
  const auctionStart = auctionParams.starts_at.isSome ? auctionParams.starts_at.unwrap().toNumber() : event.blockNumber
  const auction = await createAuction(store, nft, auctionParams, auctionStart)

  // update NFT transactional status
  const transactionalStatus = new TransactionalStatusAuction()
  transactionalStatus.auctionId = auction.id
  await setNewNftTransactionalStatus(store, nft, transactionalStatus, event.blockNumber)

  // common event processing - second

  const announcingPeriodStartedEvent = new EnglishAuctionStartedEvent({
    ...genericEventFields(event),

    actor: await convertContentActor(store, contentActor),
    video,
    auction,
    // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
  })

  await store.save<EnglishAuctionStartedEvent>(announcingPeriodStartedEvent)
}

// create auction type variant from raw runtime auction type
function createAuctionType(
  auctionParams: joystreamTypes.OpenAuctionParams | joystreamTypes.EnglishAuctionParams,
  startsAtBlockNumber: number
): typeof AuctionType {
  function isEnglishAuction(
    auction: joystreamTypes.OpenAuctionParams | joystreamTypes.EnglishAuctionParams
  ): auction is joystreamTypes.EnglishAuctionParams {
    return !!(auction as any).duration
  }

  // auction type `english`
  if (isEnglishAuction(auctionParams)) {
    // prepare auction variant
    const auctionType = new AuctionTypeEnglish()
    auctionType.duration = auctionParams.duration.toNumber()
    auctionType.extensionPeriod = auctionParams.extension_period.toNumber()
    auctionType.minimalBidStep = new BN(auctionParams.min_bid_step.toString())
    auctionType.plannedEndAtBlock = startsAtBlockNumber + auctionParams.duration.toNumber()

    return auctionType
  }

  // auction type `open`

  // prepare auction variant
  const auctionType = new AuctionTypeOpen()
  auctionType.bidLockDuration = auctionParams.bid_lock_duration.toNumber()
  return auctionType
}

export async function contentNft_NftIssued({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [actor, videoId, nftIssuanceParameters] = new Content.NftIssuedEvent(event).params

  // specific event processing

  // load video
  const video = await getRequiredExistingEntity(store, Video, videoId.toString(), 'NFT for non-existing video issed', [
    'channel',
    'channel.ownerCuratorGroup',
    'channel.ownerMember',
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
    // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, actor)),
  })

  await store.save<NftIssuedEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_AuctionBidMade({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [memberId, videoId, bidAmount] = new Content.AuctionBidMadeEvent(event).params

  // specific event processing

  // create record for winning bid
  const { auction, member, video, nft, previousTopBid } = await createBid(
    event,
    store,
    memberId.toNumber(),
    videoId.toNumber(),
    bidAmount.toString()
  )

  // extend auction duration when needed
  if (
    auction.auctionType instanceof AuctionTypeEnglish &&
    auction.auctionType.plannedEndAtBlock - auction.auctionType.extensionPeriod < event.blockNumber
  ) {
    auction.auctionType.plannedEndAtBlock = auction.auctionType.extensionPeriod
    store.save<Auction>(auction)
  }

  // common event processing - second

  const announcingPeriodStartedEvent = new AuctionBidMadeEvent({
    ...genericEventFields(event),

    member,
    video,
    bidAmount,
    ownerMember: nft.ownerMember,
    ownerCuratorGroup: nft.ownerCuratorGroup,
    previousTopBid,
  })

  await store.save<AuctionBidMadeEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_AuctionBidCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [memberId, videoId] = new Content.AuctionBidCanceledEvent(event).params

  // specific event processing

  // load video and auction
  const { video, auction, nft } = await getCurrentAuctionFromVideo(
    store,
    videoId.toString(),
    'Non-existing video got bid canceled',
    'Non-existing NFT got bid canceled',
    'Non-existing auction got bid canceled',
    ['topBid', 'bids', 'bids.bidder']
  )

  // retrieve relevant bid
  const bid = (auction.bids || []).find((bid) => !bid.isCanceled && bid.bidder.id.toString() === memberId.toString())

  // ensure bid exists
  if (!bid) {
    return inconsistentState('Non-existing bid got canceled', { auction: auction.id.toString(), memberId })
  }

  bid.isCanceled = true

  // save bid
  await store.save<Bid>(bid)

  if (auction.topBid && bid.id.toString() === auction.topBid.id.toString()) {
    // find new top bid
    auction.topBid = findTopBid(auction.bids || [])

    // save auction
    await store.save<Auction>(auction)
  }

  // common event processing - second

  const announcingPeriodStartedEvent = new AuctionBidCanceledEvent({
    ...genericEventFields(event),

    member: new Membership({ id: memberId.toString() }),
    video,
    ownerMember: nft.ownerMember,
    ownerCuratorGroup: nft.ownerCuratorGroup,
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
    'Non-existing NFT got bid canceled',
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
    // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
  })

  await store.save<AuctionCanceledEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_EnglishAuctionCompleted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  // memberId ignored here because it references member that called extrinsic - that can be anyone!
  const [, /* memberId */ videoId] = new Content.EnglishAuctionCompletedEvent(event).params

  // specific event processing

  // load NFT
  const { nft } = await getNftFromVideo(
    store,
    videoId.toString(),
    'Non-existing video sell offer was accepted',
    'Non-existing nft sell offer was accepted',
    ['nft.ownerMember', 'nft.ownerCuratorGroup']
  )
  const { winner, video } = await finishAuction(store, videoId.toNumber(), event.blockNumber)

  // common event processing - second

  const announcingPeriodStartedEvent = new EnglishAuctionCompletedEvent({
    ...genericEventFields(event),

    winner,
    video,
    ownerMember: nft.ownerMember,
    ownerCuratorGroup: nft.ownerCuratorGroup,
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
  const { nft, previousTopBid } = await createBid(event, store, memberId.toNumber(), videoId.toNumber())

  // finish auction and transfer ownership
  const { winner: member, video, boughtPrice: price } = await finishAuction(
    store,
    videoId.toNumber(),
    event.blockNumber
  )

  // common event processing - second

  const announcingPeriodStartedEvent = new BidMadeCompletingAuctionEvent({
    ...genericEventFields(event),

    member,
    video,
    ownerMember: nft.ownerMember,
    ownerCuratorGroup: nft.ownerCuratorGroup,
    price,
    previousTopBid,
  })

  await store.save<BidMadeCompletingAuctionEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_OpenAuctionBidAccepted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [contentActor, videoId, winnerId, bidAmount] = new Content.OpenAuctionBidAcceptedEvent(event).params

  // specific event processing

  const { video } = await finishAuction(store, videoId.toNumber(), event.blockNumber, {
    bidAmount,
    winnerId: winnerId.toNumber(),
  })

  // common event processing - second

  const announcingPeriodStartedEvent = new OpenAuctionBidAcceptedEvent({
    ...genericEventFields(event),

    contentActor: await convertContentActor(store, contentActor),
    video,
    // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
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
    // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
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
    'Non-existing nft sell offer was accepted',
    ['nft.ownerMember', 'nft.ownerCuratorGroup']
  )

  // read member from offer
  const memberId = (nft.transactionalStatus as TransactionalStatusInitiatedOfferToMember).memberId
  // read price from offer
  const price = (nft.transactionalStatus as TransactionalStatusInitiatedOfferToMember).price
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
    ownerMember: nft.ownerMember,
    ownerCuratorGroup: nft.ownerCuratorGroup,
    price,
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
    // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
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
    // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
  })

  await store.save<NftSellOrderMadeEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_NftBought({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId, memberId] = new Content.NftBoughtEvent(event).params

  // specific event processing

  // load video
  const { video, nft } = await getNftFromVideo(
    store,
    videoId.toString(),
    'Non-existing video was bought',
    'Non-existing NFT was bought',
    ['nft.ownerMember', 'nft.ownerCuratorGroup']
  )

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
    ownerMember: nft.ownerMember,
    ownerCuratorGroup: nft.ownerCuratorGroup,
    price: (nft.transactionalStatus as TransactionalStatusBuyNow).price,
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
    // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
  })

  await store.save<BuyNowCanceledEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_BuyNowPriceUpdated({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId, contentActor, newPrice] = new Content.BuyNowPriceUpdatedEvent(event).params

  // specific event processing

  const { nft, video } = await getNftFromVideo(
    store,
    videoId.toString(),
    'Non-existing video sell offer was accepted',
    'Non-existing nft sell offer was accepted'
  )

  const newTransactionalStatus = new TransactionalStatusBuyNow()
  newTransactionalStatus.price = new BN(newPrice.toString()) // this "typecast" is needed to prevent error

  await setNewNftTransactionalStatus(store, nft, newTransactionalStatus, event.blockNumber)

  // common event processing - second

  const announcingPeriodStartedEvent = new BuyNowPriceUpdatedEvent({
    ...genericEventFields(event),

    video,
    contentActor: await convertContentActor(store, contentActor),
    newPrice: newPrice,
    ownerMember: nft.ownerMember,
    ownerCuratorGroup: nft.ownerCuratorGroup,
  })

  await store.save<BuyNowCanceledEvent>(announcingPeriodStartedEvent)
}

export async function contentNft_NftSlingedBackToTheOriginalArtist({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId, contentActor] = new Content.NftSlingedBackToTheOriginalArtistEvent(event).params

  // load NFT
  const { video, nft } = await getNftFromVideo(
    store,
    videoId.toString(),
    'Non-existing video was slinged',
    'Non-existing nft was slinged',
    ['channel', 'channel.ownerCuratorGroup', 'channel.ownerMember']
  )

  nft.ownerMember = video.channel?.ownerMember
  nft.ownerCuratorGroup = video.channel?.ownerCuratorGroup
  nft.isOwnedByChannel = true
  nft.updatedAt = new Date(event.blockTimestamp)

  store.save<OwnedNft>(nft)

  // common event processing - second

  const nftSlingedBackToTheOriginalArtistEvent = new NftSlingedBackToTheOriginalArtistEvent({
    ...genericEventFields(event),
    video,
    contentActor: await convertContentActor(store, contentActor),
    ownerMember: nft.ownerMember,
    ownerCuratorGroup: nft.ownerCuratorGroup,
  })

  await store.save<NftSlingedBackToTheOriginalArtistEvent>(nftSlingedBackToTheOriginalArtistEvent)
}
