// TODO: solve events' relations to videos and other entites that can be changed or deleted

import { DatabaseManager, EventContext, StoreContext, SubstrateEvent } from '@joystream/hydra-common'
import {
  PalletContentNftTypesEnglishAuctionParamsRecord as EnglishAuctionParams,
  PalletContentNftTypesInitTransactionalStatusRecord as InitTransactionalStatus,
  PalletContentNftTypesNftIssuanceParametersRecord as NftIssuanceParameters,
  PalletContentNftTypesOpenAuctionParamsRecord as OpenAuctionParams,
} from '@polkadot/types/lookup'
import BN from 'bn.js'
import _ from 'lodash'
import {
  // entities
  Auction,
  AuctionBidCanceledEvent,
  AuctionBidMadeEvent,
  AuctionCanceledEvent,
  AuctionType,
  AuctionTypeEnglish,
  AuctionTypeOpen,
  Bid,
  BidMadeCompletingAuctionEvent,
  BuyNowCanceledEvent,
  BuyNowPriceUpdatedEvent,
  EnglishAuctionSettledEvent,
  EnglishAuctionStartedEvent,
  Membership,
  NftBoughtEvent,
  NftIssuedEvent,
  NftSellOrderMadeEvent,
  NftSlingedBackToTheOriginalArtistEvent,
  OfferAcceptedEvent,
  OfferCanceledEvent,
  OfferStartedEvent,
  OpenAuctionBidAcceptedEvent,
  // events
  OpenAuctionStartedEvent,
  OwnedNft,
  TransactionalStatus,
  TransactionalStatusBuyNow,
  TransactionalStatusIdle,
  TransactionalStatusInitiatedOfferToMember,
  TransactionalStatusUpdate,
  Video,
} from 'query-node/dist/model'
import {
  Content_AuctionBidCanceledEvent_V1001 as AuctionBidCanceledEvent_V1001,
  Content_AuctionBidMadeEvent_V1001 as AuctionBidMadeEvent_V1001,
  Content_AuctionCanceledEvent_V1001 as AuctionCanceledEvent_V1001,
  Content_BidMadeCompletingAuctionEvent_V1001 as BidMadeCompletingAuctionEvent_V1001,
  Content_BuyNowCanceledEvent_V1001 as BuyNowCanceledEvent_V1001,
  Content_BuyNowPriceUpdatedEvent_V1001 as BuyNowPriceUpdatedEvent_V1001,
  Content_EnglishAuctionSettledEvent_V1001 as EnglishAuctionSettledEvent_V1001,
  Content_EnglishAuctionStartedEvent_V1001 as EnglishAuctionStartedEvent_V1001,
  Content_NftBoughtEvent_V1001 as NftBoughtEvent_V1001,
  Content_NftIssuedEvent_V1001 as NftIssuedEvent_V1001,
  Content_NftSellOrderMadeEvent_V1001 as NftSellOrderMadeEvent_V1001,
  Content_NftSlingedBackToTheOriginalArtistEvent_V1001 as NftSlingedBackToTheOriginalArtistEvent_V1001,
  Content_OfferAcceptedEvent_V1001 as OfferAcceptedEvent_V1001,
  Content_OfferCanceledEvent_V1001 as OfferCanceledEvent_V1001,
  Content_OfferStartedEvent_V1001 as OfferStartedEvent_V1001,
  Content_OpenAuctionBidAcceptedEvent_V1001 as OpenAuctionBidAcceptedEvent_V1001,
  Content_OpenAuctionStartedEvent_V1001 as OpenAuctionStartedEvent_V1001,
} from '../../generated/types'
import {
  RelationsArr,
  genericEventFields,
  getById,
  getByIdOrFail,
  getManyBy,
  getOneByOrFail,
  inconsistentState,
  unimplementedError,
} from '../common'
import { getAllManagers } from '../derivedPropertiesManager/applications'
import { PERBILL_ONE_PERCENT } from '../temporaryConstants'
import { convertContentActor, convertContentActorToChannelOrNftOwner } from './utils'

