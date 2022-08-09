import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { IStorageBucketOperatorMetadata, StorageBucketOperatorMetadata } from '@joystream/metadata-protobuf'
import { CreateInterface, createType } from '@joystream/types'
import {
  PalletStorageDynamicBagIdType as DynamicBagId,
  PalletStorageStaticBagId as StaticBagId,
} from '@polkadot/types/lookup'
import _ from 'lodash'
import { Utils } from '../../utils'
import BN from 'bn.js'
import { FixtureRunner } from '../../Fixture'
import { HireWorkersFixture } from '../../fixtures/workingGroups/HireWorkersFixture'

type StorageBucketConfig = {
  metadata: IStorageBucketOperatorMetadata
  staticBags?: CreateInterface<StaticBagId>[]
  storageLimit: BN
  objectsLimit: number
  transactorUri: string
  transactorBalance: BN
}

type InitStorageConfig = {
  buckets: StorageBucketConfig[]
  dynamicBagPolicy: {
    [K in DynamicBagId['type']]?: number
  }
}

export const allStaticBags: CreateInterface<StaticBagId>[] = [
  'Council',
  { WorkingGroup: 'Content' },
  { WorkingGroup: 'Distribution' },
  { WorkingGroup: 'Gateway' },
  { WorkingGroup: 'OperationsAlpha' },
  { WorkingGroup: 'OperationsBeta' },
  { WorkingGroup: 'OperationsGamma' },
  { WorkingGroup: 'Storage' },
]

export const singleBucketConfig: InitStorageConfig = {
  dynamicBagPolicy: {
    'Channel': 1,
    'Member': 1,
  },
  buckets: [
    {
      metadata: { endpoint: process.env.COLOSSUS_1_URL || 'http://localhost:3333' },
      staticBags: allStaticBags,
      storageLimit: new BN(1_000_000_000_000),
      objectsLimit: 1000000000,
      transactorUri: process.env.COLOSSUS_1_TRANSACTOR_URI || '//Colossus1',
      transactorBalance: new BN(9_000_000_000_000_000),
    },
  ],
}

export const doubleBucketConfig: InitStorageConfig = {
  dynamicBagPolicy: {
    'Channel': 2,
    'Member': 2,
  },
  buckets: [
    {
      metadata: { endpoint: process.env.COLOSSUS_1_URL || 'http://localhost:3333' },
      staticBags: allStaticBags,
      storageLimit: new BN(1_000_000_000_000),
      objectsLimit: 1000000000,
      transactorUri: process.env.COLOSSUS_1_TRANSACTOR_URI || '//Colossus1',
      transactorBalance: new BN(9_000_000_000_000_000),
    },
    {
      metadata: { endpoint: process.env.COLOSSUS_2_URL || 'http://localhost:3335' },
      staticBags: allStaticBags,
      storageLimit: new BN(1_000_000_000_000),
      objectsLimit: 1000000000,
      transactorUri: process.env.COLOSSUS_2_TRANSACTOR_URI || '//Colossus2',
      transactorBalance: new BN(9_000_000_000_000_000),
    },
  ],
}

export default function createFlow({ buckets, dynamicBagPolicy }: InitStorageConfig) {
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
    const operatorIds = hireWorkersFixture.getCreatedWorkerIds()

    const operatorKeys = await api.getWorkerRoleAccounts(operatorIds, 'storageWorkingGroup')

    // Set global limits and policies
    const updateDynamicBagPolicyTxs = _.entries(dynamicBagPolicy).map(([bagType, numberOfBuckets]) =>
      api.tx.storage.updateNumberOfStorageBucketsInDynamicBagCreationPolicy(
        bagType as DynamicBagId['type'],
        numberOfBuckets
      )
    )
    const setMaxVoucherLimitsTx = api.tx.storage.updateStorageBucketsVoucherMaxLimits(maxStorageLimit, maxObjectsLimit)
    const setBucketPerBagLimitTx = api.tx.storage.updateStorageBucketsPerBagLimit(Math.max(5, buckets.length))

    await api.sendExtrinsicsAndGetResults(
      [...updateDynamicBagPolicyTxs, setMaxVoucherLimitsTx, setBucketPerBagLimitTx],
      storageLeaderKey
    )

    // Create buckets
    const createBucketTxs = buckets.map((b, i) =>
      api.tx.storage.createStorageBucket(operatorIds[i], true, b.storageLimit, b.objectsLimit)
    )
    const createBucketResults = await api.sendExtrinsicsAndGetResults(createBucketTxs, storageLeaderKey)
    const bucketById = new Map<number, StorageBucketConfig>()
    createBucketResults.forEach((res, i) => {
      const bucketId = api.getEvent(res, 'storage', 'StorageBucketCreated').data[0]
      bucketById.set(bucketId.toNumber(), buckets[i])
    })

    // Accept invitations
    const acceptInvitationTxs = Array.from(bucketById.entries()).map(([bucketId, bucketConfig], i) => {
      const transactorKey = api.createCustomKeyPair(bucketConfig.transactorUri, true).address
      return api.tx.storage.acceptStorageBucketInvitation(operatorIds[i], bucketId, transactorKey)
    })
    await api.sendExtrinsicsAndGetResults(acceptInvitationTxs, operatorKeys)

    // Bucket metadata, static bags, transactor balances
    const bucketSetupPromises = _.flatten(
      Array.from(bucketById.entries()).map(([bucketId, bucketConfig], i) => {
        const operatorId = operatorIds[i]
        const operatorKey = operatorKeys[i]
        const metadataBytes = Utils.metadataToBytes(StorageBucketOperatorMetadata, bucketConfig.metadata)
        const setMetaTx = api.tx.storage.setStorageOperatorMetadata(operatorId, bucketId, metadataBytes)
        const setMetaPromise = api.sendExtrinsicsAndGetResults([setMetaTx], operatorKey)
        const updateBagTxs = (bucketConfig.staticBags || []).map((sBagId) => {
          return api.tx.storage.updateStorageBucketsForBag(
            createType('PalletStorageBagIdType', { Static: sBagId }),
            createType('BTreeSet<u64>', [bucketId]),
            createType('BTreeSet<u64>', [])
          )
        })
        const updateBagsPromise = api.sendExtrinsicsAndGetResults(updateBagTxs, storageLeaderKey)
        const setupTransactorBalancePromise = (async () => {
          const transactorKey = api.getAddressFromSuri(bucketConfig.transactorUri)
          return [await api.treasuryTransferBalance(transactorKey, bucketConfig.transactorBalance)]
        })()
        return [updateBagsPromise, setMetaPromise, setupTransactorBalancePromise]
      })
    )
    await Promise.all(bucketSetupPromises)

    debug('Done')
  }
}
