import { flags } from '@oclif/command'
import { acceptStorageBucketInvitation } from '../../services/runtime/extrinsics'
import ApiCommandBase from '../../command-base/ApiCommandBase'
import logger from '../../services/logger'

export default class OperatorAcceptInvitation extends ApiCommandBase {
  static description = 'Accept pending storage bucket invitation.'

  static flags = {
    worker: flags.integer({
      char: 'w',
      required: true, // TODO: for dev
      description: 'Storage operator worker ID',
    }),
    bucket: flags.integer({
      char: 'b',
      required: true,
      description: 'Storage bucket ID',
    }),
    ...ApiCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(OperatorAcceptInvitation)

    const worker = flags.worker ?? 0 // TODO: don't require on dev???
    const bucket = flags.bucket ?? 0

    logger.info('Accepting pending storage bucket invitation...')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    const account = this.getAccount(flags)

    const api = await this.getApi()
    await acceptStorageBucketInvitation(api, account, worker, bucket)
  }
}
