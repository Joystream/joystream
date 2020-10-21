import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { apiModuleByGroup } from '../../Api'
import chalk from 'chalk'
import { positiveInt } from '../../validators/common'
import { createParamOptions } from '../../helpers/promptOptions'
import ExitCodes from '../../ExitCodes'
import { formatReward } from '@joystream/js/lib/functions/format'

export default class WorkingGroupsUpdateWorkerReward extends WorkingGroupsCommandBase {
  static description = "Change given worker's reward (amount only). Requires lead access."
  static args = [
    {
      name: 'workerId',
      required: true,
      description: 'Worker ID',
    },
  ]

  static flags = {
    ...WorkingGroupsCommandBase.flags,
  }

  async run() {
    const { args } = this.parse(WorkingGroupsUpdateWorkerReward)

    const account = await this.getRequiredSelectedAccount()
    // Lead-only gate
    await this.getRequiredLead()

    const workerId = parseInt(args.workerId)
    // This will also make sure the worker is valid
    const groupMember = await this.getWorkerForLeadAction(workerId)

    const { reward } = groupMember

    if (!reward) {
      this.error('There is no reward relationship associated with this worker!', { exit: ExitCodes.InvalidInput })
    }

    console.log(chalk.white(`Current worker reward: ${formatReward(reward)}`))

    const newRewardValue = await this.promptForParam(
      'BalanceOfMint',
      createParamOptions('new_amount', undefined, positiveInt())
    )

    await this.requestAccountDecoding(account)

    await this.sendAndFollowNamedTx(account, apiModuleByGroup[this.group], 'updateRewardAmount', [
      workerId,
      newRewardValue,
    ])

    const { reward: updatedReward } = await this.getApi().groupMember(this.group, workerId)
    this.log(chalk.green(`Worker ${chalk.white(workerId)} reward has been updated!`))
    this.log(chalk.green(`New worker reward: ${chalk.white(updatedReward ? formatReward(updatedReward) : 'NONE')}`))
  }
}
