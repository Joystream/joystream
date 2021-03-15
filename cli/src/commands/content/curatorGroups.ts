import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
// import chalk from 'chalk'
import { displayTable } from '../../helpers/display'

export default class CuratorGroupsCommand extends ContentDirectoryCommandBase {
  static description = 'List existing Curator Groups.'

  async run() {
    const groups = await this.getApi().availableCuratorGroups()

    if (groups.length) {
      displayTable(
        groups.map(([id, group]) => ({
          'ID': id.toString(),
          'Status': group.active.valueOf() ? 'Active' : 'Inactive',
          'Members': group.curators.toArray().length,
        })),
        5
      )
    } else {
      this.log('No Curator Groups available!')
    }
  }
}
