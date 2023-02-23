import { flags } from '@oclif/command'
import * as allMessages from '@joystream/metadata-protobuf'
import DefaultCommandBase from '../../base/DefaultCommandBase'
import { AnyMetadataClass } from '@joystream/metadata-protobuf/types'
import { metadataToBytes } from '../../helpers/serialization'
import { getInputJson } from '../../helpers/InputOutput'
import ExitCodes from '../../ExitCodes'

export default class EncodeMessageCommand extends DefaultCommandBase {
  static description = 'Encode a protobuf message (from json to hex)'

  static flags = {
    type: flags.enum({
      options: Object.keys(allMessages),
      required: true,
      description: 'Type of the message',
    }),
    jsonString: flags.string({
      required: false,
      description: `JSON-encoded message input (eg. '${JSON.stringify({ videoId: 1 })}'`,
      exclusive: ['input'],
    }),
    input: flags.string({
      char: 'i',
      required: false,
      description: `Path to a file containing a JSON-encoded message`,
      exclusive: ['jsonString'],
    }),
  }

  async run(): Promise<void> {
    const { type, jsonString, input } = this.parse(EncodeMessageCommand).flags
    const metaClass = allMessages[type as keyof typeof allMessages] as AnyMetadataClass<unknown>
    const jsonObj = input
      ? await getInputJson(input)
      : jsonString
      ? JSON.parse(jsonString)
      : this.error('Either --input or --jsonString must be provided!', { exit: ExitCodes.InvalidInput })
    const bytes = metadataToBytes(metaClass, jsonObj)

    this.output(bytes.toHex())
  }
}
