import { createType } from '@joystream/types'
import { flags } from '@oclif/command'
import { formatBalance } from '@polkadot/util'
import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import ExitCodes from '../../ExitCodes'

export default class DeleteVideoAssetsAsModeratorCommand extends ContentDirectoryCommandBase {
  static description = 'Delete the video assets.'

  protected requiresQueryNode = true

  static flags = {
    videoId: flags.integer({
      char: 'v',
      required: true,
      description: 'ID of the Video',
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
      description: 'Reason for removing the video assets by moderator',
    }),
    ...ContentDirectoryCommandBase.flags,
  }

  async getDataObjectsInfo(videoId: number, assetIds: string[]): Promise<number[]> {
    const dataObjects = (await this.getQNApi().dataObjectsByVideoId(videoId.toString())).map((o) => o.id)

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
      flags: { videoId, assetIds, rationale },
    } = this.parse(DeleteVideoAssetsAsModeratorCommand)
    // Context
    const [actor, address] = await this.getCuratorContext()

    const dataObjects = await this.getDataObjectsInfo(videoId, assetIds)
    const stateBloatBond = dataObjects.length * (await this.getApi().dataObjectStateBloatBond())
    this.log(
      `Data objects state bloat bond of ${chalk.cyanBright(
        formatBalance(stateBloatBond)
      )} will be transferred to ${chalk.magentaBright(address)}`
    )

    await this.requireConfirmation(
      `Are you sure you want to remove assets ${assetIds} associated with video ${chalk.magentaBright(videoId)}?`
    )

    await this.sendAndFollowNamedTx(await this.getDecodedPair(address), 'content', 'deleteVideoAssetsAsModerator', [
      actor,
      videoId,
      createType('BTreeSet<u64>', dataObjects),
      rationale,
    ])
  }
}
