import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import {
  CreateChannelsAndVideosFixture,
  CreateContentStructureFixture,
  CreateMembersFixture,
  NftEnglishAuctionFixture,
  NftBuyNowFixture,
  NftUpdateBuyNowPriceFixture,
  NftDirectOfferFixture,
  NftOpenAuctionFixture,
  AuctionCancelationsFixture,
  CreateVideoWithNftFixture,
  NftCreateVideoWithBuyNowFixture,
  UpdateVideoForNftCreationFixture,
  NftCollectorsFixture,
  NftAuctionWhitelistFixture,
  IMember,
} from '../../fixtures/content'
import BN from 'bn.js'
import { createJoystreamCli } from '../utils'

export default async function nftAuctionAndOffers({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:nft-auction-and-offers')
  debug('Started')
  api.enableDebugTxLogs()

  // create Joystream CLI
  const joystreamCli = await createJoystreamCli()

  // settings
  const videoCount = 8 // should be equal to number of uses of `nextVideo()` below
  const videoCategoryCount = 1
  const channelCount = 1
  const auctionParticipantsCount = 3
  const sufficientTopupAmount = new BN(1_000_000) // some very big number to cover fees of all transactions

  // prepare content

  const createContentStructureFixture = new CreateContentStructureFixture(api, query, joystreamCli, videoCategoryCount)
  await new FixtureRunner(createContentStructureFixture).run()

  const { videoCategoryIds } = createContentStructureFixture.getCreatedItems()

  // create author of channels and videos as well as auction participants
  const createMembersFixture = new CreateMembersFixture(
    api,
    query,
    auctionParticipantsCount + 1,
    0,
    sufficientTopupAmount
  )
  await new FixtureRunner(createMembersFixture).run()
  const [author, ...auctionParticipants] = createMembersFixture.getCreatedItems().members

  const createChannelsAndVideos = new CreateChannelsAndVideosFixture(
    api,
    query,
    joystreamCli,
    channelCount,
    videoCount,
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

  const englishAuctionFixture = new NftEnglishAuctionFixture(
    api,
    query,
    nextVideo().videoId,
    author as IMember,
    auctionParticipants
  )

  await new FixtureRunner(englishAuctionFixture).run()

  const openAuctionFixture = new NftOpenAuctionFixture(api, query, nextVideo().videoId, author, auctionParticipants)

  await new FixtureRunner(openAuctionFixture).run()

  const nftBuyNowFixture = new NftBuyNowFixture(
    api,
    query,
    nextVideo().videoId,
    author as IMember,
    auctionParticipants[0]
  )

  await new FixtureRunner(nftBuyNowFixture).run()

  const updateBuyNowPriceFixture = new NftUpdateBuyNowPriceFixture(api, query, nextVideo().videoId, author as IMember)

  await new FixtureRunner(updateBuyNowPriceFixture).run()

  const nftDirectOfferFixture = new NftDirectOfferFixture(
    api,
    query,
    nextVideo().videoId,
    author as IMember,
    auctionParticipants[0]
  )

  await new FixtureRunner(nftDirectOfferFixture).run()

  const auctionCancelationsFicture = new AuctionCancelationsFixture(
    api,
    query,
    nextVideo().videoId,
    author as IMember,
    auctionParticipants[0]
  )

  await new FixtureRunner(auctionCancelationsFicture).run()

  const createVideoWithAuctionFixture = new CreateVideoWithNftFixture(api, query, author as IMember, channelIds[0])

  await new FixtureRunner(createVideoWithAuctionFixture).run()

  const createVideoWithBuyNowFixture = new NftCreateVideoWithBuyNowFixture(api, query, author as IMember, channelIds[0])

  await new FixtureRunner(createVideoWithBuyNowFixture).run()

  const updateVideoWithAuctionFixture = new UpdateVideoForNftCreationFixture(api, query, author as IMember, [
    nextVideo().videoId,
    nextVideo().videoId,
  ])

  await new FixtureRunner(updateVideoWithAuctionFixture).run()

  const auctionWhitelistFixture = new NftAuctionWhitelistFixture(
    api,
    query,
    author as IMember,
    channelIds[0],
    auctionParticipants
  )

  await new FixtureRunner(auctionWhitelistFixture).run()

  // content of this table depends on effects of previously run fixtures
  // keep it updated when changing this flow
  const nftCollectors = {
    [channelIds[0].toString()]: {
      // 4 == num of videos not transfered from original owner
      //      + 1 created in createVideoWithAuctionFixture
      //      + 1 created in auctionWhitelistFixture
      [author.memberId.toString()]: 8,

      // 2 == target of direct offer + buy now winner
      [auctionParticipants[0].memberId.toString()]: 2,

      // 1 == winner of chain of open auctions
      [auctionParticipants[1].memberId.toString()]: 1,

      // 2 == winner of english auction
      [auctionParticipants[2].memberId.toString()]: 1,
    },
  }
  const nftCollectorsFixture = new NftCollectorsFixture(api, query, nftCollectors)

  await new FixtureRunner(nftCollectorsFixture).run()

  debug('Done')
}
