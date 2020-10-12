import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import ChannelEntitySchema from 'cd-schemas/schemas/entities/ChannelEntity.schema.json'
import { ChannelEntity } from 'cd-schemas/types/entities/ChannelEntity'
import { InputParser } from 'cd-schemas'
import { IOFlags, getInputJson, saveOutputJson } from '../../helpers/InputOutput'
import { JSONSchema } from '@apidevtools/json-schema-ref-parser'
import { JsonSchemaCustomPrompts, JsonSchemaPrompter } from '../../helpers/JsonSchemaPrompt'
import { Entity } from '@joystream/types/content-directory'

export default class UpdateChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Update one of the owned channels on Joystream (requires a membership).'
  static flags = {
    ...IOFlags,
  }

  static args = [
    {
      name: 'id',
      description: 'ID of the channel to update',
      required: false,
    },
  ]

  async run() {
    const account = await this.getRequiredSelectedAccount()
    const memberId = await this.getRequiredMemberId()
    const actor = { Member: memberId }

    await this.requestAccountDecoding(account)

    const { id } = this.parse(UpdateChannelCommand).args

    let channelEntity: Entity, channelId: number
    if (id) {
      channelId = parseInt(id)
      channelEntity = await this.getEntity(channelId, 'Channel', memberId)
    } else {
      const [id, channel] = await this.promptForEntityEntry('Select a channel to update', 'Channel', 'title', memberId)
      channelId = id.toNumber()
      channelEntity = channel
    }

    const currentValues = await this.parseToKnownEntityJson<ChannelEntity>(channelEntity)
    this.jsonPrettyPrint(JSON.stringify(currentValues))

    const channelJsonSchema = (ChannelEntitySchema as unknown) as JSONSchema

    const { input, output } = this.parse(UpdateChannelCommand).flags

    let inputJson = await getInputJson<ChannelEntity>(input, channelJsonSchema)
    if (!inputJson) {
      const customPrompts: JsonSchemaCustomPrompts = [
        [
          'language',
          () =>
            this.promptForEntityId('Choose channel language', 'Language', 'name', undefined, currentValues.language),
        ],
        ['curationStatus', async () => undefined],
      ]

      const prompter = new JsonSchemaPrompter<ChannelEntity>(channelJsonSchema, currentValues, customPrompts)

      inputJson = await prompter.promptAll()
    }

    this.jsonPrettyPrint(JSON.stringify(inputJson))
    const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

    if (confirmed) {
      const inputParser = InputParser.createWithKnownSchemas(this.getOriginalApi())
      const updateOperation = await inputParser.createEntityUpdateOperation(inputJson, 'Channel', channelId)
      this.log('Sending the extrinsic...')
      await this.sendAndFollowNamedTx(account, 'contentDirectory', 'transaction', [actor, [updateOperation]], true)
      saveOutputJson(output, `${inputJson.title}Channel.json`, inputJson)
    }
  }
}
