/*
eslint-disable @typescript-eslint/naming-convention
*/
import { DatabaseManager, EventContext, StoreContext } from '@joystream/hydra-common'
import BN from 'bn.js'
import {
  DistributionBucket,
  DistributionBucketFamily,
  DistributionBucketOperator,
  DistributionBucketOperatorMetadata,
  DistributionBucketOperatorStatus,
  GeoCoordinates,
  NodeLocationMetadata,
  StorageBag,
  StorageBucket,
  StorageBucketOperatorStatusActive,
  StorageBucketOperatorStatusInvited,
  StorageBucketOperatorStatusMissing,
  StorageDataObject,
} from 'query-node/dist/model'
import {
  Storage_DataObjectsDeletedEvent_V1001 as DataObjectsDeletedEvent_V1001,
  Storage_DataObjectsMovedEvent_V1001 as DataObjectsMovedEvent_V1001,
  Storage_DataObjectsUpdatedEvent_V1001 as DataObjectsUpdatedEvent_V1001,
  Storage_DataObjectsUploadedEvent_V1001 as DataObjectsUploadedEvent_V1001,
  Storage_DistributionBucketCreatedEvent_V1001 as DistributionBucketCreatedEvent_V1001,
  Storage_DistributionBucketDeletedEvent_V1001 as DistributionBucketDeletedEvent_V1001,
  Storage_DistributionBucketFamilyCreatedEvent_V1001 as DistributionBucketFamilyCreatedEvent_V1001,
  Storage_DistributionBucketFamilyDeletedEvent_V1001 as DistributionBucketFamilyDeletedEvent_V1001,
  Storage_DistributionBucketFamilyMetadataSetEvent_V1001 as DistributionBucketFamilyMetadataSetEvent_V1001,
  Storage_DistributionBucketInvitationAcceptedEvent_V1001 as DistributionBucketInvitationAcceptedEvent_V1001,
  Storage_DistributionBucketInvitationCancelledEvent_V1001 as DistributionBucketInvitationCancelledEvent_V1001,
  Storage_DistributionBucketMetadataSetEvent_V1001 as DistributionBucketMetadataSetEvent_V1001,
  Storage_DistributionBucketModeUpdatedEvent_V1001 as DistributionBucketModeUpdatedEvent_V1001,
  Storage_DistributionBucketOperatorInvitedEvent_V1001 as DistributionBucketOperatorInvitedEvent_V1001,
  Storage_DistributionBucketOperatorRemovedEvent_V1001 as DistributionBucketOperatorRemovedEvent_V1001,
  Storage_DistributionBucketStatusUpdatedEvent_V1001 as DistributionBucketStatusUpdatedEvent_V1001,
  Storage_DistributionBucketsUpdatedForBagEvent_V1001 as DistributionBucketsUpdatedForBagEvent_V1001,
  Storage_DynamicBagCreatedEvent_V1001 as DynamicBagCreatedEvent_V1001,
  Storage_DynamicBagDeletedEvent_V1001 as DynamicBagDeletedEvent_V1001,
  Storage_PendingDataObjectsAcceptedEvent_V1001 as PendingDataObjectsAcceptedEvent_V1001,
  Storage_StorageBucketCreatedEvent_V1001 as StorageBucketCreatedEvent_V1001,
  Storage_StorageBucketDeletedEvent_V1001 as StorageBucketDeletedEvent_V1001,
  Storage_StorageBucketInvitationAcceptedEvent_V1001 as StorageBucketInvitationAcceptedEvent_V1001,
  Storage_StorageBucketInvitationCancelledEvent_V1001 as StorageBucketInvitationCancelledEvent_V1001,
  Storage_StorageBucketOperatorInvitedEvent_V1001 as StorageBucketOperatorInvitedEvent_V1001,
  Storage_StorageBucketStatusUpdatedEvent_V1001 as StorageBucketStatusUpdatedEvent_V1001,
  Storage_StorageBucketVoucherLimitsSetEvent_V1001 as StorageBucketVoucherLimitsSetEvent_V1001,
  Storage_StorageBucketsUpdatedForBagEvent_V1001 as StorageBucketsUpdatedForBagEvent_V1001,
  Storage_StorageOperatorMetadataSetEvent_V1001 as StorageOperatorMetadataSetEvent_V1001,
  Storage_VoucherChangedEvent_V1001 as VoucherChangedEvent_V1001,
} from '../../generated/types'
import { RelationsArr, getById, getByIdOrFail } from '../common'
import { unsetAssetRelations, videoRelationsForCounters } from '../content/utils'
import { getAllManagers } from '../derivedPropertiesManager/applications'
import {
  processDistributionBucketFamilyMetadata,
  processDistributionOperatorMetadata,
  processStorageOperatorMetadata,
} from './metadata'
import {
  createDataObjects,
  deleteDataObjects,
  distributionBucketId,
  distributionBucketIdByFamilyAndIndex,
  distributionOperatorId,
  getBag,
  getDataObjectsInBag,
  getDistributionBucketOperatorWithMetadata,
  getDynamicBag,
  getDynamicBagId,
  getDynamicBagOwner,
} from './utils'

