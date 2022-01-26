import BountyCommandBase from '../../base/BountyCommandBase'
import { displayCollapsedRow } from '../../helpers/display'

export default class EntryCommand extends BountyCommandBase {
  static description = 'Show Work entry details by id.'
  static args = [
    {
      name: 'entryId',
      required: true,
      description: 'ID of the work entry',
    },
  ]

  async run() {
    const { entryId } = this.parse(EntryCommand).args
    const entry = await this.getApi().entryById(entryId)
    if (entry) {
      displayCollapsedRow({
        'ID': entryId.toString(),
        'Member ID': entry.member_id.toString(),
        'Staking Account ID': entry.staking_account_id.toString(),
        'Submitted At': entry.submitted_at.toString(),
        'Work Submitted': entry.work_submitted.toString(),
        'Oracle Judgement': entry.oracle_judgment_result.unwrapOr('None').toString(),
      })
    } else {
      this.error(`Work entry not found by channel id: "${entryId}"!`)
    }
  }
}
