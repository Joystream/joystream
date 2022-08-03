import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { flags } from '@oclif/command'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'
import { formatBalance } from '@polkadot/util'
import BN from 'bn.js'

export default class DeleteChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Delete the channel and optionally all associated data objects.'

  static flags = {
    channelId: flags.integer({
      char: 'c',
      required: true,
      description: 'ID of the Channel',
    }),
    force: flags.boolean({
      char: 'f',
      default: false,
      description: 'Force-remove all associated channel data objects',
    }),
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const {
      flags: { channelId, force },
    } = this.parse(DeleteChannelCommand)
    // Context
    const channel = await this.getApi().channelById(channelId)
    const [actor, address] = await this.getChannelOwnerActor(channel)

    if (channel.numVideos.toNumber()) {
      this.error(
        `This channel still has ${channel.numVideos.toNumber()} associated video(s)!\n` +
          `Delete the videos first using ${chalk.magentaBright('content:deleteVideo')} command`
      )
    }

    const videosInfo = await this.getVideosInfoFromQueryNode(channelId)
    const dataObjectsInfo = this.isQueryNodeUriSet()
      ? await this.getDataObjectsInfoFromQueryNode(channelId)
      : await this.getDataObjectsInfoFromChain(channelId)

    if (dataObjectsInfo.length) {
      if (!force) {
        this.error(`Cannot remove associated data objects unless ${chalk.magentaBright('--force')} flag is used`, {
          exit: ExitCodes.InvalidInput,
        })
      }
      const videosStateBloatBond = videosInfo.reduce((sum, [, bloatBond]) => sum.add(bloatBond), new BN(0))
      const dataObjectsStateBloatBond = dataObjectsInfo.reduce((sum, [, bloatBond]) => sum.add(bloatBond), new BN(0))
      this.log(
        `Videos state bloat bond of ${chalk.cyanBright(
          formatBalance(videosStateBloatBond)
        )} will be transferred to ${chalk.magentaBright(address)}\n` +
          `Data objects state bloat bond of ${chalk.cyanBright(
            formatBalance(dataObjectsStateBloatBond)
          )} will be transferred to ${chalk.magentaBright(address)}`
      )
    }

    await this.requireConfirmation(
      `Are you sure you want to remove channel ${chalk.magentaBright(channelId.toString())}${
        force ? ' and all associated data objects' : ''
      }?`
    )

    await this.sendAndFollowNamedTx(await this.getDecodedPair(address), 'content', 'deleteChannel', [
      actor,
      channelId,
      force ? dataObjectsInfo.length : 0,
    ])
  }
}
