import { createType } from '@joystream/types'
import { flags } from '@oclif/command'
import { formatBalance } from '@polkadot/util'
import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import ExitCodes from '../../ExitCodes'
import BN from 'bn.js'

export default class DeleteChannelAssetsAsModeratorCommand extends ContentDirectoryCommandBase {
  static description = 'Delete the channel assets.'

  protected requiresQueryNode = true

  static flags = {
    channelId: flags.integer({
      char: 'c',
      required: true,
      description: 'ID of the Channel',
    }),
    assetIds: flags.integer({
      char: 'a',
      description: `List of data object IDs to delete`,
      required: true,
      multiple: true,
    }),
    rationale: flags.string({
      char: 'r',
      required: true,
      description: 'Reason for removing the channel assets by moderator',
    }),
    context: ContentDirectoryCommandBase.moderationActionContextFlag,
    ...ContentDirectoryCommandBase.flags,
  }

  async getDataObjectsInfo(channelId: number, assetIds: number[]): Promise<[string, BN][]> {
    const dataObjects = await this.getQNApi().dataObjectsByChannelId(channelId.toString())

    return assetIds.map((id) => {
      const dataObject = dataObjects.find((o) => o.id === id.toString())
      if (dataObject) {
        return [dataObject.id, new BN(dataObject.stateBloatBond)]
      }

      this.error(`Data object ${id} is not associated with channel ${channelId}`, {
        exit: ExitCodes.InvalidInput,
      })
    })
  }

  async run(): Promise<void> {
    const { channelId, assetIds, rationale, context } = this.parse(DeleteChannelAssetsAsModeratorCommand).flags
    // Context
    const [actor, address] = await this.getModerationActionActor(context)
    // ensure channel exists
    const { privilegeLevel } = await this.getApi().channelById(channelId)

    // Ensure moderator has required permission
    if (!(await this.isModeratorWithRequiredPermission(actor, privilegeLevel, 'DeleteNonVideoChannelAssets'))) {
      this.error(
        `Only content lead or curator with "DeleteNonVideoChannelAssets" permission can delete channel ${channelId} assets!`,
        {
          exit: ExitCodes.AccessDenied,
        }
      )
    }

    const dataObjectsInfo = await this.getDataObjectsInfo(channelId, assetIds)
    const stateBloatBond = dataObjectsInfo.reduce((sum, [, bloatBond]) => sum.add(bloatBond), new BN(0))
    this.log(
      `Data objects state bloat bond of ${chalk.cyanBright(
        formatBalance(stateBloatBond)
      )} will be transferred to ${chalk.magentaBright(address)}`
    )

    await this.requireConfirmation(
      `Are you sure you want to remove assets ${assetIds} associated with channel ${chalk.magentaBright(channelId)}?`
    )

    await this.sendAndFollowNamedTx(await this.getDecodedPair(address), 'content', 'deleteChannelAssetsAsModerator', [
      actor,
      channelId,
      createType(
        'BTreeSet<u64>',
        dataObjectsInfo.map(([id]) => Number(id))
      ),
      rationale,
    ])
  }
}
