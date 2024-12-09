import { flags } from '@oclif/command'
import stringify from 'fast-safe-stringify'
import ApiCommandBase from '../../command-base/ApiCommandBase'
import logger from '../../services/logger'
import { QueryNodeApi } from '../../services/queryNode/api'
import { performCleanup } from '../../services/sync/cleanupService'
import { loadDataObjectIdCache } from '../../services/caching/localDataObjects'

/**
 * CLI command:
 * Prunes outdated data objects: removes all the local stored data objects that the operator is no longer obliged to store.
 *
 * @remarks
 * Shell command: "util:cleanup"
 */
export default class Cleanup extends ApiCommandBase {
  static description = `Runs the data objects cleanup/pruning workflow. It removes all the local stored data objects that the operator is no longer obliged to store`

  static flags = {
    workerId: flags.integer({
      char: 'w',
      required: true,
      description: 'Storage node operator worker ID.',
    }),
    bucketId: flags.integer({
      char: 'b',
      required: true,
      description: 'The buckerId to sync prune/cleanup',
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
      default: 'http://localhost:4352/graphql',
      description: 'Storage Squid graphql server endpoint (e.g.: http://some.com:4352/graphql)',
    }),
    uploads: flags.string({
      char: 'd',
      required: true,
      description: 'Data uploading directory (absolute path).',
    }),
    ...ApiCommandBase.flags,
  }

  async run(): Promise<void> {
    const { flags } = this.parse(Cleanup)
    const bucketId = flags.bucketId.toString()
    const api = await this.getApi()
    const qnApi = new QueryNodeApi(flags.queryNodeEndpoint)
    await loadDataObjectIdCache(flags.uploads)

    logger.info('Cleanup...')

    try {
      await performCleanup([bucketId], flags.cleanupWorkersNumber, api, qnApi, flags.uploads, '')
    } catch (err) {
      logger.error(err)
      logger.error(stringify(err))
    }
  }
}
