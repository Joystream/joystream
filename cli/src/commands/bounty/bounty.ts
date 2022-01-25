import BountyCommandBase from '../../base/BountyCommandBase'
import { displayCollapsedRow } from '../../helpers/display'

export default class BountyCommand extends BountyCommandBase {
  static description = 'Show Bounty details by id.'
  static args = [
    {
      name: 'bountyId',
      required: true,
      description: 'ID of the Bounty',
    },
  ]

  async run() {
    const { bountyId } = this.parse(BountyCommand).args
    const bounty = await this.getApi().bountyById(bountyId)
    if (bounty) {
      displayCollapsedRow({
        'ID': bountyId.toString(),
        'Bounty Creator': bounty.creation_params.creator.toString(),
        'Oracle': bounty.creation_params.oracle.toString(),
        'Contract Type': bounty.creation_params.contract_type.toString(),
        'Bounty Cherry': bounty.creation_params.cherry.toString(),
        'Entrant Stake': bounty.creation_params.entrant_stake.toString(),
        'Funding Type': bounty.creation_params.funding_type.toString(),
        'Work Period': bounty.creation_params.work_period.toString(),
        'Judging Period': bounty.creation_params.judging_period.toString(),
        'Total Funding': bounty.total_funding.toString(),
        'Milestone': bounty.milestone.toString(),
        'Active Work Entry Count': bounty.active_work_entry_count.toString(),
      })
    } else {
      this.error(`Bounty not found by channel id: "${bountyId}"!`)
    }
  }
}
