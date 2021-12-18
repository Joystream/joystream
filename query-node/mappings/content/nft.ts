import { EventContext, StoreContext, DatabaseManager } from '@joystream/hydra-common'
import { genericEventFields } from '../common'
import {
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
import { Content } from '../generated/types'

export async function contentNft_AuctionStarted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [ownerId, videoId, auctionParams] = new Content.AuctionStartedEvent(event).params

  const announcingPeriodStartedEvent = new AuctionStartedEvent({
    ...genericEventFields(event),
  })

  await store.save<AuctionStartedEvent>(announcingPeriodStartedEvent)

  // specific event processing

}

export async function contentNft_NftIssued({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [actor, videoId, royalty, metadata, newOwner] = new Content.NftIssuedEvent(event).params

  const announcingPeriodStartedEvent = new NftIssuedEvent({
    ...genericEventFields(event),
  })

  await store.save<NftIssuedEvent>(announcingPeriodStartedEvent)

  // specific event processing

}

export async function contentNft_AuctionBidMade({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [member, video, bidAmount, extendsAuction] = new Content.AuctionBidMadeEvent(event).params

  const announcingPeriodStartedEvent = new AuctionBidMadeEvent({
    ...genericEventFields(event),
  })

  await store.save<AuctionBidMadeEvent>(announcingPeriodStartedEvent)

  // specific event processing

}

export async function contentNft_AuctionBidCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [member, video] = new Content.AuctionBidCanceledEvent(event).params

  const announcingPeriodStartedEvent = new AuctionBidCanceledEvent({
    ...genericEventFields(event),
  })

  await store.save<AuctionBidCanceledEvent>(announcingPeriodStartedEvent)

  // specific event processing

}

export async function contentNft_AuctionCanceled({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [contentActor, video] = new Content.AuctionCanceledEvent(event).params

  const announcingPeriodStartedEvent = new AuctionCanceledEvent({
    ...genericEventFields(event),
  })

  await store.save<AuctionCanceledEvent>(announcingPeriodStartedEvent)

  // specific event processing

}

export async function contentNft_EnglishAuctionCompleted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [member, video] = new Content.EnglishAuctionCompletedEvent(event).params

  const announcingPeriodStartedEvent = new EnglishAuctionCompletedEvent({
    ...genericEventFields(event),
  })

  await store.save<EnglishAuctionCompletedEvent>(announcingPeriodStartedEvent)

  // specific event processing

}

export async function contentNft_BidMadeCompletingAuction({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [member, video] = new Content.BidMadeCompletingAuctionEvent(event).params

  const announcingPeriodStartedEvent = new BidMadeCompletingAuctionEvent({
    ...genericEventFields(event),
  })

  await store.save<BidMadeCompletingAuctionEvent>(announcingPeriodStartedEvent)

  // specific event processing

}

export async function contentNft_OpenAuctionBidAccepted({ event, store }: EventContext & StoreContext): Promise<void> {
  // common event processing

  const [contentActor, video] = new Content.OpenAuctionBidAcceptedEvent(event).params

  const announcingPeriodStartedEvent = new OpenAuctionBidAcceptedEvent({
    ...genericEventFields(event),
  })

  await store.save<OpenAuctionBidAcceptedEvent>(announcingPeriodStartedEvent)

  // specific event processing

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
