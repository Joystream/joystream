import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { displayCollapsedRow } from '../../helpers/display'

export default class VideoCommand extends ContentDirectoryCommandBase {
  static description = 'Show Video details by id.'
  static args = [
    {
      name: 'videoId',
      required: true,
      description: 'ID of the Video',
    },
  ]

  async run(): Promise<void> {
    const { videoId } = this.parse(VideoCommand).args
    const aVideo = await this.getApi().videoById(videoId)
    if (aVideo) {
      displayCollapsedRow({
        'ID': videoId.toString(),
        'InChannel': aVideo.in_channel.toString(),
        'InSeries': aVideo.in_series.unwrapOr('NONE').toString(),
        'IsCensored': aVideo.is_censored.toString(),
      })
    } else {
      this.error(`Video not found by channel id: "${videoId}"!`)
    }
  }
}
