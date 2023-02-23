import { flags } from '@oclif/command'
import * as all from '@joystream/metadata-protobuf'
import DefaultCommandBase from '../../base/DefaultCommandBase'
import { AnyMetadataClass } from '@joystream/metadata-protobuf/types'
import { metadataToBytes } from '../../helpers/serialization'

export default class GenerateMessageCommand extends DefaultCommandBase {
  static description = 'Generate a protobuf message hex'

  static flags = {
    name: flags.enum({
      options: Object.keys(all),
      required: true,
      description: 'Name of the message',
    }),
    json: flags.string({
      required: true,
      description: 'JSON-encoded message input',
    }),
  }

  async run(): Promise<void> {
    const { name, json } = this.parse(GenerateMessageCommand).flags
    const metaClass = all[name as keyof typeof all] as AnyMetadataClass<unknown>
    const bytes = metadataToBytes(metaClass, JSON.parse(json))

    this.output(bytes.toHex())
  }
}
