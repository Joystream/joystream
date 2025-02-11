import { Command, flags } from '@oclif/command'
import { createApi } from '../services/runtime/api'
import { addAccountFromJsonFile, addAlicePair, addAccountFromUri } from '../services/runtime/accounts'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiPromise, Keyring } from '@polkadot/api'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import logger from '../services/logger'
import ExitCodes from './ExitCodes'
import { CLIError } from '@oclif/errors'
import { Input } from '@oclif/parser'
import path from 'path'
import fs from 'fs'
import { JOYSTREAM_ADDRESS_PREFIX } from '@joystream/types'

/**
 * Parent class for all runtime-based commands. Defines common functions.
 */
export default abstract class ApiCommandBase extends Command {
  private api: ApiPromise | null = null
  private keyring: Keyring | null = null

  static flags = {
    help: flags.help({ char: 'h' }),
    dev: flags.boolean({ char: 'm', description: 'Use development mode', default: false }),
    apiUrl: flags.string({
      char: 'u',
      description: 'Runtime API URL. Mandatory in non-dev environment.',
      default: 'ws://localhost:9944',
    }),
    keyFile: flags.string({
      char: 'k',
      description: 'Path to key file to add to the keyring.',
    }),
    password: flags.string({
      char: 'p',
      description:
        'Password to unlock keyfiles. Multiple passwords can be passed, to try against all files. If not specified a single password can be set in ACCOUNT_PWD environment variable.',
      multiple: true,
      // only fits one password and flag will be a string, otherwise the flag will be an array of strings
      env: 'ACCOUNT_PWD',
    }),
    accountUri: flags.string({
      char: 'y',
      description:
        'Account URI (optional). If not specified a single key can be set in ACCOUNT_URI environment variable.',
      // only fits one key and flag will be a string, otherwise the flag will be an array of strings
      env: 'ACCOUNT_URI',
      multiple: true,
    }),
    // Path to a single keyfile or a folder
    keyStore: flags.string({
      description: 'Path to a folder with multiple key files to load into keystore.',
    }),
  }

  /**
   * Returns the runtime API promise.
   *
   * @returns void promise.
   */
  async finally(err: Error | undefined): Promise<void> {
    // called after run and catch regardless of whether or not the command errored
    // We'll force exit here, in case there is no error, to prevent console.log from hanging the process
    if (err && process.env.DEBUG) {
      console.error(err)
    }
    if (!err) this.exit(0)
    super.finally(err)
  }

  /**
   * Returns the runtime API promise.
   */
  protected async getApi(): Promise<ApiPromise> {
    if (this.api === null) {
      throw new CLIError('Runtime Api is uninitialized.', {
        exit: ExitCodes.ApiError,
      })
    }

    return this.api
  }

  /**
   * Initilizes the runtime API using the URL from the command line or the
   * default value (ws://localhost:9944)
   */
  async init(): Promise<void> {
    await cryptoWaitReady()
    this.keyring = new Keyring({ type: 'sr25519', ss58Format: JOYSTREAM_ADDRESS_PREFIX })

    // Oclif hack: https://github.com/oclif/oclif/issues/225#issuecomment-490555119
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const { flags } = this.parse(<Input<any>>this.constructor)

    // Add all keys to the keystore
    await this.loadKeys(flags)

    // Some dev commands doesn't contain flags variables.
    const apiUrl = flags.apiUrl ?? 'ws://localhost:9944'

    logger.info(`Initializing runtime connection to: ${apiUrl}`)
    try {
      this.api = await createApi(apiUrl)
    } catch (err) {
      logger.error(`Creating runtime API error: ${err.target?._url}`)
    }

    await this.getApi()
  }

  /**
   * Read the chain name from the runtime and throws an error if it's
   * not 'Development' chain.
   */
  async ensureDevelopmentChain(): Promise<void> {
    const api = await this.getApi()

    const chainType = await api.rpc.system.chainType()

    if (!chainType.isDevelopment && !chainType.isLocal) {
      throw new CLIError('This command should only be run on a Development chain.', {
        exit: ExitCodes.DevelopmentModeOnly,
      })
    }

    logger.info('Development mode is ON.')
  }

