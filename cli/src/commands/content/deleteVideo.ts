import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { flags } from '@oclif/command'
import BN from 'bn.js'
import chalk from 'chalk'
import { formatBalance } from '@polkadot/util'
import { createTypeFromConstructor } from '@joystream/types'
import { BagId } from '@joystream/types/storage'

export default class DeleteChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Delete the video (it cannot have any associated data objects).'

  static flags = {
    videoId: flags.integer({
      char: 'v',
      required: true,
      description: 'ID of the Video',
    }),
  }

  async run(): Promise<void> {
    const {
      flags: { videoId },
    } = this.parse(DeleteChannelCommand)
    // Context
    const account = await this.getRequiredSelectedAccount()
    const video = await this.getApi().videoById(videoId)
    const channel = await this.getApi().channelById(video.in_channel.toNumber())
    const actor = await this.getChannelOwnerActor(channel)
    await this.requestAccountDecoding(account)

    const bagId = createTypeFromConstructor(BagId, { Dynamic: { Channel: video.in_channel } })

    const dataObjects = await this.getApi().dataObjectsByIds(
      bagId,
      Array.from(video.maybe_data_objects_id_set.unwrapOr([]))
    )

    if (dataObjects.length) {
      const deletionPrize = dataObjects.reduce((a, b) => a.add(b.deletion_prize), new BN(0))
      this.log(
        `Data objects deletion prize of ${chalk.cyanBright(
          formatBalance(deletionPrize)
        )} will be transferred to ${chalk.magentaBright(channel.deletion_prize_source_account_id.toString())}`
      )
    }

    await this.requireConfirmation(`Are you sure you want to remove the video with ID ${videoId.toString()}?`)

    await this.sendAndFollowNamedTx(account, 'content', 'deleteVideo', [actor, videoId])
  }
}
