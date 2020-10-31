import { QueryNodeApi, WorkingGroups } from '../../Api'
import { UpdateChannelFixture } from '../../fixtures/contentDirectoryModule'
import { ChannelEntity } from 'cd-schemas/types/entities/ChannelEntity'
import { assert } from 'chai'
import { KeyringPair } from '@polkadot/keyring/types'

export function createUpdateChannelTitleFixture(api: QueryNodeApi, pair: KeyringPair): UpdateChannelFixture {
     // Create partial channel entity, only containing the fields we wish to update
  const channelUpdateInput: Partial<ChannelEntity> = {
    title: 'Updated channel title',
  }

  const uniquePropVal: Record<string, any> = { title: 'Example channel' }
  
    return new UpdateChannelFixture (api, channelUpdateInput, uniquePropVal, pair)
}

export default async function updateChannel(api: QueryNodeApi, pair: KeyringPair) {
  const createVideoHappyCaseFixture = createUpdateChannelTitleFixture(api, pair)
 
  await createVideoHappyCaseFixture.runner(false)
}