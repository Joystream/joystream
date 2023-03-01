import ProtobufMessageCommandBase from '../../base/ProtobufMessageCommandBase'

export default class MessageStructureCommand extends ProtobufMessageCommandBase {
  static description = 'Show message structure (available fields, their types and indexes)'
  static flags = { ...super.flags }

  async run(): Promise<void> {
    this.output(JSON.stringify(this.messageJson, null, 4))
  }
}
