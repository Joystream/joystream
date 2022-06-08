import { flags } from '@oclif/command'
import { updateBlacklist } from '../../services/runtime/extrinsics'
import ApiCommandBase from '../../command-base/ApiCommandBase'
import ExitCodes from '../../command-base/ExitCodes'
import logger from '../../services/logger'
import _ from 'lodash'

/**
 * CLI command:
 * Updates content ID blacklist. The CID blacklist block data object
 * runtim registration.
 *
 * @remarks
 * Storage working group leader command. Requires storage WG leader priviliges.
 * Shell command: "leader:update-blacklist"
 */
export default class LeaderUpdateBlacklist extends ApiCommandBase {
  static description = 'Add/remove a content ID from the blacklist (adds by default).'

  static flags = {
    add: flags.string({
      char: 'a',
      multiple: true,
      description: 'Content ID to add',
      default: [],
    }),
    remove: flags.string({
      char: 'r',
      description: 'Content ID to remove',
      multiple: true,
      default: [],
    }),
    ...ApiCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(LeaderUpdateBlacklist)

    logger.info('Updating the blacklist...')
    if (flags.dev) {
      await this.ensureDevelopmentChain()
    }

    if (_.isEmpty(flags.add) && _.isEmpty(flags.remove)) {
      logger.error('No Content ID provided.')
      this.exit(ExitCodes.InvalidParameters)
    }

    const account = this.getAccount(flags)
    const api = await this.getApi()

    const success = await updateBlacklist(api, account, flags.add, flags.remove)

    this.exitAfterRuntimeCall(success)
  }
}
