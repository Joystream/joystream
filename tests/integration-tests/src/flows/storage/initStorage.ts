import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { IStorageBucketOperatorMetadata, StorageBucketOperatorMetadata } from '@joystream/metadata-protobuf'
import { CreateInterface, createType } from '@joystream/types'
import { BagId, DynamicBagId, StaticBagId } from '@joystream/types/storage'
import _ from 'lodash'
import { Utils } from '../../utils'
import BN from 'bn.js'

type StorageBucketConfig = {
  metadata: IStorageBucketOperatorMetadata
  staticBags?: CreateInterface<StaticBagId>[]
  storageLimit: BN
  objectsLimit: number
  operatorId: number
  transactorKey: string
  transactorUri: string
  transactorBalance: BN
}

type InitStorageConfig = {
  buckets: StorageBucketConfig[]
  dynamicBagPolicy: {
    [K in keyof typeof DynamicBagId.typeDefinitions]?: number
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
      operatorId: parseInt(process.env.COLOSSUS_1_WORKER_ID || '0'),
      storageLimit: new BN(1_000_000_000_000),
      objectsLimit: 1000000000,
      transactorKey: process.env.COLOSSUS_1_TRANSACTOR_KEY || '5DkE5YD8m5Yzno6EH2RTBnH268TDnnibZMEMjxwYemU4XevU', // //Colossus1
      transactorUri: process.env.COLOSSUS_1_TRANSACTOR_URI || '//Colossus1',
      transactorBalance: new BN(100_000),
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
      operatorId: parseInt(process.env.COLOSSUS_1_WORKER_ID || '0'),
      storageLimit: new BN(1_000_000_000_000),
      objectsLimit: 1000000000,
      transactorKey: process.env.COLOSSUS_1_TRANSACTOR_KEY || '5DkE5YD8m5Yzno6EH2RTBnH268TDnnibZMEMjxwYemU4XevU', // //Colossus1
      transactorUri: process.env.COLOSSUS_1_TRANSACTOR_URI || '//Colossus1',
      transactorBalance: new BN(100_000),
    },
    {
      metadata: { endpoint: process.env.STORAGE_2_URL || 'http://localhost:3335' },
      staticBags: allStaticBags,
      operatorId: parseInt(process.env.STORAGE_2_WORKER_ID || '1'),
      storageLimit: new BN(1_000_000_000_000),
      objectsLimit: 1000000000,
      transactorKey: process.env.COLOSSUS_2_TRANSACTOR_KEY || '5FbzYmQ3HogiEEDSXPYJe58yCcmSh3vsZLodTdBB6YuLDAj7', // //Colossus2
      transactorUri: process.env.COLOSSUS_2_TRANSACTOR_URI || '//Colossus2',
      transactorBalance: new BN(100_000),
    },
  ],
}

export default function createFlow({ buckets, dynamicBagPolicy }: InitStorageConfig) {
  return async function initDistribution({ api }: FlowProps): Promise<void> {
    const debug = extendDebug('flow:initStorage')
    debug('Started')

    // Get working group leaders
    const [, storageLeader] = await api.getLeader('storageWorkingGroup')

    const storageLeaderKey = storageLeader.role_account_id.toString()
    const maxStorageLimit = buckets.sort((a, b) => b.storageLimit.cmp(a.storageLimit))[0].storageLimit
    const maxObjectsLimit = Math.max(...buckets.map((b) => b.objectsLimit))

    // Hire operators
    // const hireWorkersFixture = new HireWorkesFixture(api, totalBucketsNum, WorkingGroups.Distribution)
    // await new FixtureRunner(hireWorkersFixture).run()
    // const operatorIds = hireWorkersFixture.getHiredWorkers()

    const operatorIds = buckets.map((b) => createType('WorkerId', b.operatorId))
    const operatorKeys = await api.getWorkerRoleAccounts(operatorIds, 'storageWorkingGroup')

    // Set global limits and policies
    const updateDynamicBagPolicyTxs = _.entries(dynamicBagPolicy).map(([bagType, numberOfBuckets]) =>
      api.tx.storage.updateNumberOfStorageBucketsInDynamicBagCreationPolicy(
        bagType as keyof typeof DynamicBagId.typeDefinitions,
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
    const acceptInvitationTxs = Array.from(bucketById.entries()).map(([bucketId, bucketConfig], i) =>
      api.tx.storage.acceptStorageBucketInvitation(operatorIds[i], bucketId, bucketConfig.transactorKey)
    )
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
            createType<BagId, 'BagId'>('BagId', { Static: sBagId }),
            createType('BTreeSet<StorageBucketId>', [bucketId]),
            createType('BTreeSet<StorageBucketId>', [])
          )
        })
        const updateBagsPromise = api.sendExtrinsicsAndGetResults(updateBagTxs, storageLeaderKey)
        const setupTransactorBalancePromise = (async () => [
          await api.treasuryTransferBalance(bucketConfig.transactorKey, bucketConfig.transactorBalance),
        ])()
        return [updateBagsPromise, setMetaPromise, setupTransactorBalancePromise]
      })
    )
    await Promise.all(bucketSetupPromises)

    debug('Done')
  }
}
