import DefaultCommandBase from '../command-base/default'
import { App } from '../app'

export default class StartNode extends DefaultCommandBase {
  static description = 'Start the node'

  static flags = {
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const app = new App(this.appConfig)
    app.start()
  }

  async finally(): Promise<void> {
    /* Do nothing */
  }
}
