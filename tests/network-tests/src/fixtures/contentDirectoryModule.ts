import { Api } from '../Api'
import BN from 'bn.js'
import { assert } from 'chai'
import { Seat } from '@joystream/types/council'
import { v4 as uuid } from 'uuid'
import { Utils } from '../utils'
import { Fixture } from '../Fixture'
import { ChannelEntity } from 'cd-schemas/types/entities/ChannelEntity'

export class CreateChannelFixture implements Fixture {
  private api: Api
  private memberId: number
  private channelEntity: ChannelEntity

  public constructor(api: Api, memberId: number, channelEntity: ChannelEntity) {
    this.api = api
    this.memberId = memberId
    this.channelEntity = channelEntity
  }

  public async runner(expectFailure: boolean): Promise<void> {
    await this.api.createChannelEntity(this.memberId, this.channelEntity)


    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

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