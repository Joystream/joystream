import { Command, flags } from '@oclif/command'
import ApiCommandBase from '../../command-base/ApiCommandBase'
import logger from '../../services/logger'

/**
 * CLI command:
 * Verifies supported bag ID types in the string format.
 *
 * @remarks
 * Should be run only during the development.
 * Shell command: "dev:verify-bag-id"
 */
export default class DevVerifyBagId extends Command {
  static description = 'The command verifies bag id supported by the storage node. Requires chain connection.'

  static flags = {
    help: flags.help({ char: 'h' }),
    bagId: ApiCommandBase.extraFlags.bagId({
      char: 'i',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { flags } = this.parse(DevVerifyBagId)

    logger.info(`Parsed: ${flags.bagId}`)
  }
}
