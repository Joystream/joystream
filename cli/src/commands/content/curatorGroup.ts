import { WorkingGroups } from '../../Types'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import chalk from 'chalk'
import { displayCollapsedRow, displayHeader } from '../../helpers/display'

export default class CuratorGroupCommand extends ContentDirectoryCommandBase {
  static description = 'Show Curator Group details by ID.'
  static args = [
    {
      name: 'id',
      required: true,
      description: 'ID of the Curator Group',
    },
  ]

  async run() {
    const { id } = this.parse(CuratorGroupCommand).args
    const group = await this.getCuratorGroup(id)
    const members = (await this.getApi().groupMembers(WorkingGroups.Curators)).filter((curator) =>
      Array.from(group.curators).some((groupCurator) => groupCurator.eq(curator.workerId))
    )

    displayCollapsedRow({
      'ID': id,
      'Status': group.active.valueOf() ? 'Active' : 'Inactive',
    })
    displayHeader(`Group Members (${members.length})`)
    this.log(
      members
        .map((curator) => chalk.magentaBright(`${curator.profile.handle} (WorkerID: ${curator.workerId.toString()})`))
        .join(', ')
    )
  }
}
