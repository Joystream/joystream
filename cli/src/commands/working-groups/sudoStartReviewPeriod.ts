import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { apiModuleByGroup } from '../../Api'
import chalk from 'chalk'

export default class WorkingGroupsSudoStartReviewPeriod extends WorkingGroupsCommandBase {
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
    const { args } = this.parse(WorkingGroupsSudoStartReviewPeriod)

    const account = await this.getRequiredSelectedAccount()

    const openingId = parseInt(args.wgOpeningId)

    await this.requestAccountDecoding(account)

    await this.sendAndFollowNamedSudoTx(account, apiModuleByGroup[this.group], 'beginApplicantReview', [openingId])

    this.log(
      chalk.green(`Opening ${chalk.magentaBright(openingId)} status changed to: ${chalk.magentaBright('In Review')}`)
    )
  }
}
