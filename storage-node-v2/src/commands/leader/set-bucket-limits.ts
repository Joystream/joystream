import ApiCommandBase from '../../command-base/ApiCommandBase'
import { setStorageBucketVoucherLimits } from '../../services/runtime/extrinsics'
import { flags } from '@oclif/command'
import logger from '../../services/logger'

/**
 * CLI command:
 * Sets voucher limits for the storage bucket.
 *
 * @remarks
 * Storage working group leader command. Requires storage WG leader priviliges.
 * Shell command: "leader:set-bucket-limits"
 */
export default class LeaderSetBucketLimits extends ApiCommandBase {
  static description = 'Set VoucherObjectsSizeLimit and VoucherObjectsNumberLimit for the storage bucket.'

  static flags = {
    bucketId: flags.integer({
      char: 'i',
      required: true,
      description: 'Storage bucket ID',
    }),
    objects: flags.integer({
      char: 'o',
      required: true,
      description: `New 'voucher object number limit' value`,
    }),
    size: flags.integer({
      char: 's',
      required: true,
      description: `New 'voucher object size limit' value`,
    }),
    ...ApiCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(LeaderSetBucketLimits)

    logger.info('Setting storage bucket limits....')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    const account = this.getAccount(flags)
    const bucket = flags.bucketId
    const objectsLimit = flags.objects
    const sizeLimit = flags.size

    const api = await this.getApi()
    const success = await setStorageBucketVoucherLimits(api, account, bucket, sizeLimit, objectsLimit)

    this.exitAfterRuntimeCall(success)
  }
}
