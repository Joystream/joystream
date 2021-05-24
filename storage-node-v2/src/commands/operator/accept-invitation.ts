import { flags } from '@oclif/command'
import { acceptStorageBucketInvitation } from '../../services/extrinsics'
import ApiCommandBase from '../../command-base/ApiCommandBase'

export default class OperatorAcceptInvitation extends ApiCommandBase {
  static description = 'Accept pending storage bucket invitation.'

  static flags = {
    help: flags.help({ char: 'h' }),
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

  static args = [{ name: 'file' }]

  async run(): Promise<void> {
    const { flags } = this.parse(OperatorAcceptInvitation)

    const worker = flags.worker ?? 0
    const bucket = flags.bucket ?? 0

    this.log('Accepting pending storage bucket invitation...')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    await acceptStorageBucketInvitation(worker, bucket)
  }
}
