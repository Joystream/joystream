import { DatabaseManager } from '@joystream/hydra-common'
import {
  PalletStorageBagIdType as BagId,
  PalletStorageDynamicBagIdType as DynamicBagId,
  PalletStorageStaticBagId as StaticBagId,
  PalletStorageDistributionBucketIdRecord as DistributionBucketId,
  PalletStorageDataObjectCreationParameters as DataObjectCreationParameters,
} from '@polkadot/types/lookup'
import {
  DataObjectTypeUnknown,
  StorageBag,
  StorageDataObject,
  StorageBagOwner,
  StorageBagOwnerChannel,
  StorageBagOwnerCouncil,
  StorageBagOwnerMember,
  StorageBagOwnerWorkingGroup,
  StorageBucket,
  DistributionBucketOperator,
  DistributionBucketFamily,
} from 'query-node/dist/model'
import BN from 'bn.js'
import { bytesToString, inconsistentState, getById, RelationsArr } from '../common'
import { In } from 'typeorm'

import { BTreeSet } from '@polkadot/types'
import _ from 'lodash'
import {
  WorkerId,
  DataObjectId,
  DistributionBucketFamilyId,
  DistributionBucketIndex,
} from '@joystream/types/primitives'
import { Balance } from '@polkadot/types/interfaces'
import { getAllManagers } from '../derivedPropertiesManager/applications'
import { videoRelationsForCounters, unsetAssetRelations } from '../content/utils'

export type StorageDataObjectParams = {
  storageBagOrId: StorageBag | BagId
  objectCreationList: DataObjectCreationParameters[]
  stateBloatBond: Balance
  objectIds: BN[]
}

export async function getDataObjectsInBag(
  store: DatabaseManager,
  bagId: BagId,
  dataObjectIds: BTreeSet<DataObjectId>,
  relations: string[] = []
): Promise<StorageDataObject[]> {
  const dataObjects = await store.getMany(StorageDataObject, {
    where: {
      id: In(Array.from(dataObjectIds).map((id) => id.toString())),
      storageBag: { id: getBagId(bagId) },
    },
    relations,
  })
  if (dataObjects.length !== Array.from(dataObjectIds).length) {
    inconsistentState(
      `Missing data objects: ${_.difference(
        Array.from(dataObjectIds).map((id) => id.toString()),
        dataObjects.map((o) => o.id)
      )} in bag ${getBagId(bagId)}`
    )
  }
  return dataObjects
}

export async function getSortedDataObjectsByIds(
  store: DatabaseManager,
  dataObjectIds: BTreeSet<DataObjectId>
): Promise<StorageDataObject[]> {
  const dataObjects = await store.getMany(StorageDataObject, {
    where: {
      id: In(Array.from(dataObjectIds).map((id) => id.toString())),
    },
  })
  if (dataObjects.length !== Array.from(dataObjectIds).length) {
    inconsistentState(
      `Missing data objects: ${_.difference(
        Array.from(dataObjectIds).map((id) => id.toString()),
        dataObjects.map((o) => o.id)
      )}`
    )
  }
  return dataObjects.sort((a, b) => parseInt(a.id) - parseInt(b.id))
}

export function getStaticBagOwner(bagId: StaticBagId): typeof StorageBagOwner {
  if (bagId.isCouncil) {
    return new StorageBagOwnerCouncil()
  } else if (bagId.isWorkingGroup) {
    const owner = new StorageBagOwnerWorkingGroup()
    owner.workingGroupId = bagId.asWorkingGroup.toString().toLowerCase()
    return owner
  } else {
    throw new Error(`Unexpected static bag type: ${bagId.type}`)
  }
}

