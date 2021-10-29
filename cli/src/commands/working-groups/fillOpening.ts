import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { GroupOpening, OpeningStatus } from '../../Types'
import { apiModuleByGroup } from '../../Api'
import chalk from 'chalk'
import { flags } from '@oclif/command'
import { createParamOptions } from '../../helpers/promptOptions'
import { createType } from '@joystream/types'
import { IRewardPolicy } from '@joystream/types/working-group'
import { Codec } from '@polkadot/types/types'

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
    applicantIds: flags.integer({
      char: 'a',
      required: false,
      multiple: true,
      description: 'List of applicants to hire, eg. 1 2 3',
    }),
    rewardPolicy: flags.integer({
      char: 'r',
      multiple: true,
      required: false,
      description: 'Set the Recurring Reward Policy, eg. [amount] [nextpayment] <frequency>',
    }),
    sudo: flags.boolean({
      char: 's',
      required: false,
      hidden: true,
      description:
        'Wrappes the command in sudo',
    }),
  }

  async run() {
    const { args } = this.parse(WorkingGroupsFillOpening)

    const {
      flags: { applicantIds, rewardPolicy, sudo },
    } = this.parse(WorkingGroupsFillOpening)

    const account = await this.getRequiredSelectedAccount()
    const openingId = parseInt(args.wgOpeningId)
    let opening: GroupOpening
    
    if (!sudo) {
      // Lead-only gate
      await this.getRequiredLead()
      opening = await this.getOpeningForLeadAction(openingId, OpeningStatus.InReview)
    } else {
      opening = await this.getOpening(openingId, OpeningStatus.InReview)
    }

    let applicationIds: number[] = []
    if (!applicantIds) {
      applicationIds = await this.promptForApplicationsToAccept(opening)
    } else {
      applicationIds = applicantIds
    }
    let rewardPolicyOpt: IRewardPolicy | Codec
    if (rewardPolicy.length >= 2) {
      rewardPolicyOpt = {
        amount_per_payout: createType('u128', rewardPolicy[0]),
        next_payment_at_block: createType('u32', rewardPolicy[1]),
        payout_interval: createType('Option<u32>',rewardPolicy[2]),
      }
    } else {
      rewardPolicyOpt = await this.promptForParam(`Option<RewardPolicy>`, createParamOptions('RewardPolicy'))
    }

    await this.requestAccountDecoding(account)
    if (!sudo) {
      await this.sendAndFollowNamedTx(account, apiModuleByGroup[this.group], 'fillOpening', [
        openingId,
        createType('BTreeSet<ApplicationId>', applicationIds),
        rewardPolicyOpt,
      ])
    } else {
      await this.sendAndFollowNamedSudoTx(account, apiModuleByGroup[this.group], 'fillOpening', [
        openingId,
        createType('BTreeSet<ApplicationId>', applicationIds),
        rewardPolicyOpt,
      ])
    }

    this.log(chalk.green(`Opening ${chalk.magentaBright(openingId)} successfully filled!`))
    this.log(
      chalk.green('Accepted working group application IDs: ') +
        chalk.magentaBright(applicationIds.length ? applicationIds.join(chalk.green(', ')) : 'NONE')
    )
  }
}
