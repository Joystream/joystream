import { flags } from '@oclif/command'
import * as allMessages from '@joystream/metadata-protobuf'
import allMessagesJson from '@joystream/metadata-protobuf/json'
import { AnyMetadataClass } from '@joystream/metadata-protobuf/types'
import DefaultCommandBase from './DefaultCommandBase'

type MessageTypeName = keyof typeof allMessages & keyof typeof allMessagesJson & string

/**
 * Abstract base class for commands that require a single protobuf message context.
 */
export default abstract class ProtobufMessageCommandBase extends DefaultCommandBase {
  protected MessageClass!: AnyMetadataClass<unknown>
  protected messageJson!: Record<string, unknown>
  protected type!: keyof typeof allMessages

  static flags = {
    type: flags.enum<MessageTypeName>({
      options: Object.keys(allMessages) as MessageTypeName[],
      required: false,
      description: 'Type of the message',
    }),
  }

  async init(): Promise<void> {
    await super.init()
    let {
      flags: { type },
    } = this.parse(this.constructor as typeof ProtobufMessageCommandBase)

    if (!type) {
      type = await this.promptForMessageType()
    }

    this.type = type
    this.messageJson = allMessagesJson[type]
    this.MessageClass = allMessages[type]
  }

  async promptForMessageType(message = 'Choose a message type'): Promise<MessageTypeName> {
    return this.simplePrompt<MessageTypeName>({
      type: 'list',
      choices: Object.keys(allMessages)
        .sort()
        .map((c) => ({
          value: c,
          name: c,
        })),
      message,
    })
  }
}
