import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { displayCollapsedRow, displayHeader } from '../../helpers/display'
import chalk from 'chalk'
import { formatBalance } from '@polkadot/util'

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

    displayHeader('Human readable text')
    this.jsonPrettyPrint(application.humanReadableText)

    displayHeader(`Details`)
    const applicationRow = {
      'WG application ID': application.wgApplicationId,
      'Application ID': application.applicationId,
      'Member handle': application.member?.handle.toString() || chalk.red('NONE'),
      'Role account': application.roleAccout.toString(),
      Stage: application.stage.type,
      'Application stake': formatBalance(application.stakes.application),
      'Role stake': formatBalance(application.stakes.role),
      'Total stake': formatBalance(application.stakes.total),
    }
    displayCollapsedRow(applicationRow)
  }
}
