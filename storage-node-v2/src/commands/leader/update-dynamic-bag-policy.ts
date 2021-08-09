import ApiCommandBase from '../../command-base/ApiCommandBase'
import { updateNumberOfStorageBucketsInDynamicBagCreationPolicy } from '../../services/runtime/extrinsics'
import { flags } from '@oclif/command'
import logger from '../../services/logger'
import { parseDynamicBagType } from '../../services/helpers/bagTypes'

/**
 * CLI command:
 * Updates dynamic bag creation policy - storage bucket number for new dynamic
 * bag.
 *
 * @remarks
 * Storage working group leader command. Requires storage WG leader priviliges.
 * Shell command: "leader:update-dynamic-bag-policy"
 */
export default class LeaderUpdateDynamicBagPolicy extends ApiCommandBase {
  static description = 'Update number of storage buckets used in the dynamic bag creation policy.'

  static flags = {
    number: flags.integer({
      char: 'n',
      required: true,
      description: 'New storage buckets number',
    }),
    bagType: flags.enum({
      char: 't',
      description: 'Dynamic bag type (Channel, Member).',
      options: ['Channel', 'Member'],
      required: true,
    }),
    ...ApiCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(LeaderUpdateDynamicBagPolicy)

    logger.info('Update dynamic bag creation policy....')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    const account = this.getAccount(flags)
    const newNumber = flags.number

    // Verified by enum argument parser.
    const dynamicBagTypeString = flags.bagType as 'Member' | 'Channel'

    const api = await this.getApi()
    const dynamicBagType = parseDynamicBagType(api, dynamicBagTypeString)
    const success = await updateNumberOfStorageBucketsInDynamicBagCreationPolicy(
      api,
      account,
      dynamicBagType,
      newNumber
    )

    this.exitAfterRuntimeCall(success)
  }
}
