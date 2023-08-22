import { StorageBucketId, WorkerId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types'
import BN from 'bn.js'
import { Api } from '../../Api'
import { StandardizedFixture } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { AnyQueryNodeEvent, EventDetails, EventType } from '../../types'

type StorageBucketCreatedEventDetails = EventDetails<EventType<'storage', 'StorageBucketCreated'>>

export type CreateStorageBucketParams = {
  inviteWorker: WorkerId
  sizeLimit: BN
  objectLimit: number
}

export class CreateStorageBucketFixture extends StandardizedFixture {
  protected events: StorageBucketCreatedEventDetails[] = []

  private createStorageBucketParams: CreateStorageBucketParams[]

  constructor(api: Api, query: QueryNodeApi, createStorageBucketParams: CreateStorageBucketParams[]) {
    super(api, query)
    this.createStorageBucketParams = createStorageBucketParams
  }

  public getCreatedStorageBucketsIds(): StorageBucketId[] {
    if (!this.events.length) {
      throw new Error('Trying to get created storage bucket ids before they were created!')
    }
    return this.events.map((e) => e.event.data[0])
  }

  protected async getSignerAccountOrAccounts(): Promise<string | string[]> {
    const lead = await this.api.query.storageWorkingGroup.currentLead()
    if (lead.isNone) {
      throw new Error(`Cannot get storageWorkingGroup lead: Lead not hired!`)
    }
    return (await this.api.query.storageWorkingGroup.workerById(lead.unwrap())).unwrap().roleAccountId.toString()
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise', ISubmittableResult>[]> {
    return this.createStorageBucketParams.map(({ inviteWorker, sizeLimit, objectLimit }) =>
      this.api.tx.storage.createStorageBucket(inviteWorker, true, sizeLimit, objectLimit)
    )
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<StorageBucketCreatedEventDetails> {
    return this.api.getEventDetails(result, 'storage', 'StorageBucketCreated')
  }

  protected assertQueryNodeEventIsValid(qEvent: AnyQueryNodeEvent, i: number): void {
    // TODO: implement QN checks after mappings are added
  }
}
