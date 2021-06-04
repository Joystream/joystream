import { flags } from '@oclif/command'
import { updateStorageBucketsForBag } from '../../services/runtime/extrinsics'
import ApiCommandBase from '../../command-base/ApiCommandBase'

export default class LeaderUpdateBag extends ApiCommandBase {
  static description =
    'Add/remove a storage bucket from a bag (adds by default).'

  static flags = {
    bucket: flags.integer({
      char: 'b',
      required: true,
      description: 'Storage bucket ID',
    }),
    remove: flags.boolean({
      char: 'r',
      description: 'Remove a bucket from the bag',
    }),
    ...ApiCommandBase.keyflags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(LeaderUpdateBag)

    const bucket = flags.bucket ?? 0

    this.log('Update bag - add/remove storage buckets...')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    const account = this.getAccount(flags)

    await updateStorageBucketsForBag(account, bucket, flags.remove)
  }
}
