import { flags } from '@oclif/command'
import { metadataToBytes } from '../../helpers/serialization'
import { getInputJson } from '../../helpers/InputOutput'
import ExitCodes from '../../ExitCodes'
import ProtobufMessageCommandBase from '../../base/ProtobufMessageCommandBase'

export default class EncodeMessageCommand extends ProtobufMessageCommandBase {
  static description = 'Encode a protobuf message (from json to hex)'

  static flags = {
    ...super.flags,
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
    const { jsonString, input } = this.parse(EncodeMessageCommand).flags
    const jsonObj = input
      ? await getInputJson(input)
      : jsonString
      ? JSON.parse(jsonString)
      : this.error('Either --input or --jsonString must be provided!', { exit: ExitCodes.InvalidInput })
    const bytes = metadataToBytes(this.MessageClass, jsonObj)

    this.output(bytes.toHex())
  }
}
