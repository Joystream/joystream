import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { apiModuleByGroup } from '../../Api'
import { validateAddress } from '../../helpers/validation'
import { GenericAccountId } from '@polkadot/types'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'

export default class WorkingGroupsUpdateRewardAccount extends WorkingGroupsCommandBase {
  static description = 'Updates the worker/lead reward account (requires current role account to be selected)'
  static args = [
    {
      name: 'accountAddress',
      required: false,
      description: 'New reward account address (if omitted, one of the existing CLI accounts can be selected)',
    },
  ]
  static flags = {
    ...WorkingGroupsCommandBase.flags,
  }

  async run() {
    const { args } = this.parse(WorkingGroupsUpdateRewardAccount)

    const account = await this.getRequiredSelectedAccount()
    // Worker-only gate
    const worker = await this.getRequiredWorker()

    if (!worker.reward) {
      this.error('There is no reward relationship associated with this role!', { exit: ExitCodes.InvalidInput })
    }

    let newRewardAccount: string = args.accountAddress
    if (!newRewardAccount) {
      const accounts = await this.fetchAccounts()
      newRewardAccount = (await this.promptForAccount(accounts, undefined, 'Choose the new reward account')).address
    }
    validateAddress(newRewardAccount)

    await this.requestAccountDecoding(account)

    await this.sendAndFollowExtrinsic(account, apiModuleByGroup[this.group], 'updateRewardAccount', [
      worker.workerId,
      new GenericAccountId(newRewardAccount),
    ])

    this.log(chalk.green(`Succesfully updated the reward account to: ${chalk.white(newRewardAccount)})`))
  }
}
