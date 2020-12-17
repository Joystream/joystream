import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { Actor, Class as ContentDirectoryClass } from '@joystream/types/content-directory'
import inquirer from 'inquirer'
import { InputParser } from '@joystream/cd-schemas'

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

  async parseDefaults(
    defaults: { [key: string]: { 'value': unknown } },
    actor: Actor,
    pickedClass: ContentDirectoryClass
  ) {
    let parsedDefaults: { [key: string]: { 'value': unknown; locked: boolean } } = {}

    const context = actor.type === 'Curator' ? 'Maintainer' : 'Controller'
    let propertyLockedFromUser: boolean[] = []

    if (context === 'Maintainer') {
      propertyLockedFromUser = pickedClass.properties.map(
        (property) => property.locking_policy.is_locked_from_maintainer.isTrue
      )
    } else {
      propertyLockedFromUser = pickedClass.properties.map(
        (property) => property.locking_policy.is_locked_from_controller.isTrue
      )
    }

    Object.keys(defaults).forEach((key, index) => {
      parsedDefaults = {
        ...parsedDefaults,
        [key]: {
          ...defaults[key],
          locked: propertyLockedFromUser[index],
        },
      }
    })

    return parsedDefaults
  }

  async run() {
    const { id } = this.parse(UpdateEntityPropertyValues).args
    const { context } = this.parse(UpdateEntityPropertyValues).flags

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const entity = await this.getEntity(id)
    const [, entityClass] = await this.classEntryByNameOrId(entity.class_id.toString())
    const defaults = this.parseEntityPropertyValues(entity, entityClass)

    const actor = await this.getActor(context, entityClass)

    const parsedDefaults = await this.parseDefaults(defaults, actor, entityClass)

    const answers: {
      [key: string]: string | number | null
    } = await inquirer.prompt(this.getQuestionsFromClass(entityClass, parsedDefaults))

    this.jsonPrettyPrint(JSON.stringify(answers))
    await this.requireConfirmation('Do you confirm the provided input?')

    const inputParser = InputParser.createWithKnownSchemas(this.getOriginalApi())

    const operations = await inputParser.getEntityUpdateOperations(answers, entityClass.name.toString(), +id)

    await this.sendAndFollowNamedTx(currentAccount, 'contentDirectory', 'transaction', [actor, operations])
  }
}
