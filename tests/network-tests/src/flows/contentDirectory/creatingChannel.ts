import { QueryNodeApi } from '../../Api'
import { Utils } from '../../utils'
import { CreateChannelFixture } from '../../fixtures/contentDirectoryModule'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities/ChannelEntity'
import { assert } from 'chai'
import { KeyringPair } from '@polkadot/keyring/types'

export function createSimpleChannelFixture(api: QueryNodeApi): CreateChannelFixture {
  const channelEntity: ChannelEntity = {
    handle: 'Example channel',
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

export default async function channelCreation(api: QueryNodeApi) {
  const createChannelHappyCaseFixture = createSimpleChannelFixture(api)

  await createChannelHappyCaseFixture.runner(false)

  // Temporary solution (wait 2 minutes)
  await Utils.wait(120000)

  // Ensure newly created channel was parsed by query node
  const result = await api.getChannelbyTitle(createChannelHappyCaseFixture.channelEntity.handle)
  const queriedChannel = result.data.channels[0]

  assert(queriedChannel.title === createChannelHappyCaseFixture.channelEntity.handle, 'Should be equal')
  assert(queriedChannel.description === createChannelHappyCaseFixture.channelEntity.description, 'Should be equal')
  assert(queriedChannel.coverPhotoUrl === createChannelHappyCaseFixture.channelEntity.coverPhotoUrl, 'Should be equal')
  assert(
    queriedChannel.avatarPhotoUrl === createChannelHappyCaseFixture.channelEntity.avatarPhotoUrl,
    'Should be equal'
  )
  assert(queriedChannel.isPublic === createChannelHappyCaseFixture.channelEntity.isPublic, 'Should be equal')
}
