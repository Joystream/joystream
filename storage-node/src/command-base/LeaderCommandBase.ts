import { KeyringPair } from '@polkadot/keyring/types'
import ExitCodes from './ExitCodes'
import { CLIError } from '@oclif/errors'
import { getLeadRoleAccount } from '../services/runtime/queries'

import ApiCommandBase from './ApiCommandBase'

/**
 * Parent class for all leader commands. Ensure lead role key is in the keystore.
 */
export default abstract class LeaderCommandBase extends ApiCommandBase {
  private roleAccount: string | undefined

  /**
   * Initilizes the runtime API using the URL from the command line or the
   * default value (ws://localhost:9944)
   */
  async init(): Promise<void> {
    await super.init()

    const api = await this.getApi()
    const leadRoleAccount = await getLeadRoleAccount(api)
    if (leadRoleAccount) {
      this.roleAccount = leadRoleAccount
    } else {
      this.error('Lead is not set')
    }

    if (!this.hasKeyringPair(leadRoleAccount)) {
      this.error(`Keyring does not contain leader role key ${leadRoleAccount}`)
    }
  }

  /**
   * Returns the intialized account KeyringPair instance of the lead's role key.
   *
   * @returns KeyringPair instance.
   */
  getAccount(): KeyringPair {
    // should not be called if roleAccount was not initialized
    if (!this.roleAccount) {
      throw new CLIError('getAccount called before command init', {
        exit: ExitCodes.KeyringNotReady,
      })
    }
    return this.getKeyringPair(this.roleAccount)
  }
}
