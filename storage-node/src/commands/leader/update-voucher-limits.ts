import ApiCommandBase from '../../command-base/ApiCommandBase'
import { updateStorageBucketsVoucherMaxLimits } from '../../services/runtime/extrinsics'
import { flags } from '@oclif/command'
import logger from '../../services/logger'

/**
 * CLI command:
 * Updates maximum values for storage bucket voucher limits.
 *
 * @remarks
 * Storage working group leader command. Requires storage WG leader priviliges.
 * Shell command: "leader:update-voucher-limits"
 */
export default class LeaderUpdateVoucherLimits extends ApiCommandBase {
  static description =
    'Update VoucherMaxObjectsSizeLimit and VoucherMaxObjectsNumberLimit for the Joystream node storage.'

  static flags = {
    objects: flags.integer({
      char: 'o',
      required: true,
      description: `New 'max voucher object number limit' value`,
    }),
    size: flags.integer({
      char: 's',
      required: true,
      description: `New 'max voucher object size limit' value`,
    }),
    ...ApiCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(LeaderUpdateVoucherLimits)

    logger.info('Updating global storage bucket voucher limits....')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    const account = this.getAccount(flags)
    const objectsLimit = flags.objects
    const sizeLimit = flags.size

    const api = await this.getApi()
    const success = await updateStorageBucketsVoucherMaxLimits(api, account, sizeLimit, objectsLimit)

    this.exitAfterRuntimeCall(success)
  }
}
