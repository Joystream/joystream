import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { apiModuleByGroup } from '../../Api'
import { ApplicationStageKeys, ApplicationId } from '@joystream/types/hiring'
import chalk from 'chalk'

export default class WorkingGroupsTerminateApplication extends WorkingGroupsCommandBase {
  static description = 'Terminates given working group application. Requires lead access.'
  static args = [
    {
      name: 'wgApplicationId',
      required: true,
      description: 'Working Group Application ID',
    },
  ]
  static flags = {
    ...WorkingGroupsCommandBase.flags,
  }

  async run() {
    const { args } = this.parse(WorkingGroupsTerminateApplication)

    const account = await this.getRequiredSelectedAccount()
    // Lead-only gate
    await this.getRequiredLead()

    const applicationId = parseInt(args.wgApplicationId)
    // We don't really need the application itself here, so this one is just for validation purposes
    await this.getApplicationForLeadAction(applicationId, ApplicationStageKeys.Active)

    await this.requestAccountDecoding(account)

    await this.sendAndFollowExtrinsic(account, apiModuleByGroup[this.group], 'terminateApplication', [
      new ApplicationId(applicationId),
    ])

    this.log(chalk.green(`Application ${chalk.white(applicationId)} has been succesfully terminated!`))
  }
}