  tryAddKeyFile(file: string, passwords: string[]): void {
    if (path.parse(file).ext.toLowerCase() !== '.json') return
    logger.info(`Adding key from ${file}`)
    const keyring = this.getKeyring()
    const pair = addAccountFromJsonFile(file, keyring)
    if (pair.isLocked) {
      // Try passwords until one of them works
      passwords.forEach((passw) => {
        if (!pair.isLocked) return
        try {
          pair.unlock(passw)
        } catch {
          //
        }
      })
    }

    // If pair is still locked, then none of the passwords worked.
    if (pair.isLocked) {
      this.warn(`Could not unlock keyfile ${file}`)
    }
  }

  /**
   * Loads all supplied keys into the keyring.
   * Accounts passed as SURI, and any JSON-files passed with keyFile and
   * files found in the keyStore directory.
   * Since there could be multiple files using the same password, and some may not be locked, its is hard
   * to distringuish which password argument corresponds to which keyfile. So we try all provided passwords
   * to unlock keyfiles.
   */
  async loadKeys(flags: {
    dev: boolean
    keyFile?: string
    password?: string | string[]
    accountUri?: string | string[]
    keyStore?: string
  }): Promise<void> {
    const keyring = this.getKeyring()
    const { dev, password, keyFile, accountUri, keyStore } = flags
    // Create the Alice account for development mode.

    // in dev mode do not add anything other than the dev account
    if (dev) {
      addAlicePair(keyring)
      return
    }

    // Multiple passwords, or single password passed as env variable
    let passwords: string[] = []
    if (Array.isArray(password)) {
      passwords = passwords.concat(password)
    } else if (password) {
      passwords.push(password)
    }

    // Single keyfile
    if (keyFile) {
      this.tryAddKeyFile(keyFile, passwords)
    }

    // Multiple Account SURIs, or single SURI passed as env variable
    let accountSuris: string[] = []
    if (Array.isArray(accountUri)) {
      accountSuris = accountSuris.concat(accountUri)
    } else if (accountUri) {
      accountSuris.push(accountUri)
    }
    accountSuris.forEach((suri) => addAccountFromUri(suri, keyring))

    if (keyStore) {
      const stat = await fs.promises.stat(keyStore)
      if (!stat.isDirectory) {
        return this.error(`keyStore path is not a directory: ${keyStore}`)
      }
      const files = await fs.promises.readdir(keyStore)
      files.forEach((file) => this.tryAddKeyFile(path.join(keyStore, file), passwords))
    }
  }

  private getKeyring(): Keyring {
    if (!this.keyring) {
      throw new CLIError('Keyring is not ready!', {
        exit: ExitCodes.KeyringNotReady,
      })
    }
    return this.keyring
  }

  /**
   * Returns the intialized account KeyringPair instance by the address.
   *
   * @param address - address to fetch keypair for from the keyring.
   * @returns KeyringPair instance.
   */
  getKeyringPair(address: string): KeyringPair {
    const keyring = this.getKeyring()
    return keyring.getPair(address)
  }

  /**
   * Returns true if keypair contains corresponding address and is unlocked.
   *
   * @param address - address to fetch keypair for from the keyring.
   * @returns boolean
   */
  hasKeyringPair(address: string): boolean {
    const keyring = this.getKeyring()
    try {
      const pair = keyring.getPair(address)
      return !pair.isLocked
    } catch (err) {
      logger.warn(err)
      return false
    }
  }

  /**
   * Returns addresses of all unlocked KeyPairs stored in the keyring.
   * @returns string[]
   */
  getUnlockedAccounts(): string[] {
    const keyring = this.getKeyring()
    return keyring.pairs.filter((pair) => !pair.isLocked).map((pair) => pair.address)
  }

  /**
   * Helper-function for exit after the CLI command. It changes the exit code
   * depending on the previous extrinsic call success.
   *
   * @returns never returns.
   */
  exitAfterRuntimeCall(success: boolean): never {
    let exitCode = ExitCodes.OK
    if (!success) {
      exitCode = ExitCodes.UnsuccessfulRuntimeCall
    }

    this.exit(exitCode)
  }
}
