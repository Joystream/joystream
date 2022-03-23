import { flags } from '@oclif/command'
import chalk from 'chalk'
import ForumCommandBase from '../../base/ForumCommandBase'
import { displayTable } from '../../helpers/display'
import { formatBalance } from '@polkadot/util'

export default class ForumThreadsCommand extends ForumCommandBase {
  static description = 'List existing forum threads in given category.'
  static flags = {
    categoryId: flags.integer({
      char: 'c',
      required: true,
      description: 'Category id (only threads in this category will be listed)',
    }),
    ...ForumCommandBase.flags,
  }

  async run(): Promise<void> {
    const { categoryId } = this.parse(ForumThreadsCommand).flags

    await this.ensureCategoryExists(categoryId)
    const threads = await this.getApi().forumThreads(categoryId)

    if (threads.length) {
      displayTable(
        threads.map(([id, t]) => ({
          'ID': id.toString(),
          'Cleanup payoff': formatBalance(t.cleanup_pay_off),
          'Author member id': t.author_id.toString(),
          'No. posts': t.number_of_posts.toString(),
        })),
        5
      )
    } else {
      this.log(`No threads in category ${chalk.magentaBright(categoryId)} found`)
    }
  }
}
