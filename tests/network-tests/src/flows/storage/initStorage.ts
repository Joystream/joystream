import { IStorageBucketOperatorMetadata } from '@joystream/metadata-protobuf'
import { CreateInterface, createType } from '@joystream/types'
import {
  PalletStorageDynamicBagIdType as DynamicBagId,
  PalletStorageStaticBagId as StaticBagId,
} from '@polkadot/types/lookup'
import BN from 'bn.js'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { FlowProps } from '../../Flow'
import {
  CreateStorageBucketFixture,
  UpdateDynamicBagCreationPolicyFixture,
  UpdateStorageBucketsVoucherLimitsFixture,
} from '../../fixtures/storage'
import { AcceptStorageBucketInvitationFixture } from '../../fixtures/storage/AcceptStorageBucketInvitationFixture'
import { SetStorageOperatorMetadataFixture } from '../../fixtures/storage/SetStorageOperatorMetadataFixture'
import { UpdateBucketsPerBagLimitFixture } from '../../fixtures/storage/UpdateBucketsPerBagLimit'
import { HireWorkersFixture } from '../../fixtures/workingGroups/HireWorkersFixture'

type StorageBucketConfig = {
  metadata: IStorageBucketOperatorMetadata
  staticBags?: CreateInterface<StaticBagId>[]
  storageLimit: BN
  objectsLimit: number
  transactorUri: string
}

export type InitStorageConfig = {
  buckets: StorageBucketConfig[]
  dynamicBagPolicy: {
    [K in DynamicBagId['type']]?: number
  }
}

export default function initStorage({ buckets, dynamicBagPolicy }: InitStorageConfig) {
  return async function initStorage({ api, query }: FlowProps): Promise<void> {
    const debug = extendDebug('flow:initStorage')
    api.enableDebugTxLogs()
    debug('Started')

    // Get working group leaders
    const [, storageLeader] = await api.getLeader('storageWorkingGroup')

    const storageLeaderKey = storageLeader.roleAccountId.toString()
    const maxStorageLimit = buckets.sort((a, b) => b.storageLimit.cmp(a.storageLimit))[0].storageLimit
    const maxObjectsLimit = Math.max(...buckets.map((b) => b.objectsLimit))

    const hireWorkersFixture = new HireWorkersFixture(api, query, 'storageWorkingGroup', buckets.length)
    await new FixtureRunner(hireWorkersFixture).run()
    const workerIds = hireWorkersFixture.getCreatedWorkerIds()

    const updateDynamicBagPolicyFixture = new UpdateDynamicBagCreationPolicyFixture(api, query, dynamicBagPolicy)
    await new FixtureRunner(updateDynamicBagPolicyFixture).run()

    const updateStorageBucketsVoucherFixture = new UpdateStorageBucketsVoucherLimitsFixture(api, query, {
      sizeLimit: maxStorageLimit,
      objectsLimit: maxObjectsLimit,
    })
    await new FixtureRunner(updateStorageBucketsVoucherFixture).run()

    const updateStorageBucketsPerBagLimitFixture = new UpdateBucketsPerBagLimitFixture(
      'storage',
      api,
      query,
      Math.max(5, buckets.length)
    )
    await new FixtureRunner(updateStorageBucketsPerBagLimitFixture).run()

    // Create buckets
    const createBucketsInput = buckets.map((bucket, i) => ({
      inviteWorker: workerIds[i],
      sizeLimit: bucket.storageLimit,
      objectLimit: bucket.objectsLimit,
    }))
    const createStorageBucketFixture = new CreateStorageBucketFixture(api, query, createBucketsInput)
    await new FixtureRunner(createStorageBucketFixture).run()
    const createdStorageBucketsIds = createStorageBucketFixture.getCreatedStorageBucketsIds()

    // Accept invitations
    const acceptInvitationInput = createdStorageBucketsIds.map((bucketId, i) => ({
      workerId: workerIds[i],
      bucketId,
      transactorAccountId: api.createCustomKeyPair(buckets[i].transactorUri, true).address,
    }))
    const acceptStorageBucketInvitationFixture = new AcceptStorageBucketInvitationFixture(
      api,
      query,
      acceptInvitationInput
    )
    await new FixtureRunner(acceptStorageBucketInvitationFixture).run()

    // Set Buckets Metadata
    const setMetadataInput = createdStorageBucketsIds.map((bucketId, i) => ({
      workerId: workerIds[i],
      bucketId,
      metadata: buckets[i].metadata,
    }))
    const setStorageOperatorMetadataFixture = new SetStorageOperatorMetadataFixture(api, query, setMetadataInput)
    await new FixtureRunner(setStorageOperatorMetadataFixture).run()

    // Add all static bags to all buckets
    const updateBagTxs = createdStorageBucketsIds.map((bucketId, i) => {
      return (buckets[i].staticBags || []).map((sBagId) => {
        return api.tx.storage.updateStorageBucketsForBag(
          createType('PalletStorageBagIdType', { Static: sBagId }),
          createType('BTreeSet<u64>', [bucketId]),
          createType('BTreeSet<u64>', [])
        )
      })
    })
    await api.sendExtrinsicsAndGetResults(updateBagTxs, storageLeaderKey)

    debug('Done')
  }
}
