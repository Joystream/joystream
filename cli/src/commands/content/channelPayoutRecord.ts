import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { displayCollapsedRow } from '../../helpers/display'
import { channelPayoutRecord } from '@joystreamjs/content'

export default class ChannelPayoutRecord extends ContentDirectoryCommandBase {
  static description = 'Show payout information for channel given a channel id.'
  static args = [
    {
      name: 'channelId',
      required: true,
      description: 'ID of the Channel',
    },
  ]

  async run(): Promise<void> {
    const { channelId } = this.parse(ChannelPayoutRecord).args
    const payoutRecord = await channelPayoutRecord(channelId)

    if (payoutRecord) {
      displayCollapsedRow({
        'Channel Id': channelId,
        'Cumulative Payout Earned': payoutRecord.cumulativeRewardEarned,
        'Merkle Branch': JSON.stringify(payoutRecord.merkleBranch),
        'Payout Rationale': payoutRecord.payoutRationale,
      })
    } else {
      this.error(`Payout record found by channel id: "${channelId}"!`)
    }
  }
}
