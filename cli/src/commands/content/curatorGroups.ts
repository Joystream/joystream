import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { displayTable } from '../../helpers/display'

export default class CuratorGroupsCommand extends ContentDirectoryCommandBase {
  static description = 'List existing Curator Groups.'
  static flags = {
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const groups = await this.getApi().availableCuratorGroups()

    if (groups.length) {
      displayTable(
        groups.map(([id, group]) => ({
          'ID': id.toString(),
          'Status': group.active.valueOf() ? 'Active' : 'Inactive',
          'Members': Array.from(group.curators).length,
          'Permissions': Array.from(group.permissionsByLevel).length,
        })),
        5
      )
    } else {
      this.log('No Curator Groups available!')
    }
  }
}
