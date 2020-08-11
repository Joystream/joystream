import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { displayTable, displayCollapsedRow, displayHeader } from '../../helpers/display'
import _ from 'lodash'
import { OpeningStatus, GroupOpeningStage, GroupOpeningStakes, UnstakingPeriodsKey } from '../../Types'
import { StakingAmountLimitModeKeys, StakingPolicy } from '@joystream/types/hiring'
import { formatBalance } from '@polkadot/util'
import chalk from 'chalk'

export default class WorkingGroupsOpening extends WorkingGroupsCommandBase {
  static description = 'Shows an overview of given working group opening by Working Group Opening ID'
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

  stageColumns(stage: GroupOpeningStage) {
    const { status, date, block } = stage
    const statusTimeHeader = status === OpeningStatus.WaitingToBegin ? 'Starts at' : 'Last status change'
    return {
      Stage: _.startCase(status),
      [statusTimeHeader]:
        date && block
          ? `~ ${date.toLocaleTimeString()} ${date.toLocaleDateString()} (#${block})`
          : (block && `#${block}`) || '?',
    }
  }

  formatStake(stake: StakingPolicy | undefined) {
    if (!stake) return 'NONE'
    const { amount, amount_mode: amountMode } = stake
    return amountMode.type === StakingAmountLimitModeKeys.AtLeast
      ? `>= ${formatBalance(amount)}`
      : `== ${formatBalance(amount)}`
  }

  stakeColumns(stakes: GroupOpeningStakes) {
    const { role, application } = stakes
    return {
      'Application stake': this.formatStake(application),
      'Role stake': this.formatStake(role),
    }
  }

  async run() {
    const { args } = this.parse(WorkingGroupsOpening)

    const opening = await this.getApi().groupOpening(this.group, parseInt(args.wgOpeningId))

    displayHeader('Human readable text')
    this.jsonPrettyPrint(opening.opening.human_readable_text.toString())

    displayHeader('Opening details')
    const openingRow = {
      'WG Opening ID': opening.wgOpeningId,
      'Opening ID': opening.openingId,
      Type: opening.type.type,
      ...this.stageColumns(opening.stage),
      ...this.stakeColumns(opening.stakes),
    }
    displayCollapsedRow(openingRow)

    displayHeader('Unstaking periods')
    const periodsRow: { [k: string]: string } = {}
    for (const key of Object.keys(opening.unstakingPeriods).sort()) {
      const displayKey = _.startCase(key) + ':  '
      periodsRow[displayKey] = opening.unstakingPeriods[key as UnstakingPeriodsKey].toLocaleString() + ' blocks'
    }
    displayCollapsedRow(periodsRow)

    displayHeader(`Applications (${opening.applications.length})`)
    const applicationsRows = opening.applications.map((a) => ({
      'WG appl. ID': a.wgApplicationId,
      'Appl. ID': a.applicationId,
      Member: a.member?.handle.toString() || chalk.red('NONE'),
      Stage: a.stage,
      'Appl. stake': a.stakes.application,
      'Role stake': a.stakes.role,
      'Total stake': Object.values(a.stakes).reduce((a, b) => a + b),
    }))
    displayTable(applicationsRows, 5)
  }
}
