import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { displayCollapsedRow, displayHeader } from '../../helpers/display'
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

  async run() {
    const { args } = this.parse(WorkingGroupsApplication)

    const application = await this.getApi().groupApplication(this.group, parseInt(args.wgApplicationId))

    displayHeader(`Details`)
    const applicationRow = {
      'Application ID': application.applicationId,
      'Member handle': application.member?.handle_hash.toString() || chalk.red('NONE'),
      'Role account': application.roleAccout.toString(),
      'Reward account': application.rewardAccount.toString(),
      'Staking account': application.stakingAccount?.toString() || 'NONE',
      'Description': application.descriptionHash.toString(),
    }
    displayCollapsedRow(applicationRow)
  }
}
