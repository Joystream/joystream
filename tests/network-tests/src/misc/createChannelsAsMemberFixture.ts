import { BaseFixture } from '../Fixture'
import { Api } from '../Api'
// import { MemberId } from '@joystream/types/members'
import { ChannelId } from '@joystream/types/common'
import { assert } from 'chai'

export class CreateChannelsAsMemberFixture extends BaseFixture {
  // Member that will be channel owner
  private memberId: number
  private numChannels: number
  private createdChannels: (ChannelId | null)[] = []

  constructor(api: Api, memberId: number, numChannels: number) {
    super(api)
    this.memberId = memberId
    this.numChannels = numChannels
  }

  public getCreatedChannels(): (ChannelId | null)[] {
    return this.createdChannels.slice()
  }

  public async execute(): Promise<void> {
    const account = await this.api.getMemberControllerAccount(this.memberId)

    const channels = []
    for (let i = 0; i < this.numChannels; i++) {
      channels.push(this.api.createMockChannel(this.memberId, account))
    }

    const channelIds = await Promise.all(channels)
    this.createdChannels = channelIds.filter((id) => id !== null)

    assert.equal(this.createdChannels.length, this.numChannels)
  }
}
