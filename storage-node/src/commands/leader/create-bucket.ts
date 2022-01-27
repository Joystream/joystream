import { createStorageBucket } from '../../services/runtime/extrinsics'
import { flags } from '@oclif/command'
import ApiCommandBase from '../../command-base/ApiCommandBase'
import logger from '../../services/logger'
import { print } from '../../services/helpers/stdout'

/**
 * CLI command:
 * Creates a storage bucket.
 *
 * @remarks
 * Storage working group leader command. Requires storage WG leader priviliges.
 * Shell command: "leader:create-bucket"
 */
export default class LeaderCreateBucket extends ApiCommandBase {
  static description = `Create new storage bucket. Requires storage working group leader permissions.`

  static flags = {
    size: flags.integer({
      char: 's',
      description: 'Storage bucket max total objects size',
    }),
    number: flags.integer({
      char: 'n',
      description: 'Storage bucket max total objects number',
    }),
    invited: flags.integer({
      char: 'i',
      description: 'Invited storage operator ID (storage WG worker ID)',
    }),
    allow: flags.boolean({ char: 'a', description: 'Accepts new bags' }),
    ...ApiCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(LeaderCreateBucket)

    const objectSize = flags.size ?? 0
    const objectNumber = flags.number ?? 0
    const allowNewBags = flags.allow
    const invitedWorker = flags.invited

    logger.info('Creating storage bucket...')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    const account = this.getAccount(flags)
    const api = await this.getApi()

    const [success, bucketId] = await createStorageBucket(
      api,
      account,
      invitedWorker,
      allowNewBags,
      objectSize,
      objectNumber
    )
    if (success) {
      const castedBucketId = bucketId as number
      print(castedBucketId.toString())
    }
    this.exitAfterRuntimeCall(success)
  }
}