// STORAGE BUCKETS

export async function storage_StorageBucketCreated({ event, store }: EventContext & StoreContext): Promise<void> {
  const [bucketId, invitedWorkerId, acceptingNewBags, dataObjectSizeLimit, dataObjectCountLimit] =
    new StorageBucketCreatedEvent_V1001(event).params

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
  const [bucketId, , metadataBytes] = new StorageOperatorMetadataSetEvent_V1001(event).params
  const storageBucket = await getByIdOrFail(store, StorageBucket, bucketId.toString(), [
    'operatorMetadata',
    'operatorMetadata.nodeLocation',
    'operatorMetadata.nodeLocation.coordinates',
  ] as RelationsArr<StorageBucket>)
  storageBucket.operatorMetadata = await processStorageOperatorMetadata(
    event,
    store,
    storageBucket.operatorMetadata,
    metadataBytes
  )
  await store.save<StorageBucket>(storageBucket)
}

export async function storage_StorageBucketStatusUpdated({ event, store }: EventContext & StoreContext): Promise<void> {
  const [bucketId, acceptingNewBags] = new StorageBucketStatusUpdatedEvent_V1001(event).params

  const storageBucket = await getByIdOrFail(store, StorageBucket, bucketId.toString())
  storageBucket.acceptingNewBags = acceptingNewBags.isTrue
  await store.save<StorageBucket>(storageBucket)
}

export async function storage_StorageBucketInvitationAccepted({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bucketId, workerId, transactorAccountId] = new StorageBucketInvitationAcceptedEvent_V1001(event).params
  const storageBucket = await getByIdOrFail(store, StorageBucket, bucketId.toString())
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
  const [bucketId] = new StorageBucketInvitationCancelledEvent_V1001(event).params
  const storageBucket = await getByIdOrFail(store, StorageBucket, bucketId.toString())
  const operatorStatus = new StorageBucketOperatorStatusMissing()
  storageBucket.operatorStatus = operatorStatus
  await store.save<StorageBucket>(storageBucket)
}

export async function storage_StorageBucketOperatorInvited({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bucketId, workerId] = new StorageBucketOperatorInvitedEvent_V1001(event).params
  const storageBucket = await getByIdOrFail(store, StorageBucket, bucketId.toString())
  const operatorStatus = new StorageBucketOperatorStatusInvited()
  operatorStatus.workerId = workerId.toNumber()
  storageBucket.operatorStatus = operatorStatus
  await store.save<StorageBucket>(storageBucket)
}

export async function storage_StorageBucketOperatorRemoved({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bucketId] = new StorageBucketInvitationCancelledEvent_V1001(event).params
  const storageBucket = await getByIdOrFail(store, StorageBucket, bucketId.toString())
  const operatorStatus = new StorageBucketOperatorStatusMissing()
  storageBucket.operatorStatus = operatorStatus
  await store.save<StorageBucket>(storageBucket)
}

