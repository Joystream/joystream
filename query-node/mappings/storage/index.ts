/*
eslint-disable @typescript-eslint/naming-convention
*/
import { EventContext, StoreContext } from '@joystream/hydra-common'
import { Storage } from '../generated/types/storage'
import {
  DistributionBucket,
  DistributionBucketFamily,
  DistributionBucketOperator,
  DistributionBucketOperatorMetadata,
  DistributionBucketOperatorStatus,
  NodeLocationMetadata,
  StorageBag,
  StorageBucket,
  StorageBucketOperatorStatusActive,
  StorageBucketOperatorStatusInvited,
  StorageBucketOperatorStatusMissing,
  StorageDataObject,
  StorageSystemParameters,
  GeoCoordinates,
} from 'query-node/dist/model'
import BN from 'bn.js'
import { getById, inconsistentState } from '../common'
import {
  processDistributionBucketFamilyMetadata,
  processDistributionOperatorMetadata,
  processStorageOperatorMetadata,
} from './metadata'
import {
  createDataObjects,
  getStorageSystem,
  removeDataObject,
  getStorageBucketWithOperatorMetadata,
  getBag,
  getDynamicBagId,
  getDynamicBagOwner,
  getDataObjectsInBag,
  getDynamicBag,
  getDistributionBucketFamilyWithMetadata,
  getDistributionBucketOperatorWithMetadata,
  distributionBucketId,
  distributionOperatorId,
  distributionBucketIdByFamilyAndIndex,
} from './utils'

// STORAGE BUCKETS

export async function storage_StorageBucketCreated({ event, store }: EventContext & StoreContext): Promise<void> {
  const [
    bucketId,
    invitedWorkerId,
    acceptingNewBags,
    dataObjectSizeLimit,
    dataObjectCountLimit,
  ] = new Storage.StorageBucketCreatedEvent(event).params

  const storageBucket = new StorageBucket({
    id: bucketId.toString(),
    acceptingNewBags: acceptingNewBags.isTrue,
    dataObjectCountLimit: new BN(dataObjectCountLimit.toString()),
    dataObjectsSizeLimit: new BN(dataObjectSizeLimit.toString()),
    dataObjectsCount: new BN(0),
    dataObjectsSize: new BN(0),
  })
  if (invitedWorkerId.isSome) {
    const operatorStatus = new StorageBucketOperatorStatusInvited()
    operatorStatus.workerId = invitedWorkerId.unwrap().toNumber()
    storageBucket.operatorStatus = operatorStatus
  } else {
    storageBucket.operatorStatus = new StorageBucketOperatorStatusMissing()
  }
  await store.save<StorageBucket>(storageBucket)
}

export async function storage_StorageOperatorMetadataSet({ event, store }: EventContext & StoreContext): Promise<void> {
  const [bucketId, , metadataBytes] = new Storage.StorageOperatorMetadataSetEvent(event).params
  const storageBucket = await getStorageBucketWithOperatorMetadata(store, bucketId.toString())
  storageBucket.operatorMetadata = await processStorageOperatorMetadata(
    store,
    storageBucket.operatorMetadata,
    metadataBytes
  )
  await store.save<StorageBucket>(storageBucket)
}

export async function storage_StorageBucketStatusUpdated({ event, store }: EventContext & StoreContext): Promise<void> {
  const [bucketId, acceptingNewBags] = new Storage.StorageBucketStatusUpdatedEvent(event).params

  const storageBucket = await getById(store, StorageBucket, bucketId.toString())
  storageBucket.acceptingNewBags = acceptingNewBags.isTrue
  await store.save<StorageBucket>(storageBucket)
}

export async function storage_StorageBucketInvitationAccepted({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bucketId, workerId, transactorAccountId] = new Storage.StorageBucketInvitationAcceptedEvent(event).params
  const storageBucket = await getById(store, StorageBucket, bucketId.toString())
  const operatorStatus = new StorageBucketOperatorStatusActive()
  operatorStatus.workerId = workerId.toNumber()
  operatorStatus.transactorAccountId = transactorAccountId.toString()
  storageBucket.operatorStatus = operatorStatus
  await store.save<StorageBucket>(storageBucket)
}

