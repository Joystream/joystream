import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import AddClassSchemaSchema from 'cd-schemas/schemas/extrinsics/AddClassSchema.schema.json'
import { AddClassSchema } from 'cd-schemas/types/extrinsics/AddClassSchema'
import { JsonSchemaPrompter, JsonSchemaCustomPrompts } from '../../helpers/JsonSchemaPrompt'
import { JSONSchema } from '@apidevtools/json-schema-ref-parser'

export default class CouncilInfo extends ContentDirectoryCommandBase {
  static description = 'Add a new schema to a class inside content directory. Requires lead access.'

  async run() {
    const account = await this.getRequiredSelectedAccount()
    await this.requireLead()

    const customPrompts: JsonSchemaCustomPrompts = [
      ['classId', async () => this.promptForClass('Select a class to add schema to')],
      [/^newProperties\[\d+\]\.property_type\.Single\.Reference/, async () => this.promptForClassReference()],
    ]

    const prompter = new JsonSchemaPrompter<AddClassSchema>(
      AddClassSchemaSchema as JSONSchema,
      undefined,
      customPrompts
    )

    const addClassSchemaJson = await prompter.promptAll()

    this.jsonPrettyPrint(JSON.stringify(addClassSchemaJson))

    await this.sendAndFollowExtrinsic(account, 'contentDirectory', 'addClassSchema', [
      addClassSchemaJson.classId,
      addClassSchemaJson.existingProperties,
      addClassSchemaJson.newProperties as any[],
    ])
  }
}
