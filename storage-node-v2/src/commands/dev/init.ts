import { hireStorageWorkingGroupLead } from '../../services/runtime/hireLead'
import ApiCommandBase from '../../command-base/ApiCommandBase'
/**
 * CLI command:
 * Initialize development environment. Sets Alice as storage working group
 * leader.
 *
 * @remarks
 * Should be run only during the development.
 * Shell command: "dev:init"
 */
export default class DevInit extends ApiCommandBase {
  static description = 'Initialize development environment. Sets Alice as storage working group leader.'

  async run(): Promise<void> {
    await this.ensureDevelopmentChain()

    const api = await this.getApi()
    await hireStorageWorkingGroupLead(api)
  }
}
