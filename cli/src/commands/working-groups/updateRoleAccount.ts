import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { apiModuleByGroup } from '../../Api'
import { validateAddress } from '../../helpers/validation'
import { GenericAccountId } from '@polkadot/types'
import chalk from 'chalk'

export default class WorkingGroupsUpdateRoleAccount extends WorkingGroupsCommandBase {
  static description = 'Updates the worker/lead role account. Requires member controller account to be selected'
  static args = [
    {
      name: 'accountAddress',
      required: false,
      description: 'New role account address (if omitted, one of the existing CLI accounts can be selected)',
    },
  ]
  static flags = {
    ...WorkingGroupsCommandBase.flags,
  }

  async run() {
    const { args } = this.parse(WorkingGroupsUpdateRoleAccount)

    const account = await this.getRequiredSelectedAccount()
    const worker = await this.getRequiredWorkerByMemberController()

    const cliAccounts = await this.fetchAccounts()
    let newRoleAccount: string = args.accountAddress
    if (!newRoleAccount) {
      newRoleAccount = (await this.promptForAccount(cliAccounts, undefined, 'Choose the new role account')).address
    }
    validateAddress(newRoleAccount)

    await this.requestAccountDecoding(account)

    await this.sendAndFollowExtrinsic(account, apiModuleByGroup[this.group], 'updateRoleAccount', [
      worker.workerId,
      new GenericAccountId(newRoleAccount),
    ])

    this.log(chalk.green(`Succesfully updated the role account to: ${chalk.white(newRoleAccount)})`))

    const matchingAccount = cliAccounts.find((account) => account.address === newRoleAccount)
    if (matchingAccount) {
      const switchAccount = await this.simplePrompt({
        type: 'confirm',
        message: 'Do you want to switch the currenly selected CLI account to the new role account?',
        default: false,
      })
      if (switchAccount) {
        await this.setSelectedAccount(matchingAccount)
        this.log(
          chalk.green('Account switched to: ') +
            chalk.white(`${matchingAccount.meta.name} (${matchingAccount.address})`)
        )
      }
    }
  }
}
