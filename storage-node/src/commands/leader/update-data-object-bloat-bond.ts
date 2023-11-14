import { updateDataObjectBloatBond } from '../../services/runtime/extrinsics'
import { flags } from '@oclif/command'
import LeaderCommandBase from '../../command-base/LeaderCommandBase'
import { formatBalance } from '@polkadot/util'
import logger from '../../services/logger'

/**
 * CLI command:
 * Updates data object bloat bond value in the runtime.
 *
 * @remarks
 * Storage working group leader command. Requires storage WG leader priviliges.
 * Shell command: "leader:update-data-object-bloat-bond"
 */
export default class LeaderUpdateDataObjectBloatBond extends LeaderCommandBase {
  static description = `Update data object bloat bond value. Requires storage working group leader permissions.`

  static flags = {
    value: flags.integer({
      char: 'v',
      required: true,
      description: 'New data object bloat bond value',
    }),
    ...LeaderCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(LeaderUpdateDataObjectBloatBond)

    const { value } = flags

    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    logger.info(`Updating data object state bloat bond value to ${formatBalance(value)}...`)

    const account = this.getAccount()
    const api = await this.getApi()

    const success = await updateDataObjectBloatBond(api, account, value)

    this.exitAfterRuntimeCall(success)
  }
}
