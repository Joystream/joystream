import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import inquirer from 'inquirer'
import { InputParser } from '@joystream/cd-schemas'
import ExitCodes from '../../ExitCodes'

export default class CreateEntityCommand extends ContentDirectoryCommandBase {
  static description =
    'Creates a new entity in the specified class (can be executed in Member, Curator or Lead context)'

  static args = [
    {
      name: 'className',
      required: true,
      description: 'Name or ID of the Class',
    },
  ]

  static flags = {
    context: ContentDirectoryCommandBase.contextFlag,
  }

  async run() {
    const { className } = this.parse(CreateEntityCommand).args
    let { context } = this.parse(CreateEntityCommand).flags

    if (!context) {
      context = await this.promptForContext()
    }

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)
    const [, entityClass] = await this.classEntryByNameOrId(className)

    const actor = await this.getActor(context, entityClass)

    if (actor.isOfType('Member') && entityClass.class_permissions.any_member.isFalse) {
      this.error('Choosen actor has no access to create an entity of this type', { exit: ExitCodes.AccessDenied })
    }

    const answers: {
      [key: string]: string | number | null
    } = await inquirer.prompt(this.getQuestionsFromProperties(entityClass.properties.toArray()))

    this.jsonPrettyPrint(JSON.stringify(answers))
    await this.requireConfirmation('Do you confirm the provided input?')

    const inputParser = InputParser.createWithKnownSchemas(this.getOriginalApi(), [
      {
        className: entityClass.name.toString(),
        entries: [answers],
      },
    ])

    const operations = await inputParser.getEntityBatchOperations()

    await this.sendAndFollowNamedTx(currentAccount, 'contentDirectory', 'transaction', [actor, operations])
  }
}
