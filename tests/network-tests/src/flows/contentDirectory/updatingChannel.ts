import { QueryNodeApi, WorkingGroups } from '../../Api'
import { UpdateChannelFixture } from '../../fixtures/contentDirectoryModule'
import { ChannelEntity } from 'cd-schemas/types/entities/ChannelEntity'
import { assert } from 'chai'
import { Utils } from '../../utils'

export function createUpdateChannelDescriptionFixture(api: QueryNodeApi, description: string): UpdateChannelFixture {
  // Create partial channel entity, only containing the fields we wish to update
  const channelUpdateInput: Partial<ChannelEntity> = {
    description,
  }

  const uniquePropVal: Record<string, any> = { title: 'Example channel' }

  return new UpdateChannelFixture(api, channelUpdateInput, uniquePropVal)
}

export default async function updateChannel(api: QueryNodeApi) {

  const channelResult = await api.getChannelbyTitle('Example channel')
  const channel = channelResult.data.channels[0]

  const description = 'Updated description'
  const createUpdateChannelDescriptionHappyCaseFixture = createUpdateChannelDescriptionFixture(api, description)

  await createUpdateChannelDescriptionHappyCaseFixture.runner(false)

  // Temporary solution (wait 2 minutes)
  await Utils.wait(120000)

  const channelAfterUpdateResult = await api.getChannelbyTitle('Example channel')
  const channelAfterUpdate = channelAfterUpdateResult.data.channels[0]
   
  // description field should be updated to provided one 
  assert(channelAfterUpdate.description === description, 'Should be equal')

  assert(channelAfterUpdate.title === channel.title, 'Should be equal')
  assert(channelAfterUpdate.coverPhotoUrl === channel.coverPhotoUrl, 'Should be equal')
  assert(channelAfterUpdate.avatarPhotoUrl === channel.avatarPhotoURL, 'Should be equal')
  assert(channelAfterUpdate.isPublic === channel.isPublic, 'Should be equal')
}
