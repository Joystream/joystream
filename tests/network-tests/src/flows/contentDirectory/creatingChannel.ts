import { QueryNodeApi } from '../../Api'
import { CreateChannelFixture } from '../../fixtures/contentDirectoryModule'
import { ChannelEntity } from 'cd-schemas/types/entities/ChannelEntity'
import { assert } from 'chai'
import { KeyringPair } from '@polkadot/keyring/types'

export function createSimpleChannelFixture(api: QueryNodeApi, pair: KeyringPair): CreateChannelFixture {
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
  return new CreateChannelFixture(api, channelEntity, pair)
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(() => resolve(), ms)).then(() => console.log('fired'))
}

export default async function channelCreation(api: QueryNodeApi, pair: KeyringPair) {
  const createChannelHappyCaseFixture = createSimpleChannelFixture(api, pair)

  await createChannelHappyCaseFixture.runner(false)

  // Temporary solution (wait 10 minutes)
  await delay(600000)

  await api
    .getChannelbyTitle(createChannelHappyCaseFixture.channelEntity.title)
    .then((result) => console.log(result.data))

  // assert(data.title === createChannelHappyCaseFixture.channelEntity.title, 'Should be equal')
  // assert(data.description === createChannelHappyCaseFixture.channelEntity.description, 'Should be equal')
  // assert(data.coverPhotoUrl === createChannelHappyCaseFixture.channelEntity.coverPhotoUrl, 'Should be equal')
  // assert(data.avatarPhotoUrl === createChannelHappyCaseFixture.channelEntity.avatarPhotoURL, 'Should be equal')
  // assert(data.isPublic === createChannelHappyCaseFixture.channelEntity.isPublic.toString(), 'Should be equal')
}
