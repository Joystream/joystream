import { AccountId } from '@joystream/types/common'
import { PrivilegedActor } from '@joystream/types/forum'
import { flags } from '@oclif/command'
import chalk from 'chalk'
import ForumCommandBase from '../../base/ForumCommandBase'
import ExitCodes from '../../ExitCodes'

export default class ForumDeleteCategoryCommand extends ForumCommandBase {
  static description = 'Delete forum category provided it has no existing subcategories and threads.'
  static flags = {
    categoryId: flags.integer({
      char: 'c',
      required: true,
      description: 'Id of the category to delete',
    }),
    context: ForumCommandBase.forumModerationContextFlag,
    ...ForumCommandBase.flags,
  }

  async run(): Promise<void> {
    const api = await this.getOriginalApi()
    const { categoryId, context } = this.parse(ForumDeleteCategoryCommand).flags

    const category = await this.getCategory(categoryId)
    let key: AccountId, actor: PrivilegedActor

    if (category.parent_category_id.isNone) {
      if (context === 'Moderator') {
        this.error('Moderator cannot delete root categories!', { exit: ExitCodes.AccessDenied })
      }
      ;[key, actor] = await this.getForumLeadContext()
    } else {
      ;[key, actor] = await this.getForumModerationContext([category.parent_category_id.unwrap()], context)
    }

    if (category.num_direct_subcategories.gtn(0)) {
      this.error('Cannot remove a category with existing subcategories!', { exit: ExitCodes.InvalidInput })
    }

    if (category.num_direct_threads.gtn(0)) {
      this.error('Cannot remove a category with existing threads!', { exit: ExitCodes.InvalidInput })
    }

    await this.requireConfirmation(
      `Are you sure you want to remove forum category ${chalk.magentaBright(categoryId)}?`,
      true
    )

    await this.sendAndFollowTx(await this.getDecodedPair(key), api.tx.forum.deleteCategory(actor, categoryId))

    this.log(chalk.green(`Forum category ${chalk.magentaBright(categoryId)} successfully removed!`))
  }
}
