import { deleteStorageBucket } from '../../services/runtime/extrinsics'
import { flags } from '@oclif/command'
import LeaderCommandBase from '../../command-base/LeaderCommandBase'
import logger from '../../services/logger'

/**
 * CLI command:
 * Deletes a storage bucket.
 *
 * @remarks
 * Storage working group leader command. Requires storage WG leader priviliges.
 * Shell command: "leader:delete-bucket"
 */
export default class LeaderDeleteBucket extends LeaderCommandBase {
  static description = `Delete a storage bucket. Requires storage working group leader permissions.`

  static flags = {
    bucketId: flags.integer({
      char: 'i',
      required: true,
      description: 'Storage bucket ID',
    }),
    ...LeaderCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(LeaderDeleteBucket)

    const storageBucketId = flags.bucketId

    logger.info('Deleting storage bucket...')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    const account = this.getAccount()
    const api = await this.getApi()

    const success = await deleteStorageBucket(api, account, storageBucketId)

    this.exitAfterRuntimeCall(success)
  }
}
