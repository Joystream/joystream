import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { Video, VideoId } from '@joystream/types/content'
import { displayTable } from '../../helpers/display'

export default class VideosCommand extends ContentDirectoryCommandBase {
  static description = 'List existing content directory videos.'

  static args = [
    {
      name: 'channelId',
      required: false,
      description: 'ID of the Channel',
    },
  ]

  async run() {
    const { channelId } = this.parse(VideosCommand).args

    let videos: [VideoId, Video][]
    if (channelId) {
      videos = await this.getApi().videosByChannelId(channelId)
    } else {
      videos = await this.getApi().availableVideos()
    }

    if (videos.length > 0) {
      displayTable(
        videos.map(([id, v]) => ({
          'ID': id.toString(),
          'InChannel': v.in_channel.toString(),
          'InSeries': v.in_series.toString(),
          'IsCensored': v.is_censored.toString(),
        })),
        3
      )
    } else {
      this.log(`There are no videos${channelId ? ' in this channel' : ''} yet`)
    }
  }
}
