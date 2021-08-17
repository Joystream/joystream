import { Command, flags } from '@oclif/command'
import { performSync } from '../../services/sync/synchronizer'
import logger from '../../services/logger'

export default class DevSync extends Command {
  static description =
    'Synchronizes data - it fixes the differences between local data folder and worker ID obligations from the runtime.'

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
    }),
    queryNodeHost: flags.string({
      char: 'q',
      required: false,
      description: 'Query node host and port (e.g.: some.com:8081)',
    }),
    dataSourceOperatorHost: flags.string({
      char: 'o',
      required: false,
      description:
        'Storage node host and port (e.g.: some.com:8081) to get data from.',
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

    const queryNodeHost = flags.queryNodeHost ?? 'localhost:8081'
    const queryNodeUrl = `http://${queryNodeHost}/graphql`
    const syncWorkersNumber = flags.syncWorkersNumber ?? 20
    const dataSourceOperatorHost =
      flags.dataSourceOperatorHost ?? 'localhost:3333'
    const operatorUrl = `http://${dataSourceOperatorHost}/`

    try {
      await performSync(
        flags.workerId,
        syncWorkersNumber,
        queryNodeUrl,
        flags.uploads,
        operatorUrl
      )
    } catch (err) {
      logger.error(err)
      logger.error(JSON.stringify(err, null, 2))
    }
  }
}
