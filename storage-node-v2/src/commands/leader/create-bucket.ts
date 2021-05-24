import { createStorageBucket } from '../../services/extrinsics'
import { flags } from '@oclif/command'
import ApiCommandBase from '../../command-base/ApiCommandBase'

export default class LeaderCreateBucket extends ApiCommandBase {
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
    const { flags } = this.parse(LeaderCreateBucket)

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
}
