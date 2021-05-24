import { Command, flags } from '@oclif/command'
import { updateStorageBucketsForBag } from '../../services/extrinsics'

export default class LeaderUpdateBag extends Command {
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

  async finally(err: Error | undefined): Promise<void> {
    // called after run and catch regardless of whether or not the command errored
    // We'll force exit here, in case there is no error, to prevent console.log from hanging the process
    if (!err) this.exit(0)
    super.finally(err)
  }
}
