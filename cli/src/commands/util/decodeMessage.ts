import { flags } from '@oclif/command'
import * as allMessages from '@joystream/metadata-protobuf'
import DefaultCommandBase from '../../base/DefaultCommandBase'
import { AnyMetadataClass } from '@joystream/metadata-protobuf/types'
import { hexToU8a, isHex } from '@polkadot/util'
import ExitCodes from '../../ExitCodes'
import { metaToObject } from '@joystream/metadata-protobuf/utils'

export default class DecodeMessageCommand extends DefaultCommandBase {
  static description = 'Decode a protobuf message (from hex to json)'

  static flags = {
    type: flags.enum({
      options: Object.keys(allMessages),
      required: true,
      description: 'Type of the message',
    }),
    hex: flags.string({
      required: true,
      description: `Hex-encoded protobuf message'`,
    }),
  }

  async run(): Promise<void> {
    const { type, hex } = this.parse(DecodeMessageCommand).flags
    const metaClass = allMessages[type as keyof typeof allMessages] as AnyMetadataClass<unknown>
    if (!isHex(hex)) {
      this.error('Invalid hex string provided', { exit: ExitCodes.InvalidInput })
    }
    const jsonObj = metaToObject(metaClass, metaClass.decode(hexToU8a(hex)))
    this.jsonPrettyPrint(JSON.stringify(jsonObj))

    this.output(JSON.stringify(jsonObj))
  }
}
