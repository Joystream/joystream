import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { OpeningStatus } from '../../Types'
import { apiModuleByGroup } from '../../Api'
import chalk from 'chalk'

export default class WorkingGroupsStartAcceptingApplications extends WorkingGroupsCommandBase {
  static description = 'Changes the status of pending opening to "Accepting applications". Requires lead access.'
  static args = [
    {
      name: 'wgOpeningId',
      required: true,
      description: 'Working Group Opening ID',
    },
  ]

  static flags = {
    ...WorkingGroupsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { args } = this.parse(WorkingGroupsStartAcceptingApplications)

    // Lead-only gate
    const lead = await this.getRequiredLeadContext()

    const openingId = parseInt(args.wgOpeningId)
    await this.validateOpeningForLeadAction(openingId, OpeningStatus.WaitingToBegin)

    await this.sendAndFollowNamedTx(
      await this.getDecodedPair(lead.roleAccount),
      apiModuleByGroup[this.group],
      'acceptApplications',
      [openingId]
    )

    this.log(
      chalk.green(
        `Opening ${chalk.magentaBright(openingId)} status changed to: ${chalk.magentaBright('Accepting Applications')}`
      )
    )
  }
}
