import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { displayCollapsedRow, displayHeader, memberHandle } from '../../helpers/display'
import chalk from 'chalk'

export default class WorkingGroupsApplication extends WorkingGroupsCommandBase {
  static description = 'Shows an overview of given application by Working Group Application ID'
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
    const { args } = this.parse(WorkingGroupsApplication)

    const application = await this.getApi().groupApplication(this.group, parseInt(args.wgApplicationId))

    displayHeader(`Details`)
    const applicationRow = {
      'Application ID': application.applicationId,
      'Opening ID': application.openingId.toString(),
      'Member handle': memberHandle(application.member),
      'Role account': application.roleAccout.toString(),
      'Reward account': application.rewardAccount.toString(),
      'Staking account': application.stakingAccount.toString(),
    }
    displayCollapsedRow(applicationRow)

    if (application.answers) {
      displayHeader(`Application form`)
      application.answers?.forEach((a) => {
        this.log(chalk.bold(a.question.question))
        this.log(a.answer)
      })
    }
  }
}
