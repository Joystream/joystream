import { flags } from '@oclif/command'
import * as all from '@joystream/metadata-protobuf'
import DefaultCommandBase from '../../base/DefaultCommandBase'
import { AnyMetadataClass } from '@joystream/metadata-protobuf/types'
import _ from 'lodash'
import Long from 'long'

export default class MessageStructureCommand extends DefaultCommandBase {
  static description = 'Show message structure (available fields and their types)'

  static flags = {
    type: flags.enum({
      options: Object.keys(all),
      required: true,
      description: 'Type of the message',
    }),
  }

  protected mapMessage(obj: AnyMetadataClass<unknown> & { new (): unknown }): Record<string, unknown> {
    const prototype = obj.prototype
    delete prototype.toJSON
    return _.mapValues(prototype, (value, key) => {
      if (Array.isArray(value)) {
        return 'array'
      }
      if (typeof value === 'object') {
        if (value instanceof Long) {
          return 'Long'
        }
        const matches = obj.decode.toString().match(new RegExp(`message\\.${key} = \\$root\\.(.+)\\.decode`))
        if (!matches) {
          this.error('Cannot understand the message structure')
        }
        const [, childMessageName] = matches
        return this.mapMessage(all[childMessageName as keyof typeof all])
      }
      return typeof value
    })
  }

  async run(): Promise<void> {
    const { type } = this.parse(MessageStructureCommand).flags
    const metaClass = all[type as keyof typeof all] as AnyMetadataClass<unknown> & { new (): unknown }
    const mapped = this.mapMessage(metaClass)
    this.output(JSON.stringify(mapped, null, 4))
  }
}
