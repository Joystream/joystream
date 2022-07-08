import {
  DistributionBucketFamilyMetadata,
  DistributionBucketOperatorMetadata,
  IDistributionBucketFamilyMetadata,
  IDistributionBucketOperatorMetadata,
} from '@joystream/metadata-protobuf'
import { createType } from '@joystream/types'
import { DistributionBucketFamilyId, WorkerId } from '@joystream/types/primitives'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import {
  PalletStorageDynamicBagIdType as DynamicBagId,
  PalletStorageStaticBagId as StaticBagId,
} from '@polkadot/types/lookup'
import _ from 'lodash'
import { extendDebug } from '../../Debugger'
import { FlowProps } from '../../Flow'
import { Utils } from '../../utils'

type DistributionBucketConfig = {
  metadata: IDistributionBucketOperatorMetadata
  staticBags?: StaticBagId[]
  operatorId: number
}

type DistributionFamilyConfig = {
  metadata?: IDistributionBucketFamilyMetadata
  buckets: DistributionBucketConfig[]
  dynamicBagPolicy: {
    [K in DynamicBagId['type']]?: number
  }
}

type InitDistributionConfig = {
  families: DistributionFamilyConfig[]
}

export const allStaticBags = [
  'Council',
  { WorkingGroup: 'Content' },
  { WorkingGroup: 'Distribution' },
  { WorkingGroup: 'Gateway' },
  { WorkingGroup: 'OperationsAlpha' },
  { WorkingGroup: 'OperationsBeta' },
  { WorkingGroup: 'OperationsGamma' },
  { WorkingGroup: 'Storage' },
]

export const singleBucketConfig: InitDistributionConfig = {
  families: [
    {
      metadata: { region: 'All' },
      dynamicBagPolicy: {
        'Channel': 1,
        'Member': 1,
      },
      buckets: [
        {
          metadata: { endpoint: process.env.DISTRIBUTOR_1_URL || 'http://localhost:3334' },
          staticBags: allStaticBags as unknown as StaticBagId[],
          operatorId: parseInt(process.env.DISTRIBUTOR_1_WORKER_ID || '0'),
        },
      ],
    },
  ],
}

export const doubleBucketConfig: InitDistributionConfig = {
  families: [
    {
      metadata: { region: 'Region 1' },
      dynamicBagPolicy: {
        'Channel': 1,
        'Member': 1,
      },
      buckets: [
        {
          metadata: { endpoint: process.env.DISTRIBUTOR_1_URL || 'http://localhost:3334' },
          staticBags: allStaticBags as unknown as StaticBagId[],
          operatorId: parseInt(process.env.DISTRIBUTOR_1_WORKER_ID || '0'),
        },
      ],
    },
    {
      metadata: { region: 'Region 2' },
      dynamicBagPolicy: {
        'Channel': 1,
        'Member': 1,
      },
      buckets: [
        {
          metadata: { endpoint: process.env.DISTRIBUTOR_2_URL || 'http://localhost:3336' },
          staticBags: allStaticBags as unknown as StaticBagId[],
          operatorId: parseInt(process.env.DISTRIBUTOR_2_WORKER_ID || '1'),
        },
      ],
    },
  ],
}

