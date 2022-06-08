import { channelPayoutRecordAtByteOffset } from '@joystreamjs/content'
import { Command, flags } from '@oclif/command'
import { displayCollapsedRow } from '../../helpers/display'

export default class ChannelPayoutRecordAtByteOffset extends Command {
  static description = 'Get channel payout record from serialized payload file at given byte.'
  static flags = {
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to serialized payload file containing channel payouts`,
    }),
  }

  static args = [
    {
      name: 'btyeOffset',
      required: true,
      description: 'Byte offset of payout record from start of payload',
    },
  ]

  async run(): Promise<void> {
    const { input } = this.parse(ChannelPayoutRecordAtByteOffset).flags
    const { btyeOffset } = this.parse(ChannelPayoutRecordAtByteOffset).args
    const start = Number.parseInt(btyeOffset as string)

    try {
      const payoutRecord = await channelPayoutRecordAtByteOffset(input, start)
      displayCollapsedRow({
        'Channel Id': payoutRecord.channelId,
        'Cumulative Payout Earned': payoutRecord.cumulativeRewardEarned,
        'Merkle Proof Branches': JSON.stringify(payoutRecord.merkleBranch),
        'Payout Rationale': payoutRecord.payoutRationale,
      })
    } catch (error) {
      this.error(`Invalid byte offset for payout record ${error}`)
    }
  }
}
