import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { apiModuleByGroup } from '../../Api'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'
import { isValidBalance } from '../../helpers/validation'

export default class WorkingGroupsDiscetionarySpending extends WorkingGroupsCommandBase {
  static args = [
    {
      name: 'address',
      required: true,
      description: 'Wallet Address of Receiver',
    },
    {
      name: 'string',
      required: true,
      description: 'Amount of JOY to be sent to receiver ',
    },
    {
      name: 'rationale',
      required: true,
      description: 'Reason for discretionary spending',
    },
  ]

  static flags = {
    ...WorkingGroupsCommandBase.flags,
  }

  async run(): Promise<void> {
    const {
      args: { address, amount, rationale },
    } = this.parse(WorkingGroupsDiscetionarySpending)

    if (!isValidBalance(amount)) {
      this.error('Invalid amount', { exit: ExitCodes.InvalidInput })
    }

    const lead = await this.getRequiredLeadContext()

    await this.sendAndFollowNamedTx(
      await this.getDecodedPair(lead.roleAccount),
      apiModuleByGroup[this.group],
      'spendFromBudget',
      [address, amount, rationale]
    )
    this.log(chalk.green(`Transaction finished !`))
  }
}
