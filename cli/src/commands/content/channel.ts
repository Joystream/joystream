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

  async run() {
    const { channelId } = this.parse(ChannelCommand).args
    const channel = await this.getApi().channelById(channelId)
    if (channel) {
      displayCollapsedRow({
        'ID': channelId.toString(),
        'Owner': JSON.stringify(channel.owner.toJSON()),
        'IsCensored': channel.is_censored.toString(),
        'RewardAccount': channel.reward_account ? channel.reward_account.toString() : 'NONE',
      })

      displayHeader(`Media`)

      displayCollapsedRow({
        'NumberOfVideos': channel.videos.length,
        'NumberOfPlaylists': channel.playlists.length,
        'NumberOfSeries': channel.series.length,
      })

      displayHeader(`MediaData`)

      displayCollapsedRow({
        'Videos': JSON.stringify(channel.videos.toJSON()),
        'Playlists': JSON.stringify(channel.playlists.toJSON()),
        'Series': JSON.stringify(channel.series.toJSON()),
      })
    } else {
      this.error(`Channel not found by channel id: "${channelId}"!`)
    }
  }
}
