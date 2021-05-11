import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { OpeningStatus } from '../../Types'
import { apiModuleByGroup } from '../../Api'
import chalk from 'chalk'
import { createParamOptions } from '../../helpers/promptOptions'

export default class WorkingGroupsFillOpening extends WorkingGroupsCommandBase {
  static description = "Allows filling working group opening that's currently in review. Requires lead access."
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
    const { args } = this.parse(WorkingGroupsFillOpening)

    const account = await this.getRequiredSelectedAccount()
    // Lead-only gate
    await this.getRequiredLead()

    const openingId = parseInt(args.wgOpeningId)
    const opening = await this.getOpeningForLeadAction(openingId, OpeningStatus.InReview)

    const applicationIds = await this.promptForApplicationsToAccept(opening)
    const rewardPolicyOpt = await this.promptForParam(`Option<RewardPolicy>`, createParamOptions('RewardPolicy'))

    await this.requestAccountDecoding(account)

    await this.sendAndFollowNamedTx(account, apiModuleByGroup[this.group], 'fillOpening', [
      openingId,
      applicationIds,
      rewardPolicyOpt,
    ])

    this.log(chalk.green(`Opening ${chalk.magentaBright(openingId)} succesfully filled!`))
    this.log(
      chalk.green('Accepted working group application IDs: ') +
        chalk.magentaBright(applicationIds.length ? applicationIds.join(chalk.green(', ')) : 'NONE')
    )
  }
}
