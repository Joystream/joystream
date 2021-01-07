import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import inquirer from 'inquirer'
import { InputParser } from '@joystream/cd-schemas'
import ExitCodes from '../../ExitCodes'

export default class UpdateEntityPropertyValues extends ContentDirectoryCommandBase {
  static description =
    'Updates the property values of the specified entity (can be executed in Member, Curator or Lead context)'

  static args = [
    {
      name: 'id',
      required: true,
      description: 'ID of the Entity',
    },
  ]

  static flags = {
    context: ContentDirectoryCommandBase.contextFlag,
  }

  async run() {
    const { id } = this.parse(UpdateEntityPropertyValues).args
    let { context } = this.parse(UpdateEntityPropertyValues).flags

    if (!context) {
      context = await this.promptForContext()
    }

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const entity = await this.getEntity(id)
    const [, entityClass] = await this.classEntryByNameOrId(entity.class_id.toString())
    const defaults = await this.parseToEntityJson(entity)

    const actor = await this.getActor(context, entityClass)

    const isPropertEditableByIndex = await Promise.all(
      entityClass.properties.map((p, i) => this.isEntityPropertyEditableByActor(entity, i, actor))
    )
    const filteredProperties = entityClass.properties.filter((p, i) => isPropertEditableByIndex[i])

    if (!filteredProperties.length) {
      this.error('No entity properties are editable by choosen actor', { exit: ExitCodes.AccessDenied })
    }

    const answers: {
      [key: string]: string | number | null
    } = await inquirer.prompt(this.getQuestionsFromProperties(filteredProperties, defaults))

    this.jsonPrettyPrint(JSON.stringify(answers))
    await this.requireConfirmation('Do you confirm the provided input?')

    const inputParser = InputParser.createWithKnownSchemas(this.getOriginalApi())

    const operations = await inputParser.getEntityUpdateOperations(answers, entityClass.name.toString(), +id)

    await this.sendAndFollowNamedTx(currentAccount, 'contentDirectory', 'transaction', [actor, operations])
  }
}
