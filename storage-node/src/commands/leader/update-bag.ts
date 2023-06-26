import { updateStorageBucketsForBag } from '../../services/runtime/extrinsics'
import LeaderCommandBase from '../../command-base/LeaderCommandBase'
import logger from '../../services/logger'
import ExitCodes from '../../command-base/ExitCodes'
import _ from 'lodash'
import { customFlags } from '../../command-base/CustomFlags'

/**
 * CLI command:
 * Updates bags-to-buckets relationships.
 *
 * @remarks
 * Storage working group leader command. Requires storage WG leader priviliges.
 * Shell command: "leader:update-bag"
 */
export default class LeaderUpdateBag extends LeaderCommandBase {
  static description = 'Add/remove a storage bucket from a bag (adds by default).'

  static flags = {
    add: customFlags.integerArr({
      char: 'a',
      description: 'Comma separated list of bucket IDs to add to bag',
      default: [],
    }),
    remove: customFlags.integerArr({
      char: 'r',
      description: 'Comma separated list of bucket IDs to remove from bag',
      default: [],
    }),
    bagId: customFlags.bagId({
      char: 'i',
      required: true,
    }),
    ...LeaderCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(LeaderUpdateBag)

    logger.info('Updating the bag...')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    if (_.isEmpty(flags.add) && _.isEmpty(flags.remove)) {
      logger.error('No bucket ID provided.')
      this.exit(ExitCodes.InvalidParameters)
    }

    const account = this.getAccount()
    const api = await this.getApi()

    const success = await updateStorageBucketsForBag(api, flags.bagId, account, flags.add, flags.remove)

    this.exitAfterRuntimeCall(success)
  }
}
