import fs, { readdirSync } from 'fs'
import path from 'path'
import slug from 'slug'
import inquirer from 'inquirer'
import ExitCodes from '../ExitCodes'
import { CLIError } from '@oclif/errors'
import ApiCommandBase from './ApiCommandBase'
import { Keyring } from '@polkadot/api'
import { formatBalance } from '@polkadot/util'
import { NamedKeyringPair } from '../Types'
import { DeriveBalancesAll } from '@polkadot/api-derive/types'
import { toFixedLength } from '../helpers/display'
import { MemberId, Membership } from '@joystream/types/members'
import { AccountId } from '@polkadot/types/interfaces'
import { KeyringPair, KeyringInstance, KeyringOptions } from '@polkadot/keyring/types'
import { KeypairType } from '@polkadot/util-crypto/types'
import { createTestKeyring } from '@polkadot/keyring/testing'
import chalk from 'chalk'
import { mnemonicGenerate } from '@polkadot/util-crypto'
import { validateAddress } from '../helpers/validation'

const ACCOUNTS_DIRNAME = 'accounts'
export const DEFAULT_ACCOUNT_TYPE = 'sr25519'
export const KEYRING_OPTIONS: KeyringOptions = {
  type: DEFAULT_ACCOUNT_TYPE,
}

export type ISelectedMember = [MemberId, Membership]

/**
 * Abstract base class for account-related commands.
 *
 * All the accounts available in the CLI are stored in the form of json backup files inside:
 * { APP_DATA_PATH }/{ ACCOUNTS_DIRNAME } (ie. ~/.local/share/joystream-cli/accounts on Ubuntu)
 * Where: APP_DATA_PATH is provided by StateAwareCommandBase and ACCOUNTS_DIRNAME is a const (see above).
 */
export default abstract class AccountsCommandBase extends ApiCommandBase {
  private selectedMember: ISelectedMember | undefined
  private _keyring: KeyringInstance | undefined

  private get keyring(): KeyringInstance {
    if (!this._keyring) {
      this.error('Trying to access Keyring before AccountsCommandBase initialization', {
        exit: ExitCodes.UnexpectedException,
      })
    }
    return this._keyring
  }

  isKeyAvailable(key: AccountId | string): boolean {
    return this.keyring.getPairs().some((p) => p.address === key.toString())
  }

  getAccountsDirPath(): string {
    return path.join(this.getAppDataPath(), ACCOUNTS_DIRNAME)
  }

  getAccountFileName(accountName: string): string {
    return `${slug(accountName)}.json`
  }

  getAccountFilePath(accountName: string): string {
    return path.join(this.getAccountsDirPath(), this.getAccountFileName(accountName))
  }

  isAccountNameTaken(accountName: string): boolean {
    return readdirSync(this.getAccountsDirPath()).some((filename) => filename === this.getAccountFileName(accountName))
  }

  private initAccountsFs(): void {
    if (!fs.existsSync(this.getAccountsDirPath())) {
      fs.mkdirSync(this.getAccountsDirPath())
    }
  }

