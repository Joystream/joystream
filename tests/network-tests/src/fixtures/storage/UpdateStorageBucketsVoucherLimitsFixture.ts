import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types'
import BN from 'bn.js'
import { Api } from '../../Api'
import { StandardizedFixture } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { AnyQueryNodeEvent, EventDetails, EventType } from '../../types'

type StorageBucketsVoucherMaxLimitsUpdatedEventDetails = EventDetails<
  EventType<'storage', 'StorageBucketsVoucherMaxLimitsUpdated'>
>

export type StorageBucketsVoucherLimitsParams = {
  sizeLimit: BN
  objectsLimit: number
}

export class UpdateStorageBucketsVoucherLimitsFixture extends StandardizedFixture {
  private voucherLimits: StorageBucketsVoucherLimitsParams

  constructor(api: Api, query: QueryNodeApi, voucherLimits: StorageBucketsVoucherLimitsParams) {
    super(api, query)
    this.voucherLimits = voucherLimits
  }

  protected async getSignerAccountOrAccounts(): Promise<string | string[]> {
    const lead = await this.api.query.storageWorkingGroup.currentLead()
    if (lead.isNone) {
      throw new Error(`Cannot get storageWorkingGroup lead: Lead not hired!`)
    }
    return (await this.api.query.storageWorkingGroup.workerById(lead.unwrap())).unwrap().roleAccountId.toString()
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise', ISubmittableResult>[]> {
    return [
      this.api.tx.storage.updateStorageBucketsVoucherMaxLimits(
        this.voucherLimits.sizeLimit,
        this.voucherLimits.objectsLimit
      ),
    ]
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<StorageBucketsVoucherMaxLimitsUpdatedEventDetails> {
    return this.api.getEventDetails(result, 'storage', 'StorageBucketsVoucherMaxLimitsUpdated')
  }

  protected assertQueryNodeEventIsValid(qEvent: AnyQueryNodeEvent, i: number): void {
    // TODO: implement QN checks after mappings are added
  }
}
