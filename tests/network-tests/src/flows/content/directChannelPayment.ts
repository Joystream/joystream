import BN from 'bn.js'
import Long from 'long'
import { Utils } from '../../utils'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { FlowProps } from '../../Flow'
import {
  CreateChannelsAndVideosFixture,
  CreateContentStructureFixture,
  CreateMembersFixture,
} from '../../fixtures/content'
import { createJoystreamCli } from '../utils'
import {
  ChannelPaymentParams,
  DirectChannelPaymentsHappyCaseFixture,
} from '../../fixtures/content/channelPayouts/DirectChannelPaymentHappyCaseFixture'
import { DirectChannelPaymentsWithInvalidRewardAccountFixture } from '../../fixtures/content/channelPayouts/DirectChannelPaymentWithInvalidRewardAccountFixture'

export default async function directChannelPayment({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:direct channel payment')
  debug('Started')
  api.enableDebugTxLogs()

  // create Joystream CLI
  const joystreamCli = await createJoystreamCli()

  // settings
  const videoCount = 1
  const videoCategoryCount = 1
  const channelCount = 1
  const sufficientTopupAmount = new BN(10_000_000_000_000) // some very big number to cover fees of all transactions
  const channelPaymentAmount = new BN(10_000_000)

  // flow itself

  // create channel categories and video categories
  const createContentStructureFixture = new CreateContentStructureFixture(api, query, joystreamCli, videoCategoryCount)
  await new FixtureRunner(createContentStructureFixture).run()

  const { videoCategoryIds } = createContentStructureFixture.getCreatedItems()

  // create author of channels and videos
  const createMembersFixture = new CreateMembersFixture(api, query, 3, 0, sufficientTopupAmount)
  await new FixtureRunner(createMembersFixture).run()
  const {
    members: [channelOwner, ...participants],
  } = createMembersFixture.getCreatedItems()

  // create channels and videos
  const createChannelsAndVideos = new CreateChannelsAndVideosFixture(
    api,
    query,
    joystreamCli,
    channelCount,
    videoCount,
    videoCategoryIds[0],
    channelOwner
  )
  await new FixtureRunner(createChannelsAndVideos).run()

  const {
    channelIds: [channelId],
    videosData,
  } = createChannelsAndVideos.getCreatedItems()

  // query channel
  const channel = await query.channelById(channelId.toString())
  Utils.assert(channel?.rewardAccount, `Channel ${channelId} reward account is not set`)

  // direct channel payment input input
  const validChannelPayments: ChannelPaymentParams[] = [
    // Channel Payment for a video:
    {
      msg: {
        videoId: Long.fromNumber(videosData[0].videoId),
        rationale: 'Really good video',
      },
      payment: [channel.rewardAccount, channelPaymentAmount],
      asMember: participants[0].memberId,
    },
    // Channel Payment as channel wide tip:
    {
      msg: {
        rationale: 'Great channel',
      },
      payment: [channel.rewardAccount, channelPaymentAmount],
      asMember: participants[0].memberId,
    },
  ]

  // check that direct channel payment is working
  const channelPaymentsSuccessfulFixture = new DirectChannelPaymentsHappyCaseFixture(api, query, validChannelPayments)
  await new FixtureRunner(channelPaymentsSuccessfulFixture).runWithQueryNodeChecks()

  const invalidChannelPayments: ChannelPaymentParams[] = [
    // Channel Payment for a video:
    {
      msg: {
        videoId: Long.fromNumber(videosData[0].videoId),
        rationale: 'Really good video',
      },
      payment: [participants[0].account, channelPaymentAmount],
      asMember: participants[0].memberId,
    },
  ]
  // check that direct channel payment failed with invalid channel's reward account recipient address
  const channelPaymentsErroredFixture = new DirectChannelPaymentsWithInvalidRewardAccountFixture(
    api,
    query,
    invalidChannelPayments
  )
  await new FixtureRunner(channelPaymentsErroredFixture).runWithQueryNodeChecks()

  debug('Done')
}