export async function storage_StorageBucketsUpdatedForBag({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bagId, addedBucketsSet, removedBucketsSet] = new StorageBucketsUpdatedForBagEvent_V1001(event).params
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
  const [bucketId, voucher] = new VoucherChangedEvent_V1001(event).params
  const bucket = await getByIdOrFail(store, StorageBucket, bucketId.toString())

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
  const [bucketId, sizeLimit, countLimit] = new StorageBucketVoucherLimitsSetEvent_V1001(event).params
  const bucket = await getByIdOrFail(store, StorageBucket, bucketId.toString())
  bucket.dataObjectsSizeLimit = sizeLimit
  bucket.dataObjectCountLimit = countLimit

  await store.save<StorageBucket>(bucket)
}

export async function storage_StorageBucketDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [bucketId] = new StorageBucketDeletedEvent_V1001(event).params
  const storageBucket = await getByIdOrFail(store, StorageBucket, bucketId.toString(), [
    'bags',
    'bags.storageBuckets',
  ] as RelationsArr<StorageBucket>)

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
  const [
    { bagId, storageBuckets, distributionBuckets, objectCreationList, expectedDataObjectStateBloatBond },
    objectIds,
  ] = new DynamicBagCreatedEvent_V1001(event).params
  const storageBag = new StorageBag({
    id: getDynamicBagId(bagId),
    owner: getDynamicBagOwner(bagId),
    objectsSize: new BN(0),
    storageBuckets: Array.from(storageBuckets).map((id) => new StorageBucket({ id: id.toString() })),
    distributionBuckets: Array.from(distributionBuckets).map(
      (id) => new DistributionBucket({ id: distributionBucketId(id) })
    ),
  })
  await store.save<StorageBag>(storageBag)
  if (objectCreationList.length) {
    await createDataObjects(store, {
      storageBagOrId: storageBag,
      objectCreationList,
      stateBloatBond: expectedDataObjectStateBloatBond,
      objectIds: Array.from(objectIds),
    })
  }
}

export async function storage_DynamicBagDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [bagId] = new DynamicBagDeletedEvent_V1001(event).params

  // first remove all the data objects in storage bucket
  const bagDataObjects = await store.getMany(StorageDataObject, {
    where: { storageBag: { id: getDynamicBagId(bagId) } },
  })

  for (const dataObject of bagDataObjects) {
    await unsetAssetRelations(store, dataObject)
  }

  const storageBag = await getDynamicBag(store, bagId, ['objects'])
  await store.remove<StorageBag>(storageBag)
}

// DATA OBJECTS

// Note: "Uploaded" here actually means "created" (the real upload happens later)
export async function storage_DataObjectsUploaded({ event, store }: EventContext & StoreContext): Promise<void> {
  const [objectIds, { bagId, objectCreationList }, stateBloatBond] = new DataObjectsUploadedEvent_V1001(event).params
  await createDataObjects(store, {
    storageBagOrId: bagId,
    objectCreationList,
    stateBloatBond,
    objectIds: [...objectIds.values()],
  })
}

export async function storage_DataObjectsUpdated({ event, store }: EventContext & StoreContext): Promise<void> {
  const [
    { bagId, objectCreationList, expectedDataObjectStateBloatBond: stateBloatBond },
    uploadedObjectIds,
    objectsToRemove,
  ] = new DataObjectsUpdatedEvent_V1001(event).params

  // create new objects
  await createDataObjects(store, {
    storageBagOrId: bagId,
    objectCreationList,
    stateBloatBond,
    objectIds: [...uploadedObjectIds.values()],
  })

  // remove objects
  await deleteDataObjects(store, bagId, objectsToRemove)
}

