import { Command, flags } from '@oclif/command'
import { createApi, getAlicePair } from '../services/runtime/api'
import { getAccountFromJsonFile } from '../services/runtime/accounts'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiPromise } from '@polkadot/api'
import logger from '../services/logger'

export default abstract class ApiCommandBase extends Command {
  private api: ApiPromise | null = null

  static keyflags = {
    help: flags.help({ char: 'h' }),
    dev: flags.boolean({ char: 'd', description: 'Use development mode' }),
    keyfile: flags.string({
      char: 'k',
      description:
        'Key file for the account. Mandatory in non-dev environment.',
    }),
    password: flags.string({
      char: 'p',
      description: 'Key file password (optional).',
    }),
  }

  async finally(err: Error | undefined): Promise<void> {
    // called after run and catch regardless of whether or not the command errored
    // We'll force exit here, in case there is no error, to prevent console.log from hanging the process
    if (!err) this.exit(0)
    super.finally(err)
  }

  protected async getApi(): Promise<ApiPromise> {
    if (this.api === null) {
      throw new Error('Runtime Api is uninitialized.')
    }

    return this.api
  }

  async init(): Promise<void> {
    this.api = await createApi()

    await this.getApi()
  }

  async ensureDevelopmentChain(): Promise<void> {
    const api = await this.getApi()

    const developmentChainName = 'Development'
    const runningChainName = await api.rpc.system.chain()

    if (runningChainName.toString() !== developmentChainName) {
      throw new Error('This command should only be run on a Development chain.')
    }

    logger.info('Development mode is ON.')
  }

  getAccount(flags: {
    dev?: boolean
    keyfile?: string
    password?: string
  }): KeyringPair {
    const keyfile = flags.keyfile ?? ''
    const password = flags.password

    let account: KeyringPair
    if (flags.dev) {
      account = getAlicePair()
    } else {
      if (keyfile === '') {
        this.error('Keyfile must be set.')
      }

      account = getAccountFromJsonFile(keyfile)
      account.unlock(password)
    }

    return account
  }
}
