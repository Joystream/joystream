import { DatabaseManager } from '@joystream/hydra-common'
import { UploadParameters } from '@joystream/types/augment'
import { registry } from '@joystream/types'
import { DataObjectCreationParameters as ObjectCreationParams } from '@joystream/types/storage'
import {
  DataObjectTypeUnknown,
  StorageBag,
  StorageDataObject,
  StorageSystemParameters,
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
import { unsetAssetRelations } from '../content/utils'

import { BTreeSet } from '@polkadot/types'
import _ from 'lodash'
import {
  DataObjectId,
  BagId,
  DynamicBagId,
  StaticBagId,
  DistributionBucketId,
  DistributionBucketFamilyId,
  DistributionBucketIndex,
  WorkerId,
} from '@joystream/types/augment/all'
import { Balance } from '@polkadot/types/interfaces'

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
    throw new Error(
      `Missing data objects: ${_.difference(
        Array.from(dataObjectIds).map((id) => id.toString()),
        dataObjects.map((o) => o.id)
      )} in bag ${getBagId(bagId)}`
    )
  }
  return dataObjects
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

export async function getStorageSystem(store: DatabaseManager): Promise<StorageSystemParameters> {
  const storageSystem = await store.get(StorageSystemParameters, {})
  if (!storageSystem) {
    throw new Error('Storage system entity is missing!')
  }

  return storageSystem
}

export async function createDataObjects(
  store: DatabaseManager,
  uploadParams: UploadParameters,
  deletionPrize: Balance,
  objectIds?: BN[]
): Promise<StorageDataObject[]> {
  const storageSystem = await getStorageSystem(store)
  const { objectCreationList, bagId } = uploadParams
  const storageBag = await getBag(store, bagId)

  const dataObjects = objectCreationList.map((objectParams, i) => {
    const params = new ObjectCreationParams(registry, objectParams.toJSON() as any)
    const objectId = objectIds ? objectIds[i] : storageSystem.nextDataObjectId
    const object = new StorageDataObject({
      id: objectId.toString(),
      isAccepted: false,
      ipfsHash: bytesToString(objectParams.ipfsContentId),
      size: new BN(params.getField('size').toString()),
      type: new DataObjectTypeUnknown(),
      deletionPrize,
      storageBag,
    })
    if (objectId.gte(storageSystem.nextDataObjectId)) {
      storageSystem.nextDataObjectId = objectId.addn(1)
    }
    return object
  })

  await Promise.all(dataObjects.map((o) => store.save<StorageDataObject>(o)))
  await store.save<StorageSystemParameters>(storageSystem)

  return dataObjects
}

export async function getMostRecentlyCreatedDataObjects(
  store: DatabaseManager,
  numberOfObjects: number
): Promise<StorageDataObject[]> {
  const storageSystem = await getStorageSystem(store)
  const objectIds = Array.from({ length: numberOfObjects }, (v, k) =>
    storageSystem.nextDataObjectId.subn(k + 1).toString()
  )
  const objects = await store.getMany(StorageDataObject, { where: { id: In(objectIds) } })
  if (objects.length < numberOfObjects) {
    inconsistentState(`Could not get ${numberOfObjects} most recently created data objects`, {
      expected: numberOfObjects,
      got: objects.length,
    })
  }
  return objects.sort((a, b) => new BN(a.id).cmp(new BN(b.id)))
}

export async function removeDataObject(store: DatabaseManager, object: StorageDataObject): Promise<void> {
  // `unsetAssetRelations` actually removes data object
  await unsetAssetRelations(store, object)
}

export function distributionBucketId(runtimeBucketId: DistributionBucketId): string {
  const { distribution_bucket_family_id: familyId, distribution_bucket_index: bucketIndex } = runtimeBucketId
  return distributionBucketIdByFamilyAndIndex(familyId, bucketIndex)
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
