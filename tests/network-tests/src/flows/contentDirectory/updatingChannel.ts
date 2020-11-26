import { QueryNodeApi, WorkingGroups } from '../../Api'
import { UpdateChannelFixture } from '../../fixtures/contentDirectoryModule'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities/ChannelEntity'
import { assert } from 'chai'

export function createUpdateChannelHandleFixture(api: QueryNodeApi): UpdateChannelFixture {
  // Create partial channel entity, only containing the fields we wish to update
  const channelUpdateInput: Partial<ChannelEntity> = {
    handle: 'Updated channel handle',
  }

  const uniquePropVal: Record<string, any> = { handle: 'Example channel' }

  return new UpdateChannelFixture(api, channelUpdateInput, uniquePropVal)
}

export default async function updateChannel(api: QueryNodeApi) {
  const createVideoHappyCaseFixture = createUpdateChannelHandleFixture(api)

  await createVideoHappyCaseFixture.runner(false)
}