export async function storage_PendingDataObjectsAccepted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [, , bagId, dataObjectIds] = new PendingDataObjectsAcceptedEvent_V1001(event).params
  const dataObjects = await getDataObjectsInBag(store, bagId, dataObjectIds, [
    'videoThumbnail',
    ...videoRelationsForCounters.map((item) => `videoThumbnail.${item}`),
    'videoMedia',
    ...videoRelationsForCounters.map((item) => `videoMedia.${item}`),
  ])

  /*
    This function helps to workaround `store.get*` functions not return objects
    shared by mutliple entities (at least now). Because of that when updating for example
    `dataObject.videoThumnail.channel.activeVideoCounter` on dataObject A, this change is not
    reflected on `dataObject.videoMedia.channel.activeVideoCounter` on dataObject B.
  */
  function applyUpdate<Entity extends { id: { toString(): string } }>(
    entities: Entity[],
    updateEntity: (entity: Entity) => void,
    relations: string[][]
  ): void {
    const ids = entities.map((entity) => entity.id.toString())

    for (const entity of entities) {
      updateEntity(entity)

      for (const relation of relations) {
        const target = relation.reduce((acc, relationPart) => {
          if (!acc) {
            return acc
          }

          return acc[relationPart]
        }, entity)

        if (!target || target === entity || !ids.includes(target.id.toString())) {
          continue
        }

        updateEntity(target)
      }
    }
  }

  // ensure update is reflected in all objects
  applyUpdate(dataObjects, (dataObject) => (dataObject.isAccepted = true), [
    ['videoThumbnail', 'thumbnailPhoto'],
    ['videoThumbnail', 'media'],
    ['videoMedia', 'thumbnailPhoto'],
    ['videoMedia', 'media'],
  ])

  // accept storage data objects
  await Promise.all(
    dataObjects.map(async (dataObject) => {
      dataObject.isAccepted = true

      // update video active counters
      await getAllManagers(store).storageDataObjects.onMainEntityUpdate(dataObject)

      await store.save<StorageDataObject>(dataObject)
    })
  )
}

export async function storage_DataObjectsMoved({ event, store }: EventContext & StoreContext): Promise<void> {
  const [srcBagId, destBagId, dataObjectIds] = new DataObjectsMovedEvent_V1001(event).params
  const dataObjects = await getDataObjectsInBag(store, srcBagId, dataObjectIds)
  const srcBag = await getBag(store, srcBagId)
  const destBag = await getBag(store, destBagId)
  await Promise.all(
    dataObjects.map(async (dataObject) => {
      dataObject.storageBag = destBag
      await store.save<StorageDataObject>(dataObject)
    })
  )

  // Update source & destination bags size
  const movedDataObjectsSize = dataObjects.reduce((acc, dataObject) => acc.add(dataObject.size), new BN(0))
  srcBag.objectsSize = srcBag.objectsSize.sub(movedDataObjectsSize)
  destBag.objectsSize = destBag.objectsSize.add(movedDataObjectsSize)
  await store.save<StorageBag>(srcBag)
  await store.save<StorageBag>(destBag)
}

export async function storage_DataObjectsDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [, bagId, dataObjectIds] = new DataObjectsDeletedEvent_V1001(event).params

  await deleteDataObjects(store, bagId, dataObjectIds)
}

// DISTRIBUTION FAMILY

export async function storage_DistributionBucketFamilyCreated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [familyId] = new DistributionBucketFamilyCreatedEvent_V1001(event).params

  const family = new DistributionBucketFamily({
    id: familyId.toString(),
  })

  await store.save<DistributionBucketFamily>(family)
}

