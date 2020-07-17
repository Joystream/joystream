import StateAwareCommandBase from '../../base/StateAwareCommandBase'
import chalk from 'chalk'

export default class ApiGetUri extends StateAwareCommandBase {
  static description = 'Get current api WS provider uri'

  async run() {
    const currentUri: string = this.getPreservedState().apiUri
    this.log(chalk.green(currentUri))
  }
}
