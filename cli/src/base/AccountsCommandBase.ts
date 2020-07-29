import fs from 'fs'
import path from 'path'
import slug from 'slug'
import inquirer from 'inquirer'
import ExitCodes from '../ExitCodes'
import { CLIError } from '@oclif/errors'
import ApiCommandBase from './ApiCommandBase'
import { Keyring } from '@polkadot/api'
import { formatBalance } from '@polkadot/util'
import { NamedKeyringPair } from '../Types'
import { DerivedBalances } from '@polkadot/api-derive/types'
import { toFixedLength } from '../helpers/display'

const ACCOUNTS_DIRNAME = 'accounts'
const SPECIAL_ACCOUNT_POSTFIX = '__DEV'

/**
 * Abstract base class for account-related commands.
 *
 * All the accounts available in the CLI are stored in the form of json backup files inside:
 * { APP_DATA_PATH }/{ ACCOUNTS_DIRNAME } (ie. ~/.local/share/joystream-cli/accounts on Ubuntu)
 * Where: APP_DATA_PATH is provided by StateAwareCommandBase and ACCOUNTS_DIRNAME is a const (see above).
 */
export default abstract class AccountsCommandBase extends ApiCommandBase {
  getAccountsDirPath(): string {
    return path.join(this.getAppDataPath(), ACCOUNTS_DIRNAME)
  }

  getAccountFilePath(account: NamedKeyringPair, isSpecial = false): string {
    return path.join(this.getAccountsDirPath(), this.generateAccountFilename(account, isSpecial))
  }

  generateAccountFilename(account: NamedKeyringPair, isSpecial = false): string {
    return `${slug(account.meta.name, '_')}__${account.address}${isSpecial ? SPECIAL_ACCOUNT_POSTFIX : ''}.json`
  }

  private initAccountsFs(): void {
    if (!fs.existsSync(this.getAccountsDirPath())) {
      fs.mkdirSync(this.getAccountsDirPath())
    }
  }

  saveAccount(account: NamedKeyringPair, password: string, isSpecial = false): void {
    try {
      const destPath = this.getAccountFilePath(account, isSpecial)
      fs.writeFileSync(destPath, JSON.stringify(account.toJson(password)))
    } catch (e) {
      throw this.createDataWriteError()
    }
  }

  // Add dev "Alice" and "Bob" accounts
  initSpecialAccounts() {
    const keyring = new Keyring({ type: 'sr25519' })
    keyring.addFromUri('//Alice', { name: 'Alice' })
    keyring.addFromUri('//Bob', { name: 'Bob' })
    keyring.getPairs().forEach((pair) => this.saveAccount({ ...pair, meta: { name: pair.meta.name } }, '', true))
  }

  fetchAccountFromJsonFile(jsonBackupFilePath: string): NamedKeyringPair {
    if (!fs.existsSync(jsonBackupFilePath)) {
      throw new CLIError('Input file does not exist!', { exit: ExitCodes.FileNotFound })
    }
    if (path.extname(jsonBackupFilePath) !== '.json') {
      throw new CLIError('Invalid input file: File extension should be .json', { exit: ExitCodes.InvalidFile })
    }
    let accountJsonObj: any
    try {
      accountJsonObj = require(jsonBackupFilePath)
    } catch (e) {
      throw new CLIError('Provided backup file is not valid or cannot be accessed', { exit: ExitCodes.InvalidFile })
    }
    if (typeof accountJsonObj !== 'object' || accountJsonObj === null) {
      throw new CLIError('Provided backup file is not valid', { exit: ExitCodes.InvalidFile })
    }

    // Force some default account name if none is provided in the original backup
    if (!accountJsonObj.meta) accountJsonObj.meta = {}
    if (!accountJsonObj.meta.name) accountJsonObj.meta.name = 'Unnamed Account'

    const keyring = new Keyring()
    let account: NamedKeyringPair
    try {
      // Try adding and retrieving the keys in order to validate that the backup file is correct
      keyring.addFromJson(accountJsonObj)
      account = keyring.getPair(accountJsonObj.address) as NamedKeyringPair // We can be sure it's named, because we forced it before
    } catch (e) {
      throw new CLIError('Provided backup file is not valid', { exit: ExitCodes.InvalidFile })
    }

    return account
  }

  private fetchAccountOrNullFromFile(jsonFilePath: string): NamedKeyringPair | null {
    try {
      return this.fetchAccountFromJsonFile(jsonFilePath)
    } catch (e) {
      // Here in case of a typical CLIError we just return null (otherwise we throw)
      if (!(e instanceof CLIError)) throw e
      return null
    }
  }

