import { flags } from '@oclif/command'
import { updateStorageBucketsForBag } from '../../services/extrinsics'
import ApiCommandBase from '../../command-base/ApiCommandBase'

export default class LeaderUpdateBag extends ApiCommandBase {
  static description =
    'Add/remove a storage bucket from a bag (adds by default).'

  static flags = {
    help: flags.help({ char: 'h' }),
    dev: flags.boolean({ char: 'd', description: 'Use development mode' }),
    bucket: flags.integer({
      char: 'b',
      required: true,
      description: 'Storage bucket ID',
    }),
    remove: flags.boolean({
      char: 'r',
      description: 'Remove a bucket from the bag',
    }),
  }

  static args = [{ name: 'file' }]

  async run(): Promise<void> {
    const { flags } = this.parse(LeaderUpdateBag)

    const bucket = flags.bucket ?? 0

    this.log('Update bag - add storage buckets...')
    if (flags.dev) {
      this.log('development mode is ON')
    }

    await updateStorageBucketsForBag(bucket, flags.remove)
  }
}
