import BountyCommandBase from '../../base/BountyCommandBase'
import { displayTable } from '../../helpers/display'

export default class EntriesCommand extends BountyCommandBase {
  static description = 'List all existing work entries.'

  async run() {
    const bounties = await this.getApi().availableEntries()
    if (bounties.length > 0) {
      displayTable(
        bounties.map(([id, e]) => ({
          'ID': id.toString(),
          'Member ID': e.member_id.toString(),
          'Staking Account ID': e.staking_account_id.toString(),
          'Submitted At': e.submitted_at.toString(),
          'Work Submitted': e.work_submitted.toString(),
          'Oracle Judgement': e.oracle_judgment_result.unwrapOr('None').toString(),
        }))
      )
    } else {
      this.log('There are no work entries yet')
    }
  }
}
