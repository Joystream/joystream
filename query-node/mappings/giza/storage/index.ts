/*
eslint-disable @typescript-eslint/naming-convention
*/
import { DatabaseManager, EventContext, StoreContext } from '@joystream/hydra-common'
import { Storage } from '../../generated/types/storage'
import {
  DistributionBucket,
  DistributionBucketFamily,
  DistributionBucketOperator,
  DistributionBucketOperatorMetadata,
  DistributionBucketOperatorStatus,
  NodeLocationMetadata,
  StorageBag,
  StorageBagOwner,
  StorageBagOwnerChannel,
  StorageBagOwnerCouncil,
  StorageBagOwnerMember,
  StorageBagOwnerWorkingGroup,
  StorageBucket,
  StorageBucketOperatorStatusActive,
  StorageBucketOperatorStatusInvited,
  StorageBucketOperatorStatusMissing,
  StorageDataObject,
  StorageSystemParameters,
  GeoCoordinates,
  StorageBagDistributionAssignment,
  StorageBagStorageAssignment,
} from 'query-node/dist/model'
import BN from 'bn.js'
import { getById, getWorkingGroupModuleName, bytesToString } from '../common'
import { BTreeSet } from '@polkadot/types'
import { DataObjectCreationParameters } from '@joystream/types/storage'
import { registry } from '@joystream/types'
import { In } from 'typeorm'
import _ from 'lodash'
import { DataObjectId, BagId, DynamicBagId, StaticBagId } from '@joystream/types/augment/all'
import {
  processDistributionBucketFamilyMetadata,
  processDistributionOperatorMetadata,
  processStorageOperatorMetadata,
} from './metadata'

async function getDataObjectsInBag(
  store: DatabaseManager,
  bagId: BagId,
  dataObjectIds: BTreeSet<DataObjectId>
): Promise<StorageDataObject[]> {
  const dataObjects = await store.getMany(StorageDataObject, {
    where: {
      id: In(Array.from(dataObjectIds).map((id) => id.toString())),
      storageBag: { id: getBagId(bagId) },
    },
  })
  if (dataObjects.length !== Array.from(dataObjectIds).length) {
    throw new Error(
      `Missing data objects: ${_.difference(
        Array.from(dataObjectIds).map((id) => id.toString()),
        dataObjects.map((o) => o.id)
      )} in bag ${getBagId(bagId)}`
    )
  }
  return dataObjects
}

function getStaticBagOwner(bagId: StaticBagId): typeof StorageBagOwner {
  if (bagId.isCouncil) {
    return new StorageBagOwnerCouncil()
  } else if (bagId.isWorkingGroup) {
    const owner = new StorageBagOwnerWorkingGroup()
    owner.workingGroupId = getWorkingGroupModuleName(bagId.asWorkingGroup)
    return owner
  } else {
    throw new Error(`Unexpected static bag type: ${bagId.type}`)
  }
}

function getDynamicBagOwner(bagId: DynamicBagId) {
  if (bagId.isChannel) {
    const owner = new StorageBagOwnerChannel()
    owner.channelId = bagId.asChannel.toNumber()
    return owner
  } else if (bagId.isMember) {
    const owner = new StorageBagOwnerMember()
    owner.memberId = bagId.asMember.toNumber()
    return owner
  } else {
    throw new Error(`Unexpected dynamic bag type: ${bagId.type}`)
  }
}

function getStaticBagId(bagId: StaticBagId): string {
  if (bagId.isCouncil) {
    return `CO`
  } else if (bagId.isWorkingGroup) {
    return `WG-${bagId.asWorkingGroup.type}`
  } else {
    throw new Error(`Unexpected static bag type: ${bagId.type}`)
  }
}

function getDynamicBagId(bagId: DynamicBagId): string {
  if (bagId.isChannel) {
    return `CH-${bagId.asChannel.toString()}`
  } else if (bagId.isMember) {
    return `M-${bagId.asMember.toString()}`
  } else {
    throw new Error(`Unexpected dynamic bag type: ${bagId.type}`)
  }
}

function getBagId(bagId: BagId) {
  return bagId.isStatic ? getStaticBagId(bagId.asStatic) : getDynamicBagId(bagId.asDynamic)
}

