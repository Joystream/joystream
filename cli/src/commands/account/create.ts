import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'
import AccountsCommandBase from '../../base/AccountsCommandBase'
import { Keyring } from '@polkadot/api'
import { mnemonicGenerate } from '@polkadot/util-crypto'
import { NamedKeyringPair } from '../../Types'

type AccountCreateArgs = {
  name: string
}

export default class AccountCreate extends AccountsCommandBase {
  static description = 'Create new account'

  static args = [
    {
      name: 'name',
      required: true,
      description: 'Account name',
    },
  ]

  validatePass(password: string, password2: string): void {
    if (password !== password2) this.error('Passwords are not the same!', { exit: ExitCodes.InvalidInput })
    if (!password) this.error("You didn't provide a password", { exit: ExitCodes.InvalidInput })
  }

  async run() {
    const args: AccountCreateArgs = this.parse(AccountCreate).args as AccountCreateArgs
    const keyring: Keyring = new Keyring()
    const mnemonic: string = mnemonicGenerate()

    keyring.addFromMnemonic(mnemonic, { name: args.name, whenCreated: Date.now() })
    const keys: NamedKeyringPair = keyring.pairs[0] as NamedKeyringPair // We assigned the name above

    const password = await this.promptForPassword("Set your account's password")
    const password2 = await this.promptForPassword('Confirm your password')

    this.validatePass(password, password2)

    this.saveAccount(keys, password)

    this.log(chalk.greenBright(`\nAccount succesfully created!`))
    this.log(chalk.white(`${chalk.bold('Name:    ')}${args.name}`))
    this.log(chalk.white(`${chalk.bold('Address: ')}${keys.address}`))
  }
}
