import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { flags } from '@oclif/command'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'
import { formatBalance } from '@polkadot/util'
import BN from 'bn.js'
import { PalletContentChannelActionPermission as ChannelActionPermission } from '@polkadot/types/lookup'

export default class DeleteChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Delete the channel and optionally all associated data objects.'

  static flags = {
    context: ContentDirectoryCommandBase.channelManagementContextFlag,
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
    const { context, channelId, force } = this.parse(DeleteChannelCommand).flags
    // Context
    const channel = await this.getApi().channelById(channelId)
    const [actor, address] = await this.getChannelManagementActor(channel, context)

    const dataObjectsInfo = this.isQueryNodeUriSet()
      ? await this.getDataObjectsInfoFromQueryNode(channelId)
      : await this.getDataObjectsInfoFromChain(channelId)

    // Ensure actor is authorized to perform channel deletion
    const requiredPermissions: ChannelActionPermission['type'][] = dataObjectsInfo.length
      ? ['DeleteChannel', 'ManageNonVideoChannelAssets']
      : ['DeleteChannel']
    if (!(await this.hasRequiredChannelAgentPermissions(actor, channel, requiredPermissions))) {
      this.error(
        `Only channelOwner or collaborator with ${requiredPermissions} permissions can perform this deletion!`,
        {
          exit: ExitCodes.AccessDenied,
        }
      )
    }

    if (channel.numVideos.toNumber()) {
      this.error(
        `This channel still has 
        ${channel.numVideos.toNumber()} associated video(s)!\n` +
          `Delete the videos first using ${chalk.magentaBright('content:deleteVideo')} command`
      )
    }

    if (dataObjectsInfo.length) {
      if (!force) {
        this.error(`Cannot remove associated data objects unless ${chalk.magentaBright('--force')} flag is used`, {
          exit: ExitCodes.InvalidInput,
        })
      }
      const dataObjectsStateBloatBond = dataObjectsInfo.reduce((sum, [, bloatBond]) => sum.add(bloatBond), new BN(0))
      this.log(
        `Channel state bloat bond of ${chalk.cyanBright(
          formatBalance(channel.channelStateBloatBond.amount)
        )} will be transferred to ${chalk.magentaBright(
          channel.channelStateBloatBond.repaymentRestrictedTo.unwrapOr(address).toString()
        )}\n` +
          `Data objects state bloat bond of ${chalk.cyanBright(
            formatBalance(dataObjectsStateBloatBond)
          )} will be repaid with accordance to the bloat bond policy.`
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
      await this.getChannelBagWitness(channelId),
      force ? dataObjectsInfo.length : 0,
    ])
  }
}
