import { QueryNodeApi, WorkingGroups } from '../../Api'
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
    return new CreateChannelFixture (api, channelEntity, pair)
}

export default async function channelCreation(api: QueryNodeApi, pair: KeyringPair) {
  const createChannelHappyCaseFixture = createSimpleChannelFixture(api, pair)

  await createChannelHappyCaseFixture.runner(false)

  const data = await api.getChannelbyTitle(createChannelHappyCaseFixture.channelEntity.title).then(result => result.data)

  assert(data.title === createChannelHappyCaseFixture.channelEntity.title, "Should be equal")
  assert(data.description === createChannelHappyCaseFixture.channelEntity.description, "Should be equal")
  assert(data.language === createChannelHappyCaseFixture.channelEntity.language as unknown as string, "Should be equal")
  assert(data.coverPhotoUrl === createChannelHappyCaseFixture.channelEntity.coverPhotoUrl, "Should be equal")
  assert(data.avatarPhotoURL === createChannelHappyCaseFixture.channelEntity.avatarPhotoURL, "Should be equal")
  assert(data.isPublic === createChannelHappyCaseFixture.channelEntity.isPublic.toString(), "Should be equal")

}