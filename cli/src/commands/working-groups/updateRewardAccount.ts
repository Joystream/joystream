import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { apiModuleByGroup } from '../../Api'
import { validateAddress } from '../../helpers/validation'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'

export default class WorkingGroupsUpdateRewardAccount extends WorkingGroupsCommandBase {
  static description = 'Updates the worker/lead reward account (requires current role account to be selected)'
  static args = [
    {
      name: 'address',
      required: false,
      description: 'New reward account address (if omitted, can be provided interactivel)',
    },
  ]

  static flags = {
    ...WorkingGroupsCommandBase.flags,
  }

  async run(): Promise<void> {
    let { address } = this.parse(WorkingGroupsUpdateRewardAccount).args

    // Worker-only gate
    const worker = await this.getRequiredWorkerContext()

    if (!worker.reward) {
      this.error('There is no reward relationship associated with this role!', { exit: ExitCodes.InvalidInput })
    }

    if (!address) {
      address = await this.promptForAnyAddress('Select new reward account')
    } else if (validateAddress(address) !== true) {
      this.error('Invalid address', { exit: ExitCodes.InvalidInput })
    }

    await this.sendAndFollowNamedTx(
      await this.getDecodedPair(worker.roleAccount),
      apiModuleByGroup[this.group],
      'updateRewardAccount',
      [worker.workerId, address]
    )

    this.log(chalk.green(`Successfully updated the reward account to: ${chalk.magentaBright(address)})`))
  }
}
