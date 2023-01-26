import { ChannelPayoutsMetadata } from '@joystream/metadata-protobuf'
import { serializedPayloadHeader } from '@joystream/js/content'
import { readBytesFromFile } from '@joystream/js/utils'
import { Command, flags } from '@oclif/command'
import chalk from 'chalk'
import { displayCollapsedRow, displayTable } from '../../helpers/display'

export default class ChannelPayoutPayloadHeader extends Command {
  static description = 'Get header from serialized payload file.'
  static flags = {
    path: flags.string({
      required: false,
      description: 'Path to the protobuf serialized payload file',
      exclusive: ['url'],
    }),
    url: flags.string({
      required: false,
      description: 'URL to the protobuf serialized payload file',
      exclusive: ['path'],
    }),
  }

  async run(): Promise<void> {
    const { path, url } = this.parse(ChannelPayoutPayloadHeader).flags
    if (!(path || url)) {
      this.error('One of path or url should be provided')
    }

    try {
      const serializedHeader = path
        ? await serializedPayloadHeader(readBytesFromFile('PATH', path))
        : await serializedPayloadHeader(readBytesFromFile('URL', url!))

      const header = ChannelPayoutsMetadata.Header.decode(serializedHeader)
      this.log(
        chalk.green(`Serialized payout header is ${chalk.cyanBright(Buffer.from(serializedHeader).toString('hex'))}\n`)
      )

      displayCollapsedRow({
        'Payload Size (in bytes)': header.payloadLengthInBytes.toString(),
        'Header Size (in bytes)': header.headerLengthInBytes.toString(),
        'Number of channels': header.numberOfChannels,
      })
      displayTable(
        (header.channelPayoutByteOffsets || []).map(({ channelId, byteOffset }) => ({
          'Channel Id': channelId.toString(),
          'Byte offset of channel record': byteOffset.toString(),
        }))
      )
    } catch (error) {
      this.error(`Invalid serialized input for decoding header ${error}`)
    }
  }
}