  fetchAccounts(includeSpecial = false): NamedKeyringPair[] {
    let files: string[] = []
    const accountDir = this.getAccountsDirPath()
    try {
      files = fs.readdirSync(accountDir)
    } catch (e) {
      // Do nothing
    }

    // We have to assert the type, because TS is not aware that we're filtering out the nulls at the end
    return files
      .map((fileName) => {
        const filePath = path.join(accountDir, fileName)
        if (!includeSpecial && filePath.includes(SPECIAL_ACCOUNT_POSTFIX + '.')) return null
        return this.fetchAccountOrNullFromFile(filePath)
      })
      .filter((accObj) => accObj !== null) as NamedKeyringPair[]
  }

  getSelectedAccountFilename(): string {
    return this.getPreservedState().selectedAccountFilename
  }

  getSelectedAccount(): NamedKeyringPair | null {
    const selectedAccountFilename = this.getSelectedAccountFilename()

    if (!selectedAccountFilename) {
      return null
    }

    const account = this.fetchAccountOrNullFromFile(path.join(this.getAccountsDirPath(), selectedAccountFilename))

    return account
  }

  // Use when account usage is required in given command
  async getRequiredSelectedAccount(promptIfMissing = true): Promise<NamedKeyringPair> {
    let selectedAccount: NamedKeyringPair | null = this.getSelectedAccount()
    if (!selectedAccount) {
      if (!promptIfMissing) {
        this.error('No default account selected! Use account:choose to set the default account.', {
          exit: ExitCodes.NoAccountSelected,
        })
      }

      const accounts: NamedKeyringPair[] = this.fetchAccounts()
      if (!accounts.length) {
        this.error('No accounts available! Use account:import in order to import accounts into the CLI.', {
          exit: ExitCodes.NoAccountFound,
        })
      }

      this.warn('No default account selected!')
      selectedAccount = await this.promptForAccount(accounts)
      await this.setSelectedAccount(selectedAccount)
    }

    return selectedAccount
  }

  async setSelectedAccount(account: NamedKeyringPair): Promise<void> {
    const accountFilename = fs.existsSync(this.getAccountFilePath(account, true))
      ? this.generateAccountFilename(account, true)
      : this.generateAccountFilename(account)

    await this.setPreservedState({ selectedAccountFilename: accountFilename })
  }

  async promptForPassword(message = "Your account's password") {
    const { password } = await inquirer.prompt([{ name: 'password', type: 'password', message }])

    return password
  }

  async requireConfirmation(message = 'Are you sure you want to execute this action?'): Promise<void> {
    const { confirmed } = await inquirer.prompt([{ type: 'confirm', name: 'confirmed', message, default: false }])
    if (!confirmed) this.exit(ExitCodes.OK)
  }

  async promptForAccount(
    accounts: NamedKeyringPair[],
    defaultAccount: NamedKeyringPair | null = null,
    message = 'Select an account',
    showBalances = true
  ): Promise<NamedKeyringPair> {
    let balances: DerivedBalances[]
    if (showBalances) {
      balances = await this.getApi().getAccountsBalancesInfo(accounts.map((acc) => acc.address))
    }
    const longestAccNameLength: number = accounts.reduce((prev, curr) => Math.max(curr.meta.name.length, prev), 0)
    const accNameColLength: number = Math.min(longestAccNameLength + 1, 20)
    const { chosenAccountFilename } = await inquirer.prompt([
      {
        name: 'chosenAccountFilename',
        message,
        type: 'list',
        choices: accounts.map((account: NamedKeyringPair, i) => ({
          name:
            `${toFixedLength(account.meta.name, accNameColLength)} | ` +
            `${account.address} | ` +
            ((showBalances || '') &&
              `${formatBalance(balances[i].availableBalance)} / ` + `${formatBalance(balances[i].votingBalance)}`),
          value: this.generateAccountFilename(account),
          short: `${account.meta.name} (${account.address})`,
        })),
        default: defaultAccount && this.generateAccountFilename(defaultAccount),
      },
    ])

    return accounts.find((acc) => this.generateAccountFilename(acc) === chosenAccountFilename) as NamedKeyringPair
  }

  async requestAccountDecoding(account: NamedKeyringPair): Promise<void> {
    const password: string = await this.promptForPassword()
    try {
      account.decodePkcs8(password)
    } catch (e) {
      this.error('Invalid password!', { exit: ExitCodes.InvalidInput })
    }
  }

  async init() {
    await super.init()
    try {
      this.initAccountsFs()
      this.initSpecialAccounts()
    } catch (e) {
      throw this.createDataDirInitError()
    }
  }
}
