import { createType } from '@joystream/types'
import { ForumCategoryId as CategoryId } from '@joystream/types/primitives'
import { flags } from '@oclif/command'
import chalk from 'chalk'
import ForumCommandBase from '../../base/ForumCommandBase'

export default class ForumCreateCategoryCommand extends ForumCommandBase {
  static description = 'Create forum category.'
  static flags = {
    parentCategoryId: flags.integer({
      char: 'p',
      required: false,
      description: 'Parent category id (in case of creating a subcategory)',
    }),
    title: flags.string({
      char: 't',
      required: true,
      description: 'Category title',
    }),
    description: flags.string({
      char: 'd',
      required: true,
      description: 'Category description',
    }),
    ...ForumCommandBase.flags,
  }

  async run(): Promise<void> {
    const api = await this.getOriginalApi()
    const { parentCategoryId, title, description } = this.parse(ForumCreateCategoryCommand).flags

    if (parentCategoryId !== undefined) {
      await this.ensureCategoryMutable(parentCategoryId)
    }

    const lead = await this.getRequiredLeadContext()

    this.jsonPrettyPrint(JSON.stringify({ parentCategoryId, title, description }))
    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowTx(
      await this.getDecodedPair(lead.roleAccount),
      api.tx.forum.createCategory(createType('Option<u64>', parentCategoryId ?? null), title, description)
    )

    const categoryId: CategoryId = this.getEvent(result, 'forum', 'CategoryCreated').data[0]
    this.log(chalk.green(`ForumCategory with id ${chalk.magentaBright(categoryId.toString())} successfully created!`))
    this.output(categoryId.toString())
  }
}
