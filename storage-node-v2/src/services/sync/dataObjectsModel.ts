import { QueryNodeApi } from '../../services/queryNode/api'
import logger from '../../services/logger'
import { u8aToString, hexToU8a } from '@polkadot/util'
import {
  StorageBagDetailsFragment,
  StorageBucketDetailsFragment,
  DataObjectDetailsFragment,
} from '../queryNode/generated/queries'

type Model = {
  storageBuckets: StorageBucket[]
  bags: Bag[]
  dataObjects: DataObject[]
}

type StorageBucket = {
  id: string
  url: string
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

export async function getRuntimeModel(
  queryNodeUrl: string,
  workerId: number
): Promise<Model> {
  const api = new QueryNodeApi(queryNodeUrl)

  let allBuckets = await getAllBuckets(api)

  let bucketIds = allBuckets
    .filter((bucket) => bucket.operatorStatus?.workerId === workerId)
    .map((bucket) => bucket.id)
  let assignedBags = await getAllAssignedBags(api, bucketIds)

  let bagIds = assignedBags.map((bag) => bag.id)
  let assignedDataObjects = await getAllAssignedDataObjects(api, bagIds)

  const model: Model = {
    storageBuckets: allBuckets.map((bucket) => ({
      id: bucket.id,
      url: extractOperatorUrl(bucket.operatorMetadata),
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
  let result = []
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

function extractOperatorUrl(encodedString: string): string{
  try {
    return u8aToString(hexToU8a(encodedString))
  }
  catch (err) {
    logger.error(`Sync - ${err}`)
  }

  return ''
}