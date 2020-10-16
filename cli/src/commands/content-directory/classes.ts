import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
// import chalk from 'chalk'
import { displayTable } from '../../helpers/display'

export default class ClassesCommand extends ContentDirectoryCommandBase {
  static description = 'List existing content directory classes.'

  async run() {
    const classes = await this.getApi().availableClasses()

    displayTable(
      classes.map(([id, c]) => ({
        'ID': id.toString(),
        'Name': c.name.toString(),
        'Any member': c.class_permissions.any_member.toString(),
        'Entities': c.current_number_of_entities.toNumber(),
        'Schemas': c.schemas.length,
        'Maintainers': c.class_permissions.maintainers.toArray().length,
        'Properties': c.properties.length,
      })),
      3
    )
  }
}
