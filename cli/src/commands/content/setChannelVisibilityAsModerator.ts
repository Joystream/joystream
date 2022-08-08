import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { flags } from '@oclif/command'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'

const CHANNEL_VISIBILITY_CONTEXTS = ['VISIBLE', 'HIDDEN'] as const

export default class SetChannelVisibilityAsModeratorCommand extends ContentDirectoryCommandBase {
  static description = 'Set channel visibility as moderator.'

  static flags = {
    channelId: flags.integer({
      char: 'c',
      required: true,
      description: 'ID of the channel',
    }),
    status: flags.enum({
      char: 's',
      options: [...CHANNEL_VISIBILITY_CONTEXTS],
      description: 'The visibility status of the channel',
      required: true,
    }),
    rationale: flags.string({
      char: 'r',
      required: true,
      description: 'Reason for changing visibility of channel',
    }),
    context: ContentDirectoryCommandBase.moderationActionContextFlag,
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const { channelId, status, rationale, context } = this.parse(SetChannelVisibilityAsModeratorCommand).flags
    // Context
    const { privilegeLevel } = await this.getApi().channelById(channelId)
    const [actor, address] = await this.getModerationActionActor(context)

    // Ensure moderator has required permission
    if (!(await this.isModeratorWithRequiredPermission(actor, privilegeLevel, 'HideChannel'))) {
      this.error(
        `Only content lead or curator with "HideChannel" permission can set visibility of channel ${channelId}!`,
        {
          exit: ExitCodes.AccessDenied,
        }
      )
    }

    await this.requireConfirmation(
      `Are you sure you want to set channel visibility ${chalk.magentaBright(
        channelId.toString()
      )} to ${chalk.magentaBright(status)}?`
    )

    await this.sendAndFollowNamedTx(await this.getDecodedPair(address), 'content', 'setChannelVisibilityAsModerator', [
      actor,
      channelId,
      status === 'HIDDEN',
      rationale,
    ])
  }
}
