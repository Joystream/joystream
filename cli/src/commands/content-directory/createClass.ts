import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import CreateClassSchema from 'cd-schemas/schemas/extrinsics/CreateClass.schema.json'
import { CreateClass } from 'cd-schemas/types/extrinsics/CreateClass'
import { JsonSchemaPrompter, JsonSchemaCustomPrompts } from '../../helpers/JsonSchemaPrompt'
import { JSONSchema } from '@apidevtools/json-schema-ref-parser'

export default class CouncilInfo extends ContentDirectoryCommandBase {
  static description = 'Create class inside content directory. Requires lead access.'

  async run() {
    const account = await this.getRequiredSelectedAccount()
    await this.requireLead()

    const customPrompts: JsonSchemaCustomPrompts = [
      ['class_permissions.maintainers', () => this.promptForCuratorGroups('Select class maintainers')],
    ]

    const prompter = new JsonSchemaPrompter<CreateClass>(CreateClassSchema as JSONSchema, undefined, customPrompts)

    const createClassJson = await prompter.promptAll()

    console.log(this.jsonPrettyPrint(JSON.stringify(createClassJson)))

    await this.sendAndFollowExtrinsic(account, 'contentDirectory', 'createClass', [
      createClassJson.name,
      createClassJson.description,
      createClassJson.class_permissions,
      createClassJson.maximum_entities_count,
      createClassJson.default_entity_creation_voucher_upper_bound,
    ])
  }
}