export default function createFlow({ families }: InitDistributionConfig) {
  return async function initDistribution({ api }: FlowProps): Promise<void> {
    const debug = extendDebug('flow:initDistribution')
    api.enableDebugTxLogs()
    debug('Started')

    // Get working group leaders
    const [, distributionLeader] = await api.getLeader('distributionWorkingGroup')

    const distributionLeaderKey = distributionLeader.roleAccountId.toString()
    const totalBucketsNum = families.reduce((a, b) => a + b.buckets.length, 0)

    // Hire operators
    // const hireWorkersFixture = new HireWorkesFixture(api, totalBucketsNum, WorkingGroups.Distribution)
    // await new FixtureRunner(hireWorkersFixture).run()
    // const operatorIds = hireWorkersFixture.getHiredWorkers()

    const operatorIds = families.reduce(
      (ids, { buckets }) => ids.concat(buckets.map((b) => api.createType('u64', b.operatorId))),
      [] as WorkerId[]
    )
    const operatorKeys = await api.getWorkerRoleAccounts(operatorIds, 'distributionWorkingGroup')

    // Create families, set buckets per bag limit
    const createFamilyTxs = families.map(() => api.tx.storage.createDistributionBucketFamily())
    const setBucketsPerBagLimitTx = api.tx.storage.updateDistributionBucketsPerBagLimit(totalBucketsNum)
    const [createFamilyResults] = await Promise.all([
      api.sendExtrinsicsAndGetResults(createFamilyTxs, distributionLeaderKey),
      api.sendExtrinsicsAndGetResults([setBucketsPerBagLimitTx], distributionLeaderKey),
    ])
    const familyIds = createFamilyResults
      .map((r) => api.getEvent(r, 'storage', 'DistributionBucketFamilyCreated').data[0])
      .sort((a, b) => a.cmp(b))
    const familyById = new Map<number, DistributionFamilyConfig>()
    familyIds.forEach((id, i) => familyById.set(id.toNumber(), families[i]))

    // Create buckets, update families metadata, set dynamic bag policies
    const createBucketTxs = families.reduce(
      (txs, { buckets }, familyIndex) =>
        txs.concat(buckets.map(() => api.tx.storage.createDistributionBucket(familyIds[familyIndex], true))),
      [] as SubmittableExtrinsic<'promise'>[]
    )
    const updateFamilyMetadataTxs = familyIds.map((id, i) => {
      const metadataBytes = Utils.metadataToBytes(DistributionBucketFamilyMetadata, families[i].metadata)
      return api.tx.storage.setDistributionBucketFamilyMetadata(id, metadataBytes)
    })
    const dynamicBagPolicies = new Map<string, [DistributionBucketFamilyId, number][]>()
    familyIds.forEach((familyId, index) => {
      const family = families[index]
      Object.entries(family.dynamicBagPolicy).forEach(([bagType, bucketsN]) => {
        const current = dynamicBagPolicies.get(bagType) || []
        dynamicBagPolicies.set(bagType, [...current, [familyId, bucketsN]])
      })
    })
    const updateDynamicBagPolicyTxs = _.entries(dynamicBagPolicies).map(([bagType, policyEntries]) =>
      api.tx.storage.updateFamiliesInDynamicBagCreationPolicy(
        bagType as DynamicBagId['type'],
        createType('BTreeMap<u64, u32>', new Map(policyEntries))
      )
    )
    const [createBucketResults] = await Promise.all([
      api.sendExtrinsicsAndGetResults(createBucketTxs, distributionLeaderKey),
      api.sendExtrinsicsAndGetResults(updateFamilyMetadataTxs, distributionLeaderKey),
      api.sendExtrinsicsAndGetResults(updateDynamicBagPolicyTxs, distributionLeaderKey),
    ])
    const bucketIds = createBucketResults
      .map((r) => {
        const [, , bucketId] = api.getEvent(r, 'storage', 'DistributionBucketCreated').data
        return bucketId
      })
      .sort(
        (a, b) =>
          a.distributionBucketFamilyId.cmp(b.distributionBucketFamilyId) ||
          a.distributionBucketIndex.cmp(b.distributionBucketIndex)
      )
    const bucketById = new Map<string, DistributionBucketConfig>()
    bucketIds.forEach((bucketId) => {
      const familyId = bucketId.distributionBucketFamilyId.toNumber()
      const bucketIndex = bucketId.distributionBucketIndex.toNumber()
      const family = familyById.get(familyId)
      if (!family) {
        throw new Error(`familyById not found: ${familyId}`)
      }
      bucketById.set(bucketId.toString(), family.buckets[bucketIndex])
    })

    // Invite bucket operators
    const bucketInviteTxs = bucketIds.map((bucketId, i) =>
      api.tx.storage.inviteDistributionBucketOperator(bucketId, operatorIds[i])
    )
    await api.sendExtrinsicsAndGetResults(bucketInviteTxs, distributionLeaderKey)

    // Accept invitations
    const acceptInvitationTxs = bucketIds.map((bucketId, i) =>
      api.tx.storage.acceptDistributionBucketInvitation(operatorIds[i], bucketId)
    )
    await api.sendExtrinsicsAndGetResults(acceptInvitationTxs, operatorKeys)

    // Bucket metadata and static bags
    const bucketSetupPromises = _.flatten(
      bucketIds.map((bucketId, i) => {
        const operatorId = operatorIds[i]
        const operatorKey = operatorKeys[i]
        const bucketConfig = bucketById.get(bucketId.toString())
        if (!bucketConfig) {
          throw new Error('Bucket config not found')
        }
        const metadataBytes = Utils.metadataToBytes(DistributionBucketOperatorMetadata, bucketConfig.metadata)
        const setMetaTx = api.tx.storage.setDistributionOperatorMetadata(operatorId, bucketId, metadataBytes)
        const setMetaPromise = api.sendExtrinsicsAndGetResults([setMetaTx], operatorKey)
        const updateBagTxs = (bucketConfig.staticBags || []).map((sBagId) => {
          return api.tx.storage.updateDistributionBucketsForBag(
            createType('PalletStorageBagIdType', { Static: sBagId }),
            bucketId.distributionBucketFamilyId,
            createType('BTreeSet<u64>', [bucketId.distributionBucketIndex]),
            createType('BTreeSet<u64>', [])
          )
        })
        const updateBagsPromise = api.sendExtrinsicsAndGetResults(updateBagTxs, distributionLeaderKey)
        return [updateBagsPromise, setMetaPromise]
      })
    )
    await Promise.all(bucketSetupPromises)

    debug('Done')
  }
}