async function getCurrentAuctionFromVideo(
  store: DatabaseManager,
  videoId: string,
  nftRelations: string[] = [],
  auctionRelations: string[] = [],
  errorMessageForAuction = 'Auction not found'
): Promise<{ video: Video; auction: Auction; nft: OwnedNft }> {
  // load nft
  const nft = await getByIdOrFail(store, OwnedNft, videoId.toString(), [
    'video',
    'transactionalStatusAuction',
    'auctions',
    ...nftRelations,
    ...auctionRelations.map((item) => `auctions.${item}`),
  ] as RelationsArr<OwnedNft>)

  // get auction
  const allAuctions = nft?.auctions || []
  const auction = allAuctions.length
    ? allAuctions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[allAuctions.length - 1]
    : null

  // ensure current auction exists
  if (!auction || auction.id !== nft.transactionalStatusAuction?.id) {
    return inconsistentState(errorMessageForAuction, videoId)
  }

  return {
    video: nft.video,
    auction,
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
  const nft = await getByIdOrFail(store, OwnedNft, videoId, ['ownerMember', 'ownerCuratorGroup', 'creatorChannel'])

  if (newOwner) {
    nft.ownerMember = newOwner
    nft.ownerCuratorGroup = undefined
    nft.isOwnedByChannel = false
  }

  // reset transactional status
  const transactionalStatus = new TransactionalStatusIdle()
  await setNewNftTransactionalStatus(store, nft, transactionalStatus, blockNumber)

  return { nft }
}

async function setNewNftTransactionalStatus(
  store: DatabaseManager,
  nft: OwnedNft,
  transactionalStatusOrTransactionalStatusAuction: typeof TransactionalStatus | Auction,
  blockNumber: number
) {
  let transactionalStatus: typeof TransactionalStatus | undefined
  let transactionalStatusAuction: Auction | undefined
  if (transactionalStatusOrTransactionalStatusAuction instanceof Auction) {
    transactionalStatusAuction = transactionalStatusOrTransactionalStatusAuction
  } else {
    transactionalStatus = transactionalStatusOrTransactionalStatusAuction
  }

  // FIXME: https://github.com/Joystream/hydra/issues/435

  // update transactionalStatus
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  nft.transactionalStatus = transactionalStatus || null
  // update transactionStatusAuction
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  nft.transactionalStatusAuction = transactionalStatusAuction || null

  await getAllManagers(store).videoNfts.onMainEntityUpdate(nft)

  // save NFT
  await store.save<OwnedNft>(nft)

  // create transactional status update record
  const transactionalStatusUpdate = new TransactionalStatusUpdate({
    nft,
    transactionalStatusAuction,
    transactionalStatus,
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
      (bid) => !bid.isCanceled && bid.bidder.id === winnerId.toString() && bid.amount.eq(bidAmount)
    )

    if (!winningBid) {
      return inconsistentState('Open auction won by non-existing bid', { videoId, bidAmount, winnerId })
    }

    return winningBid
  }

  // load video and auction
  const {
    video,
    auction,
    nft: { ownerMember: previousOwnerMember, ownerCuratorGroup: previousOwnerCuratorGroup },
  } = await getCurrentAuctionFromVideo(
    store,
    videoId.toString(),
    ['ownerMember', 'ownerCuratorGroup'],
    ['topBid', 'topBid.bidder', 'bids', 'bids.bidder'],
    'Non-existing auction was completed'
  )

  const winningBid = openAuctionWinner
    ? findOpenAuctionWinningBid(auction.bids || [], openAuctionWinner.bidAmount, openAuctionWinner.winnerId, videoId)
    : (auction.topBid as Bid)

  // load all unique bidders of auction
  const bidders = (_.uniqBy(auction.bids, (b) => b.bidder.id) || []).map((bid) => bid.bidder)

  // update NFT's transactional status
  const { nft } = await resetNftTransactionalStatusFromVideo(
    store,
    videoId.toString(),
    `Non-existing NFT's auction completed`,
    blockNumber,
    winningBid.bidder
  )

  // update auction
  auction.isCompleted = true
  auction.winningMember = winningBid.bidder
  auction.endedAtBlock = blockNumber

  // save auction
  await store.save<Auction>(auction)

  return { video, nft, winningBid, bidders, previousOwnerMember, previousOwnerCuratorGroup }
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
  const member = await getByIdOrFail(store, Membership, memberId.toString())

  // load video and auction
  const { video, auction, nft } = await getCurrentAuctionFromVideo(
    store,
    videoId.toString(),
    ['ownerMember', 'ownerCuratorGroup'],
    ['topBid', 'bids', 'bids.bidder'],
    'Non-existing auction got bid canceled'
  )

  const memberPreviousUncanceledBids = await store.getMany(Bid, {
    where: { bidder: { id: memberId.toString() }, nft: { id: videoId.toString() }, isCanceled: false },
  })

  // cancel any previous bids done by same member
  const cancelledBidsIds: string[] = []
  for (const bid of memberPreviousUncanceledBids || []) {
    bid.isCanceled = true
    cancelledBidsIds.push(bid.id)

    await store.save<Bid>(bid)
  }
  auction.bids?.forEach((b) => {
    if (cancelledBidsIds.includes(b.id)) b.isCanceled = true
  })

  const amount = bidAmount ? new BN(bidAmount.toString()) : (auction.buyNowPrice as BN)
  const previousTopBid = auction.topBid

  // prepare bid record
  const newBid = new Bid({
    auction,
    nft,
    bidder: member,
    amount: amount,
    createdInBlock: event.blockNumber,
    indexInBlock: event.indexInBlock,
    isCanceled: false,
  })
  auction.bids ? auction.bids.push(newBid) : (auction.bids = [newBid])

  // check if the auction's top bid needs to be updated, this can happen in those cases:
  // 1. auction doesn't have the top bid at the moment, new bid should be new top bid
  // 2. new bid is higher than the current top bid
  // 3. new bid canceled previous top bid (user changed their bid to a lower one), so we need to find a new one

  if (!auction.topBid || newBid.amount.gt(auction.topBid.amount)) {
    // handle cases 1 and 2
    newBid.auctionTopBid = auction
    auction.topBid = newBid
  } else if (cancelledBidsIds.includes(auction.topBid.id)) {
    // handle case 3
    const newTopBid = findTopBid(auction.bids)
    if (newTopBid) {
      if (newTopBid.id !== newBid.id) {
        // only save newTopBid if it's not the newBid, otherwise store.save(newBid) below will overwrite it
        newTopBid.auctionTopBid = auction
        auction.topBid = newTopBid
        await store.save<Bid>(newTopBid)
      } else {
        newBid.auctionTopBid = auction
        auction.topBid = newBid
      }
    }
  }

  await store.save<Bid>(newBid)

  return { auction, member, video, nft, previousTopBid }
}

export async function createNft(
  store: DatabaseManager,
  video: Video,
  nftIssuanceParameters: NftIssuanceParameters,
  blockNumber: number
): Promise<OwnedNft> {
  // load owner
  const ownerMember = nftIssuanceParameters.nonChannelOwner.isSome
    ? await getById(store, Membership, nftIssuanceParameters.nonChannelOwner.unwrap().toString())
    : video.channel.ownerMember

  // calculate some values
  const creatorRoyalty = nftIssuanceParameters.royalty.isSome
    ? nftIssuanceParameters.royalty.unwrap().div(new BN(PERBILL_ONE_PERCENT)).toNumber()
    : undefined
  const decodedMetadata = nftIssuanceParameters.nftMetadata.toString()

  // Newly minted NFT is always owned by a channel unless nonChannelOwner was set
  const isOwnedByChannel = !nftIssuanceParameters.nonChannelOwner.isSome

  // channel ownerCuratorGroup (if any)
  const ownerCuratorGroup = isOwnedByChannel ? video.channel.ownerCuratorGroup : undefined

  // prepare nft record
  const nft = new OwnedNft({
    id: video.id.toString(),
    video,
    videoCategory: video.category,
    ownerMember,
    creatorRoyalty,
    ownerCuratorGroup,
    isOwnedByChannel,
    metadata: decodedMetadata,
    creatorChannel: video.channel,
    // always start with Idle status to prevent egg-chicken problem between auction+nft; update it later if needed
    transactionalStatus: new TransactionalStatusIdle(),
  })

  await getAllManagers(store).videoNfts.onMainEntityCreation(nft)

  // save nft
  await store.save<OwnedNft>(nft)

  // update NFT transactional status
  const transactionalStatus = await convertTransactionalStatus(
    nftIssuanceParameters.initTransactionalStatus,
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
  auctionParams: OpenAuctionParams | EnglishAuctionParams,
  startsAtBlockNumber: number
): Promise<Auction> {
  const whitelistedMembers = await getManyBy(
    store,
    Membership,
    [...auctionParams.whitelist].map((id) => id.toString())
  )

  // prepare auction record
  const auction = new Auction({
    nft: nft,
    initialOwner: nft.ownerMember,
    startingPrice: new BN(auctionParams.startingPrice.toString()),
    buyNowPrice: new BN(auctionParams.buyNowPrice.toString()),
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
  transactionalStatus: InitTransactionalStatus,
  store: DatabaseManager,
  nft: OwnedNft,
  blockNumber: number
): Promise<typeof TransactionalStatus | Auction> {
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
    const auctionStart = auctionParams.startsAt.isSome ? auctionParams.startsAt.unwrap().toNumber() : blockNumber
    const auction = await createAuction(store, nft, auctionParams, auctionStart)

    return auction
  }

  if (transactionalStatus.isBuyNow) {
    const status = new TransactionalStatusBuyNow()
    status.price = new BN(transactionalStatus.asBuyNow.toString())

    return status
  }

  unimplementedError(`Unsupported NFT TransactionalStatus type: ${transactionalStatus.toString()}`)
}

export async function contentNft_OpenAuctionStarted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [contentActor, videoId, auctionParams] = new OpenAuctionStartedEvent_V1001(event).params

  // specific event processing

  // load video
  const nft = await getByIdOrFail(store, OwnedNft, videoId.toString(), [
    'video',
    'ownerMember',
    'ownerCuratorGroup',
    'creatorChannel',
  ])

  // create auction
  const auctionStart = auctionParams.startsAt.isSome ? auctionParams.startsAt.unwrap().toNumber() : event.blockNumber
  const auction = await createAuction(store, nft, auctionParams, auctionStart)

  await setNewNftTransactionalStatus(store, nft, auction, event.blockNumber)

  // common event processing - second

  const openAuctionStartedEvent = new OpenAuctionStartedEvent({
    ...genericEventFields(event),

    actor: await convertContentActor(store, contentActor),
    video: nft.video,
    auction,
    // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
  })

  await store.save<OpenAuctionStartedEvent>(openAuctionStartedEvent)
}

export async function contentNft_EnglishAuctionStarted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [contentActor, videoId, auctionParams] = new EnglishAuctionStartedEvent_V1001(event).params

  // specific event processing

  // load video
  const nft = await getByIdOrFail(store, OwnedNft, videoId.toString(), [
    'video',
    'ownerMember',
    'ownerCuratorGroup',
    'creatorChannel',
  ])

  // create new auction
  const auctionStart = auctionParams.startsAt.isSome ? auctionParams.startsAt.unwrap().toNumber() : event.blockNumber
  const auction = await createAuction(store, nft, auctionParams, auctionStart)

  await setNewNftTransactionalStatus(store, nft, auction, event.blockNumber)

  // common event processing - second

  const englishAuctionStartedEvent = new EnglishAuctionStartedEvent({
    ...genericEventFields(event),

    actor: await convertContentActor(store, contentActor),
    video: nft.video,
    auction,
    // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
  })

  await store.save<EnglishAuctionStartedEvent>(englishAuctionStartedEvent)
}

// create auction type variant from raw runtime auction type
function createAuctionType(
  auctionParams: OpenAuctionParams | EnglishAuctionParams,
  startsAtBlockNumber: number
): typeof AuctionType {
  function isEnglishAuction(auction: OpenAuctionParams | EnglishAuctionParams): auction is EnglishAuctionParams {
    return !!(auction as any).duration
  }

  // auction type `english`
  if (isEnglishAuction(auctionParams)) {
    // prepare auction variant
    const auctionType = new AuctionTypeEnglish()
    auctionType.duration = auctionParams.duration.toNumber()
    auctionType.extensionPeriod = auctionParams.extensionPeriod.toNumber()
    auctionType.minimalBidStep = new BN(auctionParams.minBidStep.toString())
    auctionType.plannedEndAtBlock = startsAtBlockNumber + auctionParams.duration.toNumber()

    return auctionType
  }

  // auction type `open`

  // prepare auction variant
  const auctionType = new AuctionTypeOpen()
  auctionType.bidLockDuration = auctionParams.bidLockDuration.toNumber()
  return auctionType
}

export async function contentNft_NftIssued({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [actor, videoId, nftIssuanceParameters] = new NftIssuedEvent_V1001(event).params

  // specific event processing

  // load video
  const video = await getByIdOrFail(store, Video, videoId.toString(), [
    'channel',
    'channel.ownerCuratorGroup',
    'channel.ownerMember',
  ] as RelationsArr<Video>)

  // prepare and save nft record
  const nft = await createNft(store, video, nftIssuanceParameters, event.blockNumber)

  // common event processing - second

  const nftIssuedEvent = new NftIssuedEvent({
    ...genericEventFields(event),

    contentActor: await convertContentActor(store, actor),
    video,
    royalty: nft.creatorRoyalty,
    metadata: nft.metadata,
    // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, actor)),
  })

  await store.save<NftIssuedEvent>(nftIssuedEvent)
}

export async function contentNft_AuctionBidMade({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [memberId, videoId, bidAmount, previousTopBidderId] = new AuctionBidMadeEvent_V1001(event).params

  const previousTopBidder = previousTopBidderId.isSome
    ? new Membership({ id: previousTopBidderId.unwrap().toString() })
    : undefined

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
  if (auction.auctionType.isTypeOf === AuctionTypeEnglish.name) {
    const auctionType = auction.auctionType as AuctionTypeEnglish
    const { plannedEndAtBlock, extensionPeriod } = auctionType
    // The condition has to be the same as in `runtime-modules/content/src/nft/types.rs`
    if (plannedEndAtBlock - extensionPeriod <= event.blockNumber) {
      auctionType.plannedEndAtBlock += extensionPeriod
      await store.save<Auction>(auction)
    }
  }

  // common event processing - second

  const auctionBidMadeEvent = new AuctionBidMadeEvent({
    ...genericEventFields(event),

    member,
    video,
    bidAmount,
    ownerMember: nft.ownerMember,
    ownerCuratorGroup: nft.ownerCuratorGroup,
    previousTopBid: previousTopBidder ? previousTopBid : undefined,
    previousTopBidder,
  })

  await store.save<AuctionBidMadeEvent>(auctionBidMadeEvent)
}

export async function contentNft_AuctionBidCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [memberId, videoId] = new AuctionBidCanceledEvent_V1001(event).params

  // specific event processing

  const canceledBid = await getOneByOrFail(
    store,
    Bid,
    { bidder: { id: memberId.toString() }, nft: { id: videoId.toString() }, isCanceled: false },
    [
      'nft',
      'nft.video',
      'nft.ownerMember',
      'nft.ownerCuratorGroup',
      'auction',
      'auction.topBid',
      'auction.bids',
      'auction.bids.bidder',
    ] as RelationsArr<Bid>
  )

  // load auction and video
  const {
    auction,
    nft: { video, ownerMember, ownerCuratorGroup },
  } = canceledBid

  canceledBid.isCanceled = true

  // save bid
  await store.save<Bid>(canceledBid)

  if (auction.topBid && canceledBid.id.toString() === auction.topBid.id.toString()) {
    // create list of all auction bids, but exclude bid that just got canceled
    // we saved the bid but the auction bids are stale in memory and the bid that just got canceled is not updated in auction.bids
    // if we don't filter it, the canceled bid may get set as the top bid again
    const allAuctionBids = [...(auction.bids || [])]
    const notCanceledAuctionBids = allAuctionBids.filter((auctionBid) => auctionBid.id !== canceledBid.id)
    // find new top bid
    auction.topBid = findTopBid(notCanceledAuctionBids)

    // save auction
    await store.save<Auction>(auction)
  }

  // common event processing - second

  const auctionBidCanceledEvent = new AuctionBidCanceledEvent({
    ...genericEventFields(event),

    member: new Membership({ id: memberId.toString() }),
    video,
    ownerMember,
    ownerCuratorGroup,
  })

  await store.save<AuctionBidCanceledEvent>(auctionBidCanceledEvent)
}

export async function contentNft_AuctionCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [contentActor, videoId] = new AuctionCanceledEvent_V1001(event).params

  // specific event processing

  // load video and auction
  const { video, auction } = await getCurrentAuctionFromVideo(store, videoId.toString())

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

  const auctionCanceledEvent = new AuctionCanceledEvent({
    ...genericEventFields(event),

    contentActor: await convertContentActor(store, contentActor),
    video,
    // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
  })

  await store.save<AuctionCanceledEvent>(auctionCanceledEvent)
}

export async function contentNft_EnglishAuctionSettled({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  // memberId ignored here because it references member that called extrinsic - that can be anyone!
  const [winnerId, , videoId] = new EnglishAuctionSettledEvent_V1001(event).params

  // specific event processing

  // finish auction
  const { video, nft, winningBid, bidders, previousOwnerMember, previousOwnerCuratorGroup } = await finishAuction(
    store,
    videoId.toNumber(),
    event.blockNumber
  )

  if (winnerId.toString() !== winningBid.bidder.id) {
    return inconsistentState(`English auction winner haven't placed the top bid`, { videoId, winnerId })
  }

  // set last sale
  nft.lastSalePrice = winningBid.amount
  nft.lastSaleDate = new Date(event.blockTimestamp)

  // save NFT
  await store.save<OwnedNft>(nft)

  // common event processing - second

  const englishAuctionSettledEvent = new EnglishAuctionSettledEvent({
    ...genericEventFields(event),

    winner: winningBid.bidder,
    video,
    bidders,
    winningBid,
    ownerMember: previousOwnerMember,
    ownerCuratorGroup: previousOwnerCuratorGroup,
  })

  await store.save<EnglishAuctionSettledEvent>(englishAuctionSettledEvent)
}

// called when auction bid's value is higher than buy-now value
export async function contentNft_BidMadeCompletingAuction({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [memberId, videoId, previousTopBidderId] = new BidMadeCompletingAuctionEvent_V1001(event).params

  const previousTopBidder = previousTopBidderId.isSome
    ? new Membership({ id: previousTopBidderId.unwrap().toString() })
    : undefined

  // specific event processing

  // create record for winning bid
  const {
    previousTopBid,
    nft: { ownerMember, ownerCuratorGroup },
  } = await createBid(event, store, memberId.toNumber(), videoId.toNumber())

  // finish auction and transfer ownership
  const { video, winningBid, nft, bidders } = await finishAuction(store, videoId.toNumber(), event.blockNumber)

  // set last sale
  nft.lastSalePrice = winningBid.amount
  nft.lastSaleDate = new Date(event.blockTimestamp)

  // save NFT
  await store.save<OwnedNft>(nft)

  // common event processing - second

  const bidMadeCompletingAuctionEvent = new BidMadeCompletingAuctionEvent({
    ...genericEventFields(event),

    member: winningBid.bidder,
    video,
    ownerMember,
    ownerCuratorGroup,
    winningBid,
    price: winningBid.amount,
    previousTopBid: previousTopBidder ? previousTopBid : undefined,
    previousTopBidder,
    bidders,
  })

  await store.save<BidMadeCompletingAuctionEvent>(bidMadeCompletingAuctionEvent)
}

export async function contentNft_OpenAuctionBidAccepted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [contentActor, videoId, winnerId, bidAmount] = new OpenAuctionBidAcceptedEvent_V1001(event).params

  // specific event processing

  // finish auction
  const { video, nft, winningBid, bidders } = await finishAuction(store, videoId.toNumber(), event.blockNumber, {
    bidAmount,
    winnerId: winnerId.toNumber(),
  })

  // set last sale
  nft.lastSalePrice = winningBid.amount
  nft.lastSaleDate = new Date(event.blockTimestamp)

  // save NFT
  await store.save<OwnedNft>(nft)

  // common event processing - second

  const openAuctionBidAcceptedEvent = new OpenAuctionBidAcceptedEvent({
    ...genericEventFields(event),

    contentActor: await convertContentActor(store, contentActor),
    video,
    // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
    winningBid,
    bidders,
    winningBidder: new Membership({ id: winnerId.toString() }),
  })

  await store.save<OpenAuctionBidAcceptedEvent>(openAuctionBidAcceptedEvent)
}

export async function contentNft_OfferStarted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId, contentActor, memberId, price] = new OfferStartedEvent_V1001(event).params

  // specific event processing

  // load NFT
  const nft = await getByIdOrFail(store, OwnedNft, videoId.toString(), [
    'video',
    'ownerMember',
    'ownerCuratorGroup',
    'creatorChannel',
  ])

  // update NFT transactional status
  const transactionalStatus = new TransactionalStatusInitiatedOfferToMember()
  transactionalStatus.memberId = memberId.toNumber()
  transactionalStatus.price = price.unwrapOr(undefined)
  await setNewNftTransactionalStatus(store, nft, transactionalStatus, event.blockNumber)

  // common event processing - second

  const offerStartedEvent = new OfferStartedEvent({
    ...genericEventFields(event),

    video: nft.video,
    contentActor: await convertContentActor(store, contentActor),
    member: new Membership({ id: memberId.toString() }),
    price: price.unwrapOr(undefined),
    // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
  })

  await store.save<OfferStartedEvent>(offerStartedEvent)
}

