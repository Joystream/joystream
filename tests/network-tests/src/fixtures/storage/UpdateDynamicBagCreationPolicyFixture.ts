import { SubmittableExtrinsic } from '@polkadot/api/types'
import { PalletStorageDynamicBagIdType as DynamicBagId } from '@polkadot/types/lookup'
import { ISubmittableResult } from '@polkadot/types/types'
import _ from 'lodash'
import { Api } from '../../Api'
import { StandardizedFixture } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { AnyQueryNodeEvent, EventDetails, EventType } from '../../types'

type NumberOfStorageBucketsInDynamicBagCreationPolicyUpdatedEventDetails = EventDetails<
  EventType<'storage', 'NumberOfStorageBucketsInDynamicBagCreationPolicyUpdated'>
>

export type DynamicBagCreationPolicyParams = {
  [K in DynamicBagId['type']]?: number
}

export class UpdateDynamicBagCreationPolicyFixture extends StandardizedFixture {
  private policyParams: DynamicBagCreationPolicyParams

  constructor(api: Api, query: QueryNodeApi, policyParams: DynamicBagCreationPolicyParams) {
    super(api, query)
    this.policyParams = policyParams
  }

  protected async getSignerAccountOrAccounts(): Promise<string | string[]> {
    const lead = await this.api.query.storageWorkingGroup.currentLead()
    if (lead.isNone) {
      throw new Error(`Cannot get storageWorkingGroup lead: Lead not hired!`)
    }
    return (await this.api.query.storageWorkingGroup.workerById(lead.unwrap())).unwrap().roleAccountId.toString()
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise', ISubmittableResult>[]> {
    return _.entries(this.policyParams).map(([bagType, numberOfBuckets]) =>
      this.api.tx.storage.updateNumberOfStorageBucketsInDynamicBagCreationPolicy(
        bagType as DynamicBagId['type'],
        numberOfBuckets
      )
    )
  }

  protected getEventFromResult(
    result: ISubmittableResult
  ): Promise<NumberOfStorageBucketsInDynamicBagCreationPolicyUpdatedEventDetails> {
    return this.api.getEventDetails(result, 'storage', 'NumberOfStorageBucketsInDynamicBagCreationPolicyUpdated')
  }

  protected assertQueryNodeEventIsValid(qEvent: AnyQueryNodeEvent, i: number): void {
    // TODO: implement QN checks after mappings are added
  }
}
