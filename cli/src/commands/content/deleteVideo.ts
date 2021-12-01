import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { flags } from '@oclif/command'
import BN from 'bn.js'
import chalk from 'chalk'
import { formatBalance } from '@polkadot/util'
import { createType } from '@joystream/types'
import ExitCodes from '../../ExitCodes'

export default class DeleteVideoCommand extends ContentDirectoryCommandBase {
  static description = 'Delete the video and optionally all associated data objects.'

  protected requiresQueryNode = true

  static flags = {
    videoId: flags.integer({
      char: 'v',
      required: true,
      description: 'ID of the Video',
    }),
    force: flags.boolean({
      char: 'f',
      default: false,
      description: 'Force-remove all associated video data objects',
    }),
    context: ContentDirectoryCommandBase.channelManagementContextFlag,
  }

  async getDataObjectsInfo(videoId: number): Promise<[string, BN][]> {
    const dataObjects = await this.getQNApi().dataObjectsByVideoId(videoId.toString())

    if (dataObjects.length) {
      this.log('Following data objects are still associated with the video:')
      dataObjects.forEach((o) => {
        this.log(`${o.id} - ${o.type.__typename}`)
      })
    }

    return dataObjects.map((o) => [o.id, new BN(o.deletionPrize)])
  }

  async run(): Promise<void> {
    const {
      flags: { videoId, force, context },
    } = this.parse(DeleteVideoCommand)
    // Context
    const account = await this.getRequiredSelectedAccount()
    const video = await this.getApi().videoById(videoId)
    const channel = await this.getApi().channelById(video.in_channel.toNumber())
    const actor = await this.getChannelManagementActor(channel, context)
    await this.requestAccountDecoding(account)

    const dataObjectsInfo = await this.getDataObjectsInfo(videoId)
    if (dataObjectsInfo.length) {
      if (!force) {
        this.error(`Cannot remove associated data objects unless ${chalk.magentaBright('--force')} flag is used`, {
          exit: ExitCodes.InvalidInput,
        })
      }
      const deletionPrize = dataObjectsInfo.reduce((sum, [, prize]) => sum.add(prize), new BN(0))
      this.log(
        `Data objects deletion prize of ${chalk.cyanBright(
          formatBalance(deletionPrize)
        )} will be transferred to ${chalk.magentaBright(account.address)}`
      )
    }

    await this.requireConfirmation(
      `Are you sure you want to remove video ${chalk.magentaBright(videoId)}${
        force ? ' and all associated data objects' : ''
      }?`
    )

    await this.sendAndFollowNamedTx(account, 'content', 'deleteVideo', [
      actor,
      videoId,
      createType(
        'BTreeSet<DataObjectId>',
        dataObjectsInfo.map(([id]) => id)
      ),
    ])
  }
}
