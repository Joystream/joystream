import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import {
  ActiveVideoCountersFixture,
  CreateChannelsAndVideosFixture,
  CreateContentStructureFixture,
  NftAuctionFixture,
  NftBuyNowFixture,
  NftDirectOfferFixture,
} from '../../fixtures/content'
import { PaidTermId } from '@joystream/types/members'
import BN from 'bn.js'
import { createJoystreamCli } from '../utils'

export default async function nftAuctionAndOffers({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:nft-auction-and-offers')
  debug('Started')
  api.enableDebugTxLogs()

  // create Joystream CLI
  const joystreamCli = await createJoystreamCli()

  // settings
  const videoCount = 2
  const videoCategoryCount = 1
  const channelCount = 1
  const channelCategoryCount = 1

  const paidTerms: PaidTermId = api.createPaidTermId(new BN(+env.MEMBERSHIP_PAID_TERMS!))

  // flow itself

  const createContentStructureFixture = new CreateContentStructureFixture(
    api,
    query,
    joystreamCli,
    videoCategoryCount,
    channelCategoryCount
  )
  await new FixtureRunner(createContentStructureFixture).run()

  const { channelCategoryIds, videoCategoryIds } = createContentStructureFixture.getCreatedItems()

  const createChannelsAndVideos = new CreateChannelsAndVideosFixture(
    api,
    query,
    joystreamCli,
    paidTerms,
    videoCount,
    channelCount,
    channelCategoryIds[0],
    videoCategoryIds[0]
  )
  await new FixtureRunner(createChannelsAndVideos).run()

  const { channelIds, videosData } = createChannelsAndVideos.getCreatedItems()

  // TODO: NFT stuff

  const nftAuctionFixture = new NftAuctionFixture(api, query, joystreamCli)

  await new FixtureRunner(nftAuctionFixture).run()

  const nftBuyNowFixture = new NftBuyNowFixture(api, query, joystreamCli)

  await new FixtureRunner(nftBuyNowFixture).run()

  const nftDirectOfferFixture = new NftDirectOfferFixture(api, query, joystreamCli)

  await new FixtureRunner(nftDirectOfferFixture).run()

  debug('Done')
}
