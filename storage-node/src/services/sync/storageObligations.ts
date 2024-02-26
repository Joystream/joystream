import _ from 'lodash'
import logger from '../logger'
import { MAX_RESULTS_PER_QUERY, QueryNodeApi } from '../queryNode/api'
import {
  DataObjectByBagIdsDetailsFragment,
  DataObjectDetailsFragment,
  StorageBagDetailsFragment,
  StorageBucketDetailsFragment,
} from '../queryNode/generated/queries'

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
   * Assigned data objects for the storage provider.
   */
  dataObjects: DataObject[]
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
type DataObject = {
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
}

/**
 * Get storage provider obligations like (assigned data objects) from the
 * runtime (Query Node).
 *
 * @param queryNodeUrl - Query Node URL
 * @param workerId - worker ID
 * @returns promise for the DataObligations
 */
export async function getStorageObligationsFromRuntime(
  qnApi: QueryNodeApi,
  bucketIds: string[]
): Promise<DataObligations> {
  const allBuckets = await getAllBuckets(qnApi)

  const assignedBags = await getAllAssignedBags(qnApi, bucketIds)

  const bagIds = assignedBags.map((bag) => bag.id)
  const assignedDataObjects = await getAllAssignedDataObjects(qnApi, bagIds)

  const model: DataObligations = {
    storageBuckets: allBuckets.map((bucket) => ({
      id: bucket.id,
      operatorUrl: bucket.operatorMetadata?.nodeEndpoint ?? '',
      workerId: bucket.operatorStatus?.workerId,
    })),
    bags: assignedBags.map((bag) => ({
      id: bag.id,
      buckets: bag.storageBuckets.map((bucketInBag) => bucketInBag.storageBucket.id),
    })),
    dataObjects: assignedDataObjects.map((dataObject) => ({
      id: dataObject.id,
      bagId: dataObject.storageBag.id,
      ipfsHash: dataObject.ipfsHash,
    })),
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
 * Get IDs of the data objects assigned to the bag ID.
 *
 * @param qnApi - initialized QueryNodeApi instance
 * @param bagId - bag ID
 * @returns data object IDs
 */
export async function getDataObjectIDsByBagId(qnApi: QueryNodeApi, bagId: string): Promise<string[]> {
  const dataObjects = await getAllAssignedDataObjects(qnApi, [bagId])

  return dataObjects.map((obj) => obj.id)
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
 * Get all data objects assigned to storage provider.
 *
 * @param api - initialized QueryNodeApi instance
 * @param bagIds - assigned storage bags' IDs
 * @returns storage bag data
 */
async function getAllAssignedDataObjects(
  api: QueryNodeApi,
  bagIds: string[]
): Promise<DataObjectByBagIdsDetailsFragment[]> {
  return await api.getDataObjectsByBagIds(bagIds)
}

/**
 * Get details of storage data objects by IDs.
 *
 * @param api - initialized QueryNodeApi instance
 * @param dataObjectIds - data objects' IDs
 * @returns storage data objects
 */
export async function getDataObjectsByIDs(
  api: QueryNodeApi,
  dataObjectIds: string[]
): Promise<DataObjectDetailsFragment[]> {
  return await api.getDataObjectDetails(dataObjectIds)
}

/**
 * Get all bags assigned to storage provider.
 *
 * @param api - initialiazed QueryNodeApi instance
 * @param bucketIds - assigned storage provider buckets' IDs
 * @returns storage bag data
 */
async function getAllAssignedBags(api: QueryNodeApi, bucketIds: string[]): Promise<StorageBagDetailsFragment[]> {
  return await api.getStorageBagsDetails(bucketIds)
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
