import { flags } from '@oclif/command'
import { formatBalance } from '@polkadot/util'
import chalk from 'chalk'
import ForumCommandBase from '../../base/ForumCommandBase'

export default class ForumModerateThreadCommand extends ForumCommandBase {
  static description = 'Moderate a forum thread and slash the associated stake.'
  static flags = {
    categoryId: flags.integer({
      char: 'c',
      required: true,
      description: 'Id of the forum category the thread is currently in',
    }),
    threadId: flags.integer({
      char: 't',
      required: true,
      description: 'Forum thread id',
    }),
    rationale: flags.string({
      char: 'r',
      required: true,
      description: 'Rationale behind the thread moderation.',
    }),
    context: ForumCommandBase.forumModerationContextFlag,
    ...ForumCommandBase.flags,
  }

  async run(): Promise<void> {
    const api = await this.getOriginalApi()
    const { categoryId, threadId, context, rationale } = this.parse(ForumModerateThreadCommand).flags

    const thread = await this.getThread(categoryId, threadId)
    const [key, actor] = await this.getForumModerationContext([categoryId], context)

    this.jsonPrettyPrint(JSON.stringify({ categoryId, threadId, rationale }))
    this.warn(`Thread stake of ${formatBalance(thread.cleanup_pay_off)} will be slashed!`)
    await this.requireConfirmation('Do you confirm the provided input?', true)

    await this.sendAndFollowTx(
      await this.getDecodedPair(key),
      api.tx.forum.moderateThread(actor, categoryId, threadId, rationale)
    )

    this.log(chalk.green(`Thread ${chalk.magentaBright(threadId.toString())} successfully moderated!`))
  }
}
