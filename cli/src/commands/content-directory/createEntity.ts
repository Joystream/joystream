import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { flags } from '@oclif/command'
import { Class as ContentDirectoryClass } from '@joystream/types/content-directory'
import inquirer from 'inquirer'
import { CLIError } from '@oclif/errors'
import { InputParser } from '@joystream/cd-schemas'

const CONTEXTS = ['Member', 'Curator', 'Lead'] as const

type CreateEntityArgs = {
  className: string
}

type CreateEntityFlags = {
  context: typeof CONTEXTS[number]
}

type Question = {
  name: string
  message: string
  type: 'list' | 'input'
  choices?: string[]
  filter?: (answer: string) => string | null | number | boolean
}

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
    context: flags.string({
      char: 'c',
      description: 'Actor context to execute the command in (Member/Curator/Lead)',
      required: true,
      options: [...CONTEXTS],
    }),
  }

  getQuestionsFromClass = (classData: ContentDirectoryClass): Question[] => {
    return classData.properties.map(({ name, property_type: propertyType, required }) => {
      const propertySubtype = propertyType.subtype
      const questionType = propertySubtype === 'Bool' ? 'list' : 'input'
      const isSubtypeNumber = propertySubtype.toLowerCase().includes('int')
      const isSubtypeReference = propertyType.isOfType('Single') && propertyType.asType('Single').isOfType('Reference')

      const optionalQuestionProperties = {
        ...{
          filter: (answer: string) => {
            if (required.isFalse && !answer) {
              return null
            }

            if ((isSubtypeNumber || isSubtypeReference) && isFinite(+answer)) {
              return +answer
            }

            return answer
          },
        },
        ...(propertySubtype === 'Bool' && {
          choices: ['true', 'false'],
          filter: (answer: string) => {
            return answer === 'true' || false
          },
        }),
      }

      const isQuestionOptional = propertySubtype === 'Bool' ? '' : required.isTrue ? '(required)' : '(optional)'
      const classId = isSubtypeReference
        ? ` [Class Id: ${propertyType.asType('Single').asType('Reference')[0].toString()}]`
        : ''

      return {
        name: name.toString(),
        message: `${name} - ${propertySubtype}${classId} ${isQuestionOptional}`,
        type: questionType,
        ...optionalQuestionProperties,
      }
    })
  }

  checkReferencesValidity = async (
    answers: {
      [key: string]: string | number | null
    },
    { properties }: ContentDirectoryClass
  ) => {
    const propertyReferenceClassIds: (string | null)[] = []

    const references = await Promise.all(
      Object.keys(answers).map((key: string, index) => {
        const propertyType = properties[index].property_type

        if (propertyType.isOfType('Single') && propertyType.asType('Single').isOfType('Reference')) {
          if (answers[key] !== null) {
            propertyReferenceClassIds.push(propertyType.asType('Single').asType('Reference')[0].toString())
            return this.getEntity(answers[key] as number | string)
          }
        }

        propertyReferenceClassIds.push(null)
      })
    )

    references.forEach((reference, index) => {
      if (reference) {
        if (reference.class_id.toString() !== propertyReferenceClassIds[index]) {
          throw new CLIError(`The #${propertyReferenceClassIds[index]} entity is not of the right class id!`)
        }
      }
    })
  }

  async getActor(context: typeof CONTEXTS[number], pickedClass: ContentDirectoryClass) {
    if (context === 'Member') {
      if (pickedClass.class_permissions.any_member.isFalse) {
        this.error(`You're not allowed to createEntity of className: ${pickedClass.name.toString()}!`)
      }

      const memberId = await this.getRequiredMemberId()

      return this.createType('Actor', { Member: memberId })
    } else if (context === 'Curator') {
      return await this.getCuratorContext([pickedClass.name.toString()])
    } else {
      await this.getRequiredLead()

      return this.createType('Actor', { Lead: null })
    }
  }

  async run() {
    const { className } = this.parse(CreateEntityCommand).args as CreateEntityArgs
    const { context } = this.parse(CreateEntityCommand).flags as CreateEntityFlags

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)
    const [, entityClass] = await this.classEntryByNameOrId(className)

    const actor = await this.getActor(context, entityClass)

    const answers: {
      [key: string]: string | number | null
    } = await inquirer.prompt(this.getQuestionsFromClass(entityClass))

    await this.checkReferencesValidity(answers, entityClass)

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
