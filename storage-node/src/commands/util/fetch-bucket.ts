import { Command, flags } from '@oclif/command'
import stringify from 'fast-safe-stringify'
import path from 'path'
import { QueryNodeApi } from '../..//services/queryNode/api'
import { loadDataObjectIdCache } from '../../services/caching/localDataObjects'
import logger from '../../services/logger'
import { performSync } from '../../services/sync/synchronizer'

/**
 * CLI command:
 * Fetch data objects assigned to assigned bucket from remote node(s) into local store.
 *
 * @remarks
 * Should not be executed while server is running.
 * Shell command: "util:fetch-bucket"
 */
export default class FetchBucket extends Command {
  static description = 'Downloads all data objects of specified bucket, that matches worker ID obligations.'

  static flags = {
    help: flags.help({ char: 'h' }),
    bucketId: flags.integer({
      char: 'b',
      required: true,
      description: 'The buckerId to fetch',
    }),
    syncWorkersNumber: flags.integer({
      char: 'n',
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
      default: 'http://localhost:4352/graphql',
      description: 'Storage Squid graphql server endpoint (e.g.: http://some.com:4352/graphql)',
    }),
    dataSourceOperatorUrl: flags.string({
      char: 'o',
      required: false,
      description: 'Storage node url base (e.g.: http://some.com:3333) to get data from.',
    }),
    uploads: flags.string({
      char: 'd',
      required: true,
      description: 'Data uploading directory (absolute path).',
    }),
    tempFolder: flags.string({
      description:
        'Directory to store tempory files during sync and upload (absolute path).\n,Temporary directory (absolute path). If not specified a subfolder under the uploads directory will be used.',
    }),
  }

  async run(): Promise<void> {
    const { flags } = this.parse(FetchBucket)
    const bucketId = flags.bucketId.toString()
    const qnApi = new QueryNodeApi(flags.queryNodeEndpoint)
    await loadDataObjectIdCache(flags.uploads)

    logger.info('Fetching bucket...')

    try {
      await performSync(
        [bucketId],
        flags.syncWorkersNumber,
        flags.syncWorkersTimeout,
        qnApi,
        flags.uploads,
        flags.tempFolder ? flags.tempFolder : path.join(flags.uploads, 'temp'),
        '',
        flags.dataSourceOperatorUrl
      )
    } catch (err) {
      logger.error(err)
      logger.error(stringify(err))
    }
  }
}
