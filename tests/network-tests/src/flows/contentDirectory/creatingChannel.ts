import { QueryNodeApi } from '../../Api'
import { Utils } from '../../utils'
import { CreateChannelFixture } from '../../fixtures/contentDirectoryModule'
import { ChannelEntity } from 'cd-schemas/types/entities/ChannelEntity'
import { assert } from 'chai'
import { ApolloQueryResult } from '@apollo/client'

export function createSimpleChannelFixture(api: QueryNodeApi): CreateChannelFixture {
  const channelEntity: ChannelEntity = {
    title: 'Example channel',
    description: 'This is an example channel',
    // We can use "existing" syntax to reference either an on-chain entity or other entity that's part of the same batch.
    // Here we reference language that we assume was added by initialization script (initialize:dev), as it is part of
    // input/entityBatches/LanguageBatch.json
    language: { existing: { code: 'EN' } },
    coverPhotoUrl: '',
    avatarPhotoURL: '',
    isPublic: true,
  }
  return new CreateChannelFixture(api, channelEntity)
}

function assertChannelMatchQueriedResult(queriedChannel: any, channel: ChannelEntity) {
  assert(queriedChannel.title === channel.title, 'Should be equal')
  assert(queriedChannel.description === channel.description, 'Should be equal')
  assert(queriedChannel.coverPhotoUrl === channel.coverPhotoUrl, 'Should be equal')
  assert(queriedChannel.avatarPhotoUrl === channel.avatarPhotoURL, 'Should be equal')
  assert(queriedChannel.isPublic === channel.isPublic, 'Should be equal')
}

export default async function channelCreation(api: QueryNodeApi) {
  const createChannelHappyCaseFixture = createSimpleChannelFixture(api)

  await createChannelHappyCaseFixture.runner(false)

  // Temporary solution (wait 2 minutes)
  await Utils.wait(120000)

  // Ensure newly created channel was parsed by query node
  let result = await api.getChannelbyTitle(createChannelHappyCaseFixture.channelEntity.title)

  assertChannelMatchQueriedResult(result.data.channels[0], createChannelHappyCaseFixture.channelEntity)
}