export function getDynamicBagOwner(bagId: DynamicBagId): typeof StorageBagOwner {
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

export function getStaticBagId(bagId: StaticBagId): string {
  if (bagId.isCouncil) {
    return `static:council`
  } else if (bagId.isWorkingGroup) {
    return `static:wg:${bagId.asWorkingGroup.type.toLowerCase()}`
  } else {
    throw new Error(`Unexpected static bag type: ${bagId.type}`)
  }
}

export function getDynamicBagId(bagId: DynamicBagId): string {
  if (bagId.isChannel) {
    return `dynamic:channel:${bagId.asChannel.toString()}`
  } else if (bagId.isMember) {
    return `dynamic:member:${bagId.asMember.toString()}`
  } else {
    throw new Error(`Unexpected dynamic bag type: ${bagId.type}`)
  }
}

export function getBagId(bagId: BagId): string {
  return bagId.isStatic ? getStaticBagId(bagId.asStatic) : getDynamicBagId(bagId.asDynamic)
}

export async function getDynamicBag(
  store: DatabaseManager,
  bagId: DynamicBagId,
  relations?: RelationsArr<StorageBag>
): Promise<StorageBag> {
  return getById(store, StorageBag, getDynamicBagId(bagId), relations)
}

export async function getStaticBag(
  store: DatabaseManager,
  bagId: StaticBagId,
  relations?: RelationsArr<StorageBag>
): Promise<StorageBag> {
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

export async function getBag(
  store: DatabaseManager,
  bagId: BagId,
  relations?: RelationsArr<StorageBag>
): Promise<StorageBag> {
  return bagId.isStatic
    ? getStaticBag(store, bagId.asStatic, relations)
    : getDynamicBag(store, bagId.asDynamic, relations)
}

export async function getDistributionBucketOperatorWithMetadata(
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

export async function getStorageBucketWithOperatorMetadata(store: DatabaseManager, id: string): Promise<StorageBucket> {
  const bucket = await store.get(StorageBucket, {
    where: { id },
    relations: ['operatorMetadata', 'operatorMetadata.nodeLocation', 'operatorMetadata.nodeLocation.coordinates'],
  })
  if (!bucket) {
    throw new Error(`StorageBucket not found by id: ${id}`)
  }
  return bucket
}

export async function getDistributionBucketFamilyWithMetadata(
  store: DatabaseManager,
  id: string
): Promise<DistributionBucketFamily> {
  const family = await store.get(DistributionBucketFamily, {
    where: { id },
    relations: ['metadata', 'metadata.areas'],
  })
  if (!family) {
    throw new Error(`DistributionBucketFamily not found by id: ${id}`)
  }
  return family
}

export async function createDataObjects(
  store: DatabaseManager,
  { storageBagOrId, objectCreationList, stateBloatBond, objectIds }: StorageDataObjectParams
): Promise<StorageDataObject[]> {
  const storageBag = storageBagOrId instanceof StorageBag ? storageBagOrId : await getBag(store, storageBagOrId)

  const dataObjects = objectCreationList.map((objectParams, i) => {
    const objectId = objectIds[i]
    const object = new StorageDataObject({
      id: objectId.toString(),
      isAccepted: false,
      ipfsHash: bytesToString(objectParams.ipfsContentId),
      size: new BN(objectParams.size_),
      type: new DataObjectTypeUnknown(),
      stateBloatBond,
      storageBag,
    })
    return object
  })

  await Promise.all(dataObjects.map((o) => store.save<StorageDataObject>(o)))

  return dataObjects
}

export async function deleteDataObjects(
  store: DatabaseManager,
  bagId: BagId,
  dataObjectIds: BTreeSet<DataObjectId>
): Promise<void> {
  const dataObjects = await getDataObjectsInBag(store, bagId, dataObjectIds, [
    'videoThumbnail',
    ...videoRelationsForCounters.map((item) => `videoThumbnail.${item}`),
    'videoMedia',
    ...videoRelationsForCounters.map((item) => `videoMedia.${item}`),
    'playlistThumbnail',
  ])

  for (const dataObject of dataObjects) {
    // update video active counters
    await getAllManagers(store).storageDataObjects.onMainEntityDeletion(dataObject)

    await unsetAssetRelations(store, dataObject)
  }
}

export function distributionBucketId(runtimeBucketId: DistributionBucketId): string {
  const { distributionBucketFamilyId, distributionBucketIndex } = runtimeBucketId
  return distributionBucketIdByFamilyAndIndex(distributionBucketFamilyId, distributionBucketIndex)
}

export function distributionBucketIdByFamilyAndIndex(
  familyId: DistributionBucketFamilyId,
  bucketIndex: DistributionBucketIndex
): string {
  return `${familyId.toString()}:${bucketIndex.toString()}`
}

export function distributionOperatorId(bucketId: DistributionBucketId, workerId: WorkerId): string {
  return `${distributionBucketId(bucketId)}-${workerId.toString()}`
}
