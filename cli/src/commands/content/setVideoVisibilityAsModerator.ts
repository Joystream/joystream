import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { flags } from '@oclif/command'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'

const VIDEO_VISIBILITY_CONTEXTS = ['VISIBLE', 'HIDDEN'] as const

export default class SetVideoVisibilityAsModeratorCommand extends ContentDirectoryCommandBase {
  static description = 'Set video visibility as moderator.'

  static flags = {
    videoId: flags.integer({
      char: 'v',
      required: true,
      description: 'ID of the Video',
    }),
    status: flags.enum({
      char: 's',
      options: [...VIDEO_VISIBILITY_CONTEXTS],
      description: 'The visibility status of the video',
      required: true,
    }),
    rationale: flags.string({
      char: 'r',
      required: true,
      description: 'Reason for changing visibility of video',
    }),
    context: ContentDirectoryCommandBase.moderationActionContextFlag,
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const { videoId, status, rationale, context } = this.parse(SetVideoVisibilityAsModeratorCommand).flags
    // Context
    const { inChannel } = await this.getApi().videoById(videoId)
    const { privilegeLevel } = await this.getApi().channelById(inChannel)
    const [actor, address] = await this.getModerationActionActor(context)

    // Ensure moderator has required permission
    if (!(await this.isModeratorWithRequiredPermission(actor, privilegeLevel, 'HideVideo'))) {
      this.error(`Only content lead or curator with "HideVideo" permission can set visibility of video ${videoId}!`, {
        exit: ExitCodes.AccessDenied,
      })
    }

    await this.requireConfirmation(
      `Are you sure you want to set video visibility ${chalk.magentaBright(
        videoId.toString()
      )} to ${chalk.magentaBright(status)}?`
    )

    await this.sendAndFollowNamedTx(await this.getDecodedPair(address), 'content', 'setVideoVisibilityAsModerator', [
      actor,
      videoId,
      status === 'HIDDEN',
      rationale,
    ])
  }
}
