import { channelPayoutProofAtByteOffset } from '@joystream/js/content'
import { readBytesFromFile } from '@joystream/js/utils'
import { Command, flags } from '@oclif/command'
import { displayCollapsedRow } from '../../helpers/display'

export default class ChannelPayoutProofAtByteOffset extends Command {
  static description = 'Get channel payout record from serialized payload at given byte.'
  static flags = {
    path: flags.string({
      required: false,
      description: 'Path to the serialized payload file',
      exclusive: ['url'],
    }),
    url: flags.string({
      required: false,
      description: 'URL to the serialized payload file',
      exclusive: ['path'],
    }),
  }

  static args = [
    {
      name: 'byteOffset',
      required: true,
      description: 'Byte offset of payout record from start of payload',
    },
  ]

  async run(): Promise<void> {
    const { path, url } = this.parse(ChannelPayoutProofAtByteOffset).flags
    const { byteOffset } = this.parse(ChannelPayoutProofAtByteOffset).args
    const start = Number.parseInt(byteOffset as string)

    try {
      if (!(path || url)) {
        this.error('One of path or url should be provided')
      }

      const payoutProof = path
        ? await channelPayoutProofAtByteOffset(readBytesFromFile('PATH', path), start)
        : await channelPayoutProofAtByteOffset(readBytesFromFile('URL', url!), start)

      displayCollapsedRow({
        'Channel Id': payoutProof.channelId,
        'Cumulative Payout Earned': payoutProof.cumulativeRewardEarned,
        'Merkle Proof Branch': JSON.stringify(payoutProof.merkleBranch),
        'Payout reason': payoutProof.reason,
      })
      console.log(payoutProof.merkleBranch)
    } catch (error) {
      this.error(`Invalid byte offset for payout record ${error}`)
    }
  }
}
