import { CreatorPayoutPayload } from '@joystream/metadata-protobuf'
import { serializedPayloadHeader } from '@joystreamjs/content'
import { Command, flags } from '@oclif/command'
import chalk from 'chalk'
import { displayCollapsedRow, displayTable } from '../../helpers/display'

export default class CreatorPayoutPayloadHeader extends Command {
  static description = 'Get header from serialized payload file.'
  static flags = {
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to serialized payload file containing creator payouts`,
    }),
  }

  async run(): Promise<void> {
    const { input } = this.parse(CreatorPayoutPayloadHeader).flags
    const serializedzHeader = await serializedPayloadHeader(input)

    try {
      const payoutHeader = CreatorPayoutPayload.Header.decode(serializedzHeader)
      this.log(
        chalk.green(`Serialized payout header is ${chalk.cyanBright(Buffer.from(serializedzHeader).toString('hex'))}!`)
      )

      displayCollapsedRow({
        'Payload Size (in bytes)': payoutHeader.payloadLengthInBytes.toString(),
        'Header Size (in bytes)': payoutHeader.headerLengthInBytes.toString(),
        'Number of channels': payoutHeader.numberOfChannels,
      })
      displayTable(
        payoutHeader.creatorPayoutByteOffsets.map(({ channelId, byteOffset }) => ({
          'Channel Id': channelId.toString(),
          'Byte offset of channel record': byteOffset.toString(),
        }))
      )
    } catch (error) {
      this.error(`Invalid byte offset for payout record ${error}`)
    }
  }
}
