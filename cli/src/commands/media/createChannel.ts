import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import ChannelEntitySchema from 'cd-schemas/schemas/entities/ChannelEntity.schema.json'
import { ChannelEntity } from 'cd-schemas/types/entities/ChannelEntity'
import { InputParser } from 'cd-schemas'
import { IOFlags, getInputJson, saveOutputJson } from '../../helpers/InputOutput'
import { JSONSchema } from '@apidevtools/json-schema-ref-parser'
import { JsonSchemaCustomPrompts, JsonSchemaPrompter } from '../../helpers/JsonSchemaPrompt'

export default class CreateChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Create a new channel on Joystream (requires a membership).'
  static flags = {
    ...IOFlags,
  }

  async run() {
    const account = await this.getRequiredSelectedAccount()
    const memberId = await this.getRequiredMemberId()
    const actor = { Member: memberId }

    await this.requestAccountDecoding(account)

    const channelJsonSchema = (ChannelEntitySchema as unknown) as JSONSchema

    const { input, output } = this.parse(CreateChannelCommand).flags

    let inputJson = await getInputJson<ChannelEntity>(input, channelJsonSchema)
    if (!inputJson) {
      const customPrompts: JsonSchemaCustomPrompts = [
        ['language', () => this.promptForEntityId('Choose channel language', 'Language', 'name')],
        ['curationStatus', async () => undefined],
      ]

      const prompter = new JsonSchemaPrompter<ChannelEntity>(channelJsonSchema, undefined, customPrompts)

      inputJson = await prompter.promptAll()
    }

    this.jsonPrettyPrint(JSON.stringify(inputJson))
    const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

    if (confirmed) {
      const inputParser = InputParser.createWithKnownSchemas(this.getOriginalApi(), [
        {
          className: 'Channel',
          entries: [inputJson],
        },
      ])
      const operations = await inputParser.getEntityBatchOperations()
      await this.sendAndFollowNamedTx(account, 'contentDirectory', 'transaction', [actor, operations], true)
      saveOutputJson(output, `${inputJson.title}Channel.json`, inputJson)
    }
  }
}