async function getDynamicBag(
  store: DatabaseManager,
  bagId: DynamicBagId,
  relations?: 'objects'[]
): Promise<StorageBag> {
  return getById(store, StorageBag, getDynamicBagId(bagId), relations)
}

async function getStaticBag(store: DatabaseManager, bagId: StaticBagId, relations?: 'objects'[]): Promise<StorageBag> {
  const id = getStaticBagId(bagId)
  const bag = await store.get(StorageBag, { where: { id }, relations })
  if (!bag) {
    console.log(`Creating new static bag: ${id}`)
    const newBag = new StorageBag({
      id,
      owner: getStaticBagOwner(bagId),
    })
    await store.save<StorageBag>(newBag)
    return newBag
  }
  return bag
}

async function getBag(store: DatabaseManager, bagId: BagId, relations?: 'objects'[]): Promise<StorageBag> {
  return bagId.isStatic
    ? getStaticBag(store, bagId.asStatic, relations)
    : getDynamicBag(store, bagId.asDynamic, relations)
}

async function getDistributionBucketOperatorWithMetadata(
  store: DatabaseManager,
  id: string
): Promise<DistributionBucketOperator> {
  const operator = await store.get(DistributionBucketOperator, {
    where: { id },
    relations: ['metadata', 'metadata.nodeLocation', 'metadata.nodeLocation.coordinates'],
  })
  if (!operator) {
    throw new Error(`DistributionBucketOperator not found by id: ${id}`)
  }
  return operator
}

async function getStorageBucketWithOperatorMetadata(store: DatabaseManager, id: string): Promise<StorageBucket> {
  const bucket = await store.get(StorageBucket, {
    where: { id },
    relations: ['operatorMetadata', 'operatorMetadata.nodeLocation', 'operatorMetadata.nodeLocation.coordinates'],
  })
  if (!bucket) {
    throw new Error(`StorageBucket not found by id: ${id}`)
  }
  return bucket
}

async function getDistributionBucketFamilyWithMetadata(
  store: DatabaseManager,
  id: string
): Promise<DistributionBucketFamily> {
  const family = await store.get(DistributionBucketFamily, {
    where: { id },
    relations: ['metadata', 'metadata.boundary'],
  })
  if (!family) {
    throw new Error(`DistributionBucketFamily not found by id: ${id}`)
  }
  return family
}

// BUCKETS

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
  const [bucketId, workerId] = new Storage.StorageBucketInvitationAcceptedEvent(event).params
  const storageBucket = await getById(store, StorageBucket, bucketId.toString())
  const operatorStatus = new StorageBucketOperatorStatusActive()
  operatorStatus.workerId = workerId.toNumber()
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
  const [bagId, addedBucketsIds, removedBucketsIds] = new Storage.StorageBucketsUpdatedForBagEvent(event).params
  // Get or create bag
  const storageBag = await getBag(store, bagId)
  const assignmentsToRemove = await store.getMany(StorageBagStorageAssignment, {
    where: {
      storageBag,
      storageBucket: { id: In(Array.from(removedBucketsIds).map((bucketId) => bucketId.toString())) },
    },
  })
  const assignmentsToAdd = Array.from(addedBucketsIds).map(
    (bucketId) =>
      new StorageBagStorageAssignment({
        id: `${storageBag.id}-${bucketId.toString()}`,
        storageBag,
        storageBucket: new StorageBucket({ id: bucketId.toString() }),
      })
  )
  await Promise.all(assignmentsToRemove.map((a) => store.remove<StorageBagStorageAssignment>(a)))
  await Promise.all(assignmentsToAdd.map((a) => store.save<StorageBagStorageAssignment>(a)))
}

export async function storage_StorageBucketDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [bucketId] = new Storage.StorageBucketDeletedEvent(event).params
  // TODO: Delete or just change status?
  // TODO: Cascade remove on db level?
  const assignments = await store.getMany(StorageBagStorageAssignment, {
    where: { storageBucket: { id: bucketId.toString() } },
  })
  await Promise.all(assignments.map((a) => store.remove<StorageBagStorageAssignment>(a)))
  await store.remove<StorageBucket>(new StorageBucket({ id: bucketId.toString() }))
}

