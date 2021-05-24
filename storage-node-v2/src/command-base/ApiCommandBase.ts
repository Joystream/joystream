import { Command } from '@oclif/command'
import { createApi } from './../services/api'

export default abstract class ApiCommandBase extends Command {
  async finally(err: Error | undefined): Promise<void> {
    // called after run and catch regardless of whether or not the command errored
    // We'll force exit here, in case there is no error, to prevent console.log from hanging the process
    if (!err) this.exit(0)
    super.finally(err)
  }

  async ensureDevelopmentChain(): Promise<void> {
    const api = await createApi()

    const developmentChainName = 'Development'
    const runningChainName = await api.rpc.system.chain()

    if (runningChainName.toString() !== developmentChainName) {
      throw new Error('This command should only be run on a Development chain.')
    }

    this.log('Development mode is ON.')
  }
}
