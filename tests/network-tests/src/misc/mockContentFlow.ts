import { CreateChannelsAsMemberFixture } from './createChannelsAsMemberFixture'
import { CreateVideosAsMemberFixture } from './createVideosAsMemberFixture'
import { BuyMembershipHappyCaseFixture } from '../fixtures/membership'
import BN from 'bn.js'
import { FlowProps } from '../Flow'
import { FixtureRunner } from '../Fixture'
import { extendDebug } from '../Debugger'

export default async function mockContent({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:createMockContent')
  debug('Started')

  if (process.env.SKIP_MOCK_CONTENT) {
    debug('Skipping Video and Channel creation')
    debug('Done')
    return
  }

  const memberAccount = (await api.createKeyPairs(1))[0].key.address
  const createMember: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(api, query, [memberAccount])
  await new FixtureRunner(createMember).run()

  const memberId = createMember.getCreatedMembers()[0].toNumber()

  // Send some funds to pay the state_bloat_bond and fees
  const channelOwnerBalance = new BN(10000)
  await api.treasuryTransferBalance(memberAccount, channelOwnerBalance)

  // If we are too "aggressive" seeing
  // 'ExtrinsicStatus:: 1010: Invalid Transaction: Transaction is outdated' errors
  const numberOfChannelsPerRound = 100
  const numberOfRoundsChannel = 5
  const numberOfVideosPerRound = 100
  const numberOfRoundsVideo = 100

  const channelIds: number[] = []

  // create mock channels
  debug('Creating Channels')
  for (let n = 0; n < numberOfRoundsChannel; n++) {
    const createChannels = new CreateChannelsAsMemberFixture(api, query, memberId, numberOfChannelsPerRound)
    await new FixtureRunner(createChannels).run()
    createChannels.getCreatedChannels().forEach((id) => channelIds.push(id.toNumber()))
  }

  // Create all videos in same channel
  const channelId = channelIds[0]

  // create mock videos
  for (let n = 0; n < numberOfRoundsVideo; n++) {
    debug('Creating Videos round', n)
    const createVideos = new CreateVideosAsMemberFixture(api, memberId, channelId, numberOfVideosPerRound)
    await new FixtureRunner(createVideos).run()
  }

  debug('Done')
}
