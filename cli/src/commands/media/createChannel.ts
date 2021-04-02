import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import ChannelEntitySchema from '@joystream/cd-schemas/schemas/entities/ChannelEntity.schema.json'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities/ChannelEntity'
import { InputParser } from '@joystream/cd-schemas'
import { IOFlags, getInputJson, saveOutputJson } from '../../helpers/InputOutput'
import { JSONSchema } from '@apidevtools/json-schema-ref-parser'
import { JsonSchemaCustomPrompts, JsonSchemaPrompter } from '../../helpers/JsonSchemaPrompt'
import { cli } from 'cli-ux'

import { flags } from '@oclif/command'
import _ from 'lodash'

export default class CreateChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Create a new channel on Joystream (requires a membership).'
  static flags = {
    ...IOFlags,
    confirm: flags.boolean({ char: 'y', name: 'confirm', required: false, description: 'Confirm the provided input' }),
  }

  async getExistingChannelHandles(): Promise<string[]> {
    cli.action.start('Fetching chain data...')
    const result = await Promise.all(
      (await this.entitiesByClassAndOwner('Channel'))
        .filter(([, c]) => c.supported_schemas.toArray().length)
        .map(async ([, channel]) => {
          const { handle } = await this.parseToEntityJson<ChannelEntity>(channel)
          return handle
        })
    )
    cli.action.stop()

    return result
  }

  async run() {
    const account = await this.getRequiredSelectedAccount()
    const memberId = await this.getRequiredMemberId()
    const actor = { Member: memberId }

    await this.requestAccountDecoding(account)

    const channelJsonSchema = (ChannelEntitySchema as unknown) as JSONSchema

    const { input, output, confirm } = this.parse(CreateChannelCommand).flags

    // Can potentially slow things down quite a bit
    const existingHandles = await this.getExistingChannelHandles()

    let inputJson = await getInputJson<ChannelEntity>(input, channelJsonSchema)
    if (!inputJson) {
      const customPrompts: JsonSchemaCustomPrompts = [
        [
          'handle',
          { validate: (h) => (existingHandles.includes(h) ? 'Channel with such handle already exists' : true) },
        ],
        ['language', () => this.promptForEntityId('Choose channel language', 'Language', 'name')],
        ['isCensored', 'skip'],
      ]

      const prompter = new JsonSchemaPrompter<ChannelEntity>(channelJsonSchema, undefined, customPrompts)

      inputJson = await prompter.promptAll()
    }

    this.jsonPrettyPrint(JSON.stringify(inputJson))
    const confirmed =
      confirm || (await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' }))

    if (confirmed) {
      saveOutputJson(output, `${_.startCase(inputJson.handle)}Channel.json`, inputJson)
      const inputParser = InputParser.createWithKnownSchemas(this.getOriginalApi(), [
        {
          className: 'Channel',
          entries: [inputJson],
        },
      ])
      const operations = await inputParser.getEntityBatchOperations()
      await this.sendAndFollowNamedTx(account, 'contentDirectory', 'transaction', [actor, operations])
    }
  }
}
