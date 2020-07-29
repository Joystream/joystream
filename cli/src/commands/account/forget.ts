import fs from 'fs'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'
import AccountsCommandBase from '../../base/AccountsCommandBase'
import { NamedKeyringPair } from '../../Types'

export default class AccountForget extends AccountsCommandBase {
  static description = 'Forget (remove) account from the list of available accounts'

  async run() {
    const accounts: NamedKeyringPair[] = this.fetchAccounts()

    if (!accounts.length) {
      this.error('No accounts found!', { exit: ExitCodes.NoAccountFound })
    }

    const choosenAccount: NamedKeyringPair = await this.promptForAccount(accounts, null, 'Select an account to forget')
    await this.requireConfirmation('Are you sure you want this account to be forgotten?')

    const accountFilePath: string = this.getAccountFilePath(choosenAccount)
    try {
      fs.unlinkSync(accountFilePath)
    } catch (e) {
      this.error(`Could not remove account file (${accountFilePath}). Permissions issue?`, {
        exit: ExitCodes.FsOperationFailed,
      })
    }

    this.log(chalk.greenBright(`\nAccount has been forgotten!`))
  }
}
