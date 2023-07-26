import { Command, flags } from '@oclif/command'
import logger from '../../services/logger'
import { customFlags } from '../../command-base/CustomFlags'
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
    bagId: customFlags.bagId({
      char: 'i',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { flags } = this.parse(DevVerifyBagId)

    logger.info(`Parsed: ${flags.bagId}`)
  }
}
