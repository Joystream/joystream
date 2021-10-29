import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { OpeningStatus } from '../../Types'
import { apiModuleByGroup } from '../../Api'
import chalk from 'chalk'
import { flags } from '@oclif/command'

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
    sudo: flags.boolean({
      char: 's',
      required: false,
      hidden: true,
      description:
        'Wrappes the command in sudo',
    }),
  }

  async run() {
    const { args } = this.parse(WorkingGroupsStartReviewPeriod)
    const { flags: { sudo } } = this.parse(WorkingGroupsStartReviewPeriod)

    const account = await this.getRequiredSelectedAccount()
    
    const openingId = parseInt(args.wgOpeningId)
    if (!sudo) {
      // Lead-only gate
      await this.getRequiredLead()
      await this.requestAccountDecoding(account)
      await this.validateOpeningForLeadAction(openingId, OpeningStatus.AcceptingApplications)
      await this.sendAndFollowNamedTx(account, apiModuleByGroup[this.group], 'beginApplicantReview', [openingId])
    } else {
      await this.requestAccountDecoding(account)
      await this.sendAndFollowNamedSudoTx(account, apiModuleByGroup[this.group], 'beginApplicantReview', [openingId])
    }

    this.log(
      chalk.green(`Opening ${chalk.magentaBright(openingId)} status changed to: ${chalk.magentaBright('In Review')}`)
    )
  }
}
