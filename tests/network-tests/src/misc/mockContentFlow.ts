// import { assert } from 'chai'
// import { registry } from '@joystream/types'
import { CreateChannelsAsMemberFixture } from './createChannelsAsMemberFixture'
import { CreateVideosAsMemberFixture } from './createVideosAsMemberFixture'
import { BuyMembershipHappyCaseFixture } from '../fixtures/membershipModule'
import { CreateMockCategories } from './createCategoriesFixture'

import { FlowProps } from '../Flow'
import { FixtureRunner } from '../Fixture'
import { extendDebug } from '../Debugger'
import BN from 'bn.js'

export default async function mockContent({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:createMockContent')
  debug('Started')

  // Check to avoid creating duplicate categories
  const nextVideoCategoryId = await api.query.content.nextVideoCategoryId()
  const nextChannelCategoryId = await api.query.content.nextVideoCategoryId()

  if (nextChannelCategoryId.toNumber() === 1 && nextVideoCategoryId.toNumber() === 1) {
    // create categories with lead
    const createCategories = new CreateMockCategories(api)
    debug('Creating Categories')
    await new FixtureRunner(createCategories).run()
  } else {
    debug('Skipping Category Creation')
  }

  if (process.env.SKIP_MOCK_CONTENT) {
    debug('Skipping Video and Channel creation')
    debug('Done')
    return
  }

  const memberAccount = api.createKeyPairs(1)[0].key.address
  const createMember: BuyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(
    api,
    [memberAccount],
    api.createPaidTermId(new BN(0))
  )
  await new FixtureRunner(createMember).run()

  const memberId = createMember.getCreatedMembers()[0].toNumber()

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
    const createChannels = new CreateChannelsAsMemberFixture(api, memberId, numberOfChannelsPerRound)
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
