import ApiCommandBase from './api'
import { AccountId } from '@polkadot/types/interfaces'
import { Keyring } from '@polkadot/api'
import { KeyringInstance, KeyringOptions, KeyringPair } from '@polkadot/keyring/types'
import { CLIError } from '@oclif/errors'

export const DEFAULT_ACCOUNT_TYPE = 'sr25519'
export const KEYRING_OPTIONS: KeyringOptions = {
  type: DEFAULT_ACCOUNT_TYPE,
}

/**
 * Abstract base class for account-related commands.
 */
export default abstract class AccountsCommandBase extends ApiCommandBase {
  private keyring!: KeyringInstance

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
    // Just for Joystream CLI compatibility currently
    return this.getPair(key)
  }

  initKeyring(): void {
    this.keyring = new Keyring(KEYRING_OPTIONS)
    this.appConfig.keys.forEach((suri) => this.keyring.addFromUri(suri))
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
