import { createType } from '@joystream/types'
import { flags } from '@oclif/command'
import { formatBalance } from '@polkadot/util'
import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import ExitCodes from '../../ExitCodes'

export default class DeleteChannelAssetsAsModeratorCommand extends ContentDirectoryCommandBase {
  static description = 'Delete the channel assets.'

  protected requiresQueryNode = true

  static flags = {
    channelId: flags.integer({
      char: 'v',
      required: true,
      description: 'ID of the Channel',
    }),
    assetIds: flags.build({
      parse: (value: string) => {
        const arr = value.split(',').map((v) => {
          if (!/^-?\d+$/.test(v)) {
            throw new Error(`Expected comma-separated integers, but received: ${value}`)
          }
          return v
        })
        return arr
      },
    })({
      char: 'a',
      description: `Comma separated list of data object IDs to delete`,
      required: true,
    }),
    rationale: flags.string({
      char: 'r',
      required: true,
      description: 'Reason for removing the channel assets by moderator',
    }),
    ...ContentDirectoryCommandBase.flags,
  }

  async getDataObjectsInfo(videoId: number, assetIds: string[]): Promise<number[]> {
    const dataObjects = (await this.getQNApi().dataObjectsByChannelId(videoId.toString())).map((o) => o.id)

    return assetIds.map((id) => {
      if (!dataObjects.includes(id)) {
        this.error(`Data object ${id} is not associated eith video ${videoId}`, {
          exit: ExitCodes.InvalidInput,
        })
      }
      return parseInt(id)
    })
  }

  async run(): Promise<void> {
    const {
      flags: { channelId, assetIds, rationale },
    } = this.parse(DeleteChannelAssetsAsModeratorCommand)
    // Context
    const [actor, address] = await this.getCuratorContext()

    const dataObjects = await this.getDataObjectsInfo(channelId, assetIds)
    const stateBloatBond = dataObjects.length * (await this.getApi().dataObjectStateBloatBond())
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
      createType('BTreeSet<u64>', dataObjects),
      rationale,
    ])
  }
}
