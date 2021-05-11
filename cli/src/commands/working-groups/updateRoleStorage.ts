import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { apiModuleByGroup } from '../../Api'
import chalk from 'chalk'

export default class WorkingGroupsUpdateRoleStorage extends WorkingGroupsCommandBase {
  static description = 'Updates the associated worker storage'
  static args = [
    {
      name: 'storage',
      required: true,
      description: 'Worker storage',
    },
  ]

  static flags = {
    ...WorkingGroupsCommandBase.flags,
  }

  async run() {
    const { storage } = this.parse(WorkingGroupsUpdateRoleStorage).args

    const account = await this.getRequiredSelectedAccount()

    // Worker-only gate
    const worker = await this.getRequiredWorker()

    await this.requestAccountDecoding(account)

    await this.sendAndFollowNamedTx(account, apiModuleByGroup[this.group], 'updateRoleStorage', [
      worker.workerId,
      storage,
    ])

    this.log(chalk.green(`Succesfully updated the associated worker storage to: ${chalk.magentaBright(storage)})`))
  }
}
