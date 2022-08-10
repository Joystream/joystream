import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { VideoId } from '@joystream/types/primitives'
import { PalletContentVideoRecord as Video } from '@polkadot/types/lookup'
import { displayTable } from '../../helpers/display'
import { formatBalance } from '@polkadot/util'

export default class VideosCommand extends ContentDirectoryCommandBase {
  static description = 'List existing content directory videos.'

  static args = [
    {
      name: 'channelId',
      required: false,
      description: 'ID of the Channel',
    },
  ]

  static flags = {
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const { channelId } = this.parse(VideosCommand).args

    let videos: [VideoId, Video][] = await this.getApi().availableVideos()
    if (channelId) {
      videos = videos.filter(([, v]) => v.inChannel.eqn(parseInt(channelId)))
    }

    if (videos.length > 0) {
      displayTable(
        videos.map(([id, v]) => ({
          'ID': id.toString(),
          'InChannel': v.inChannel.toString(),
          'VideoStateBloatBond': formatBalance(v.videoStateBloatBond),
          'DataObjects': v.dataObjects.toString(),
        })),
        3
      )
    } else {
      this.log(`There are no videos${channelId ? ' in this channel' : ''} yet`)
    }
  }
}