export async function storage_StorageBucketInvitationCancelled({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bucketId] = new Storage.StorageBucketInvitationCancelledEvent(event).params
  const storageBucket = await getById(store, StorageBucket, bucketId.toString())
  const operatorStatus = new StorageBucketOperatorStatusMissing()
  storageBucket.operatorStatus = operatorStatus
  await store.save<StorageBucket>(storageBucket)
}

export async function storage_StorageBucketOperatorInvited({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bucketId, workerId] = new Storage.StorageBucketOperatorInvitedEvent(event).params
  const storageBucket = await getById(store, StorageBucket, bucketId.toString())
  const operatorStatus = new StorageBucketOperatorStatusInvited()
  operatorStatus.workerId = workerId.toNumber()
  storageBucket.operatorStatus = operatorStatus
  await store.save<StorageBucket>(storageBucket)
}

export async function storage_StorageBucketOperatorRemoved({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bucketId] = new Storage.StorageBucketInvitationCancelledEvent(event).params
  const storageBucket = await getById(store, StorageBucket, bucketId.toString())
  const operatorStatus = new StorageBucketOperatorStatusMissing()
  storageBucket.operatorStatus = operatorStatus
  await store.save<StorageBucket>(storageBucket)
}

export async function storage_StorageBucketsUpdatedForBag({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bagId, addedBucketsSet, removedBucketsSet] = new Storage.StorageBucketsUpdatedForBagEvent(event).params
  // Get or create bag
  const storageBag = await getBag(store, bagId, ['storageBuckets'])
  const removedBucketsIds = Array.from(removedBucketsSet).map((id) => id.toString())
  const addedBucketsIds = Array.from(addedBucketsSet).map((id) => id.toString())
  storageBag.storageBuckets = (storageBag.storageBuckets || [])
    .filter((bucket) => !removedBucketsIds.includes(bucket.id))
    .concat(addedBucketsIds.map((id) => new StorageBucket({ id })))
  await store.save<StorageBag>(storageBag)
}

export async function storage_VoucherChanged({ event, store }: EventContext & StoreContext): Promise<void> {
  const [bucketId, voucher] = new Storage.VoucherChangedEvent(event).params
  const bucket = await getById(store, StorageBucket, bucketId.toString())

  bucket.dataObjectCountLimit = voucher.objectsLimit
  bucket.dataObjectsSizeLimit = voucher.sizeLimit
  bucket.dataObjectsCount = voucher.objectsUsed
  bucket.dataObjectsSize = voucher.sizeUsed

  await store.save<StorageBucket>(bucket)
}

export async function storage_StorageBucketVoucherLimitsSet({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bucketId, sizeLimit, countLimit] = new Storage.StorageBucketVoucherLimitsSetEvent(event).params
  const bucket = await getById(store, StorageBucket, bucketId.toString())
  bucket.dataObjectsSizeLimit = sizeLimit
  bucket.dataObjectCountLimit = countLimit

  await store.save<StorageBucket>(bucket)
}

export async function storage_StorageBucketDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [bucketId] = new Storage.StorageBucketDeletedEvent(event).params
  // TODO: Cascade remove on db level (would require changes in Hydra / comitting autogenerated files)
  const storageBucket = await store.get(StorageBucket, {
    where: { id: bucketId.toString() },
    relations: ['bags', 'bags.storageBuckets'],
  })
  if (!storageBucket) {
    inconsistentState(`Storage bucket by id ${bucketId.toString()} not found!`)
  }
  // Remove relations
  await Promise.all(
    (storageBucket.bags || []).map((bag) => {
      bag.storageBuckets = (bag.storageBuckets || []).filter((bucket) => bucket.id !== bucketId.toString())
      return store.save<StorageBag>(bag)
    })
  )
  await store.remove<StorageBucket>(storageBucket)
}

