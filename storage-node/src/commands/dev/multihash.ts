import { Command, flags } from '@oclif/command'
import { hashFile } from '../../services/helpers/hashing'
import logger from '../../services/logger'
import { print } from '../../services/helpers/stdout'

/**
 * CLI command:
 * Hashes the file using blake3 algorithm, convert the hash in the multihash
 * format.
 *
 * @remarks
 * Should be run only during the development.
 * Shell command: "dev:multihash"
 */
export default class DevMultihash extends Command {
  static description = 'Creates a multihash (blake3) for a file.'

  static flags = {
    help: flags.help({ char: 'h' }),
    file: flags.string({
      char: 'f',
      required: true,
      description: 'Path for a hashing file.',
    }),
  }

  async run(): Promise<void> {
    const { flags } = this.parse(DevMultihash)

    logger.info(`Hashing ${flags.file} ....`)

    const multi = await hashFile(flags.file)

    logger.info(`Hash: ${multi}`)

    print(multi)
  }
}