export async function contentNft_OfferAccepted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId] = new OfferAcceptedEvent_V1001(event).params

  // specific event processing

  // load NFT
  const nft = await getByIdOrFail(store, OwnedNft, videoId.toString(), [
    'video',
    'ownerMember',
    'ownerCuratorGroup',
    'creatorChannel',
  ])

  // read member from offer
  const memberId = (nft.transactionalStatus as TransactionalStatusInitiatedOfferToMember).memberId
  // read price from offer
  const price = (nft.transactionalStatus as TransactionalStatusInitiatedOfferToMember).price
  const member = new Membership({ id: memberId.toString() })

  if (price) {
    // set last sale
    nft.lastSalePrice = price
    nft.lastSaleDate = new Date(event.blockTimestamp)

    // save NFT
    await store.save<OwnedNft>(nft)
  }

  // update NFT's transactional status
  await resetNftTransactionalStatusFromVideo(
    store,
    videoId.toString(),
    `Non-existing NFT's offer accepted`,
    event.blockNumber,
    member
  )

  // common event processing - second

  const offerAcceptedEvent = new OfferAcceptedEvent({
    ...genericEventFields(event),

    video: nft.video,
    ownerMember: nft.ownerMember,
    ownerCuratorGroup: nft.ownerCuratorGroup,
    price,
  })

  await store.save<OfferAcceptedEvent>(offerAcceptedEvent)
}

