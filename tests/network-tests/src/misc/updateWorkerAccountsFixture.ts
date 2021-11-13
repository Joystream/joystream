import { BaseFixture } from '../Fixture'
import { AllWorkingGroups } from '../WorkingGroups'

export class UpdateWorkerAccountsFixture extends BaseFixture {
  public async execute(): Promise<void> {
    await Promise.all(
      AllWorkingGroups.map(async (group) =>
        Promise.all(
          (await this.api.getActiveWorkerIds(group)).map((id) => this.api.assignWorkerWellknownAccount(group, id))
        )
      )
    )
  }
}
