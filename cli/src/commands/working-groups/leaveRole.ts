import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { apiModuleByGroup } from '../../Api'
import { minMaxStr } from '../../validators/common'
import chalk from 'chalk'
import { createParamOptions } from '../../helpers/promptOptions'
import { Bytes } from '@polkadot/types'

export default class WorkingGroupsLeaveRole extends WorkingGroupsCommandBase {
  static description = 'Leave the worker or lead role associated with currently selected account.'
  static flags = {
    ...WorkingGroupsCommandBase.flags,
  }

  async run(): Promise<void> {
    // Worker-only gate
    const worker = await this.getRequiredWorkerContext()

    const constraint = await this.getApi().workerExitRationaleConstraint(this.group)
    const rationaleValidator = minMaxStr(constraint.min.toNumber(), constraint.max.toNumber())
    const rationale = (await this.promptForParam(
      'Bytes',
      createParamOptions('rationale', undefined, rationaleValidator)
    )) as Bytes

    await this.sendAndFollowNamedTx(
      await this.getDecodedPair(worker.roleAccount),
      apiModuleByGroup[this.group],
      'leaveRole',
      [worker.workerId, rationale]
    )

    this.log(chalk.green(`Successfully left the role! (worker id: ${chalk.magentaBright(worker.workerId.toNumber())})`))
  }
}
