import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import ChannelEntitySchema from '@joystream/cd-schemas/schemas/entities/ChannelEntity.schema.json'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities/ChannelEntity'
import { InputParser } from '@joystream/cd-schemas'
import { IOFlags, getInputJson, saveOutputJson } from '../../helpers/InputOutput'
import { JSONSchema } from '@apidevtools/json-schema-ref-parser'
import { JsonSchemaCustomPrompts, JsonSchemaPrompter } from '../../helpers/JsonSchemaPrompt'
import { Actor, Entity } from '@joystream/types/content-directory'
import { flags } from '@oclif/command'
import { createType } from '@joystream/types'
import _ from 'lodash'

export default class UpdateChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Update one of the owned channels on Joystream (requires a membership).'
  static flags = {
    ...IOFlags,
    asCurator: flags.boolean({
      description: 'Provide this flag in order to use Curator context for the update',
      required: false,
    }),
  }

  static args = [
    {
      name: 'id',
      description: 'ID of the channel to update',
      required: false,
    },
  ]

  async run() {
    const {
      args: { id },
      flags: { asCurator },
    } = this.parse(UpdateChannelCommand)

    const account = await this.getRequiredSelectedAccount()

    let memberId: number | undefined, actor: Actor

    if (asCurator) {
      actor = await this.getCuratorContext(['Channel'])
    } else {
      memberId = await this.getRequiredMemberId()
      actor = createType('Actor', { Member: memberId })
    }

    await this.requestAccountDecoding(account)

    let channelEntity: Entity, channelId: number
    if (id) {
      channelId = parseInt(id)
      channelEntity = await this.getEntity(channelId, 'Channel', memberId)
    } else {
      const [id, channel] = await this.promptForEntityEntry('Select a channel to update', 'Channel', 'handle', memberId)
      channelId = id.toNumber()
      channelEntity = channel
    }

    const currentValues = await this.parseToKnownEntityJson<ChannelEntity>(channelEntity)
    this.jsonPrettyPrint(JSON.stringify(currentValues))

    const channelJsonSchema = (ChannelEntitySchema as unknown) as JSONSchema

    const { input, output } = this.parse(UpdateChannelCommand).flags

    let inputJson = await getInputJson<ChannelEntity>(input, channelJsonSchema)
    if (!inputJson) {
      const customPrompts: JsonSchemaCustomPrompts<ChannelEntity> = [
        [
          'language',
          () =>
            this.promptForEntityId('Choose channel language', 'Language', 'name', undefined, currentValues.language),
        ],
      ]

      if (!asCurator) {
        // Skip isCensored is it's not updated by the curator
        customPrompts.push(['isCensored', 'skip'])
      }

      const prompter = new JsonSchemaPrompter<ChannelEntity>(channelJsonSchema, currentValues, customPrompts)

      inputJson = await prompter.promptAll()
    }

    this.jsonPrettyPrint(JSON.stringify(inputJson))
    const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

    if (confirmed) {
      saveOutputJson(output, `${_.startCase(inputJson.handle)}Channel.json`, inputJson)
      const inputParser = InputParser.createWithKnownSchemas(this.getOriginalApi())
      const updateOperations = await inputParser.getEntityUpdateOperations(inputJson, 'Channel', channelId)
      this.log('Sending the extrinsic...')
      await this.sendAndFollowNamedTx(account, 'contentDirectory', 'transaction', [actor, updateOperations])
    }
  }
}
