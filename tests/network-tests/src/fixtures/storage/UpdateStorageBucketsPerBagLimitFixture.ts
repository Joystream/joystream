import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types'
import { Api } from '../../Api'
import { StandardizedFixture } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { AnyQueryNodeEvent, EventDetails, EventType } from '../../types'

type StorageBucketsPerBagLimitUpdatedEventDetails = EventDetails<
  EventType<'storage', 'StorageBucketsPerBagLimitUpdated'>
>

export type StorageBucketsPerBagLimitParam = number

export class UpdateStorageBucketsPerBagLimitFixture extends StandardizedFixture {
  private bucketsPerBagLimit: StorageBucketsPerBagLimitParam

  constructor(api: Api, query: QueryNodeApi, bucketsPerBagLimit: StorageBucketsPerBagLimitParam) {
    super(api, query)
    this.bucketsPerBagLimit = bucketsPerBagLimit
  }

  protected async getSignerAccountOrAccounts(): Promise<string | string[]> {
    const lead = await this.api.query.storageWorkingGroup.currentLead()
    if (lead.isNone) {
      throw new Error(`Cannot get storageWorkingGroup lead: Lead not hired!`)
    }
    return (await this.api.query.storageWorkingGroup.workerById(lead.unwrap())).unwrap().roleAccountId.toString()
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise', ISubmittableResult>[]> {
    return [this.api.tx.storage.updateStorageBucketsPerBagLimit(this.bucketsPerBagLimit)]
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<StorageBucketsPerBagLimitUpdatedEventDetails> {
    return this.api.getEventDetails(result, 'storage', 'StorageBucketsPerBagLimitUpdated')
  }

  protected assertQueryNodeEventIsValid(qEvent: AnyQueryNodeEvent, i: number): void {
    // TODO: implement QN checks after mappings are added
  }
}
