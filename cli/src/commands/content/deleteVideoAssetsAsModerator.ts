import { createType } from '@joystream/types'
import { flags } from '@oclif/command'
import { formatBalance } from '@polkadot/util'
import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import ExitCodes from '../../ExitCodes'
import BN from 'bn.js'

export default class DeleteVideoAssetsAsModeratorCommand extends ContentDirectoryCommandBase {
  static description = 'Delete the video assets.'

  protected requiresQueryNode = true

  static flags = {
    videoId: flags.integer({
      char: 'v',
      required: true,
      description: 'ID of the Video',
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
      description: 'Reason for removing the video assets by moderator',
    }),
    context: ContentDirectoryCommandBase.moderationActionContextFlag,
    ...ContentDirectoryCommandBase.flags,
  }

  async getDataObjectsInfo(videoId: number, assetIds: string[]): Promise<[string, BN][]> {
    const dataObjects = await this.getQNApi().dataObjectsByVideoId(videoId.toString())

    return assetIds.map((id) => {
      const dataObject = dataObjects.find((o) => o.id === id)
      if (dataObject) {
        return [dataObject.id, new BN(dataObject.stateBloatBond)]
      }

      this.error(`Data object ${id} is not associated with video ${videoId}`, {
        exit: ExitCodes.InvalidInput,
      })
    })
  }

  async run(): Promise<void> {
    const { videoId, assetIds, rationale, context } = this.parse(DeleteVideoAssetsAsModeratorCommand).flags
    // Context
    const [actor, address] = await this.getModerationActionActor(context)
    // ensure video exists
    const { inChannel, nftStatus } = await this.getApi().videoById(videoId)
    const { privilegeLevel } = await this.getApi().channelById(inChannel)

    // Ensure moderator has required permission
    if (
      !(await this.isModeratorWithRequiredPermission(actor, privilegeLevel, { DeleteVideoAssets: nftStatus.isSome }))
    ) {
      this.error(
        `Only content lead or curator with DeleteVideoAssets(${nftStatus.isSome}) permission can delete video ${videoId} assets!`,
        {
          exit: ExitCodes.AccessDenied,
        }
      )
    }

    const dataObjectsInfo = await this.getDataObjectsInfo(videoId, assetIds)
    const stateBloatBond = dataObjectsInfo.reduce((sum, [, bloatBond]) => sum.add(bloatBond), new BN(0))
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
      createType(
        'BTreeSet<u64>',
        dataObjectsInfo.map(([id]) => Number(id))
      ),
      rationale,
    ])
  }
}
