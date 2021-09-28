import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { flags } from '@oclif/command'
import chalk from 'chalk'

export default class DeleteChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Delete the channel (it cannot have any associated assets and videos).'

  static flags = {
    channelId: flags.integer({
      char: 'c',
      required: true,
      description: 'ID of the Channel',
    }),
  }

  async run(): Promise<void> {
    const {
      flags: { channelId },
    } = this.parse(DeleteChannelCommand)
    // Context
    const account = await this.getRequiredSelectedAccount()
    const channel = await this.getApi().channelById(channelId)
    const actor = await this.getChannelOwnerActor(channel)
    await this.requestAccountDecoding(account)

    if (channel.num_assets.toNumber()) {
      this.error(
        `This channel still has ${channel.num_assets.toNumber()} associated asset(s)!\n` +
          `Delete the assets first using ${chalk.magentaBright('content:removeChannelAssets')} command`
      )
    }

    if (channel.num_videos.toNumber()) {
      this.error(
        `This channel still has ${channel.num_videos.toNumber()} associated video(s)!\n` +
          `Delete the videos first using ${chalk.magentaBright('content:deleteVideo')} command`
      )
    }

    await this.requireConfirmation(`Are you sure you want to remove the channel with ID ${channelId.toString()}?`)

    await this.sendAndFollowNamedTx(account, 'content', 'deleteChannel', [actor, channelId])
  }
}
