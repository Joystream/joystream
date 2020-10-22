import { Api, WorkingGroups } from '../../Api'
import { CreateChannelFixture } from '../../fixtures/contentDirectoryModule'
import { ChannelEntity } from 'cd-schemas/types/entities/ChannelEntity'
import { assert } from 'chai'

export function createSimpleChannelFixture(api: Api): CreateChannelFixture {
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
    return new CreateChannelFixture (api, 0, channelEntity)
}

export default async function channelCreation(api: Api) {
  const createChannelHappyCaseFixture = createSimpleChannelFixture(api)

  await createChannelHappyCaseFixture.runner(false)
}