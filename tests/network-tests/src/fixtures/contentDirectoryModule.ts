import { Api } from '../Api'
import { BaseFixture } from '../Fixture'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities/ChannelEntity'
import { VideoEntity } from '@joystream/cd-schemas/types/entities/VideoEntity'

export class CreateChannelFixture extends BaseFixture {
  public channelEntity: ChannelEntity

  public constructor(api: Api, channelEntity: ChannelEntity) {
    super(api)
    this.channelEntity = channelEntity
  }

  public async execute(): Promise<void> {
    this.expectDispatchSuccess(
      await this.api.createChannelEntity(this.channelEntity),
      'Create Channel should have succeeded'
    )
  }
}

export class CreateVideoFixture extends BaseFixture {
  public videoEntity: VideoEntity

  public constructor(api: Api, videoEntity: VideoEntity) {
    super(api)
    this.videoEntity = videoEntity
  }

  public async execute(): Promise<void> {
    this.expectDispatchSuccess(await this.api.createVideoEntity(this.videoEntity), 'Create Video should have succeeded')
  }
}

export class UpdateChannelFixture extends BaseFixture {
  private channelUpdateInput: Record<string, any>
  private uniquePropValue: Record<string, any>

  public constructor(api: Api, channelUpdateInput: Record<string, any>, uniquePropValue: Record<string, any>) {
    super(api)
    this.channelUpdateInput = channelUpdateInput
    this.uniquePropValue = uniquePropValue
  }

  public async execute(): Promise<void> {
    this.expectDispatchSuccess(
      await this.api.updateChannelEntity(this.channelUpdateInput, this.uniquePropValue),
      'Update Channel should have succeeded'
    )
  }
}
