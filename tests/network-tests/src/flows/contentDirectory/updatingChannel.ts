import { QueryNodeApi, WorkingGroups } from '../../Api'
import { UpdateChannelFixture } from '../../fixtures/contentDirectoryModule'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities/ChannelEntity'
import { assert } from 'chai'
import { Utils } from '../../utils'

export function createUpdateChannelHandleFixture(api: QueryNodeApi, handle: string): UpdateChannelFixture {
  // Create partial channel entity, only containing the fields we wish to update
  const channelUpdateInput: Partial<ChannelEntity> = {
    handle,
  }

  const uniquePropVal: Record<string, any> = { handle }

  return new UpdateChannelFixture(api, channelUpdateInput, uniquePropVal)
}

export default async function updateChannel(api: QueryNodeApi) {
  const channelResult = await api.getChannelbyHandle('New channel example')
  const channel = channelResult.data.channels[0]

  const handle = 'Updated handle'
  const createUpdateChannelDescriptionHappyCaseFixture = createUpdateChannelHandleFixture(api, handle)

  await createUpdateChannelDescriptionHappyCaseFixture.runner(false)

  // Temporary solution (wait 2 minutes)
  await Utils.wait(120000)

  const channelAfterUpdateResult = await api.getChannelbyHandle(handle)
  const channelAfterUpdate = channelAfterUpdateResult.data.channels[0]

  // handle field should be updated to provided one
  assert(channelAfterUpdate.handle === handle)
  assert(channelAfterUpdate.description === channel.description, 'Should be equal')
  assert(channelAfterUpdate.coverPhotoUrl === channel.coverPhotoUrl, 'Should be equal')
  assert(channelAfterUpdate.avatarPhotoUrl === channel.avatarPhotoURL, 'Should be equal')
  assert(channelAfterUpdate.isPublic === channel.isPublic, 'Should be equal')
}
