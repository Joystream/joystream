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
    assetIds: flags.string({
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
    ...ContentDirectoryCommandBase.flags,
  }

  async getDataObjectsInfo(channelId: number, assetIds: string[]): Promise<[string, BN][]> {
    const dataObjects = await this.getQNApi().dataObjectsByChannelId(channelId.toString())

    return assetIds.map((id) => {
      const dataObject = dataObjects.find((o) => o.id === id)
      if (dataObject) {
        return [dataObject.id, new BN(dataObject.stateBloatBond)]
      }

      this.error(`Data object ${id} is not associated with channel ${channelId}`, {
        exit: ExitCodes.InvalidInput,
      })
    })
  }

  async run(): Promise<void> {
    const {
      flags: { channelId, assetIds, rationale },
    } = this.parse(DeleteChannelAssetsAsModeratorCommand)
    // Context
    const [actor, address] = await this.getCuratorContext()

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
