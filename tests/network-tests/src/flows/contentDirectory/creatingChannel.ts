import { Api } from '../../Api'
import { FlowProps } from '../../Flow'
import { Utils } from '../../utils'
import { CreateChannelFixture } from '../../fixtures/contentDirectoryModule'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities/ChannelEntity'
import { assert } from 'chai'
import { FixtureRunner } from '../../Fixture'
import Debugger from 'debug'

export function createSimpleChannelFixture(api: Api): CreateChannelFixture {
  const channelEntity: ChannelEntity = {
    handle: 'New channel example',
    description: 'This is an example channel',
    // We can use "existing" syntax to reference either an on-chain entity or other entity that's part of the same batch.
    // Here we reference language that we assume was added by initialization script (initialize:dev), as it is part of
    // input/entityBatches/LanguageBatch.json
    language: { existing: { code: 'EN' } },
    coverPhotoUrl: '',
    avatarPhotoUrl: '',
    isPublic: true,
  }
  return new CreateChannelFixture(api, channelEntity)
}

function assertChannelMatchQueriedResult(queriedChannel: any, channel: ChannelEntity) {
  assert.equal(queriedChannel.handle, channel.handle, 'Should be equal')
  assert.equal(queriedChannel.description, channel.description, 'Should be equal')
  assert.equal(queriedChannel.coverPhotoUrl, channel.coverPhotoUrl, 'Should be equal')
  assert.equal(queriedChannel.avatarPhotoUrl, channel.avatarPhotoUrl, 'Should be equal')
  assert.equal(queriedChannel.isPublic, channel.isPublic, 'Should be equal')
}

export default async function channelCreation({ api, query }: FlowProps): Promise<void> {
  const debug = Debugger('flow:creatingChannel')
  debug('Started')

  const createChannelHappyCaseFixture = createSimpleChannelFixture(api)

  await new FixtureRunner(createChannelHappyCaseFixture).run()

  // Temporary solution (wait 2 minutes)
  await Utils.wait(120000)

  // Ensure newly created channel was parsed by query node
  const result = await query.getChannelbyHandle(createChannelHappyCaseFixture.channelEntity.handle)

  assertChannelMatchQueriedResult(result.data.channels[0], createChannelHappyCaseFixture.channelEntity)

  debug('Done')
}
