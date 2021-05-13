import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { OpeningStatus } from '../../Types'
import { apiModuleByGroup } from '../../Api'
import chalk from 'chalk'

export default class WorkingGroupsStartReviewPeriod extends WorkingGroupsCommandBase {
  static description = 'Changes the status of active opening to "In review". Requires lead access.'
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

  async run() {
    const { args } = this.parse(WorkingGroupsStartReviewPeriod)

    const account = await this.getRequiredSelectedAccount()
    // Lead-only gate
    await this.getRequiredLead()

    const openingId = parseInt(args.wgOpeningId)
    await this.validateOpeningForLeadAction(openingId, OpeningStatus.AcceptingApplications)

    await this.requestAccountDecoding(account)

    await this.sendAndFollowNamedTx(account, apiModuleByGroup[this.group], 'beginApplicantReview', [openingId])

    this.log(
      chalk.green(`Opening ${chalk.magentaBright(openingId)} status changed to: ${chalk.magentaBright('In Review')}`)
    )
  }
}
