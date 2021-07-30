import { QueryNodeApi } from '../../services/queryNode/api'
import { u8aToString, hexToU8a } from '@polkadot/util'

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
  // TODO: graphql response entries limit
  // TODO: get accepted data objects only

  let allBuckets = await api.getAllStorageBucketDetails()

  let bucketIds = allBuckets
    .filter((bucket) => bucket.operatorStatus?.workerId === workerId)
    .map((bucket) => bucket.id)
  let assignedBags = await api.getStorageBagsDetails(bucketIds)

  let bagIds = assignedBags.map((bag) => bag.id)
  let assignedDataObjects = await api.getDataObjectDetails(bagIds)

  const model: Model = {
    storageBuckets: allBuckets.map((bucket) => ({
      id: bucket.id,
      url: u8aToString(hexToU8a(bucket.operatorMetadata)), //TODO: catch error locally
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