export async function storage_DistributionBucketFamilyMetadataSet({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [familyId, metadataBytes] = new DistributionBucketFamilyMetadataSetEvent_V1001(event).params

  const family = await getByIdOrFail(store, DistributionBucketFamily, familyId.toString(), [
    'metadata',
    'metadata.areas',
  ] as RelationsArr<DistributionBucketFamily>)
  family.metadata = await processDistributionBucketFamilyMetadata(event, store, family.metadata, metadataBytes)

  await store.save<DistributionBucketFamily>(family)
}

export async function storage_DistributionBucketFamilyDeleted({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [familyId] = new DistributionBucketFamilyDeletedEvent_V1001(event).params

  const family = await getById(store, DistributionBucketFamily, familyId.toString())

  await store.remove(family)
}

// DISTRIBUTION BUCKET

export async function storage_DistributionBucketCreated({ event, store }: EventContext & StoreContext): Promise<void> {
  const [familyId, acceptingNewBags, bucketId] = new DistributionBucketCreatedEvent_V1001(event).params

  const family = await getById(store, DistributionBucketFamily, familyId.toString())
  const bucket = new DistributionBucket({
    id: distributionBucketId(bucketId),
    bucketIndex: bucketId.distributionBucketIndex.toNumber(),
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
  const [bucketId, acceptingNewBags] = new DistributionBucketStatusUpdatedEvent_V1001(event).params

  const bucket = await getByIdOrFail(store, DistributionBucket, distributionBucketId(bucketId))
  bucket.acceptingNewBags = acceptingNewBags.valueOf()

  await store.save<DistributionBucket>(bucket)
}

export async function storage_DistributionBucketDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  const [bucketId] = new DistributionBucketDeletedEvent_V1001(event).params
  // TODO: Cascade remove on db level (would require changes in Hydra / comitting autogenerated files)
  const distributionBucket = await getByIdOrFail(store, DistributionBucket, distributionBucketId(bucketId), [
    'bags',
    'bags.distributionBuckets',
  ] as RelationsArr<DistributionBucket>)

  // Remove relations
  await Promise.all(
    (distributionBucket.bags || []).map((bag) => {
      bag.distributionBuckets = (bag.distributionBuckets || []).filter(
        (bucket) => bucket.id !== distributionBucketId(bucketId)
      )
      return store.save<StorageBag>(bag)
    })
  )

  // Remove invited bucket operators
  const invitedOperators = await store.getMany(DistributionBucketOperator, {
    where: {
      status: DistributionBucketOperatorStatus.INVITED,
      distributionBucket: { id: distributionBucket.id },
    },
  })
  await Promise.all(invitedOperators.map((operator) => removeDistributionBucketOperator(store, operator)))
  await store.remove<DistributionBucket>(distributionBucket)
}

export async function storage_DistributionBucketsUpdatedForBag({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bagId, familyId, addedBucketsIndices, removedBucketsIndices] = new DistributionBucketsUpdatedForBagEvent_V1001(
    event
  ).params
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
  const [bucketId, distributing] = new DistributionBucketModeUpdatedEvent_V1001(event).params

  const bucket = await getByIdOrFail(store, DistributionBucket, distributionBucketId(bucketId))
  bucket.distributing = distributing.valueOf()

  await store.save<DistributionBucket>(bucket)
}

export async function storage_DistributionBucketOperatorInvited({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bucketId, workerId] = new DistributionBucketOperatorInvitedEvent_V1001(event).params

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
  const [bucketId, workerId] = new DistributionBucketInvitationCancelledEvent_V1001(event).params

  const invitedOperator = await getByIdOrFail(
    store,
    DistributionBucketOperator,
    distributionOperatorId(bucketId, workerId)
  )

  await store.remove<DistributionBucketOperator>(invitedOperator)
}

export async function storage_DistributionBucketInvitationAccepted({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [workerId, bucketId] = new DistributionBucketInvitationAcceptedEvent_V1001(event).params

  const invitedOperator = await getByIdOrFail(
    store,
    DistributionBucketOperator,
    distributionOperatorId(bucketId, workerId)
  )
  invitedOperator.status = DistributionBucketOperatorStatus.ACTIVE

  await store.save<DistributionBucketOperator>(invitedOperator)
}

export async function storage_DistributionBucketMetadataSet({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [workerId, bucketId, metadataBytes] = new DistributionBucketMetadataSetEvent_V1001(event).params

  const operator = await getDistributionBucketOperatorWithMetadata(store, distributionOperatorId(bucketId, workerId))
  operator.metadata = await processDistributionOperatorMetadata(event, store, operator.metadata, metadataBytes)

  await store.save<DistributionBucketOperator>(operator)
}

export async function storage_DistributionBucketOperatorRemoved({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  const [bucketId, workerId] = new DistributionBucketOperatorRemovedEvent_V1001(event).params

  // TODO: Cascade remove on db level (would require changes in Hydra / comitting autogenerated files)
  const operator = await getDistributionBucketOperatorWithMetadata(store, distributionOperatorId(bucketId, workerId))
  await removeDistributionBucketOperator(store, operator)
}

async function removeDistributionBucketOperator(store: DatabaseManager, operator: DistributionBucketOperator) {
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