// DYNAMIC BAGS
export async function storage_DynamicBagCreated({ event, store }: EventContext & StoreContext): Promise<void> {
  const [bagId] = new Storage.DynamicBagCreatedEvent(event).params
  const storageBag = new StorageBag({
    id: getDynamicBagId(bagId),
    owner: getDynamicBagOwner(bagId),
  })
  await store.save<StorageBag>(storageBag)
}

export async function storage_DynamicBagDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [, bagId] = new Storage.DynamicBagDeletedEvent(event).params
  // TODO: Delete or just change status?
  // TODO: Cascade remove on db level?
  const storageBag = await getDynamicBag(store, bagId, ['objects'])
  await Promise.all((storageBag.objects || []).map((o) => store.remove<StorageDataObject>(o)))
  await store.remove<StorageBag>(storageBag)
}

// DATA OBJECTS

// Note: "Uploaded" here actually means "created" (the real upload happens later)
export async function storage_DataObjectsUploaded({ event, store }: EventContext & StoreContext): Promise<void> {
  const [dataObjectIds, uploadParams] = new Storage.DataObjectsUploadedEvent(event).params
  const { bagId, objectCreationList } = uploadParams
  const storageBag = await getBag(store, bagId)
  const dataObjects = dataObjectIds.map((objectId, i) => {
    const objectParams = new DataObjectCreationParameters(registry, objectCreationList[i].toJSON() as any)
    return new StorageDataObject({
      id: objectId.toString(),
      isAccepted: false,
      ipfsHash: bytesToString(objectParams.ipfsContentId),
      size: new BN(objectParams.getField('size').toString()),
      storageBag,
    })
  })
  await Promise.all(dataObjects.map((o) => store.save<StorageDataObject>(o)))
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
  // TODO: Delete them or just change status?
  // (may not be so optimal if we expect a large amount of data objects)
  await Promise.all(dataObjects.map((o) => store.remove<StorageDataObject>(o)))
}

// BLACKLIST
export async function storage_UpdateBlacklist({ event, store }: EventContext & StoreContext): Promise<void> {
  const [removedContentIds, addedContentIds] = new Storage.UpdateBlacklistEvent(event).params
  const storageSystem = await store.get(StorageSystemParameters, {})
  if (!storageSystem) {
    throw new Error('StorageSystemParameters entity not found!')
  }
  storageSystem.blacklist = storageSystem.blacklist
    .filter((cid) => !Array.from(removedContentIds).some((id) => id.eq(cid)))
    .concat(Array.from(addedContentIds).map((id) => id.toString()))

  await store.save<StorageSystemParameters>(storageSystem)
}

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

