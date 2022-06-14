import DefaultCommandBase from '../command-base/default'
import { App } from '../app'
import { Config } from '../types'

export default class StartNode extends DefaultCommandBase {
  static description = 'Start the node'

  static flags = {
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const app = new App(this.appConfig as Config)
    await app.start()
  }

  async finally(): Promise<void> {
    /* Do nothing */
  }
}
