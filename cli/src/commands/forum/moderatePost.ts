import { flags } from '@oclif/command'
import { formatBalance } from '@polkadot/util'
import chalk from 'chalk'
import ForumCommandBase from '../../base/ForumCommandBase'

export default class ForumModeratePostCommand extends ForumCommandBase {
  static description = 'Moderate a forum post and slash the associated stake.'
  static flags = {
    categoryId: flags.integer({
      char: 'c',
      required: true,
      description: 'Forum category id',
    }),
    threadId: flags.integer({
      char: 't',
      required: true,
      description: 'Forum thread id',
    }),
    postId: flags.integer({
      char: 'p',
      required: true,
      description: 'Forum post id',
    }),
    rationale: flags.string({
      char: 'r',
      required: true,
      description: 'Rationale behind the post moderation.',
    }),
    context: ForumCommandBase.forumModerationContextFlag,
    ...ForumCommandBase.flags,
  }

  async run(): Promise<void> {
    const api = await this.getOriginalApi()
    const { categoryId, threadId, postId, rationale, context } = this.parse(ForumModeratePostCommand).flags

    await this.ensureCategoryExists(categoryId)
    await this.ensureCategoryMutable(categoryId)
    await this.ensureThreadExists(categoryId, threadId)
    const post = await this.getPost(threadId, postId)
    const [key, actor] = await this.getForumModerationContext([categoryId], context)

    this.jsonPrettyPrint(JSON.stringify({ categoryId, threadId, postId, rationale }))
    this.warn(`Post stake of ${formatBalance(post.cleanup_pay_off)} will be slashed!`)
    await this.requireConfirmation('Do you confirm the provided input?', true)

    await this.sendAndFollowTx(
      await this.getDecodedPair(key),
      api.tx.forum.moderatePost(actor, categoryId, threadId, postId, rationale)
    )

    this.log(chalk.green(`Post ${chalk.magentaBright(postId.toString())} successfully moderated!`))
  }
}