// DYNAMIC BAGS
export async function storage_DynamicBagCreated({ event, store }: EventContext & StoreContext): Promise<void> {
  const [bagId, , storageBucketIdsSet, distributionBucketIdsSet] = new Storage.DynamicBagCreatedEvent(event).params
  const storageBag = new StorageBag({
    id: getDynamicBagId(bagId),
    owner: getDynamicBagOwner(bagId),
    storageBuckets: Array.from(storageBucketIdsSet).map((id) => new StorageBucket({ id: id.toString() })),
    distributionBuckets: Array.from(distributionBucketIdsSet).map(
      (id) => new DistributionBucket({ id: distributionBucketId(id) })
    ),
  })
  await store.save<StorageBag>(storageBag)
}

export async function storage_DynamicBagDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [, bagId] = new Storage.DynamicBagDeletedEvent(event).params
  const storageBag = await getDynamicBag(store, bagId, ['objects'])
  await store.remove<StorageBag>(storageBag)
}

// DATA OBJECTS

// Note: "Uploaded" here actually means "created" (the real upload happens later)
export async function storage_DataObjectsUploaded({ event, store }: EventContext & StoreContext): Promise<void> {
  const [dataObjectIds, uploadParams, deletionPrize] = new Storage.DataObjectsUploadedEvent(event).params
  await createDataObjects(store, uploadParams, deletionPrize, dataObjectIds)
}

export async function storage_PendingDataObjectsAccepted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [, , bagId, dataObjectIds] = new Storage.PendingDataObjectsAcceptedEvent(event).params
  const dataObjects = await getDataObjectsInBag(store, bagId, dataObjectIds)
  await Promise.all(
    dataObjects.map(async (dataObject) => {
      dataObject.isAccepted = true
      await store.save<StorageDataObject>(dataObject)
    })
  )
}

export async function storage_DataObjectsMoved({ event, store }: EventContext & StoreContext): Promise<void> {
  const [srcBagId, destBagId, dataObjectIds] = new Storage.DataObjectsMovedEvent(event).params
  const dataObjects = await getDataObjectsInBag(store, srcBagId, dataObjectIds)
  const destBag = await getBag(store, destBagId)
  await Promise.all(
    dataObjects.map(async (dataObject) => {
      dataObject.storageBag = destBag
      await store.save<StorageDataObject>(dataObject)
    })
  )
}

export async function storage_DataObjectsDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [, bagId, dataObjectIds] = new Storage.DataObjectsDeletedEvent(event).params
  const dataObjects = await getDataObjectsInBag(store, bagId, dataObjectIds)
  await Promise.all(dataObjects.map((o) => removeDataObject(store, o)))
}

// DISTRIBUTION FAMILY

export async function storage_DistributionBucketFamilyCreated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [familyId] = new Storage.DistributionBucketFamilyCreatedEvent(event).params

  const family = new DistributionBucketFamily({
    id: familyId.toString(),
  })

  await store.save<DistributionBucketFamily>(family)
}

export async function storage_DistributionBucketFamilyMetadataSet({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [familyId, metadataBytes] = new Storage.DistributionBucketFamilyMetadataSetEvent(event).params

  const family = await getDistributionBucketFamilyWithMetadata(store, familyId.toString())
  family.metadata = await processDistributionBucketFamilyMetadata(store, family.metadata, metadataBytes)

  await store.save<DistributionBucketFamily>(family)
}

export async function storage_DistributionBucketFamilyDeleted({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [familyId] = new Storage.DistributionBucketFamilyDeletedEvent(event).params

  const family = await getById(store, DistributionBucketFamily, familyId.toString())

  await store.remove(family)
}

// DISTRIBUTION BUCKET

export async function storage_DistributionBucketCreated({ event, store }: EventContext & StoreContext): Promise<void> {
  const [familyId, acceptingNewBags, bucketId] = new Storage.DistributionBucketCreatedEvent(event).params

  const family = await getById(store, DistributionBucketFamily, familyId.toString())
  const bucket = new DistributionBucket({
    id: distributionBucketId(bucketId),
    bucketIndex: bucketId.distribution_bucket_index.toNumber(),
    acceptingNewBags: acceptingNewBags.valueOf(),
    distributing: true, // Runtime default
    family,
  })

  await store.save<DistributionBucket>(bucket)
}

export async function storage_DistributionBucketStatusUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bucketId, acceptingNewBags] = new Storage.DistributionBucketStatusUpdatedEvent(event).params

  const bucket = await getById(store, DistributionBucket, distributionBucketId(bucketId))
  bucket.acceptingNewBags = acceptingNewBags.valueOf()

  await store.save<DistributionBucket>(bucket)
}

