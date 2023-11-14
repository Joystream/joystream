import { removeStorageBucketOperator } from '../../services/runtime/extrinsics'
import { flags } from '@oclif/command'
import LeaderCommandBase from '../../command-base/LeaderCommandBase'
import logger from '../../services/logger'

/**
 * CLI command:
 * Removes invited storage bucket operator.
 *
 * @remarks
 * Storage working group leader command. Requires storage WG leader priviliges.
 * Shell command: "leader:remove-operator"
 */
export default class LeaderRemoveOperator extends LeaderCommandBase {
  static description = `Remove a storage bucket operator. Requires storage working group leader permissions.`

  static flags = {
    bucketId: flags.integer({
      char: 'i',
      required: true,
      description: 'Storage bucket ID',
    }),
    ...LeaderCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(LeaderRemoveOperator)

    const storageBucketId = flags.bucketId

    logger.info('Removing storage bucket operator...')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    const account = this.getAccount()
    const api = await this.getApi()

    const success = await removeStorageBucketOperator(api, account, storageBucketId)

    this.exitAfterRuntimeCall(success)
  }
}
