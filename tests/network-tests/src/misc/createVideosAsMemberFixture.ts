import { BaseFixture } from '../Fixture'
import { Api } from '../Api'

export class CreateVideosAsMemberFixture extends BaseFixture {
  // Member that will be channel owner
  private memberId: number
  private numVideos: number
  private channelId: number

  constructor(api: Api, memberId: number, channelId: number, numVideos: number) {
    super(api)
    this.memberId = memberId
    this.numVideos = numVideos
    this.channelId = channelId
  }

  public async execute(): Promise<void> {
    const account = await this.api.getMemberControllerAccount(this.memberId)

    const videos = []
    for (let i = 0; i < this.numVideos; i++) {
      videos.push(this.api.createMockVideo(this.memberId, this.channelId, account))
    }

    await Promise.all(videos)
  }
}
