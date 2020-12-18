import { QueryNodeApi } from '../Api'
import { Fixture } from '../Fixture'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities/ChannelEntity'
import { VideoEntity } from '@joystream/cd-schemas/types/entities/VideoEntity'

export class CreateChannelFixture implements Fixture {
  private api: QueryNodeApi
  public channelEntity: ChannelEntity

  public constructor(api: QueryNodeApi, channelEntity: ChannelEntity) {
    this.api = api
    this.channelEntity = channelEntity
  }

  public async runner(): Promise<void> {
    await this.api.createChannelEntity(this.channelEntity)
  }
}

export class CreateVideoFixture implements Fixture {
  private api: QueryNodeApi
  public videoEntity: VideoEntity

  public constructor(api: QueryNodeApi, videoEntity: VideoEntity) {
    this.api = api
    this.videoEntity = videoEntity
  }

  public async runner(): Promise<void> {
    await this.api.createVideoEntity(this.videoEntity)
  }
}

export class UpdateChannelFixture implements Fixture {
  private api: QueryNodeApi
  private channelUpdateInput: Record<string, any>
  private uniquePropValue: Record<string, any>

  public constructor(api: QueryNodeApi, channelUpdateInput: Record<string, any>, uniquePropValue: Record<string, any>) {
    this.api = api
    this.channelUpdateInput = channelUpdateInput
    this.uniquePropValue = uniquePropValue
  }

  public async runner(): Promise<void> {
    await this.api.updateChannelEntity(this.channelUpdateInput, this.uniquePropValue)
  }
}
