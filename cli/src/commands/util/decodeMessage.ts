import { flags } from '@oclif/command'
import { hexToU8a, isHex } from '@polkadot/util'
import ExitCodes from '../../ExitCodes'
import { metaToObject } from '@joystream/metadata-protobuf/utils'
import ProtobufMessageCommandBase from '../../base/ProtobufMessageCommandBase'

export default class DecodeMessageCommand extends ProtobufMessageCommandBase {
  static description = 'Decode a protobuf message (from hex to json)'

  static flags = {
    ...super.flags,
    hex: flags.string({
      required: true,
      description: `Hex-encoded protobuf message'`,
    }),
  }

  async run(): Promise<void> {
    const { hex } = this.parse(DecodeMessageCommand).flags
    if (!isHex(hex)) {
      this.error('Invalid hex string provided', { exit: ExitCodes.InvalidInput })
    }
    const jsonObj = metaToObject(this.MessageClass, this.MessageClass.decode(hexToU8a(hex)))
    this.jsonPrettyPrint(JSON.stringify(jsonObj))

    this.output(JSON.stringify(jsonObj))
  }
}
