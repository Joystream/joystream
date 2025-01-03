import _ from 'lodash'
import logger from '../logger'
import { MAX_RESULTS_PER_QUERY, QueryNodeApi } from '../queryNode/api'
import { StorageBucketDetailsFragment } from '../queryNode/generated/queries'
import { ApiPromise } from '@polkadot/api'
import { PalletStorageStorageBucketRecord } from '@polkadot/types/lookup'

/**
 * Defines storage provider data obligations.
 */
export type DataObligations = {
  /**
   * All storage buckets in the system.
   */
  storageBuckets: StorageBucket[]

  /**
   * Assigned bags for the storage provider.
   */
  bags: Bag[]

  /**
   * Map from bucket id to storage node url, without own buckets.
   */
  bucketOperatorUrlById: Map<string, string>

  /**
   * Map from assigned bag ids to storage node urls.
   */
  bagOperatorsUrlsById: Map<string, string[]>

  /**
   * A function that returns assigned data object ids
   */
  getAssignedDataObjectIds(isAccepted?: boolean): Promise<string[]>
}

/**
 * Storage bucket abstraction.
 */
type StorageBucket = {
  /**
   * Storage bucket ID
   */
  id: string

  /**
   * Storage operator URL
   */
  operatorUrl: string

  /**
   * Storage working group ID.
   */
  workerId: number
}

/**
 * Storage bag abstracton.
 */
type Bag = {
  /**
   * Storage bag ID
   */
  id: string

  /**
   * Assigned storage bucket IDs.
   */
  buckets: string[]
}

/**
 * Data object abstraction.
 */
export type DataObject = {
  /**
   * Data object ID
   */
  id: string

  /**
   * Assigned bag ID
   */
  bagId: string

  /**
   * Data Object hash
   */
  ipfsHash: string

  /**
   * Data Object size
   */
  size: number
}

/**
 * Get storage provider obligations like (assigned data objects) from the
 * runtime (Query Node).
 *
 * @param queryNodeUrl - Query Node URL
 * @param bucketIds - bucket IDs. If undefined, we treat all existing bags as obligations.
 * @returns promise for the DataObligations
 */
export async function getStorageObligationsFromRuntime(
  qnApi: QueryNodeApi,
  bucketIds?: string[]
): Promise<DataObligations> {
  const storageBuckets = (await getAllBuckets(qnApi)).map((bucket) => ({
    id: bucket.id,
    operatorUrl: bucket.operatorMetadata?.nodeEndpoint ?? '',
    workerId: bucket.operatorStatus?.workerId,
  }))

  const bags = (
    bucketIds === undefined ? await qnApi.getAllStorageBagsDetails() : await qnApi.getStorageBagsDetails(bucketIds)
  ).map((bag) => ({
    id: bag.id,
    buckets: bag.storageBuckets.map((bucketInBag) => bucketInBag.storageBucket.id),
  }))

  const ownBuckets = new Set<string>(bucketIds || [])
  const ownOperatorUrls = new Set<string>()
  for (const bucket of storageBuckets) {
    if (ownBuckets.has(bucket.id)) {
      ownOperatorUrls.add(bucket.operatorUrl)
    }
  }

  const bucketOperatorUrlById = new Map<string, string>()
  for (const bucket of storageBuckets) {
    if (!ownBuckets.has(bucket.id)) {
      if (ownOperatorUrls.has(bucket.operatorUrl)) {
        logger.warn(`Skipping remote bucket ${bucket.id} - ${bucket.operatorUrl}`)
      } else {
        bucketOperatorUrlById.set(bucket.id, bucket.operatorUrl)
      }
    }
  }

  const bagOperatorsUrlsById = new Map<string, string[]>()
  for (const bag of bags) {
    const operatorUrls = []
    for (const bucketId of bag.buckets) {
      const operatorUrl = bucketOperatorUrlById.get(bucketId)
      if (operatorUrl) {
        operatorUrls.push(operatorUrl)
      }
    }

    bagOperatorsUrlsById.set(bag.id, operatorUrls)
  }

  const model: DataObligations = {
    storageBuckets,
    bags,
    bagOperatorsUrlsById,
    bucketOperatorUrlById,
    getAssignedDataObjectIds: (isAccepted?: boolean) =>
      qnApi.getDataObjectIdsByBagIds(
        bags.map((b) => b.id),
        isAccepted
      ),
  }

  return model
}

