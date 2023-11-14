import { flags } from '@oclif/command'
import _ from 'lodash'
import { customFlags } from '../../command-base/CustomFlags'
import ExitCodes from '../../command-base/ExitCodes'
import LeaderCommandBase from '../../command-base/LeaderCommandBase'
import logger from '../../services/logger'
import { updateStorageBucketsForBags } from '../../services/runtime/extrinsics'

/**
 * CLI command:
 * Updates bags-to-buckets relationships.
 *
 * @remarks
 * Storage working group leader command. Requires storage WG leader priviliges.
 * Shell command: "leader:update-bag"
 */
export default class LeaderUpdateBag extends LeaderCommandBase {
  static description =
    `Add/remove a storage bucket/s from a bag/s. If multiple bags are ` +
    `provided, then the same input bucket ID/s would be added/removed from all bags.`

  static flags = {
    add: customFlags.integerArr({
      char: 'a',
      description: 'Comma separated list of bucket IDs to add to all bag/s',
      default: [],
    }),
    remove: customFlags.integerArr({
      char: 'r',
      description: 'Comma separated list of bucket IDs to remove from all bag/s',
      default: [],
    }),
    bagIds: customFlags.bagId({
      char: 'i',
      required: true,
      multiple: true,
    }),
    updateStrategy: flags.enum<'atomic' | 'force'>({
      char: 's',
      options: ['atomic', 'force'],
      description: 'Update strategy to use. Either "atomic" or "force".',
      default: 'atomic',
    }),

    ...LeaderCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(LeaderUpdateBag)

    logger.info('Updating the bag...')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    const uniqueBagIds = _.uniqBy(flags.bagIds, (b) => b.toString())
    const uniqueAddBuckets = _.uniq(flags.add)
    const uniqueRemoveBuckets = _.uniq(flags.remove)

    if (_.isEmpty(uniqueAddBuckets) && _.isEmpty(uniqueRemoveBuckets)) {
      logger.error('No bucket ID provided.')
      this.exit(ExitCodes.InvalidParameters)
    }

    if (_.isEmpty(uniqueBagIds)) {
      logger.error('No bag ID provided.')
      this.exit(ExitCodes.InvalidParameters)
    }

    const account = this.getAccount()
    const api = await this.getApi()

    // Ensure that input bag ids exist
    for (const bagId of uniqueBagIds) {
      const bag = await api.query.storage.bags(bagId)
      if (bag.isEmpty) {
        logger.error(`Bag with ID ${bagId} does not exist`)
        this.exit(ExitCodes.InvalidParameters)
      }
    }

    // Ensure that input add bucket ids exist
    for (const b of uniqueAddBuckets) {
      const bucket = await api.query.storage.storageBucketById(b)
      if (bucket.isEmpty) {
        logger.error(`Add Bucket input with ID ${b} does not exist`)
        this.exit(ExitCodes.InvalidParameters)
      }
    }

    // Ensure that input remove bucket ids exist
    for (const b of uniqueRemoveBuckets) {
      const bucket = await api.query.storage.storageBucketById(b)
      if (bucket.isEmpty) {
        logger.error(`Remove Bucket input with ID ${b} does not exist`)
        this.exit(ExitCodes.InvalidParameters)
      }
    }

    const [success, failedCalls] = await updateStorageBucketsForBags(
      api,
      uniqueBagIds,
      account,
      flags.add,
      flags.remove,
      flags.updateStrategy
    )

    if (!_.isEmpty(failedCalls)) {
      logger.error(`Following extrinsic calls in the batch Tx failed:\n ${JSON.stringify(failedCalls, null, 2)}}`)
    } else {
      logger.info('All extrinsic calls in the batch Tx succeeded!')
    }

    this.exitAfterRuntimeCall(success)
  }
}
