import { displayCollapsedRow } from '../../helpers/display'
import { channelPayoutRecord } from '@joystreamjs/content'
import UploadCommandBase from '../../base/UploadCommandBase'
import BN from 'bn.js'

export default class ChannelPayoutRecord extends UploadCommandBase {
  static description = 'Show payout information for a channel.'
  static args = [
    {
      name: 'channelId',
      required: true,
      description: 'ID of the Channel',
    },
  ]

  async run(): Promise<void> {
    const { channelId } = this.parse(ChannelPayoutRecord).args

    const storageNodeInfo = await this.getRandomActiveStorageNodeInfo('static:council')
    if (!storageNodeInfo) {
      this.error('No active storage node found')
    }

    const commitment = await this.getOriginalApi().query.content.commitment()
    const [{ payloadDataObject }] = await this.getQNApi().getChannelPayoutsUpdatedEventByCommitment(
      commitment.toString()
    )
    const payoutRecord = await channelPayoutRecord(
      channelId,
      `${storageNodeInfo.apiEndpoint}/files`,
      new BN(payloadDataObject.id)
    )

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