  async createAccount(
    name?: string,
    masterKey?: KeyringPair,
    password?: string,
    type?: KeypairType
  ): Promise<NamedKeyringPair> {
    while (!name || this.isAccountNameTaken(name)) {
      if (name) {
        this.warn(`Account ${chalk.magentaBright(name)} already exists... Try different name`)
      }
      name = await this.simplePrompt({ message: 'New account name' })
    }

    if (!masterKey) {
      const keyring = new Keyring(KEYRING_OPTIONS)
      const mnemonic = mnemonicGenerate()
      keyring.addFromMnemonic(mnemonic, { name, whenCreated: Date.now() }, type)
      masterKey = keyring.getPairs()[0]
      this.log(chalk.magentaBright(`${chalk.bold('New account memonic: ')}${mnemonic}`))
    } else {
      const { address } = masterKey
      const existingAcc = this.getPairs().find((p) => p.address === address)
      if (existingAcc) {
        this.error(`Account with this key already exists (${chalk.magentaBright(existingAcc.meta.name)})`, {
          exit: ExitCodes.InvalidInput,
        })
      }
      await this.requestPairDecoding(masterKey, 'Current account password')
      masterKey.meta.name = name
    }

    while (password === undefined) {
      password = await this.promptForPassword("Set new account's password")
      const password2 = await this.promptForPassword("Confirm new account's password")

      if (password !== password2) {
        this.warn('Passwords are not the same!')
        password = undefined
      }
    }
    if (!password) {
      this.warn('Using empty password is not recommended!')
    }

    const destPath = this.getAccountFilePath(name)
    fs.writeFileSync(destPath, JSON.stringify(masterKey.toJson(password)))

    this.keyring.addPair(masterKey)

    this.log(chalk.greenBright(`\nNew account succesfully created!`))

    return masterKey as NamedKeyringPair
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

    if (!accountJsonObj.meta) accountJsonObj.meta = {}
    // Normalize the CLI account name based on file name
    // (makes sure getAccountFilePath(name) will always point to the correct file, preserving backward-compatibility
    // with older CLI versions)
    accountJsonObj.meta.name = path.basename(jsonBackupFilePath, '.json')

    const keyring = new Keyring(KEYRING_OPTIONS)
    let account: NamedKeyringPair
    try {
      // Try adding and retrieving the keys in order to validate that the backup file is correct
      keyring.addFromJson(accountJsonObj)
      account = keyring.getPair(accountJsonObj.address) as NamedKeyringPair // We can be sure it's named, because we forced it before
    } catch (e) {
      throw new CLIError(`Provided backup file is not valid (${(e as Error).message})`, { exit: ExitCodes.InvalidFile })
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

  fetchAccounts(): NamedKeyringPair[] {
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
        return this.fetchAccountOrNullFromFile(filePath)
      })
      .filter((account) => account !== null) as NamedKeyringPair[]
  }

  getPairs(includeDevAccounts = true): NamedKeyringPair[] {
    return this.keyring.getPairs().filter((p) => includeDevAccounts || !p.meta.isTesting) as NamedKeyringPair[]
  }

  getPair(key: string): NamedKeyringPair {
    return this.keyring.getPair(key) as NamedKeyringPair
  }

  async getDecodedPair(key: string | AccountId): Promise<NamedKeyringPair> {
    const pair = this.getPair(key.toString())

    return (await this.requestPairDecoding(pair)) as NamedKeyringPair
  }

  async requestPairDecoding(pair: KeyringPair, message?: string): Promise<KeyringPair> {
    // Skip if pair already unlocked
    if (!pair.isLocked) {
      return pair
    }

    // First - try decoding using empty string
    try {
      pair.decodePkcs8('')
      return pair
    } catch (e) {
      // Continue...
    }

    let isPassValid = false
    while (!isPassValid) {
      try {
        const password = await this.promptForPassword(
          message || `Enter ${pair.meta.name ? pair.meta.name : pair.address} account password`
        )
        pair.decodePkcs8(password)
        isPassValid = true
      } catch (e) {
        this.warn('Invalid password... Try again.')
      }
    }

    return pair
  }

  initKeyring(): void {
    this._keyring = this.getApi().isDevelopment ? createTestKeyring(KEYRING_OPTIONS) : new Keyring(KEYRING_OPTIONS)
    const accounts = this.fetchAccounts()
    accounts.forEach((a) => this.keyring.addPair(a))
  }

  async promptForPassword(message = "Your account's password"): Promise<string> {
    const { password } = await inquirer.prompt([
      {
        name: 'password',
        type: 'password',
        message,
      },
    ])

    return password
  }

