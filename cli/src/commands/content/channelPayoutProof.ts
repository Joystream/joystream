import { displayCollapsedRow } from '../../helpers/display'
import { channelPayoutProof } from '@joystream/js/content'
import UploadCommandBase from '../../base/UploadCommandBase'

export default class ChannelPayoutProof extends UploadCommandBase {
  static description = 'Show payout information for a channel.'
  static args = [
    {
      name: 'channelId',
      required: true,
      description: 'ID of the Channel',
    },
  ]

  async run(): Promise<void> {
    const { channelId } = this.parse(ChannelPayoutProof).args

    // Ensure channel exists
    await this.getApi().channelById(channelId)

    // Get payouts payload bag info
    const storageNodeInfo = await this.getRandomActiveStorageNodeInfo('static:council')
    if (!storageNodeInfo) {
      this.error('No active storage node found')
    }

    const commitment = (await this.getOriginalApi().query.content.commitment()).toString()
    const [{ payloadDataObject }] = await this.getQNApi().getChannelPayoutsUpdatedEventByCommitment(commitment)

    const payoutProof = await channelPayoutProof(
      'URL',
      `${storageNodeInfo.apiEndpoint}/files/${payloadDataObject.id}`,
      Number(channelId)
    )

    if (payoutProof) {
      displayCollapsedRow({
        'Channel Id': channelId,
        'Cumulative Payout Earned': payoutProof.cumulativeRewardEarned,
        'Merkle Branch': JSON.stringify(payoutProof.merkleBranch),
        'Payout reason': payoutProof.reason,
      })
    } else {
      this.error(`Payout record found by channel id: "${channelId}"!`)
    }
  }
}
