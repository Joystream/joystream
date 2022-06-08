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

  async run(): Promise<void> {
    const { storage } = this.parse(WorkingGroupsUpdateRoleStorage).args

    const worker = await this.getRequiredWorkerContext()

    await this.sendAndFollowNamedTx(
      await this.getDecodedPair(worker.roleAccount),
      apiModuleByGroup[this.group],
      'updateRoleStorage',
      [worker.workerId, storage]
    )

    this.log(chalk.green(`Successfully updated the associated worker storage to: ${chalk.magentaBright(storage)})`))
  }
}
