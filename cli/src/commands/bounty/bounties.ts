import BountyCommandBase from '../../base/BountyCommandBase'
import { displayTable } from '../../helpers/display'

export default class BountiesCommand extends BountyCommandBase {
  static description = 'List all existing bounties.'

  async run() {
    const bounties = await this.getApi().availableBounties()
    if (bounties.length > 0) {
      displayTable(
        bounties.map(([id, b]) => ({
          'ID': id.toString(),
          'Bounty Creator': b.creation_params.creator.toString(),
          'Oracle': b.creation_params.oracle.toString(),
          'Contract Type': b.creation_params.contract_type.toString(),
          'Bounty Cherry': b.creation_params.cherry.toString(),
          'Entrant Stake': b.creation_params.entrant_stake.toString(),
          'Funding Type': b.creation_params.funding_type.toString(),
          'Work Period': b.creation_params.work_period.toString(),
          'Judging Period': b.creation_params.judging_period.toString(),
          'Total Funding': b.total_funding.toString(),
          'Milestone': b.milestone.toString(),
          'Active Work Entry Count': b.active_work_entry_count.toString(),
        }))
      )
    } else {
      this.log('There are no bounties yet')
    }
  }
}
