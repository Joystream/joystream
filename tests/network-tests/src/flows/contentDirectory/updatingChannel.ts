import { QueryNodeApi, WorkingGroups } from '../../Api'
import { UpdateChannelFixture } from '../../fixtures/contentDirectoryModule'
import { ChannelEntity } from 'cd-schemas/types/entities/ChannelEntity'
import { assert } from 'chai'

export function createUpdateChannelTitleFixture(api: QueryNodeApi): UpdateChannelFixture {
  // Create partial channel entity, only containing the fields we wish to update
  const channelUpdateInput: Partial<ChannelEntity> = {
    handle: 'Updated channel title',
  }

  const uniquePropVal: Record<string, any> = { title: 'Example channel' }

  return new UpdateChannelFixture(api, channelUpdateInput, uniquePropVal)
}

export default async function updateChannel(api: QueryNodeApi) {
  const createVideoHappyCaseFixture = createUpdateChannelTitleFixture(api)

  await createVideoHappyCaseFixture.runner(false)
}
