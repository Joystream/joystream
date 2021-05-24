import { Command, flags } from '@oclif/command'
import { hireStorageWorkingGroupLead } from '../../services/hireLead'

export default class DevInit extends Command {
  static description = 'Initialize development environment. Sets Alice as storage working group leader.'

  static flags = {
    help: flags.help({ char: 'h' }),
  }

  async run(): Promise<void> {
    await hireStorageWorkingGroupLead()
  }

  async finally(err: Error | undefined): Promise<void> {
    // called after run and catch regardless of whether or not the command errored
    // We'll force exit here, in case there is no error, to prevent console.log from hanging the process
    if (!err) this.exit(0)
    super.finally(err)
  }
}
