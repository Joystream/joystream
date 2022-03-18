import { flags } from '@oclif/command'
import chalk from 'chalk'
import ForumCommandBase from '../../base/ForumCommandBase'

export default class ForumUpdateCategoryArchivalStatusCommand extends ForumCommandBase {
  static description = 'Update archival status of a forum category.'
  static flags = {
    categoryId: flags.integer({
      char: 'c',
      required: true,
      description: 'Forum category id',
    }),
    archived: flags.enum<'yes' | 'no'>({
      options: ['yes', 'no'],
      required: true,
      description: 'Whether the category should be archived',
    }),
    context: ForumCommandBase.forumModerationContextFlag,
    ...ForumCommandBase.flags,
  }

  async run(): Promise<void> {
    const api = await this.getOriginalApi()
    const { categoryId, archived, context } = this.parse(ForumUpdateCategoryArchivalStatusCommand).flags
    const category = await this.getCategory(categoryId)
    if (category.archived.isTrue === (archived === 'yes')) {
      this.error(
        `Category ${chalk.magentaBright(categoryId.toString())} is already ${archived === 'no' ? 'not ' : ''}archived!`
      )
    }
    const [key, actor] = await this.getForumModerationContext([categoryId], context)

    this.jsonPrettyPrint(JSON.stringify({ categoryId, archived }))
    await this.requireConfirmation('Do you confirm the provided input?', true)

    await this.sendAndFollowTx(
      await this.getDecodedPair(key),
      api.tx.forum.updateCategoryArchivalStatus(actor, categoryId, archived === 'yes')
    )

    this.log(
      chalk.green(
        `Archival status of category ${chalk.magentaBright(
          categoryId.toString()
        )} successfully updated to: ${chalk.magentaBright(archived === 'yes' ? 'archived' : 'not archived')}!`
      )
    )
  }
}
