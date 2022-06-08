import { updateUploadingBlockedStatus } from '../../services/runtime/extrinsics'
import { flags } from '@oclif/command'
import ApiCommandBase from '../../command-base/ApiCommandBase'
import logger from '../../services/logger'

/**
 * CLI command:
 * Manages global uploading block in the runtime.
 *
 * @remarks
 * Storage working group leader command. Requires storage WG leader priviliges.
 * Shell command: "leader:set-global-uploading-status"
 */
export default class LeaderSetGlobalUploadingStatus extends ApiCommandBase {
  static description = `Set global uploading block. Requires storage working group leader permissions.`

  static flags = {
    set: flags.enum({
      char: 's',
      description: 'Sets global uploading block (on/off).',
      options: ['on', 'off'],
      required: true,
    }),
    ...ApiCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(LeaderSetGlobalUploadingStatus)

    // Enable blocking?
    const newStatus = flags.set === 'on'

    logger.info('Setting global uploading block...')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    const account = this.getAccount(flags)
    const api = await this.getApi()

    const success = await updateUploadingBlockedStatus(api, account, newStatus)

    this.exitAfterRuntimeCall(success)
  }
}