export async function storage_DistributionBucketDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [bucketId] = new Storage.DistributionBucketDeletedEvent(event).params
  // TODO: Cascade remove on db level (would require changes in Hydra / comitting autogenerated files)
  const distributionBucket = await store.get(DistributionBucket, {
    where: { id: distributionBucketId(bucketId) },
    relations: ['bags', 'bags.distributionBuckets'],
  })
  if (!distributionBucket) {
    inconsistentState(`Distribution bucket by id ${distributionBucketId(bucketId)} not found!`)
  }
  // Remove relations
  await Promise.all(
    (distributionBucket.bags || []).map((bag) => {
      bag.distributionBuckets = (bag.distributionBuckets || []).filter(
        (bucket) => bucket.id !== distributionBucketId(bucketId)
      )
      return store.save<StorageBag>(bag)
    })
  )
  await store.remove<DistributionBucket>(distributionBucket)
}

export async function storage_DistributionBucketsUpdatedForBag({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [
    bagId,
    familyId,
    addedBucketsIndices,
    removedBucketsIndices,
  ] = new Storage.DistributionBucketsUpdatedForBagEvent(event).params
  // Get or create bag
  const storageBag = await getBag(store, bagId, ['distributionBuckets'])
  const removedBucketsIds = Array.from(removedBucketsIndices).map((bucketIndex) =>
    distributionBucketIdByFamilyAndIndex(familyId, bucketIndex)
  )
  const addedBucketsIds = Array.from(addedBucketsIndices).map((bucketIndex) =>
    distributionBucketIdByFamilyAndIndex(familyId, bucketIndex)
  )
  storageBag.distributionBuckets = (storageBag.distributionBuckets || [])
    .filter((bucket) => !removedBucketsIds.includes(bucket.id))
    .concat(addedBucketsIds.map((id) => new DistributionBucket({ id })))
  await store.save<StorageBag>(storageBag)
}

export async function storage_DistributionBucketModeUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bucketId, distributing] = new Storage.DistributionBucketModeUpdatedEvent(event).params

  const bucket = await getById(store, DistributionBucket, distributionBucketId(bucketId))
  bucket.distributing = distributing.valueOf()

  await store.save<DistributionBucket>(bucket)
}

export async function storage_DistributionBucketOperatorInvited({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bucketId, workerId] = new Storage.DistributionBucketOperatorInvitedEvent(event).params

  const bucket = await getById(store, DistributionBucket, distributionBucketId(bucketId))
  const invitedOperator = new DistributionBucketOperator({
    id: distributionOperatorId(bucketId, workerId),
    distributionBucket: bucket,
    status: DistributionBucketOperatorStatus.INVITED,
    workerId: workerId.toNumber(),
  })

  await store.save<DistributionBucketOperator>(invitedOperator)
}

export async function storage_DistributionBucketInvitationCancelled({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bucketId, workerId] = new Storage.DistributionBucketOperatorInvitedEvent(event).params

  const invitedOperator = await getById(store, DistributionBucketOperator, distributionOperatorId(bucketId, workerId))

  await store.remove<DistributionBucketOperator>(invitedOperator)
}

