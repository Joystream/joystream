import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { EventDetails, WorkingGroupModuleName } from '../../types'
import { BaseWorkingGroupFixture } from './BaseWorkingGroupFixture'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types/'

export class SetLeaderInvitationQuotaFixture extends BaseWorkingGroupFixture {
  protected group: WorkingGroupModuleName
  protected quota: number

  public constructor(api: Api, query: QueryNodeApi, group: WorkingGroupModuleName, quota: number) {
    super(api, query, group)
    this.group = group
    this.quota = quota
  }

  protected async getSignerAccountOrAccounts(): Promise<string> {
    return (await this.api.query.sudo.key()).toString()
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise'>[]> {
    const extrinsics = [this.api.tx.members.setLeaderInvitationQuota(this.quota)]
    return extrinsics.map((tx) => this.api.tx.sudo.sudo(tx))
  }

  protected async getEventFromResult(result: ISubmittableResult): Promise<EventDetails> {
    return await this.api.getEventDetails(result, 'members', 'LeaderInvitationQuotaUpdated')
  }

  protected assertQueryNodeEventIsValid(qEvent: unknown, i: number): void {
    // TODO: implement
  }

  async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()

    // Query and check the events
    // TODO: implement
  }
}
