import { flags } from '@oclif/command'
import chalk from 'chalk'
import ForumCommandBase from '../../base/ForumCommandBase'
import { displayTable } from '../../helpers/display'
import { formatBalance } from '@polkadot/util'

export default class ForumPostsCommand extends ForumCommandBase {
  static description = 'List existing forum posts in given thread.'
  static flags = {
    threadId: flags.integer({
      char: 't',
      required: true,
      description: 'Thread id (only posts in this thread will be listed)',
    }),
    ...ForumCommandBase.flags,
  }

  async run(): Promise<void> {
    const { threadId } = this.parse(ForumPostsCommand).flags

    const posts = await this.getApi().forumPosts(threadId)

    if (posts.length) {
      displayTable(
        posts.map(([id, p]) => ({
          'ID': id.toString(),
          'Cleanup payoff': formatBalance(p.cleanup_pay_off),
          'Author member id': p.author_id.toString(),
          'Last edited': `#${p.last_edited.toNumber()}`,
        })),
        5
      )
    } else {
      this.log(`No posts in thread ${chalk.magentaBright(threadId)} found`)
    }
  }
}
