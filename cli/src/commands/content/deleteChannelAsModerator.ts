import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { flags } from '@oclif/command'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'
import { formatBalance } from '@polkadot/util'
import BN from 'bn.js'

export default class DeleteChannelAsModeratorCommand extends ContentDirectoryCommandBase {
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
    rationale: flags.string({
      char: 'r',
      required: true,
      description: 'Reason of deleting the channel by moderator',
    }),
    context: ContentDirectoryCommandBase.moderationActionContextFlag,
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const { channelId, force, rationale, context } = this.parse(DeleteChannelAsModeratorCommand).flags
    // Context
    const channel = await this.getApi().channelById(channelId)
    const [actor, address] = await this.getModerationActionActor(context)

    // Ensure moderator has required permission
    if (!(await this.isModeratorWithRequiredPermission(actor, channel.privilegeLevel, 'DeleteChannel'))) {
      this.error(`Only content lead or curator with "DeleteChannel" permission can delete channel ${channelId}!`, {
        exit: ExitCodes.AccessDenied,
      })
    }

    if (channel.numVideos.toNumber()) {
      this.error(
        `This channel still has ${channel.numVideos.toNumber()} associated video(s)!\n` +
          `Delete the videos first using ${chalk.magentaBright('content:deleteVideo')} command`
      )
    }

    const dataObjectsInfo = this.isQueryNodeUriSet()
      ? await this.getDataObjectsInfoFromQueryNode(channelId)
      : await this.getDataObjectsInfoFromChain(channelId)

    if (dataObjectsInfo.length) {
      if (!force) {
        this.error(`Cannot remove associated data objects unless ${chalk.magentaBright('--force')} flag is used`, {
          exit: ExitCodes.InvalidInput,
        })
      }
      const stateBloatBond = dataObjectsInfo.reduce((sum, [, bloatBond]) => sum.add(bloatBond), new BN(0))
      this.log(
        `Channel state bloat bond of ${chalk.cyanBright(
          formatBalance(channel.channelStateBloatBond)
        )} will be transferred to ${chalk.magentaBright(address)}\n` +
          `Data objects state bloat bond of ${chalk.cyanBright(
            formatBalance(stateBloatBond)
          )} will be transferred to ${chalk.magentaBright(address)}`
      )
    }

    await this.requireConfirmation(
      `Are you sure you want to remove channel ${chalk.magentaBright(channelId.toString())}${
        force ? ' and all associated data objects' : ''
      }?`
    )

    await this.sendAndFollowNamedTx(await this.getDecodedPair(address), 'content', 'deleteChannelAsModerator', [
      actor,
      channelId,
      force ? dataObjectsInfo.length : 0,
      rationale,
    ])
  }
}
