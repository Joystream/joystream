import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { displayCollapsedRow, displayHeader } from '../../helpers/display'

export default class ChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Show Channel details by id.'
  static args = [
    {
      name: 'channelId',
      required: true,
      description: 'Name or ID of the Channel',
    },
  ]

  async run(): Promise<void> {
    const { channelId } = this.parse(ChannelCommand).args
    const channel = await this.getApi().channelById(channelId)
    if (channel) {
      displayCollapsedRow({
        'ID': channelId.toString(),
        'Owner': JSON.stringify(channel.owner.toJSON()),
        'IsCensored': channel.is_censored.toString(),
        'RewardAccount': channel.reward_account.unwrapOr('NONE').toString(),
      })

      displayHeader(`Media`)
      displayCollapsedRow({
        'NumberOfVideos': channel.num_videos.toNumber(),
      })

      displayHeader(`Collaborators`)
      const collaboratorIds = Array.from(channel.collaborators)
      const collaborators = await this.getApi().getMembers(collaboratorIds)
      this.log(collaborators.map((c, i) => `${collaboratorIds[i].toString()} (${c.handle.toString()})`).join(', '))
    } else {
      this.error(`Channel not found by channel id: "${channelId}"!`)
    }
  }
}