export async function contentNft_OfferCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId, contentActor] = new OfferCanceledEvent_V1001(event).params

  // specific event processing

  // load video
  const video = await getByIdOrFail(store, Video, videoId.toString())

  // update NFT's transactional status
  await resetNftTransactionalStatusFromVideo(
    store,
    videoId.toString(),
    `Non-existing NFT's offer canceled`,
    event.blockNumber
  )

  // common event processing - second

  const offerCanceledEvent = new OfferCanceledEvent({
    ...genericEventFields(event),

    video,
    contentActor: await convertContentActor(store, contentActor),
    // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
  })

  await store.save<OfferCanceledEvent>(offerCanceledEvent)
}

export async function contentNft_NftSellOrderMade({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId, contentActor, price] = new NftSellOrderMadeEvent_V1001(event).params

  // specific event processing

  // load NFT
  const nft = await getByIdOrFail(store, OwnedNft, videoId.toString(), [
    'video',
    'ownerMember',
    'ownerCuratorGroup',
    'creatorChannel',
  ])

  // update NFT transactional status
  const transactionalStatus = new TransactionalStatusBuyNow()
  transactionalStatus.price = new BN(price.toString())
  await setNewNftTransactionalStatus(store, nft, transactionalStatus, event.blockNumber)

  // common event processing - second

  const nftSellOrderMadeEvent = new NftSellOrderMadeEvent({
    ...genericEventFields(event),

    video: nft.video,
    contentActor: await convertContentActor(store, contentActor),
    price,
    // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
  })

  await store.save<NftSellOrderMadeEvent>(nftSellOrderMadeEvent)
}

