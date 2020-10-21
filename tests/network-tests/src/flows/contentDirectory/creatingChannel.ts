import { Api, WorkingGroups } from '../../Api'
import { createSimpleChannelFixture } from '../../fixtures/contentDirectoryModule'
import { assert } from 'chai'

export default async function channelCreation(api: Api) {
  const createChannelHappyCaseFixture = createSimpleChannelFixture(api)

  await createChannelHappyCaseFixture.runner(false)
}