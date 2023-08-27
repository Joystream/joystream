import { Command, flags } from '@oclif/command'
import stringify from 'fast-safe-stringify'
import logger from '../../services/logger'
import { QueryNodeApi } from '../../services/queryNode/api'
import { performCleanup } from '../../services/sync/cleanupService'

/**
 * CLI command:
 * Prunes outdated data objects: removes all the local stored data objects that the operator is no longer obliged to store.
 * storage.
 *
 * @remarks
 * Should be run only during the development.
 * Shell command: "dev:cleanup"
 */
export default class DevCleanup extends Command {
  static description = `Runs the data objects cleanup/pruning workflow. It removes all the local stored data objects that the operator is no longer obliged to store`

  static flags = {
    help: flags.help({ char: 'h' }),
    workerId: flags.integer({
      char: 'w',
      required: true,
      description: 'Storage node operator worker ID.',
    }),
    bucketId: flags.integer({
      char: 'b',
      required: true,
      description: 'The buckerId to sync',
    }),
    cleanupWorkersNumber: flags.integer({
      char: 'p',
      required: false,
      description: 'Cleanup/Pruning workers number (max async operations in progress).',
      default: 20,
    }),
    queryNodeEndpoint: flags.string({
      char: 'q',
      required: false,
      default: 'http://localhost:8081/graphql',
      description: 'Query node endpoint (e.g.: http://some.com:8081/graphql)',
    }),
    uploads: flags.string({
      char: 'd',
      required: true,
      description: 'Data uploading directory (absolute path).',
    }),
  }

  async run(): Promise<void> {
    const { flags } = this.parse(DevCleanup)
    const bucketId = flags.bucketId.toString()
    const qnApi = new QueryNodeApi(flags.queryNodeEndpoint)
    logger.info('Cleanup...')

    try {
      await performCleanup(flags.workerId, [bucketId], flags.cleanupWorkersNumber, qnApi, flags.uploads)
    } catch (err) {
      logger.error(err)
      logger.error(stringify(err))
    }
  }
}
