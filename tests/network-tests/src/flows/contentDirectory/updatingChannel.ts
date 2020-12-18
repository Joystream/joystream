import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { UpdateChannelFixture } from '../../fixtures/contentDirectoryModule'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities/ChannelEntity'
import { assert } from 'chai'
import { Utils } from '../../utils'

export function createUpdateChannelHandleFixture(api: Api, handle: string, description: string): UpdateChannelFixture {
  // Create partial channel entity, only containing the fields we wish to update
  const channelUpdateInput: Partial<ChannelEntity> = {
    description,
  }

  const uniquePropVal: Record<string, any> = { handle }

  return new UpdateChannelFixture(api, channelUpdateInput, uniquePropVal)
}

export default async function updateChannel(api: Api, query: QueryNodeApi) {
  const handle = 'New channel example'
  const channelResult = await query.getChannelbyHandle(handle)
  const channel = channelResult.data.channels[0]

  const description = 'Updated description'
  const createUpdateChannelDescriptionHappyCaseFixture = createUpdateChannelHandleFixture(api, handle, description)

  await createUpdateChannelDescriptionHappyCaseFixture.runner()

  // Temporary solution (wait 2 minutes)
  await Utils.wait(120000)

  const channelAfterUpdateResult = await query.getChannelbyHandle(handle)
  const channelAfterUpdate = channelAfterUpdateResult.data.channels[0]

  // description field should be updated to provided one
  assert.equal(channelAfterUpdate.description, description, 'Should be equal')

  assert.equal(channelAfterUpdate.handle, channel.handle, 'Should be equal')
  assert.equal(channelAfterUpdate.coverPhotoUrl, channel.coverPhotoUrl, 'Should be equal')
  assert.equal(channelAfterUpdate.avatarPhotoUrl, channel.avatarPhotoUrl, 'Should be equal')
  assert.equal(channelAfterUpdate.isPublic, channel.isPublic, 'Should be equal')
}
