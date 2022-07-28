import { ForumCategoryId as CategoryId } from '@joystream/types/primitives'
import { flags } from '@oclif/command'
import chalk from 'chalk'
import ForumCommandBase from '../../base/ForumCommandBase'
import { displayCollapsedRow, displayHeader, displayTable, memberHandle } from '../../helpers/display'
import { GroupMember } from '../../Types'

export default class ForumCategoryCommand extends ForumCommandBase {
  static description = 'Display forum category details.'
  static flags = {
    categoryId: flags.integer({
      char: 'c',
      required: true,
      description: 'Forum category id',
    }),
    ...ForumCommandBase.flags,
  }

  async run(): Promise<void> {
    const { categoryId } = this.parse(ForumCategoryCommand).flags
    const category = await this.getCategory(categoryId)
    const allCategories = await this.getApi().forumCategories()
    const directSubcategories = allCategories.filter(
      ([, c]) => c.parentCategoryId.unwrapOr(undefined)?.toNumber() === categoryId
    )
    const moderatorsEntries = await this.getApi().forumCategoryModerators(categoryId)
    const moderators = await Promise.all(
      moderatorsEntries.map(
        async ([categoryId, workerId]) =>
          [categoryId, await this.getApi().groupMember(this.group, workerId.toNumber())] as [CategoryId, GroupMember]
      )
    )

    displayCollapsedRow({
      'ID': categoryId.toString(),
      'No. direct subcategories': category.numDirectSubcategories.toString(),
      'No. direct threads': category.numDirectThreads.toString(),
      'No. direct moderators': category.numDirectModerators.toString(),
    })

    displayHeader('Stickied threads')
    if (category.stickyThreadIds.length) {
      this.log(category.stickyThreadIds.map((id) => chalk.magentaBright(id.toString())).join(', '))
    } else {
      this.log('No stickied threads')
    }

    displayHeader('Direct subcategories')
    this.log(directSubcategories.map(([id]) => chalk.magentaBright(id.toString())).join(', '))

    displayHeader('Moderators')
    if (moderators.length) {
      displayTable(
        moderators.map(([cId, moderator]) => ({
          'Worker ID': moderator.workerId.toString(),
          'Member Handle': memberHandle(moderator.profile),
          'Access': cId.eq(categoryId) ? 'Direct' : `Ancestor (${cId.toString()})`,
        })),
        5
      )
    } else {
      this.log('No moderators')
    }
  }
}
