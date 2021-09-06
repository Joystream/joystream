import { Command, flags } from '@oclif/command'
import { createApi } from '../services/runtime/api'
import {
  getAccountFromJsonFile,
  getAlicePair,
  getAccountFromUri
} from '../services/runtime/accounts'
import { parseBagId } from '../services/helpers/bagTypes'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiPromise } from '@polkadot/api'
import logger from '../services/logger'
import ExitCodes from './ExitCodes'
import { CLIError } from '@oclif/errors'
import { Input } from '@oclif/parser'
import _ from 'lodash'

/**
 * Parent class for all runtime-based commands. Defines common functions.
 */
export default abstract class ApiCommandBase extends Command {
  private api: ApiPromise | null = null

  static flags = {
    help: flags.help({ char: 'h' }),
    dev: flags.boolean({ char: 'm', description: 'Use development mode', default: false }),
    apiUrl: flags.string({
      char: 'u',
      description: 'Runtime API URL. Mandatory in non-dev environment.',
      default: 'ws://localhost:9944',
    }),
    keyfile: flags.string({
      char: 'k',
      description: 'Key file for the account. Mandatory in non-dev environment.',
    }),
    password: flags.string({
      char: 'p',
      description: 'Key file password (optional). Could be overriden by ACCOUNT_PWD environment variable.',
    }),
    accountURI: flags.string({
      char: 'y',
      description:
        'Account URI (optional). Has a priority over the keyfile and password flags. Could be overriden by ACCOUNT_URI environment variable.',
  }

  static extraFlags = {
    bagId: flags.build({
      parse: (value: string) => {
        return parseBagId(value)
      },
      description: `Bag ID. Format: {bag_type}:{sub_type}:{id}.
    - Bag types: 'static', 'dynamic'
    - Sub types: 'static:council', 'static:wg', 'dynamic:member', 'dynamic:channel'
    - Id:
      - absent for 'static:council'
      - working group name for 'static:wg'
      - integer for 'dynamic:member' and 'dynamic:channel'
    Examples:
    - static:council
    - static:wg:storage
    - dynamic:member:4`,
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
    // Oclif hack: https://github.com/oclif/oclif/issues/225#issuecomment-490555119
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const { flags } = this.parse(<Input<any>>this.constructor)

    // Some dev commands doesn't contain flags variables.
    const apiUrl = flags.apiUrl ?? 'ws://localhost:9944'

    logger.info(`Initialized runtime connection: ${apiUrl}`)
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

  /**
   * Returns the intialized account KeyringPair instance. Loads the account
   * JSON-file or loads 'Alice' Keypair when in the development mode.
   *
   * @param dev - indicates the development mode (optional).
   * @param keyfile - key file path (optional).
   * @param password - password for the key file (optional).
   * @param accountURI - accountURI (optional). Overrides keyfile and password flags.
   * @returns KeyringPair instance.
   */
  getAccount(flags: { dev: boolean; keyfile?: string; password?: string; accountURI?: string }): KeyringPair {
    // Select account URI variable from flags key and environment variable.
    let accountURI = flags.accountURI ?? ''
    if (!_.isEmpty(process.env.ACCOUNT_URI)) {
      if (!_.isEmpty(flags.accountURI)) {
        logger.warn(
          `Both enviroment variable and command line argument were provided for the account URI. Environment variable has a priority.`
        )
      }
      accountURI = process.env.ACCOUNT_URI ?? ''
    }

    // Select password variable from flags key and environment variable.
    let password = flags.password
    if (!_.isEmpty(process.env.ACCOUNT_PWD)) {
      if (!_.isEmpty(flags.password)) {
        logger.warn(
          `Both enviroment variable and command line argument were provided for the password. Environment variable has a priority.`
        )
      }
      password = process.env.ACCOUNT_PWD ?? ''
    }

    const keyfile = flags.keyfile ?? ''
    // Create the Alice account for development mode.
    if (flags.dev) {
      return getAlicePair()
    }
    // Create an account using account URI
    else if (!_.isEmpty(accountURI)) {
      return getAccountFromUri(accountURI)
    }
    // Create an account using the keyfile and password.
    else if (!_.isEmpty(keyfile)) {
      const account = getAccountFromJsonFile(keyfile)
      account.unlock(password)

      return account
    }
    // Cannot create any account for these parameters.
    else {
      this.error('Keyfile or account URI must be set.')
    }
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
