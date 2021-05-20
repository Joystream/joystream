import { createStorageBucket } from '../../../services/extrinsics'
import { Command, flags } from '@oclif/command'

export default class WgLeaderCreateBucket extends Command {
  static description = `Create new storage bucket. Requires storage working group leader permissions.`

  static flags = {
    help: flags.help({ char: 'h' }),
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
    dev: flags.boolean({ char: 'd', description: 'Use development mode' }),
  }

  async run(): Promise<void> {
    const { flags } = this.parse(WgLeaderCreateBucket)

    const objectSize = flags.size ?? 0
    const objectNumber = flags.number ?? 0
    const allowNewBags = flags.allow ?? false
    const invitedWorker = flags.invited

    this.log('Creating storage bucket...')
    if (flags.dev) {
      this.log('development mode is ON')
    }

    await createStorageBucket(
      invitedWorker,
      allowNewBags,
      objectSize,
      objectNumber
    )
  }

  async finally(err: Error | undefined): Promise<void> {
    // called after run and catch regardless of whether or not the command errored
    // We'll force exit here, in case there is no error, to prevent console.log from hanging the process
    if (!err) this.exit(0)
    super.finally(err)
  }
}
