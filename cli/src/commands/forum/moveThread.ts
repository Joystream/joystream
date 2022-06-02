import { flags } from '@oclif/command'
import chalk from 'chalk'
import ForumCommandBase from '../../base/ForumCommandBase'

export default class ForumMoveThreadCommand extends ForumCommandBase {
  static description = 'Move forum thread to a different category.'
  static flags = {
    categoryId: flags.integer({
      char: 'c',
      required: true,
      description: "Thread's current category id",
    }),
    threadId: flags.integer({
      char: 't',
      required: true,
      description: 'Forum thread id',
    }),
    newCategoryId: flags.integer({
      char: 'n',
      required: true,
      description: "Thread's new category id",
    }),
    context: ForumCommandBase.forumModerationContextFlag,
    ...ForumCommandBase.flags,
  }

  async run(): Promise<void> {
    const api = await this.getOriginalApi()
    const { categoryId, newCategoryId, threadId, context } = this.parse(ForumMoveThreadCommand).flags

    await this.ensureThreadExists(categoryId, threadId)
    await this.ensureCategoryExists(newCategoryId)
    const [key, actor] = await this.getForumModerationContext([categoryId, newCategoryId], context)

    this.jsonPrettyPrint(JSON.stringify({ threadId, categoryId, newCategoryId }))
    await this.requireConfirmation('Do you confirm the provided input?', true)

    await this.sendAndFollowTx(
      await this.getDecodedPair(key),
      api.tx.forum.moveThreadToCategory(actor, categoryId, threadId, newCategoryId)
    )

    this.log(
      chalk.green(
        `Thread ${chalk.magentaBright(threadId.toString())} successfully moved from category ${chalk.magentaBright(
          categoryId.toString()
        )} to category ${chalk.magentaBright(newCategoryId.toString())}!`
      )
    )
  }
}
