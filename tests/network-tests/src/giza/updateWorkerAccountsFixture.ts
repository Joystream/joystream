import { BaseFixture } from '../Fixture'
import { WorkingGroups } from '../Api'

export class UpdateLeadWorkerAccountsFixture extends BaseFixture {
  public async execute(): Promise<void> {
    const storageLead = await this.api.getLeadWorkerId(WorkingGroups.StorageWorkingGroup)
    if (storageLead) {
      await this.api.assignWorkerWellknownAccount(WorkingGroups.StorageWorkingGroup, storageLead)
    }

    const contentLead = await this.api.getLeadWorkerId(WorkingGroups.ContentWorkingGroup)
    if (contentLead) {
      await this.api.assignWorkerWellknownAccount(WorkingGroups.ContentWorkingGroup, contentLead)
    }
  }
}
