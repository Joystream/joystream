import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import {
  ActiveVideoCountersFixture,
  CreateChannelsAndVideosFixture,
  CreateContentStructureFixture,
  CreateMembersFixture,
  NftEnglishAuctionFixture,
  NftBuyNowFixture,
  NftDirectOfferFixture,
  NftOpenAuctionFixture,
  AuctionCancelationsFixture,
  NftCreateVideoWithAuctionFixture,
  UpdateVideoForNftCreationFixture,
  IMember,
  NftEnglishAuctionWithExtensionFixture,
} from '../../fixtures/content'
import BN from 'bn.js'
import { createJoystreamCli } from '../utils'

export default async function nftAuctionAndOffers({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:nft-auction-and-offers')
  debug('Started')
  api.enableDebugTxLogs()

  // create Joystream CLI
  const joystreamCli = await createJoystreamCli()

  // settings
  const videoCount = 6 // should be equal to number of uses of `nextVideo()` below
  const videoCategoryCount = 1
  const channelCount = 1
  const channelCategoryCount = 1
  const auctionParticipantsCount = 3
  const sufficientTopupAmount = new BN(1_000_000) // some very big number to cover fees of all transactions

  // prepare content

  const createContentStructureFixture = new CreateContentStructureFixture(
    api,
    query,
    joystreamCli,
    videoCategoryCount,
    channelCategoryCount
  )
  await new FixtureRunner(createContentStructureFixture).run()

  const { channelCategoryIds, videoCategoryIds } = createContentStructureFixture.getCreatedItems()

  // create author of channels and videos as well as auction participants
  const createMembersFixture = new CreateMembersFixture(api, query, auctionParticipantsCount + 1, sufficientTopupAmount)
  await new FixtureRunner(createMembersFixture).run()
  const [author, ...auctionParticipants] = createMembersFixture.getCreatedItems()

  const createChannelsAndVideos = new CreateChannelsAndVideosFixture(
    api,
    query,
    joystreamCli,
    channelCount,
    videoCount,
    channelCategoryIds[0],
    videoCategoryIds[0],
    author
  )
  await new FixtureRunner(createChannelsAndVideos).run()

  const { channelIds, videosData } = createChannelsAndVideos.getCreatedItems()

  const nextVideo = (() => {
    let i = 0
    return () => videosData[i++]
  })()

  // test NFT features

  const nftAuctionFixture = new NftEnglishAuctionFixture(
    api,
    query,
    joystreamCli,
    nextVideo().videoId,
    author as IMember,
    auctionParticipants
  )

  await new FixtureRunner(nftAuctionFixture).run()

  const nftAuctionWithExtensionFixture = new NftEnglishAuctionWithExtensionFixture(
    api,
    query,
    nextVideo().videoId,
    author as IMember,
    auctionParticipants,
    5, // auction duration
    3 // extension period
  )

  await new FixtureRunner(nftAuctionWithExtensionFixture).run()

  const openAuctionFixture = new NftOpenAuctionFixture(
    api,
    query,
    joystreamCli,
    nextVideo().videoId,
    author,
    auctionParticipants
  )

  await new FixtureRunner(openAuctionFixture).run()

  const nftBuyNowFixture = new NftBuyNowFixture(
    api,
    query,
    joystreamCli,
    nextVideo().videoId,
    author as IMember,
    auctionParticipants[0]
  )

  await new FixtureRunner(nftBuyNowFixture).run()

  const nftDirectOfferFixture = new NftDirectOfferFixture(
    api,
    query,
    joystreamCli,
    nextVideo().videoId,
    author as IMember,
    auctionParticipants[0]
  )

  await new FixtureRunner(nftDirectOfferFixture).run()

  const auctionCancelationsFicture = new AuctionCancelationsFixture(
    api,
    query,
    joystreamCli,
    nextVideo().videoId,
    author as IMember,
    auctionParticipants[0]
  )

  await new FixtureRunner(auctionCancelationsFicture).run()

  const createVideoWithAuctionFixture = new NftCreateVideoWithAuctionFixture(
    api,
    query,
    joystreamCli,
    author as IMember,
    channelIds[0]
  )

  await new FixtureRunner(createVideoWithAuctionFixture).run()

  const updateVideoForNftCreationFixture = new UpdateVideoForNftCreationFixture(
    api,
    query,
    author as IMember,
    nextVideo().videoId
  )

  await new FixtureRunner(updateVideoForNftCreationFixture).run()

  debug('Done')
}
