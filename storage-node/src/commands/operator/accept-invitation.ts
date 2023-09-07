import { flags } from '@oclif/command'
import { acceptStorageBucketInvitation } from '../../services/runtime/extrinsics'
import ApiCommandBase from '../../command-base/ApiCommandBase'
import logger from '../../services/logger'
import { getWorkerRoleAccount } from '../../services/runtime/queries'

/**
 * CLI command:
 * Accepts pending invitation for the storage bucket.
 *
 * @remarks
 * Storage provider (operator) command. Requires an additional worker ID for
 * runtime verification.
 * Shell command: "operator:accept-invitation"
 */
export default class OperatorAcceptInvitation extends ApiCommandBase {
  static description = 'Accept pending storage bucket invitation.'

  static flags = {
    workerId: flags.integer({
      char: 'w',
      required: true,
      description: 'Storage operator worker ID',
    }),
    bucketId: flags.integer({
      char: 'i',
      required: true,
      description: 'Storage bucket ID',
    }),
    transactorAccountId: flags.string({
      char: 't',
      required: true,
      description: 'Transactor account ID (public key)',
    }),
    ...ApiCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(OperatorAcceptInvitation)

    const { workerId, bucketId, transactorAccountId } = flags

    logger.info('Accepting pending storage bucket invitation...')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    const api = await this.getApi()
    const account = await getWorkerRoleAccount(api, workerId)

    if (account) {
      if (this.hasKeyringPair(account)) {
        const keypair = this.getKeyringPair(account)
        const success = await acceptStorageBucketInvitation(api, keypair, workerId, bucketId, transactorAccountId)
        this.exitAfterRuntimeCall(success)
      } else {
        this.error(`Keyring does not contain role key ${account} for operator ${workerId}`)
      }
    } else {
      this.error(`workerId ${workerId} is not valid`)
    }
  }
}
