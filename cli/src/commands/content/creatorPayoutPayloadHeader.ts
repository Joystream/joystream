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
    const serializedHeader = await serializedPayloadHeader(input)

    try {
      const header = CreatorPayoutPayload.Header.decode(serializedHeader)
      this.log(
        chalk.green(`Serialized payout header is ${chalk.cyanBright(Buffer.from(serializedHeader).toString('hex'))}!`)
      )

      displayCollapsedRow({
        'Payload Size (in bytes)': header.payloadLengthInBytes.toString(),
        'Header Size (in bytes)': header.headerLengthInBytes.toString(),
        'Number of channels': header.numberOfChannels,
      })
      displayTable(
        header.creatorPayoutByteOffsets.map(({ channelId, byteOffset }) => ({
          'Channel Id': channelId.toString(),
          'Byte offset of channel record': byteOffset.toString(),
        }))
      )
    } catch (error) {
      this.error(`Invalid serialized input for decoding header ${error}`)
    }
  }
}
