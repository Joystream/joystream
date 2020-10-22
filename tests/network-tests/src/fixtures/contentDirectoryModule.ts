import { Api } from '../Api'
import BN from 'bn.js'
import { assert } from 'chai'
import { Seat } from '@joystream/types/council'
import { v4 as uuid } from 'uuid'
import { Utils } from '../utils'
import { Fixture } from '../Fixture'
import { ChannelEntity } from 'cd-schemas/types/entities/ChannelEntity'
import { VideoEntity } from 'cd-schemas/types/entities/VideoEntity'

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

export class CreateVideoFixture implements Fixture {
  private api: Api
  private memberId: number
  private videoEntity: VideoEntity

  public constructor(api: Api, memberId: number, videoEntity: VideoEntity) {
    this.api = api
    this.memberId = memberId
    this.videoEntity = videoEntity
  }

  public async runner(expectFailure: boolean): Promise<void> {
    await this.api.createVideoEntity(this.memberId, this.videoEntity)


    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}