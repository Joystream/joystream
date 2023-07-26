import { inviteStorageBucketOperator } from '../../services/runtime/extrinsics'
import { flags } from '@oclif/command'
import LeaderCommandBase from '../../command-base/LeaderCommandBase'
import logger from '../../services/logger'

/**
 * CLI command:
 * Invites a storage bucket operator.
 *
 * @remarks
 * Storage working group leader command. Requires storage WG leader priviliges.
 * Shell command: "leader:invite-operator"
 */
export default class LeaderInviteOperator extends LeaderCommandBase {
  static description = `Invite a storage bucket operator. Requires storage working group leader permissions.`

  static flags = {
    bucketId: flags.integer({
      char: 'i',
      required: true,
      description: 'Storage bucket ID',
    }),
    operatorId: flags.integer({
      char: 'w',
      required: true,
      description: 'Storage bucket operator ID (storage group worker ID)',
    }),
    ...LeaderCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(LeaderInviteOperator)

    const storageBucketId = flags.bucketId
    const operatorId = flags.operatorId

    logger.info('Inviting storage bucket operator...')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    const account = this.getAccount()
    const api = await this.getApi()

    const success = await inviteStorageBucketOperator(api, account, storageBucketId, operatorId)

    this.exitAfterRuntimeCall(success)
  }
}
