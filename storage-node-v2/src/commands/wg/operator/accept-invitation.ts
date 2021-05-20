import {Command, flags} from '@oclif/command'
import { acceptStorageBucketInvitation } from '../../../services/api'

export default class WgOperatorAcceptInvitation extends Command {
  static description = 'Accept pending storage bucket invitation.'

  static flags = {
    help: flags.help({char: 'h'}),
    worker: flags.integer({
      char: 'w',
      required: true,
      description: 'Storage operator worker ID',
    }),
    bucket: flags.integer({
      char: 'b',
      required: true,
      description: 'Storage bucket ID',
    }),
    dev: flags.boolean({ char: 'd', description: 'Use development mode' }),
  }

  static args = [{name: 'file'}]

  async run() {
    const { flags } = this.parse(WgOperatorAcceptInvitation)

    const worker = flags.worker ?? 0
    const bucket = flags.bucket ?? 0

    this.log('Accepting pending storage bucket invitation...')
    if (flags.dev) {
      this.log('development mode is ON')
    }

    await acceptStorageBucketInvitation(worker, bucket)
  }

  async finally(err: any) {
    // called after run and catch regardless of whether or not the command errored
    // We'll force exit here, in case there is no error, to prevent console.log from hanging the process
    if (!err) this.exit(0)
    super.finally(err)
  }
}
