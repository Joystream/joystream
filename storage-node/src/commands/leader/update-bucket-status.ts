import { flags } from '@oclif/command'
import { updateStorageBucketStatus } from '../../services/runtime/extrinsics'
import ApiCommandBase from '../../command-base/ApiCommandBase'
import logger from '../../services/logger'

/**
 * CLI command:
 * Updates the storage bucket status (accept new bags).
 *
 * @remarks
 * Storage working group leader command. Requires storage WG leader priviliges.
 * Shell command: "leader:update-bucket-status"
 */
export default class LeaderUpdateStorageBucketStatus extends ApiCommandBase {
  static description = 'Update storage bucket status (accepting new bags).'

  static flags = {
    bucketId: flags.integer({
      char: 'i',
      required: true,
      description: 'Storage bucket ID',
    }),
    set: flags.enum({
      char: 's',
      description: `Sets 'accepting new bags' parameter for the bucket (on/off).`,
      options: ['on', 'off'],
      required: true,
    }),
    ...ApiCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(LeaderUpdateStorageBucketStatus)

    const bucket = flags.bucketId
    // Accept new bags?
    const newStatus = flags.set === 'on'

    logger.info('Updating the storage bucket status...')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    const account = this.getAccount(flags)

    const api = await this.getApi()
    const success = await updateStorageBucketStatus(api, account, bucket, newStatus)

    this.exitAfterRuntimeCall(success)
  }
}
