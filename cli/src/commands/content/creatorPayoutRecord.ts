import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { displayCollapsedRow } from '../../helpers/display'
import { creatorPayoutRecord } from '@joystreamjs/content'

export default class CreatorPayoutRecord extends ContentDirectoryCommandBase {
  static description = 'Show payout information for creator given a channel id.'
  static args = [
    {
      name: 'channelId',
      required: true,
      description: 'ID of the Channel',
    },
  ]

  async run(): Promise<void> {
    const { channelId } = this.parse(CreatorPayoutRecord).args
    const payoutRecord = await creatorPayoutRecord(channelId)

    if (payoutRecord) {
      displayCollapsedRow({
        'Channel Id': channelId,
        'Cumulative Payout Owed': payoutRecord.cumulativePayoutOwed,
        'Merkle Proof Branches': payoutRecord.merkleBranches.toString(),
        'Payout Rationale': payoutRecord.payoutRationale,
      })
    } else {
      this.error(`Payout record found by channel id: "${channelId}"!`)
    }
  }
}
