import { flags } from '@oclif/command'
import chalk from 'chalk'
import ForumCommandBase from '../../base/ForumCommandBase'

export default class ForumUpdateCategoryModeratorStatusCommand extends ForumCommandBase {
  static description = 'Update moderator status of a worker in relation to a category.'
  static flags = {
    categoryId: flags.integer({
      char: 'c',
      required: true,
      description: 'Forum category id',
    }),
    workerId: flags.integer({
      char: 'w',
      required: true,
      description: 'Forum working group worker id',
    }),
    status: flags.enum<'active' | 'disabled'>({
      options: ['active', 'disabled'],
      required: true,
      description: 'Status of the moderator membership in the category',
    }),
    ...ForumCommandBase.flags,
  }

  async run(): Promise<void> {
    const api = await this.getOriginalApi()
    const { categoryId, workerId, status } = this.parse(ForumUpdateCategoryModeratorStatusCommand).flags
    const lead = await this.getRequiredLeadContext()

    await this.ensureCategoryExists(categoryId)
    await this.ensureWorkerExists(workerId)

    this.jsonPrettyPrint(JSON.stringify({ categoryId, workerId, status }))
    await this.requireConfirmation('Do you confirm the provided input?', true)

    await this.sendAndFollowTx(
      await this.getDecodedPair(lead.roleAccount),
      api.tx.forum.updateCategoryMembershipOfModerator(workerId, categoryId, status === 'active')
    )

    this.log(
      chalk.green(
        `Worker ${chalk.magentaBright(workerId.toString())} moderation permissions for category ${chalk.magentaBright(
          categoryId.toString()
        )} successfully ${status === 'active' ? 'granted' : 'revoked'}`
      )
    )
  }
}
