import { IStorageBucketOperatorMetadata, StorageBucketOperatorMetadata } from '@joystream/metadata-protobuf'
import { StorageBucketId, WorkerId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult } from '@polkadot/types/types'
import { Api } from '../../Api'
import { StandardizedFixture } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { AnyQueryNodeEvent, EventDetails, EventType } from '../../types'
import { Utils } from '../../utils'

type StorageOperatorMetadataSetEventDetails = EventDetails<EventType<'storage', 'StorageOperatorMetadataSet'>>

export type SetStorageOperatorMetadataParams = {
  workerId: WorkerId
  bucketId: StorageBucketId
  metadata: IStorageBucketOperatorMetadata
}

export class SetStorageOperatorMetadataFixture extends StandardizedFixture {
  private storageOperatorMetadataParams: SetStorageOperatorMetadataParams[]

  constructor(api: Api, query: QueryNodeApi, storageOperatorMetadataParams: SetStorageOperatorMetadataParams[]) {
    super(api, query)
    this.storageOperatorMetadataParams = storageOperatorMetadataParams
  }

  protected async getSignerAccountOrAccounts(): Promise<string | string[]> {
    return await Promise.all(
      this.storageOperatorMetadataParams.map(async ({ workerId }) =>
        (await this.api.query.storageWorkingGroup.workerById(workerId)).unwrap().roleAccountId.toString()
      )
    )
  }

  protected async getExtrinsics(): Promise<SubmittableExtrinsic<'promise', ISubmittableResult>[]> {
    return this.storageOperatorMetadataParams.map(({ workerId, bucketId, metadata }) => {
      const metadataBytes = Utils.metadataToBytes(StorageBucketOperatorMetadata, metadata)
      return this.api.tx.storage.setStorageOperatorMetadata(workerId, bucketId, metadataBytes)
    })
  }

  protected getEventFromResult(result: ISubmittableResult): Promise<StorageOperatorMetadataSetEventDetails> {
    return this.api.getEventDetails(result, 'storage', 'StorageOperatorMetadataSet')
  }

  protected assertQueryNodeEventIsValid(qEvent: AnyQueryNodeEvent, i: number): void {
    // TODO: implement QN checks after mappings are added
  }
}
