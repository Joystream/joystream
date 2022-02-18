import fs from 'fs'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'
import AccountsCommandBase from '../../base/AccountsCommandBase'
import { flags } from '@oclif/command'

export default class AccountForgetCommand extends AccountsCommandBase {
  static description = 'Forget (remove) account from the list of available accounts'

  static flags = {
    address: flags.string({
      required: false,
      description: 'Address of the account to remove',
      exclusive: ['name'],
    }),
    name: flags.string({
      required: false,
      description: 'Name of the account to remove',
      exclusive: ['address'],
    }),
  }

  async run(): Promise<void> {
    let { address, name } = this.parse(AccountForgetCommand).flags

    if (!address && !name) {
      address = await this.promptForAccount('Select an account to forget', false, false)
    } else if (name) {
      address = await this.getPairByName(name).address
    }

    await this.requireConfirmation('Are you sure you want to PERMANENTLY FORGET this account?')

    const accountFilePath = this.getAccountFilePath(this.getPair(address || '').meta.name)

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
