import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { OpeningStatus } from '../../Types'
import { apiModuleByGroup } from '../../Api'
import { OpeningId } from '@joystream/types/hiring'
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

  async run() {
    const { args } = this.parse(WorkingGroupsStartAcceptingApplications)

    const account = await this.getRequiredSelectedAccount()
    // Lead-only gate
    await this.getRequiredLead()

    const openingId = parseInt(args.wgOpeningId)
    await this.validateOpeningForLeadAction(openingId, OpeningStatus.WaitingToBegin)

    await this.requestAccountDecoding(account)

    await this.sendAndFollowExtrinsic(account, apiModuleByGroup[this.group], 'acceptApplications', [
      new OpeningId(openingId),
    ])

    this.log(
      chalk.green(`Opening ${chalk.white(openingId)} status changed to: ${chalk.white('Accepting Applications')}`)
    )
  }
}
