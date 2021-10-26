import ApiCommandBase from './api'
import { AccountId } from '@polkadot/types/interfaces'
import { Keyring } from '@polkadot/api'
import { KeyringInstance, KeyringOptions, KeyringPair, KeyringPair$Json } from '@polkadot/keyring/types'
import { CLIError } from '@oclif/errors'
import ExitCodes from './ExitCodes'
import fs from 'fs'
import path from 'path'
import inquirer from 'inquirer'

export const DEFAULT_ACCOUNT_TYPE = 'sr25519'
export const KEYRING_OPTIONS: KeyringOptions = {
  type: DEFAULT_ACCOUNT_TYPE,
}

/**
 * Abstract base class for account-related commands.
 */
export default abstract class AccountsCommandBase extends ApiCommandBase {
  private keyring!: KeyringInstance

  fetchAccountFromJsonFile(jsonBackupFilePath: string): KeyringPair {
    if (!fs.existsSync(jsonBackupFilePath)) {
      throw new CLIError(`Keypair backup json file does not exist: ${jsonBackupFilePath}`, {
        exit: ExitCodes.FileNotFound,
      })
    }
    if (path.extname(jsonBackupFilePath) !== '.json') {
      throw new CLIError(`Keypair backup json file is invalid: File extension should be .json: ${jsonBackupFilePath}`, {
        exit: ExitCodes.InvalidFile,
      })
    }
    let accountJsonObj: unknown
    try {
      accountJsonObj = require(jsonBackupFilePath)
    } catch (e) {
      throw new CLIError(`Keypair backup json file is invalid or cannot be accessed: ${jsonBackupFilePath}`, {
        exit: ExitCodes.InvalidFile,
      })
    }
    if (typeof accountJsonObj !== 'object' || accountJsonObj === null) {
      throw new CLIError(`Keypair backup json file is is not valid: ${jsonBackupFilePath}`, {
        exit: ExitCodes.InvalidFile,
      })
    }

    const keyring = new Keyring()
    let account: KeyringPair
    try {
      // Try adding and retrieving the keys in order to validate that the backup file is correct
      keyring.addFromJson(accountJsonObj as KeyringPair$Json)
      account = keyring.getPair((accountJsonObj as KeyringPair$Json).address)
    } catch (e) {
      throw new CLIError(`Keypair backup json file is is not valid: ${jsonBackupFilePath}`, {
        exit: ExitCodes.InvalidFile,
      })
    }

    return account
  }

  isKeyAvailable(key: AccountId | string): boolean {
    return this.keyring.getPairs().some((p) => p.address === key.toString())
  }

  getPairs(includeDevAccounts = true): KeyringPair[] {
    return this.keyring.getPairs().filter((p) => includeDevAccounts || !p.meta.isTesting)
  }

  getPair(key: string): KeyringPair {
    const pair = this.keyring.getPair(key)
    if (!pair) {
      throw new CLIError(`Required key for account ${key} is not available`)
    }
    return pair
  }

  async getDecodedPair(key: string): Promise<KeyringPair> {
    const pair = this.getPair(key)
    return this.requestPairDecoding(pair)
  }

  async requestPairDecoding(pair: KeyringPair, message?: string): Promise<KeyringPair> {
    // Skip if pair already unlocked
    if (!pair.isLocked) {
      return pair
    }

    // Try decoding using empty string
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

  initKeyring(): void {
    this.keyring = new Keyring(KEYRING_OPTIONS)
    this.appConfig.keys.forEach((keyData) => {
      if ('suri' in keyData) {
        this.keyring.addFromUri(keyData.suri, undefined, keyData.type)
      }
      if ('mnemonic' in keyData) {
        this.keyring.addFromMnemonic(keyData.mnemonic, undefined, keyData.type)
      }
      if ('keyfile' in keyData) {
        const acc = this.fetchAccountFromJsonFile(keyData.keyfile)
        this.keyring.addPair(acc)
      }
    })
  }

  async getDistributorLeadKey(): Promise<string> {
    const currentLead = await this.api.query.distributionWorkingGroup.currentLead()
    if (!currentLead.isSome) {
      throw new CLIError('There is no active distributor working group lead currently')
    }
    const worker = await this.api.query.distributionWorkingGroup.workerById(currentLead.unwrap())
    return worker.role_account_id.toString()
  }

  async getDistributorWorkerRoleKey(workerId: number): Promise<string> {
    const worker = await this.api.query.distributionWorkingGroup.workerById(workerId)
    if (!worker) {
      throw new CLIError(`Worker not found by id: ${workerId}!`)
    }
    return worker.role_account_id.toString()
  }

  async init(): Promise<void> {
    await super.init()
    await this.initKeyring()
  }
}
