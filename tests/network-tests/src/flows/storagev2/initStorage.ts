import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { WorkingGroups } from '../../WorkingGroups'
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

export const defaultSingleBucketConfig: InitStorageConfig = {
  dynamicBagPolicy: {
    'Channel': 1,
    'Member': 1,
  },
  buckets: [
    {
      metadata: { endpoint: process.env.STORAGE_1_URL || 'http://localhost:3333' },
      staticBags: allStaticBags,
      operatorId: parseInt(process.env.STORAGE_1_WORKER_ID || '0'),
      storageLimit: new BN(1_000_000_000_000),
      objectsLimit: 1000000000,
    },
  ],
}

export default function createFlow({ buckets, dynamicBagPolicy }: InitStorageConfig) {
  return async function initDistribution({ api }: FlowProps): Promise<void> {
    api.enableVerboseTxLogs()

    const debug = extendDebug('flow:initStorage')
    debug('Started')

    // Get working group leaders
    const storageLeaderId = await api.getLeadWorkerId(WorkingGroups.Storage)
    const storageLeader = await api.getGroupLead(WorkingGroups.Storage)
    if (!storageLeaderId || !storageLeader) {
      throw new Error('Active storage leader is required in this flow!')
    }

    const storageLeaderKey = storageLeader.role_account_id.toString()
    const maxStorageLimit = buckets.sort((a, b) => b.storageLimit.cmp(a.storageLimit))[0].storageLimit
    const maxObjectsLimit = Math.max(...buckets.map((b) => b.objectsLimit))

    // Hire operators
    // const hireWorkersFixture = new HireWorkesFixture(api, totalBucketsNum, WorkingGroups.Distribution)
    // await new FixtureRunner(hireWorkersFixture).run()
    // const operatorIds = hireWorkersFixture.getHiredWorkers()

    const operatorIds = buckets.map((b) => createType('WorkerId', b.operatorId))
    const operatorKeys = await api.getWorkerRoleAccounts(operatorIds, WorkingGroups.Storage)

    // Set global limits and policies
    const updateDynamicBagPolicyTxs = _.entries(dynamicBagPolicy).map(([bagType, numberOfBuckets]) =>
      api.tx.storage.updateNumberOfStorageBucketsInDynamicBagCreationPolicy(
        bagType as keyof typeof DynamicBagId.typeDefinitions,
        numberOfBuckets
      )
    )
    const setMaxVoucherLimitsTx = api.tx.storage.updateStorageBucketsVoucherMaxLimits(maxStorageLimit, maxObjectsLimit)
    const setBucketPerBagLimitTx = api.tx.storage.updateStorageBucketsPerBagLimit(buckets.length)

    await api.signAndSendMany(
      [...updateDynamicBagPolicyTxs, setMaxVoucherLimitsTx, setBucketPerBagLimitTx],
      storageLeaderKey
    )

    // Create buckets
    const createBucketTxs = buckets.map((b, i) =>
      api.tx.storage.createStorageBucket(operatorIds[i], true, b.storageLimit, b.objectsLimit)
    )
    const createBucketResults = await api.signAndSendManyByMany(createBucketTxs, operatorKeys)
    const bucketById = new Map<number, StorageBucketConfig>()
    createBucketResults.forEach((res, i) => {
      const bucketId = api.getEvent(res, 'storage', 'StorageBucketCreated').data[0]
      bucketById.set(bucketId.toNumber(), buckets[i])
    })

    // Invite bucket operators
    const bucketInviteTxs = _.keys(bucketById).map((bucketId, i) =>
      api.tx.storage.inviteStorageBucketOperator(bucketId, operatorIds[i])
    )
    await api.signAndSendMany(bucketInviteTxs, storageLeaderKey)

    // Accept invitations
    const acceptInvitationTxs = _.keys(bucketById).map((bucketId, i) =>
      api.tx.storage.acceptStorageBucketInvitation(operatorIds[i], bucketId)
    )
    await api.signAndSendManyByMany(acceptInvitationTxs, operatorKeys)

    // Bucket metadata and static bags
    const bucketSetupPromises = _.flatten(
      Array.from(bucketById.entries()).map(([bucketId, bucketConfig], i) => {
        const operatorId = operatorIds[i]
        const operatorKey = operatorKeys[i]
        const metadataBytes = Utils.metadataToBytes(StorageBucketOperatorMetadata, bucketConfig.metadata)
        const setMetaTx = api.tx.storage.setStorageOperatorMetadata(operatorId, bucketId, metadataBytes)
        const setMetaPromise = api.signAndSendMany([setMetaTx], operatorKey)
        const updateBagTxs = (bucketConfig.staticBags || []).map((sBagId) => {
          return api.tx.storage.updateStorageBucketsForBag(
            createType<BagId, 'BagId'>('BagId', { Static: sBagId }),
            createType('BTreeSet<StorageBucketId>', [bucketId]),
            createType('BTreeSet<StorageBucketId>', [])
          )
        })
        const updateBagsPromise = api.signAndSendMany(updateBagTxs, storageLeaderKey)
        return [updateBagsPromise, setMetaPromise]
      })
    )
    await Promise.all(bucketSetupPromises)

    debug('Done')
  }
}
