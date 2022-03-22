import { BaseFixture } from '../Fixture'
import { Api } from '../Api'
import { ChannelId } from '@joystream/types/common'

export class CreateChannelsAsMemberFixture extends BaseFixture {
  // Member that will be channel owner
  private memberId: number
  private numChannels: number
  private createdChannels: ChannelId[] = []

  constructor(api: Api, memberId: number, numChannels: number) {
    super(api)
    this.memberId = memberId
    this.numChannels = numChannels
  }

  public getCreatedChannels(): ChannelId[] {
    return this.createdChannels.slice()
  }

  public async execute(): Promise<void> {
    const account = await this.api.getMemberControllerAccount(this.memberId)

    const channels: Promise<ChannelId>[] = []
    for (let i = 0; i < this.numChannels; i++) {
      channels.push(this.api.createMockChannel(this.memberId, account))
    }

    this.createdChannels = await Promise.all(channels)
  }
}
