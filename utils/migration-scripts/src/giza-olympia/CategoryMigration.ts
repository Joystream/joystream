import { BaseMigration } from './BaseMigration'

export abstract class CategoryMigration extends BaseMigration {
  protected contentLeadKey!: string

  public async init(): Promise<void> {
    await super.init()
    await this.loadContentLeadKey()
  }

  private async loadContentLeadKey(): Promise<void> {
    const { api } = this
    const leadId = await api.query.contentWorkingGroup.currentLead()
    if (!leadId.isSome) {
      throw new Error('ContentWorkingGroup lead must be set!')
    }
    const leadWorker = await api.query.contentWorkingGroup.workerById(leadId.unwrap())
    this.contentLeadKey = leadWorker.role_account_id.toString()
  }
}
