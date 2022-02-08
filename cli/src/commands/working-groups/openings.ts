import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { flags } from '@oclif/command'
import { displayTable } from '../../helpers/display'
import { formatBalance } from '@polkadot/util'
import moment from 'moment'

export default class WorkingGroupsOpenings extends WorkingGroupsCommandBase {
  static description = 'Lists active/upcoming openings in a given working group'
  static flags = {
    upcoming: flags.boolean({
      description: 'List upcoming openings (active openings are listed by default)',
    }),
    ...WorkingGroupsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { upcoming } = this.parse(WorkingGroupsOpenings).flags

    let rows: { [k: string]: string | number }[]
    if (upcoming) {
      const upcomingOpenings = await this.getQNApi().upcomingWorkingGroupOpeningsByGroup(this.group)
      rows = upcomingOpenings.map((o) => ({
        'Upcoming opening ID': o.id,
        'Starts at': o.expectedStart ? moment(o.expectedStart).format('YYYY-mm-dd HH:mm:ss') : '?',
        'Reward/block': o.rewardPerBlock ? formatBalance(o.rewardPerBlock) : '?',
        'Stake': o.stakeAmount ? formatBalance(o.stakeAmount) : '?',
      }))
    } else {
      const openings = await this.getApi().openingsByGroup(this.group)
      rows = openings.map((o) => ({
        'Opening ID': o.openingId,
        Type: o.type.type,
        Applications: o.applications.length,
        'Reward/block': formatBalance(o.rewardPerBlock),
        'Stake': formatBalance(o.stake.value),
      }))
    }

    displayTable(rows, 5)
  }
}
