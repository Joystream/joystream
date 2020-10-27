import { Api, WorkingGroups } from '../../Api'
import { CreateChannelFixture } from '../../fixtures/contentDirectoryModule'
import { ChannelEntity } from 'cd-schemas/types/entities/ChannelEntity'
import { assert } from 'chai'
import { KeyringPair } from '@polkadot/keyring/types'

export function createSimpleChannelFixture(api: Api, pair: KeyringPair): CreateChannelFixture {
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

export default async function channelCreation(api: Api, pair: KeyringPair) {
  const createChannelHappyCaseFixture = createSimpleChannelFixture(api, pair)

  await createChannelHappyCaseFixture.runner(false)
}