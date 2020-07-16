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
      required: false,
    }),
  }

  async run() {
    const { showSpecial } = this.parse(AccountChoose).flags
    const accounts: NamedKeyringPair[] = this.fetchAccounts(showSpecial)
    const selectedAccount: NamedKeyringPair | null = this.getSelectedAccount()

    this.log(chalk.white(`Found ${accounts.length} existing accounts...\n`))

    if (accounts.length === 0) {
      this.warn('No account to choose from. Add accont using account:import or account:create.')
      this.exit(ExitCodes.NoAccountFound)
    }

    const choosenAccount: NamedKeyringPair = await this.promptForAccount(accounts, selectedAccount)

    await this.setSelectedAccount(choosenAccount)
    this.log(chalk.greenBright('\nAccount switched!'))
  }
}
