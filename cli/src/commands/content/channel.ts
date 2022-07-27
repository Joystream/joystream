import { MemberId } from '@joystream/types/primitives'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { displayCollapsedRow, displayHeader, memberHandle } from '../../helpers/display'

export default class ChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Show Channel details by id.'
  static args = [
    {
      name: 'channelId',
      required: true,
      description: 'Name or ID of the Channel',
    },
  ]

  static flags = {
    ...ContentDirectoryCommandBase.flags,
  }

  async displayMembersSet(set: MemberId[]): Promise<void> {
    const members = await this.getApi().membersDetailsByIds(set)
    this.log(members.length ? members.map((m) => `${m.id} (${memberHandle(m)})`).join(', ') : 'NONE')
  }

  async run(): Promise<void> {
    const { channelId } = this.parse(ChannelCommand).args
    const channel = await this.getApi().channelById(channelId)
    if (channel) {
      displayCollapsedRow({
        'ID': channelId.toString(),
        'Owner': JSON.stringify(channel.owner.toJSON()),
      })

      displayHeader(`Media`)
      displayCollapsedRow({
        'NumberOfVideos': channel.numVideos.toNumber(),
      })

      displayHeader(`Collaborators`)
      await this.displayMembersSet([...channel.collaborators.keys()])
    } else {
      this.error(`Channel not found by channel id: "${channelId}"!`)
    }
  }
}
