import { Command, flags } from '@oclif/command'
import { createApi, getAlicePair } from './../services/api'
import { getAccountFromJsonFile } from './../services/accounts'
import { KeyringPair } from '@polkadot/keyring/types'

export default abstract class ApiCommandBase extends Command {
  static keyflags = {
    help: flags.help({ char: 'h' }),
    dev: flags.boolean({ char: 'd', description: 'Use development mode' }),
    keyfile: flags.string({
      char: 'k',
      description:
        'Key file for the account. Mandatory in non-dev environment.', //TODO: rename
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

  async ensureDevelopmentChain(): Promise<void> {
    const api = await createApi()

    const developmentChainName = 'Development'
    const runningChainName = await api.rpc.system.chain()

    if (runningChainName.toString() !== developmentChainName) {
      throw new Error('This command should only be run on a Development chain.')
    }

    this.log('Development mode is ON.')
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
