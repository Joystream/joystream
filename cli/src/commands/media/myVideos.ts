import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { VideoEntity } from '@joystream/cd-schemas/types/entities/VideoEntity'
import { displayTable } from '../../helpers/display'
import chalk from 'chalk'
import { flags } from '@oclif/command'

export default class MyVideosCommand extends ContentDirectoryCommandBase {
  static description = "Show the list of videos associated with current account's membership."
  static flags = {
    channel: flags.integer({
      char: 'c',
      required: false,
      description: 'Channel id to filter the videos by',
    }),
  }

  async run() {
    const memberId = await this.getRequiredMemberId()

    const { channel } = this.parse(MyVideosCommand).flags
    const props: (keyof VideoEntity)[] = ['title', 'isPublic', 'channel']
    const filters: [string, string][] = channel !== undefined ? [['channel', channel.toString()]] : []

    const list = await this.createEntityList('Video', props, filters, memberId)

    if (list.length) {
      displayTable(list, 3)
      this.log(`\nTIP: Use ${chalk.bold('content-directory:entity ID')} command to see more details about given video`)
    } else {
      this.log(`No videos uploaded yet! Upload a video with ${chalk.bold('media:uploadVideo')}`)
    }
  }
}
