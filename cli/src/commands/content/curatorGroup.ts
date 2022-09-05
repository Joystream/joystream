import { WorkingGroups } from '../../Types'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import chalk from 'chalk'
import { displayCollapsedRow, displayHeader, displayTable, memberHandle } from '../../helpers/display'

export default class CuratorGroupCommand extends ContentDirectoryCommandBase {
  static description = 'Show Curator Group details by ID.'
  static args = [
    {
      name: 'id',
      required: true,
      description: 'ID of the Curator Group',
    },
  ]

  static flags = {
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const { id } = this.parse(CuratorGroupCommand).args
    const { active, curators, permissionsByLevel } = await this.getCuratorGroup(id)
    const members = (await this.getApi().groupMembers(WorkingGroups.Curators)).filter((curator) =>
      Array.from(curators).some(([groupCurator]) => groupCurator.eq(curator.workerId))
    )

    displayCollapsedRow({
      'ID': id,
      'Status': active.valueOf() ? 'Active' : 'Inactive',
    })
    displayHeader(`Group Members (${members.length})`)
    this.log(
      members
        .map((curator) =>
          chalk.magentaBright(`${memberHandle(curator.profile)} (WorkerID: ${curator.workerId.toString()})`)
        )
        .join(', ')
    )
    displayHeader(`Group Permissions (${[...permissionsByLevel].length})`)
    this.log(
      [...permissionsByLevel]
        .map(([level, permissions]) => chalk.magentaBright(`Privilege Level: ${level}; (Permissions: ${permissions})`))
        .join('\n\n')
    )
    displayHeader(`Permissions by Curator`)
    displayTable(
      [...curators].map(([id, permissions]) => ({
        'ID': id.toString(),
        'Permissions': permissions.toString(),
      })),
      5
    )
  }
}
