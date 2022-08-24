import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { flags } from '@oclif/command'
import BN from 'bn.js'
import chalk from 'chalk'
import { formatBalance } from '@polkadot/util'
import { createType } from '@joystream/types'
import ExitCodes from '../../ExitCodes'

export default class DeleteVideoAsModeratorCommand extends ContentDirectoryCommandBase {
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
    rationale: flags.string({
      char: 'r',
      required: true,
      description: 'reason of deleting the video by moderator',
    }),
    context: ContentDirectoryCommandBase.moderationActionContextFlag,
    ...ContentDirectoryCommandBase.flags,
  }

  async getDataObjectsInfo(videoId: number): Promise<[string, BN][]> {
    const dataObjects = await this.getQNApi().dataObjectsByVideoId(videoId.toString())

    if (dataObjects.length) {
      this.log('Following data objects are still associated with the video:')
      dataObjects.forEach((o) => {
        this.log(`${o.id} - ${o.type.__typename}`)
      })
    }

    return dataObjects.map((o) => [o.id, new BN(o.stateBloatBond)])
  }

  async run(): Promise<void> {
    const {
      flags: { videoId, force, rationale, context },
    } = this.parse(DeleteVideoAsModeratorCommand)
    // Context
    const [actor, address] = await this.getModerationActionActor(context)
    // ensure video exists
    const { inChannel, videoStateBloatBond } = await this.getApi().videoById(videoId)
    const { privilegeLevel } = await this.getApi().channelById(inChannel)

    // Ensure moderator has required permission
    if (!(await this.isModeratorWithRequiredPermission(actor, privilegeLevel, 'DeleteVideo'))) {
      this.error(`Only content lead or curator with "DeleteVideo" permission can delete video ${videoId}!`, {
        exit: ExitCodes.AccessDenied,
      })
    }

    const dataObjectsInfo = await this.getDataObjectsInfo(videoId)
    if (dataObjectsInfo.length) {
      if (!force) {
        this.error(`Cannot remove associated data objects unless ${chalk.magentaBright('--force')} flag is used`, {
          exit: ExitCodes.InvalidInput,
        })
      }
      const stateBloatBond = dataObjectsInfo.reduce((sum, [, bloatBond]) => sum.add(bloatBond), new BN(0))
      this.log(
        `Video state bloat bond of ${chalk.cyanBright(
          formatBalance(videoStateBloatBond)
        )} will be transferred to ${chalk.magentaBright(address)}\n` +
          `Data objects state bloat bond of ${chalk.cyanBright(
            formatBalance(stateBloatBond)
          )} will be transferred to ${chalk.magentaBright(address)}`
      )
    }

    await this.requireConfirmation(
      `Are you sure you want to remove video ${chalk.magentaBright(videoId)}${
        force ? ' and all associated data objects' : ''
      }?`
    )

    await this.sendAndFollowNamedTx(await this.getDecodedPair(address), 'content', 'deleteVideoAsModerator', [
      actor,
      videoId,
      createType('u64', dataObjectsInfo.length),
      rationale,
    ])
  }
}
