import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { WorkingGroups } from '../../WorkingGroups'
import {
  DistributionBucketFamilyMetadata,
  DistributionBucketOperatorMetadata,
  IDistributionBucketFamilyMetadata,
  IDistributionBucketOperatorMetadata,
} from '@joystream/metadata-protobuf'
import { CreateInterface, createType } from '@joystream/types'
import {
  BagId,
  DistributionBucketFamilyId,
  DistributionBucketId,
  DynamicBagId,
  StaticBagId,
} from '@joystream/types/storage'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import _ from 'lodash'
import { Utils } from '../../utils'
import { WorkerId } from '@joystream/types/working-group'

type DistributionBucketConfig = {
  metadata: IDistributionBucketOperatorMetadata
  staticBags?: CreateInterface<StaticBagId>[]
  operatorId: number
}

type DistributionFamilyConfig = {
  metadata?: IDistributionBucketFamilyMetadata
  buckets: DistributionBucketConfig[]
  dynamicBagPolicy: {
    [K in keyof typeof DynamicBagId.typeDefinitions]?: number
  }
}

type InitDistributionConfig = {
  families: DistributionFamilyConfig[]
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

export const defaultSingleBucketConfig: InitDistributionConfig = {
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
          staticBags: allStaticBags,
          operatorId: parseInt(process.env.DISTRIBUTOR_1_WORKER_ID || '0'),
        },
      ],
    },
  ],
}

export default function createFlow({ families }: InitDistributionConfig) {
  return async function initDistribution({ api }: FlowProps): Promise<void> {
    api.enableVerboseTxLogs()

    const debug = extendDebug('flow:initDistribution')
    debug('Started')

    // Get working group leaders
    const distributionLeaderId = await api.getLeadWorkerId(WorkingGroups.Distribution)
    const distributionLeader = await api.getGroupLead(WorkingGroups.Distribution)
    if (!distributionLeaderId || !distributionLeader) {
      throw new Error('Active distributor leader is required in this flow!')
    }

    const distributionLeaderKey = distributionLeader.role_account_id.toString()
    const totalBucketsNum = families.reduce((a, b) => a + b.buckets.length, 0)

    // Hire operators
    // const hireWorkersFixture = new HireWorkesFixture(api, totalBucketsNum, WorkingGroups.Distribution)
    // await new FixtureRunner(hireWorkersFixture).run()
    // const operatorIds = hireWorkersFixture.getHiredWorkers()

    const operatorIds = families.reduce(
      (ids, { buckets }) => ids.concat(buckets.map((b) => createType('WorkerId', b.operatorId))),
      [] as WorkerId[]
    )
    const operatorKeys = await api.getWorkerRoleAccounts(operatorIds, WorkingGroups.Distribution)

    // Create families, set buckets per bag limit
    const createFamilyTxs = families.map(() => api.tx.storage.createDistributionBucketFamily())
    const setBucketsPerBagLimitTx = api.tx.storage.updateDistributionBucketsPerBagLimit(totalBucketsNum)
    const [createFamilyResults] = await Promise.all([
      api.signAndSendMany(createFamilyTxs, distributionLeaderKey),
      api.signAndSendMany([setBucketsPerBagLimitTx], distributionLeaderKey),
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
        bagType as keyof typeof DynamicBagId.typeDefinitions,
        createType('BTreeMap<DistributionBucketFamilyId, u32>', new Map(policyEntries))
      )
    )
    const [createBucketResults] = await Promise.all([
      api.signAndSendMany(createBucketTxs, distributionLeaderKey),
      api.signAndSendMany(updateFamilyMetadataTxs, distributionLeaderKey),
      api.signAndSendMany(updateDynamicBagPolicyTxs, distributionLeaderKey),
    ])
    const bucketEntries = createBucketResults
      .map((r) => {
        const [familyId, , bucketId] = api.getEvent(r, 'storage', 'DistributionBucketCreated').data
        return [familyId, bucketId] as [DistributionBucketFamilyId, DistributionBucketId]
      })
      .sort((a, b) => a[0].cmp(b[0]) || a[1].cmp(b[1]))
    const bucketById = new Map<number, DistributionBucketConfig>()
    const bucketEntriesByFamilyId = _.groupBy(bucketEntries, ([familyId]) => familyId.toString())
    _.mapValues(bucketEntriesByFamilyId, (entries) => {
      entries.forEach(([familyId, bucketId], bucketInFamilyIndex) => {
        const family = familyById.get(familyId.toNumber())
        if (!family) {
          throw new Error('Family config not found')
        }
        bucketById.set(bucketId.toNumber(), family.buckets[bucketInFamilyIndex])
      })
    })

    // Invite bucket operators
    const bucketInviteTxs = bucketEntries.map(([familyId, bucketId], i) =>
      api.tx.storage.inviteDistributionBucketOperator(familyId, bucketId, operatorIds[i])
    )
    await api.signAndSendMany(bucketInviteTxs, distributionLeaderKey)

    // Accept invitations
    const acceptInvitationTxs = bucketEntries.map(([familyId, bucketId], i) =>
      api.tx.storage.acceptDistributionBucketInvitation(operatorIds[i], familyId, bucketId)
    )
    await api.signAndSendManyByMany(acceptInvitationTxs, operatorKeys)

    // Bucket metadata and static bags
    const bucketSetupPromises = _.flatten(
      bucketEntries.map(([familyId, bucketId], i) => {
        const operatorId = operatorIds[i]
        const operatorKey = operatorKeys[i]
        const bucketConfig = bucketById.get(bucketId.toNumber())
        if (!bucketConfig) {
          throw new Error('Bucket config not found')
        }
        const metadataBytes = Utils.metadataToBytes(DistributionBucketOperatorMetadata, bucketConfig.metadata)
        const setMetaTx = api.tx.storage.setDistributionOperatorMetadata(operatorId, familyId, bucketId, metadataBytes)
        const setMetaPromise = api.signAndSendMany([setMetaTx], operatorKey)
        const updateBagTxs = (bucketConfig.staticBags || []).map((sBagId) => {
          return api.tx.storage.updateDistributionBucketsForBag(
            createType<BagId, 'BagId'>('BagId', { Static: sBagId }),
            familyId,
            createType('DistributionBucketIdSet', [bucketId.toNumber()]),
            createType('DistributionBucketIdSet', [])
          )
        })
        const updateBagsPromise = api.signAndSendMany(updateBagTxs, distributionLeaderKey)
        return [updateBagsPromise, setMetaPromise]
      })
    )
    await Promise.all(bucketSetupPromises)

    debug('Done')
  }
}
