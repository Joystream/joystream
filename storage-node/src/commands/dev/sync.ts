import { Command, flags } from '@oclif/command'
import { performSync } from '../../services/sync/synchronizer'
import logger from '../../services/logger'
import stringify from 'fast-safe-stringify'

/**
 * CLI command:
 * Synchronizes data: fixes the difference between node obligations and local
 * storage.
 *
 * @remarks
 * Should be run only during the development.
 * Shell command: "dev:sync"
 */
export default class DevSync extends Command {
  static description =
    'Synchronizes the data - it fixes the differences between local data folder and worker ID obligations from the runtime.'

  static flags = {
    help: flags.help({ char: 'h' }),
    workerId: flags.integer({
      char: 'w',
      required: true,
      description: 'Storage node operator worker ID.',
    }),
    syncWorkersNumber: flags.integer({
      char: 'p',
      required: false,
      description: 'Sync workers number (max async operations in progress).',
      default: 20,
    }),
    syncWorkersTimeout: flags.integer({
      char: 't',
      required: false,
      description: 'Asset downloading timeout for the syncronization (in minutes).',
      default: 30,
    }),
    queryNodeEndpoint: flags.string({
      char: 'q',
      required: false,
      default: 'http://localhost:8081/graphql',
      description: 'Query node endpoint (e.g.: http://some.com:8081/graphql)',
    }),
    dataSourceOperatorUrl: flags.string({
      char: 'o',
      required: false,
      description: 'Storage node url base (e.g.: http://some.com:3333) to get data from.',
      default: 'http://localhost:3333',
    }),
    uploads: flags.string({
      char: 'd',
      required: true,
      description: 'Data uploading directory (absolute path).',
    }),
  }

  async run(): Promise<void> {
    const { flags } = this.parse(DevSync)

    logger.info('Syncing...')

    try {
      await performSync(
        undefined,
        flags.workerId,
        flags.syncWorkersNumber,
        flags.syncWorkersTimeout,
        flags.queryNodeEndpoint,
        flags.uploads,
        flags.dataSourceOperatorUrl
      )
    } catch (err) {
      logger.error(err)
      logger.error(stringify(err))
    }
  }
}
