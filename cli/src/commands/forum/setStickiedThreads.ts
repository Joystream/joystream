import { flags } from '@oclif/command'
import chalk from 'chalk'
import ForumCommandBase from '../../base/ForumCommandBase'

export default class ForumSetStickiedThreadsCommand extends ForumCommandBase {
  static description = 'Set stickied threads in a given category.'
  static flags = {
    categoryId: flags.integer({
      required: true,
      description: 'Forum category id',
    }),
    threadIds: flags.integer({
      required: false,
      multiple: true,
      description: 'Space-separated thread ids',
    }),
    context: ForumCommandBase.forumModerationContextFlag,
    ...ForumCommandBase.flags,
  }

  async run(): Promise<void> {
    const api = await this.getOriginalApi()
    const { categoryId, threadIds, context } = this.parse(ForumSetStickiedThreadsCommand).flags

    await this.ensureCategoryExists(categoryId)
    await Promise.all((threadIds || []).map((threadId) => this.ensureThreadExists(categoryId, threadId)))

    const [key, actor] = await this.getForumModerationContext([categoryId], context)

    this.jsonPrettyPrint(JSON.stringify({ categoryId, threadIds }))
    await this.requireConfirmation('Do you confirm the provided input?', true)

    await this.sendAndFollowTx(
      await this.getDecodedPair(key),
      api.tx.forum.setStickiedThreads(actor, categoryId, threadIds)
    )

    this.log(
      chalk.green(
        `Threads ${chalk.magentaBright(
          threadIds.map((id) => chalk.magentaBright(id)).join(', ')
        )} successfully set as stickied in category ${categoryId}!`
      )
    )
  }
}
