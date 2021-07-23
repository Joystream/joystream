import { Command, flags } from '@oclif/command'
import { QueryNodeApi } from '../../services/query-node/api'

export default class DevSync extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({ char: 'h' }),
  }

  async run() {
    this.parse(DevSync)

    console.log('Syncing...')

    const queryNodeUrl = 'http://localhost:8081/graphql'
    const api = new QueryNodeApi(queryNodeUrl)
    const id = '0'

    try {
      const bucket = await api.getStorageBucketDetails(id)
      console.log(bucket)
    } catch (err) {
      console.log(err)
      console.log(JSON.stringify(err, null, 2))
    }
  }
}