export async function contentNft_NftBought({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId, memberId] = new NftBoughtEvent_V1001(event).params

  // specific event processing

  // load NFT
  const nft = await getByIdOrFail(store, OwnedNft, videoId.toString(), [
    'video',
    'ownerMember',
    'ownerCuratorGroup',
    'creatorChannel',
  ])

  // read member
  const winner = new Membership({ id: memberId.toString() })
  // NFT bought price
  const price = (nft.transactionalStatus as TransactionalStatusBuyNow).price

  // set last sale
  nft.lastSalePrice = price
  nft.lastSaleDate = new Date(event.blockTimestamp)

  // save NFT
  await store.save<OwnedNft>(nft)

  // update NFT's transactional status
  await resetNftTransactionalStatusFromVideo(
    store,
    videoId.toString(),
    `Non-existing NFT's auction completed`,
    event.blockNumber,
    winner
  )

  // common event processing - second

  const nftBoughtEvent = new NftBoughtEvent({
    ...genericEventFields(event),

    video: nft.video,
    member: winner,
    ownerMember: nft.ownerMember,
    ownerCuratorGroup: nft.ownerCuratorGroup,
    price,
  })

  await store.save<NftBoughtEvent>(nftBoughtEvent)
}

export async function contentNft_BuyNowCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId, contentActor] = new BuyNowCanceledEvent_V1001(event).params

  // specific event processing

  // load video
  const video = await getByIdOrFail(store, Video, videoId.toString())

  await resetNftTransactionalStatusFromVideo(
    store,
    videoId.toString(),
    `Non-existing NFT's buy-now canceled`,
    event.blockNumber
  )

  // common event processing - second

  const buyNowCanceledEvent = new BuyNowCanceledEvent({
    ...genericEventFields(event),

    video,
    contentActor: await convertContentActor(store, contentActor),
    // prepare Nft owner (handles fields `ownerMember` and `ownerCuratorGroup`)
    ...(await convertContentActorToChannelOrNftOwner(store, contentActor)),
  })

  await store.save<BuyNowCanceledEvent>(buyNowCanceledEvent)
}

