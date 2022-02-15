import { creatorPayoutRecordAtByteOffset } from '@joystreamjs/content'
import { Command, flags } from '@oclif/command'
import { displayCollapsedRow } from '../../helpers/display'

export default class CreatorPayoutRecordAtByteOffset extends Command {
  static description = 'Get creator payout record from serialized payload file at given byte.'
  static flags = {
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to serialized payload file containing creator payouts`,
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
    const { input } = this.parse(CreatorPayoutRecordAtByteOffset).flags
    const { btyeOffset } = this.parse(CreatorPayoutRecordAtByteOffset).args
    const start = Number.parseInt(btyeOffset as string)

    try {
      const payoutRecord = await creatorPayoutRecordAtByteOffset(input, start)
      displayCollapsedRow({
        'Channel Id': payoutRecord.channelId,
        'Cumulative Payout Owed': payoutRecord.cumulativePayoutOwed,
        'Merkle Proof Branches': JSON.stringify(payoutRecord.merkleBranch),
        'Payout Rationale': payoutRecord.payoutRationale,
      })
    } catch (error) {
      this.error(`Invalid byte offset for payout record ${error}`)
    }
  }
}