export async function storage_DistributionBucketFamilyDeleted({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [familyId] = new Storage.DistributionBucketFamilyDeletedEvent(event).params

  const family = await getById(store, DistributionBucketFamily, familyId.toString())

  await store.remove(family)
}

export async function storage_DistributionBucketCreated({ event, store }: EventContext & StoreContext): Promise<void> {
  const [familyId, acceptingNewBags, bucketId] = new Storage.DistributionBucketCreatedEvent(event).params

  const family = await getById(store, DistributionBucketFamily, familyId.toString())
  const bucket = new DistributionBucket({
    id: bucketId.toString(),
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
  const [, bucketId, acceptingNewBags] = new Storage.DistributionBucketStatusUpdatedEvent(event).params

  const bucket = await getById(store, DistributionBucket, bucketId.toString())
  bucket.acceptingNewBags = acceptingNewBags.valueOf()

  await store.save<DistributionBucket>(bucket)
}

export async function storage_DistributionBucketDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [, bucketId] = new Storage.DistributionBucketDeletedEvent(event).params
  // TODO: Delete or just change status?
  // TODO: Cascade remove on db level?
  const assignments = await store.getMany(StorageBagDistributionAssignment, {
    where: { distributionBucket: { id: bucketId.toString() } },
  })
  await Promise.all(assignments.map((a) => store.remove<StorageBagDistributionAssignment>(a)))
  await store.remove<DistributionBucket>(new DistributionBucket({ id: bucketId.toString() }))
}

export async function storage_DistributionBucketsUpdatedForBag({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bagId, , addedBucketsIds, removedBucketsIds] = new Storage.DistributionBucketsUpdatedForBagEvent(event).params
  // Get or create bag
  const storageBag = await getBag(store, bagId)
  const assignmentsToRemove = await store.getMany(StorageBagDistributionAssignment, {
    where: {
      storageBag,
      distributionBucket: { id: In(Array.from(removedBucketsIds).map((bucketId) => bucketId.toString())) },
    },
  })
  const assignmentsToAdd = Array.from(addedBucketsIds).map(
    (bucketId) =>
      new StorageBagDistributionAssignment({
        id: `${storageBag.id}-${bucketId.toString()}`,
        storageBag,
        distributionBucket: new DistributionBucket({ id: bucketId.toString() }),
      })
  )
  await Promise.all(assignmentsToRemove.map((a) => store.remove<StorageBagDistributionAssignment>(a)))
  await Promise.all(assignmentsToAdd.map((a) => store.save<StorageBagDistributionAssignment>(a)))
}

export async function storage_DistributionBucketModeUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [, bucketId, distributing] = new Storage.DistributionBucketModeUpdatedEvent(event).params

  const bucket = await getById(store, DistributionBucket, bucketId.toString())
  bucket.distributing = distributing.valueOf()

  await store.save<DistributionBucket>(bucket)
}

export async function storage_DistributionBucketOperatorInvited({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [, bucketId, workerId] = new Storage.DistributionBucketOperatorInvitedEvent(event).params

  const bucket = await getById(store, DistributionBucket, bucketId.toString())
  const invitedOperator = new DistributionBucketOperator({
    id: `${bucketId}-${workerId}`,
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
  const [, bucketId, workerId] = new Storage.DistributionBucketOperatorInvitedEvent(event).params

  const invitedOperator = await getById(store, DistributionBucketOperator, `${bucketId}-${workerId}`)

  await store.remove<DistributionBucketOperator>(invitedOperator)
}

export async function storage_DistributionBucketInvitationAccepted({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [workerId, , bucketId] = new Storage.DistributionBucketInvitationAcceptedEvent(event).params

  const invitedOperator = await getById(store, DistributionBucketOperator, `${bucketId}-${workerId}`)
  invitedOperator.status = DistributionBucketOperatorStatus.ACTIVE

  await store.save<DistributionBucketOperator>(invitedOperator)
}

export async function storage_DistributionBucketMetadataSet({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [workerId, , bucketId, metadataBytes] = new Storage.DistributionBucketMetadataSetEvent(event).params

  const operator = await getDistributionBucketOperatorWithMetadata(store, `${bucketId}-${workerId}`)
  operator.metadata = await processDistributionOperatorMetadata(store, operator.metadata, metadataBytes)

  await store.save<DistributionBucketOperator>(operator)
}

export async function storage_DistributionBucketOperatorRemoved({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [, bucketId, workerId] = new Storage.DistributionBucketOperatorRemovedEvent(event).params

  // TODO: Cascade remove

  const operator = await getDistributionBucketOperatorWithMetadata(store, `${bucketId}-${workerId}`)
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

export async function storage_DistributionBucketFamilyMetadataSet({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [familyId, metadataBytes] = new Storage.DistributionBucketFamilyMetadataSetEvent(event).params

  const family = await getDistributionBucketFamilyWithMetadata(store, familyId.toString())
  family.metadata = await processDistributionBucketFamilyMetadata(store, family.metadata, metadataBytes)

  await store.save<DistributionBucketFamily>(family)
}

export async function storage_DistributionBucketsPerBagLimitUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_FamiliesInDynamicBagCreationPolicyUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_StorageBucketVoucherLimitsSet({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_UploadingBlockStatusUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_DataObjectPerMegabyteFeeUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_StorageBucketsPerBagLimitUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_StorageBucketsVoucherMaxLimitsUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_VoucherChanged({ event, store }: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_NumberOfStorageBucketsInDynamicBagCreationPolicyUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}