export async function contentNft_BuyNowPriceUpdated({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId, contentActor, newPrice] = new BuyNowPriceUpdatedEvent_V1001(event).params

  // specific event processing

  const nft = await getByIdOrFail(store, OwnedNft, videoId.toString(), [
    'video',
    'ownerMember',
    'ownerCuratorGroup',
    'creatorChannel',
  ])

  const newTransactionalStatus = new TransactionalStatusBuyNow()
  newTransactionalStatus.price = new BN(newPrice.toString()) // this "typecast" is needed to prevent error

  await setNewNftTransactionalStatus(store, nft, newTransactionalStatus, event.blockNumber)

  // common event processing - second

  const buyNowPriceUpdatedEvent = new BuyNowPriceUpdatedEvent({
    ...genericEventFields(event),

    video: nft.video,
    contentActor: await convertContentActor(store, contentActor),
    newPrice: newPrice,
    ownerMember: nft.ownerMember,
    ownerCuratorGroup: nft.ownerCuratorGroup,
  })

  await store.save<BuyNowCanceledEvent>(buyNowPriceUpdatedEvent)
}

export async function contentNft_NftSlingedBackToTheOriginalArtist({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [videoId, contentActor] = new NftSlingedBackToTheOriginalArtistEvent_V1001(event).params

  // load NFT

  const nft = await getByIdOrFail(store, OwnedNft, videoId.toString(), [
    'ownerMember',
    'ownerCuratorGroup',
    'creatorChannel',
    'video',
    'video.channel',
    'video.channel.ownerMember',
    'video.channel.ownerCuratorGroup',
  ] as RelationsArr<OwnedNft>)

  nft.ownerMember = nft.video.channel.ownerMember
  nft.ownerCuratorGroup = nft.video.channel.ownerCuratorGroup
  nft.isOwnedByChannel = true

  await getAllManagers(store).videoNfts.onMainEntityUpdate(nft)

  await store.save<OwnedNft>(nft)

  // common event processing - second

  const nftSlingedBackToTheOriginalArtistEvent = new NftSlingedBackToTheOriginalArtistEvent({
    ...genericEventFields(event),
    video: nft.video,
    contentActor: await convertContentActor(store, contentActor),
    ownerMember: nft.ownerMember,
    ownerCuratorGroup: nft.ownerCuratorGroup,
  })

  await store.save<NftSlingedBackToTheOriginalArtistEvent>(nftSlingedBackToTheOriginalArtistEvent)
}