export async function storage_DistributionBucketInvitationAccepted({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [workerId, bucketId] = new Storage.DistributionBucketInvitationAcceptedEvent(event).params

  const invitedOperator = await getById(store, DistributionBucketOperator, distributionOperatorId(bucketId, workerId))
  invitedOperator.status = DistributionBucketOperatorStatus.ACTIVE

  await store.save<DistributionBucketOperator>(invitedOperator)
}

export async function storage_DistributionBucketMetadataSet({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [workerId, bucketId, metadataBytes] = new Storage.DistributionBucketMetadataSetEvent(event).params

  const operator = await getDistributionBucketOperatorWithMetadata(store, distributionOperatorId(bucketId, workerId))
  operator.metadata = await processDistributionOperatorMetadata(store, operator.metadata, metadataBytes)

  await store.save<DistributionBucketOperator>(operator)
}

export async function storage_DistributionBucketOperatorRemoved({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bucketId, workerId] = new Storage.DistributionBucketOperatorRemovedEvent(event).params

  // TODO: Cascade remove on db level (would require changes in Hydra / comitting autogenerated files)

  const operator = await getDistributionBucketOperatorWithMetadata(store, distributionOperatorId(bucketId, workerId))
  await store.remove<DistributionBucketOperator>(operator)
  if (operator.metadata) {
    await store.remove<DistributionBucketOperatorMetadata>(operator.metadata)
    if (operator.metadata.nodeLocation) {
      await store.remove<NodeLocationMetadata>(operator.metadata.nodeLocation)
      if (operator.metadata.nodeLocation.coordinates) {
        await store.remove<GeoCoordinates>(operator.metadata.nodeLocation.coordinates)
      }
    }
  }
}

// STORAGE SYSTEM GLOBAL PARAMS

export async function storage_UpdateBlacklist({ event, store }: EventContext & StoreContext): Promise<void> {
  const [removedContentIds, addedContentIds] = new Storage.UpdateBlacklistEvent(event).params
  const storageSystem = await getStorageSystem(store)
  storageSystem.blacklist = storageSystem.blacklist
    .filter((cid) => !Array.from(removedContentIds).some((id) => id.eq(cid)))
    .concat(Array.from(addedContentIds).map((id) => id.toString()))

  await store.save<StorageSystemParameters>(storageSystem)
}

export async function storage_DistributionBucketsPerBagLimitUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [newLimit] = new Storage.DistributionBucketsPerBagLimitUpdatedEvent(event).params
  const storageSystem = await getStorageSystem(store)

  storageSystem.distributionBucketsPerBagLimit = newLimit.toNumber()

  await store.save<StorageSystemParameters>(storageSystem)
}

export async function storage_StorageBucketsPerBagLimitUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [newLimit] = new Storage.StorageBucketsPerBagLimitUpdatedEvent(event).params
  const storageSystem = await getStorageSystem(store)

  storageSystem.storageBucketsPerBagLimit = newLimit.toNumber()

  await store.save<StorageSystemParameters>(storageSystem)
}

export async function storage_StorageBucketsVoucherMaxLimitsUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [sizeLimit, countLimit] = new Storage.StorageBucketsVoucherMaxLimitsUpdatedEvent(event).params
  const storageSystem = await getStorageSystem(store)

  storageSystem.storageBucketMaxObjectsSizeLimit = sizeLimit
  storageSystem.storageBucketMaxObjectsCountLimit = countLimit

  await store.save<StorageSystemParameters>(storageSystem)
}

export async function storage_UploadingBlockStatusUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [isBlocked] = new Storage.UploadingBlockStatusUpdatedEvent(event).params
  const storageSystem = await getStorageSystem(store)

  storageSystem.uploadingBlocked = isBlocked.isTrue

  await store.save<StorageSystemParameters>(storageSystem)
}

export async function storage_DataObjectPerMegabyteFeeUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [newFee] = new Storage.DataObjectPerMegabyteFeeUpdatedEvent(event).params
  const storageSystem = await getStorageSystem(store)

  storageSystem.dataObjectFeePerMb = newFee

  await store.save<StorageSystemParameters>(storageSystem)
}
