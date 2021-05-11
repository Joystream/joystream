import AccountsCommandBase from '../../base/AccountsCommandBase'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'
import { NamedKeyringPair } from '../../Types'
import { flags } from '@oclif/command'

export default class AccountChoose extends AccountsCommandBase {
  static description = 'Choose default account to use in the CLI'
  static flags = {
    showSpecial: flags.boolean({
      description: 'Whether to show special (DEV chain) accounts',
      char: 'S',
      required: false,
    }),
    address: flags.string({
      description: 'Select account by address (if available)',
      char: 'a',
      required: false,
    }),
  }

  async run() {
    const { showSpecial, address } = this.parse(AccountChoose).flags
    const accounts: NamedKeyringPair[] = this.fetchAccounts(!!address || showSpecial)
    const selectedAccount: NamedKeyringPair | null = this.getSelectedAccount()

    this.log(chalk.magentaBright(`Found ${accounts.length} existing accounts...\n`))

    if (accounts.length === 0) {
      this.warn('No account to choose from. Add accont using account:import or account:create.')
      this.exit(ExitCodes.NoAccountFound)
    }

    let choosenAccount: NamedKeyringPair
    if (address) {
      const matchingAccount = accounts.find((a) => a.address === address)
      if (!matchingAccount) {
        this.error(`No matching account found by address: ${address}`, { exit: ExitCodes.InvalidInput })
      }
      choosenAccount = matchingAccount
    } else {
      choosenAccount = await this.promptForAccount(accounts, selectedAccount)
    }

    await this.setSelectedAccount(choosenAccount)
    this.log(chalk.greenBright(`\nAccount switched to ${chalk.magentaBright(choosenAccount.address)}!`))
  }
}
