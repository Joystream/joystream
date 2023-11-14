import { updateDataSizeFee } from '../../services/runtime/extrinsics'
import { flags } from '@oclif/command'
import LeaderCommandBase from '../../command-base/LeaderCommandBase'
import logger from '../../services/logger'
import { formatBalance } from '@polkadot/util'

/**
 * CLI command:
 * Updates storage data fee in the runtime.
 *
 * @remarks
 * Storage working group leader command. Requires storage WG leader priviliges.
 * Shell command: "leader:update-data-fee"
 */
export default class LeaderUpdateDataFee extends LeaderCommandBase {
  static description = `Update data size fee. Requires storage working group leader permissions.`

  static flags = {
    fee: flags.integer({
      char: 'f',
      required: true,
      description: 'New data size fee',
    }),
    ...LeaderCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(LeaderUpdateDataFee)

    const fee = flags.fee

    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }
    logger.info(`Updating data size fee to ${formatBalance(fee)}...`)

    const account = this.getAccount()
    const api = await this.getApi()

    const success = await updateDataSizeFee(api, account, fee)

    this.exitAfterRuntimeCall(success)
  }
}