/**
 * Get storage bucket IDs assigned to the worker.
 *
 * @param qnApi - Query Node Api
 * @param workerId - worker ID
 * @returns storage bucket IDs
 */
export async function getStorageBucketIdsByWorkerId(qnApi: QueryNodeApi, workerId: number): Promise<string[]> {
  const idFragments = await qnApi.getStorageBucketIdsByWorkerId(workerId)
  const ids = idFragments.map((frag) => frag.id)

  return ids
}

/**
 * Get all storage buckets registered in the runtime (Query Node).
 *
 * @param api - initialiazed QueryNodeApi instance
 * @returns storage buckets data
 */
async function getAllBuckets(api: QueryNodeApi): Promise<StorageBucketDetailsFragment[]> {
  const idFragments = await api.getStorageBucketIds()
  const ids = idFragments.map((frag) => frag.id)

  return await getAllObjectsWithPaging(async (offset, limit) => {
    const idsPart = ids.slice(offset, offset + limit)
    if (!_.isEmpty(idsPart)) {
      logger.debug(`Sync - getting all storage buckets: offset = ${offset}, limit = ${limit}`)
      return await api.getStorageBucketDetails(idsPart)
    } else {
      return false
    }
  })
}

/**
 * Get details of storage data objects by IDs.
 *
 * @param api - initialized QueryNodeApi instance
 * @param dataObjectIds - data objects' IDs
 * @returns storage data objects
 */
export async function getDataObjectsByIDs(api: QueryNodeApi, dataObjectIds: string[]): Promise<DataObject[]> {
  return (await api.getDataObjectsDetailsByIds(dataObjectIds)).map((o) => ({
    id: o.id,
    size: parseInt(o.size),
    bagId: o.storageBag.id,
    ipfsHash: o.ipfsHash,
  }))
}

/**
 * Abstract object acquiring function for the QueryNode. It uses paging for
 * queries and gets data using record offset and limit (hardcoded to 1000).
 *
 * @param objectName - object name(type) to get from the QueryNode
 * @param query - actual query function
 * @returns storage operator URL
 */
async function getAllObjectsWithPaging<T>(
  query: (offset: number, limit: number) => Promise<T[] | false>
): Promise<T[]> {
  const result = []
  const limit = MAX_RESULTS_PER_QUERY
  let offset = 0

  let resultPart = []
  do {
    const queryResult = await query(offset, limit)
    if (queryResult === false) {
      return result
    } else {
      resultPart = queryResult
    }

    offset += limit
    result.push(...resultPart)
  } while (resultPart.length > 0)

  return result
}

/**
 * Given a list of bucket ids, constructs a list of [bucketId, operatorAddress] entries.
 * Filters out buckets that are not assigned to the provided workerId.
 *
 * @param api - runtime API
 * @param qnApi - query node API
 * @param workerId - ID of the worker
 * @param bucketsToServe - list of buckets to serve / construct the mapping for
 * @returns [bucketId, operatorAddress] entries
 */
export async function constructBucketToAddressMapping(
  api: ApiPromise,
  qnApi: QueryNodeApi,
  workerId: number,
  bucketsToServe: number[]
): Promise<[string, string][]> {
  const bucketIds = await getStorageBucketIdsByWorkerId(qnApi, workerId)
  const buckets: [string, PalletStorageStorageBucketRecord][] = (
    await Promise.all(
      bucketIds.map(async (bucketId) => [bucketId, await api.query.storage.storageBucketById(bucketId)] as const)
    )
  )
    .filter(([bucketId]) => bucketsToServe.length === 0 || bucketsToServe.includes(parseInt(bucketId)))
    .filter(([, optBucket]) => optBucket.isSome && optBucket.unwrap().operatorStatus.isStorageWorker)
    .map(([bucketId, optBucket]) => [bucketId, optBucket.unwrap()])

  return buckets.map(([bucketId, bucket]) => [bucketId, bucket.operatorStatus.asStorageWorker[1].toString()])
}
