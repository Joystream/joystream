import { QueryNodeApi } from '../queryNode/api'
import logger from '../logger'
import { u8aToString, hexToU8a } from '@polkadot/util'
import {
  StorageBagDetailsFragment,
  StorageBucketDetailsFragment,
  DataObjectDetailsFragment,
} from '../queryNode/generated/queries'

export type DataObligations = {
  storageBuckets: StorageBucket[]
  bags: Bag[]
  dataObjects: DataObject[]
}

type StorageBucket = {
  id: string
  operatorUrl: string
  workerId: number
}

type Bag = {
  id: string
  buckets: string[]
}

type DataObject = {
  cid: string
  bagId: string
}

export async function getStorageObligationsFromRuntime(
  queryNodeUrl: string,
  workerId: number
): Promise<DataObligations> {
  const api = new QueryNodeApi(queryNodeUrl)

  const allBuckets = await getAllBuckets(api)

  const bucketIds = allBuckets
    .filter((bucket) => bucket.operatorStatus?.workerId === workerId)
    .map((bucket) => bucket.id)
  const assignedBags = await getAllAssignedBags(api, bucketIds)

  const bagIds = assignedBags.map((bag) => bag.id)
  const assignedDataObjects = await getAllAssignedDataObjects(api, bagIds)

  const model: DataObligations = {
    storageBuckets: allBuckets.map((bucket) => ({
      id: bucket.id,
      operatorUrl: extractOperatorUrl(bucket.operatorMetadata),
      workerId: bucket.operatorStatus?.workerId,
    })),
    bags: assignedBags.map((bag) => ({
      id: bag.id,
      buckets: bag.storedBy.map((bucketInBag) => bucketInBag.id),
    })),
    dataObjects: assignedDataObjects.map((dataObject) => ({
      cid: dataObject.ipfsHash,
      bagId: dataObject.storageBag.id,
    })),
  }

  return model
}

export async function getDataObjectIDsByBagId(
  queryNodeUrl: string,
  bagId: string
): Promise<string[]> {
  const api = new QueryNodeApi(queryNodeUrl)
  const dataObjects = await getAllAssignedDataObjects(api, [bagId])

  return dataObjects.map((obj) => obj.ipfsHash)
}

async function getAllBuckets(
  api: QueryNodeApi
): Promise<StorageBucketDetailsFragment[]> {
  return await getAllObjectsWithPaging(
    'all storage buckets',
    async (offset, limit) => await api.getStorageBucketDetails(offset, limit)
  )
}

async function getAllAssignedDataObjects(
  api: QueryNodeApi,
  bagIds: string[]
): Promise<DataObjectDetailsFragment[]> {
  return await getAllObjectsWithPaging(
    'assigned data objects',
    async (offset, limit) =>
      await api.getDataObjectDetails(bagIds, offset, limit)
  )
}

async function getAllAssignedBags(
  api: QueryNodeApi,
  bucketIds: string[]
): Promise<StorageBagDetailsFragment[]> {
  return await getAllObjectsWithPaging(
    'assigned bags',
    async (offset, limit) =>
      await api.getStorageBagsDetails(bucketIds, offset, limit)
  )
}

async function getAllObjectsWithPaging<T>(
  objectName: string,
  query: (offset: number, limit: number) => Promise<T[]>
): Promise<T[]> {
  const result = []
  const limit = 1000 // TODO: make as parameter?
  let offset = 0

  let resultPart = []
  do {
    logger.debug(
      `Sync - getting ${objectName}: offset = ${offset}, limit = ${limit}`
    )
    resultPart = await query(offset, limit)
    offset += limit
    result.push(...resultPart)

    if (resultPart.length < limit) break
  } while (resultPart.length > 0)

  return result
}

function extractOperatorUrl(encodedString: string): string {
  try {
    return u8aToString(hexToU8a(encodedString))
  } catch (err) {
    logger.error(`Sync - ${err}`)
  }

  return ''
}
