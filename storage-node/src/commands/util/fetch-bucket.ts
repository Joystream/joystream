import { Command, flags } from '@oclif/command'
import { performSync } from '../../services/sync/synchronizer'
import { QueryNodeApi } from '../../services/queryNode/api'
import logger from '../../services/logger'
import stringify from 'fast-safe-stringify'
import path from 'path'
import { loadDataObjectIdCache } from '../../services/caching/localDataObjects'

/**
 * CLI command:
 * Fetch all data objects from a bucket into local store.
 *
 * @remarks
 * Should not be executed while server is running.
 * Shell command: "util:fetch-bucket"
 */
export default class FetchBucket extends Command {
  static description = 'Downloads all data objects of specified bucket, that matches worker ID obligations.'

  static flags = {
    help: flags.help({ char: 'h' }),
    bucket: flags.integer({
      char: 'b',
      required: true,
      description: 'The bucket id to fetch',
      multiple: true,
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
      default: 'https://query.joystream.org/graphql',
      description: 'Query node endpoint (e.g.: https://query.joystream.org/graphql)',
    }),
    dataSourceOperatorUrl: flags.string({
      char: 'o',
      required: false,
      description: 'Storage node url base (e.g.: http://some.com:3333) to get data from.',
    }),
    destination: flags.string({
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
    const buckets = []
    if (Array.isArray(flags.bucket)) {
      buckets.push(...flags.bucket)
    } else {
      buckets.push(flags.bucket)
    }

    // Load objects from destination to avoid overwriting
    await loadDataObjectIdCache(flags.destination)

    const qnApi = new QueryNodeApi(flags.queryNodeEndpoint)

    logger.info(`Fetching buckets... ${flags.bucket}`)

    try {
      await performSync(
        buckets.map((id) => id.toString()),
        flags.syncWorkersNumber,
        flags.syncWorkersTimeout,
        qnApi,
        flags.destination,
        flags.tempFolder ? flags.tempFolder : path.join(flags.destination, 'temp'),
        '',
        flags.dataSourceOperatorUrl
      )
    } catch (err) {
      logger.error(err)
      logger.error(stringify(err))
    }
  }
}
