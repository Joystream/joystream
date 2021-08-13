import { Command, flags } from '@oclif/command'
import { performSync } from '../../services/sync/synchronizer'

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
    processNumber: flags.integer({
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

  async run() {
    const { flags } = this.parse(DevSync)

    console.log('Syncing...')

    const queryNodeHost = flags.queryNodeHost ?? 'localhost:8081'
    const queryNodeUrl = `http://${queryNodeHost}/graphql`
    const processNumber = flags.processNumber ?? 30
    const dataSourceOperatorHost =
      flags.dataSourceOperatorHost ?? 'localhost:3333'
    const operatorUrl = `http://${dataSourceOperatorHost}/`

    try {
      await performSync(
        flags.workerId,
        processNumber,
        queryNodeUrl,
        flags.uploads,
        operatorUrl
      )
    } catch (err) {
      console.log(err)
      console.log(JSON.stringify(err, null, 2))
    }
  }
}

//TODO: implement periodical sync
// import sleep from 'sleep-promise'
// export function runSyncWithInterval() {
//   setTimeout(async () => {
//     await sleep(5000)
//     console.log('Syncing with timeout...')
//     await performSync()
//     runSyncWithInterval()
//   }, 0)
// }
