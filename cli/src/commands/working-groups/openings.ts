import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { displayTable } from '../../helpers/display'
import _ from 'lodash'

export default class WorkingGroupsOpenings extends WorkingGroupsCommandBase {
  static description = 'Shows an overview of given working group openings'
  static flags = {
    ...WorkingGroupsCommandBase.flags,
  }

  async run() {
    const openings = await this.getApi().openingsByGroup(this.group)

    const openingsRows = openings.map((o) => ({
      'WG Opening ID': o.wgOpeningId,
      Type: o.type.type,
      Stage: `${_.startCase(o.stage.status)}${o.stage.block ? ` (#${o.stage.block})` : ''}`,
      Applications: o.applications.length,
    }))
    displayTable(openingsRows, 5)
  }
}
