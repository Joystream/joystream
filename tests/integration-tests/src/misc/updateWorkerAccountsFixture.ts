import { BaseFixture } from '../Fixture'
import { workingGroups } from '../consts'

export class UpdateWorkerAccountsFixture extends BaseFixture {
  public async execute(): Promise<void> {
    await Promise.all(
      workingGroups.map(async (group) =>
        Promise.all(
          (await this.api.getActiveWorkerIds(group)).map((id) => this.api.assignWorkerWellknownAccount(group, id))
        )
      )
    )
  }
}