  async promptForAccount(
    message = 'Select an account',
    createIfUnavailable = true,
    includeDevAccounts = true,
    showBalances = true
  ): Promise<string> {
    const pairs = this.getPairs(includeDevAccounts)

    if (!pairs.length) {
      this.warn('No accounts available!')
      if (createIfUnavailable) {
        await this.requireConfirmation('Do you want to create a new account?', true)
        pairs.push(await this.createAccount())
      } else {
        this.exit()
      }
    }

    let balances: DeriveBalancesAll[] = []
    if (showBalances) {
      balances = await this.getApi().getAccountsBalancesInfo(pairs.map((p) => p.address))
    }

    const longestNameLen: number = pairs.reduce((prev, curr) => Math.max(curr.meta.name.length, prev), 0)
    const nameColLength: number = Math.min(longestNameLen + 1, 20)
    const chosenKey = await this.simplePrompt({
      message,
      type: 'list',
      choices: pairs.map((p, i) => ({
        name:
          `${toFixedLength(p.meta.name, nameColLength)} | ` +
          `${p.address} | ` +
          ((showBalances || '') &&
            `${formatBalance(balances[i].availableBalance)} / ` + `${formatBalance(balances[i].votingBalance)}`),
        value: p.address,
      })),
    })

    return chosenKey
  }

  promptForCustomAddress(): Promise<string> {
    return this.simplePrompt({
      message: 'Provide custom address',
      validate: (a) => validateAddress(a),
    })
  }

  async promptForAnyAddress(message = 'Select an address'): Promise<string> {
    const type: 'available' | 'new' | 'custom' = await this.simplePrompt({
      message,
      type: 'list',
      choices: [
        { name: 'Available account', value: 'available' },
        { name: 'New account', value: 'new' },
        { name: 'Custom address', value: 'custom' },
      ],
    })

    if (type === 'available') {
      return this.promptForAccount()
    } else if (type === 'new') {
      return (await this.createAccount()).address
    } else {
      return this.promptForCustomAddress()
    }
  }

  async setSelectedMember(selectedMember: ISelectedMember): Promise<void> {
    this.selectedMember = selectedMember

    await this.setPreservedState({ selectedMemberId: selectedMember[0].toString() })
  }

  async getRequiredMemberContext(allowedIds?: MemberId[], useSelected = true): Promise<ISelectedMember> {
    if (
      useSelected &&
      this.selectedMember &&
      (!allowedIds || allowedIds.some((id) => id.eq(this.selectedMember?.[0])))
    ) {
      return this.selectedMember
    }

    const availableMemberships = await this.getKnownMembers(allowedIds)

    if (!availableMemberships.length) {
      this.error(
        `No ${allowedIds ? 'allowed ' : ''}member controller key available!` +
          (allowedIds ? ` Allowed members: ${allowedIds.join(', ')}.` : ''),
        {
          exit: ExitCodes.AccessDenied,
        }
      )
    } else if (availableMemberships.length === 1) {
      this.selectedMember = availableMemberships[0]
    } else {
      this.selectedMember = await this.promptForMember(availableMemberships, 'Choose member context')
    }

    return this.selectedMember
  }

  private async getKnownMembers(allowedIds?: MemberId[]): Promise<ISelectedMember[]> {
    const membersEntries = allowedIds
      ? await this.getApi().memberEntriesByIds(allowedIds)
      : await this.getApi().allMemberEntries()
    const availableMemberships = await Promise.all(
      membersEntries.filter(([, m]) => this.isKeyAvailable(m.controller_account.toString()))
    )

    return availableMemberships
  }

  async promptForMember(
    availableMemberships: ISelectedMember[],
    message = 'Choose a member'
  ): Promise<ISelectedMember> {
    const memberIndex = await this.simplePrompt({
      type: 'list',
      message,
      choices: availableMemberships.map(([, membership], i) => ({
        name: membership.handle.toString(),
        value: i,
      })),
    })

    return availableMemberships[memberIndex]
  }

  private async initSelectedMember(): Promise<void> {
    const memberIdString = this.getPreservedState().selectedMemberId

    const memberId = this.createType('MemberId', memberIdString)
    const member = await this.getApi().membershipById(memberId)

    // ensure selected member exists
    if (!member) {
      return
    }

    this.selectedMember = [memberId, member]
  }

  async init(): Promise<void> {
    await super.init()
    try {
      this.initAccountsFs()
    } catch (e) {
      throw this.createDataDirInitError()
    }
    await this.initKeyring()

    await this.initSelectedMember()
  }
}
