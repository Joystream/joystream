import StateAwareCommandBase from '../../base/StateAwareCommandBase'
import chalk from 'chalk'

export default class ApiGetQueryNodeEndpoint extends StateAwareCommandBase {
  static description = 'Get current query node endpoint'

  async run(): Promise<void> {
    const currentEndpoint: string | null | undefined = this.getPreservedState().queryNodeUri
    this.log(chalk.green(JSON.stringify(currentEndpoint)))
  }
}
