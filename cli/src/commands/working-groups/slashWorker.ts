import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { apiModuleByGroup } from '../../Api'
import { WorkerId } from '@joystream/types/working-group'
import { Balance } from '@polkadot/types/interfaces'
import { formatBalance } from '@polkadot/util'
import { minMaxInt } from '../../validators/common'
import chalk from 'chalk'
import { createParamOptions } from '../../helpers/promptOptions'

export default class WorkingGroupsSlashWorker extends WorkingGroupsCommandBase {
  static description = 'Slashes given worker stake. Requires lead access.'
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
    const { args } = this.parse(WorkingGroupsSlashWorker)

    const account = await this.getRequiredSelectedAccount()
    // Lead-only gate
    await this.getRequiredLead()

    const workerId = parseInt(args.workerId)
    const groupMember = await this.getWorkerWithStakeForLeadAction(workerId)

    this.log(chalk.white('Current worker stake: ', formatBalance(groupMember.stake)))
    const balanceValidator = minMaxInt(1, groupMember.stake.toNumber())
    const balance = (await this.promptForParam(
      'Balance',
      createParamOptions('amount', undefined, balanceValidator)
    )) as Balance

    await this.requestAccountDecoding(account)

    await this.sendAndFollowExtrinsic(account, apiModuleByGroup[this.group], 'slashStake', [
      new WorkerId(workerId),
      balance,
    ])

    this.log(
      chalk.green(
        `${chalk.white(formatBalance(balance))} from worker ${chalk.white(
          workerId
        )} stake has been succesfully slashed!`
      )
    )
  }
}
