import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { apiModuleByGroup } from '../../Api'
import { ApplicationStageKeys } from '@joystream/types/hiring'
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

  async run(): Promise<void> {
    const { args } = this.parse(WorkingGroupsTerminateApplication)

    // Lead-only gate
    const lead = await this.getRequiredLeadContext()

    const applicationId = parseInt(args.wgApplicationId)
    // We don't really need the application itself here, so this one is just for validation purposes
    await this.getApplicationForLeadAction(applicationId, ApplicationStageKeys.Active)

    await this.sendAndFollowNamedTx(
      await this.getDecodedPair(lead.roleAccount),
      apiModuleByGroup[this.group],
      'terminateApplication',
      [applicationId]
    )

    this.log(chalk.green(`Application ${chalk.magentaBright(applicationId)} has been successfully terminated!`))
  }
}
