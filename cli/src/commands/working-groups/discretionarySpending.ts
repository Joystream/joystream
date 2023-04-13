import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { apiModuleByGroup } from '../../Api'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'
import { isValidBalance } from '../../helpers/validation'
import { IOFlags, getInputJson } from '../../helpers/InputOutput'
import { WorkingGroupDiscretionarySpendingInputParameters } from '../../Types'
import { WorkingGroupsDiscretionarySpendingSchema } from '../../schemas/WorkingGroups'

export default class WorkingGroupsDiscetionarySpending extends WorkingGroupsCommandBase {
  static args = [
    {
      name: 'address',
      description: 'Wallet Address of Receiver',
    },
    {
      name: 'amount',
      description: 'Amount of JOY to be sent to receiver ',
    },
    {
      name: 'rationale',
      description: 'Reason for discretionary spending',
    },
  ]

  static flags = {
    input: IOFlags.input,
    ...WorkingGroupsCommandBase.flags,
  }

  async getInputFromFile(filePath: string): Promise<WorkingGroupDiscretionarySpendingInputParameters> {
    return getInputJson<WorkingGroupDiscretionarySpendingInputParameters>(
      filePath,
      WorkingGroupsDiscretionarySpendingSchema
    )
  }

  async run(): Promise<void> {
    const {
      flags: { input },
      args,
    } = this.parse(WorkingGroupsDiscetionarySpending)


    const lead = await this.getRequiredLeadContext()

    const openingJson = input ? await this.getInputFromFile(input) : undefined

    this.log(openingJson);

    if (openingJson === undefined) {
      if (!isValidBalance(args.amount)) {
        this.error('Invalid amount', { exit: ExitCodes.InvalidInput })
      }

      await this.sendAndFollowNamedTx(
        await this.getDecodedPair(lead.roleAccount),
        apiModuleByGroup[this.group],
        'spendFromBudget',
        [args.address, args.amount, args.rationale]
      )

      this.log(chalk.green(`Transaction finished !`))

      return
    }

    for (let i = 0; i < openingJson.length; i++) {
      const element = openingJson[i]

      if (!isValidBalance(element.amount)) {
        this.error(chalk.red('Invalid amount'), { exit: ExitCodes.InvalidInput })
      }
      if (!element.address) {
        this.error(chalk.red('Invalid address'), { exit: ExitCodes.InvalidInput })
      }
      if (!element.rationale) {
        this.error(chalk.red('Invalid rationale'), { exit: ExitCodes.InvalidInput })
      }
      await this.sendAndFollowNamedTxMuilt(
        await this.getDecodedPair(lead.roleAccount),
        apiModuleByGroup[this.group],
        'spendFromBudget',
        [element.address, element.amount, element.rationale]
      )
    }

    this.log(chalk.green(`Transaction finished !`))
  }
}
