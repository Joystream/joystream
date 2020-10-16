import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { displayTable } from '../../helpers/display'
import _ from 'lodash'

export default class ClassCommand extends ContentDirectoryCommandBase {
  static description = 'Show entities list by class id or name.'
  static args = [
    {
      name: 'className',
      required: true,
      description: 'Name or ID of the Class',
    },
    {
      name: 'properties',
      required: false,
      description:
        'Comma-separated properties to include in the results table (ie. code,name). ' +
        'By default all property values will be included.',
    },
  ]

  async run() {
    const { className, properties } = this.parse(ClassCommand).args
    const [classId, entityClass] = await this.classEntryByNameOrId(className)
    const entityEntries = await this.getApi().entitiesByClassId(classId.toNumber())
    const propertiesToInclude = properties && (properties as string).split(',')

    displayTable(
      await Promise.all(
        entityEntries.map(([id, entity]) => ({
          'ID': id.toString(),
          ..._.mapValues(this.parseEntityPropertyValues(entity, entityClass, propertiesToInclude), (v) =>
            v.value.toString()
          ),
        }))
      ),
      3
    )
  }
}
