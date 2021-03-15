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
    const [id, aChannel] = await this.channelEntryById(channelId)

    displayCollapsedRow({
      'ID': id.toString(),
      'Owner': JSON.stringify(aChannel.owner.toJSON()),
      'IsCensored': aChannel.is_censored.toString(),
      'RewardAccount': aChannel.reward_account? aChannel.reward_account.toString() : 'NONE'
    })

    displayHeader(`Media`)

    displayCollapsedRow({
      'NumberOfVideos': aChannel.videos.length,
      'NumberOfPlaylists': aChannel.playlists.length,
      'NumberOfSeries': aChannel.series.length,
    })

    displayHeader(`MediaData`)

    displayCollapsedRow({
      'Videos': JSON.stringify(aChannel.videos.toJSON()),
      'Playlists': JSON.stringify(aChannel.playlists.toJSON()),
      'Series': JSON.stringify(aChannel.series.toJSON()),
    })
  }
}
