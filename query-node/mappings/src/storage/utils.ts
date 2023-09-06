import { DatabaseManager } from '@joystream/hydra-common'
import {
  PalletStorageBagIdType as BagId,
  PalletStorageDataObjectCreationParameters as DataObjectCreationParameters,
  PalletStorageDistributionBucketIdRecord as DistributionBucketId,
  PalletStorageDynamicBagIdType as DynamicBagId,
  PalletStorageStaticBagId as StaticBagId,
} from '@polkadot/types/lookup'
import BN from 'bn.js'
import {
  DataObjectTypeUnknown,
  DistributionBucketOperator,
  StorageBag,
  StorageBagOwner,
  StorageBagOwnerChannel,
  StorageBagOwnerCouncil,
  StorageBagOwnerMember,
  StorageBagOwnerWorkingGroup,
  StorageDataObject,
} from 'query-node/dist/model'
import { RelationsArr, bytesToString, getByIdOrFail, getManyByOrFail } from '../common'

import {
  DataObjectId,
  DistributionBucketFamilyId,
  DistributionBucketIndex,
  WorkerId,
} from '@joystream/types/primitives'
import { BTreeSet } from '@polkadot/types'
import { Balance } from '@polkadot/types/interfaces'
import { unsetAssetRelations, videoRelationsForCounters } from '../content/utils'
import { getAllManagers } from '../derivedPropertiesManager/applications'

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
  return getManyByOrFail(
    store,
    StorageDataObject,
    [...dataObjectIds].map((id) => id.toString()),
    { storageBag: { id: getBagId(bagId) } },
    relations as RelationsArr<StorageDataObject>,
    `Missing data objects in bag ${getBagId(bagId)}`
  )
}

export async function getSortedDataObjectsByIds(
  store: DatabaseManager,
  dataObjectIds: BTreeSet<DataObjectId>
): Promise<StorageDataObject[]> {
  const dataObjects = await getManyByOrFail(
    store,
    StorageDataObject,
    [...dataObjectIds].map((id) => id.toString())
  )
  return dataObjects.sort((a, b) => parseInt(a.id) - parseInt(b.id))
}

export function getStaticBagOwner(bagId: StaticBagId): typeof StorageBagOwner {
  if (bagId.isCouncil) {
    return new StorageBagOwnerCouncil()
  } else {
    const owner = new StorageBagOwnerWorkingGroup()
    owner.workingGroupId = bagId.asWorkingGroup.toString().toLowerCase()
    return owner
  }
}

export function getDynamicBagOwner(bagId: DynamicBagId): typeof StorageBagOwner {
  if (bagId.isChannel) {
    const owner = new StorageBagOwnerChannel()
    owner.channelId = bagId.asChannel.toNumber()
    return owner
  } else {
    const owner = new StorageBagOwnerMember()
    owner.memberId = bagId.asMember.toNumber()
    return owner
  }
}

export function getStaticBagId(bagId: StaticBagId): string {
  return bagId.isCouncil ? `static:council` : `static:wg:${bagId.asWorkingGroup.type.toLowerCase()}`
}

export function getDynamicBagId(bagId: DynamicBagId): string {
  return bagId.isChannel
    ? `dynamic:channel:${bagId.asChannel.toString()}`
    : `dynamic:member:${bagId.asMember.toString()}`
}

export function getBagId(bagId: BagId): string {
  return bagId.isStatic ? getStaticBagId(bagId.asStatic) : getDynamicBagId(bagId.asDynamic)
}

export async function getDynamicBag(
  store: DatabaseManager,
  bagId: DynamicBagId,
  relations?: RelationsArr<StorageBag>
): Promise<StorageBag> {
  return getByIdOrFail(store, StorageBag, getDynamicBagId(bagId), relations)
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
  return getByIdOrFail(store, DistributionBucketOperator, id, [
    'metadata',
    'metadata.nodeLocation',
    'metadata.nodeLocation.coordinates',
  ] as RelationsArr<DistributionBucketOperator>)
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
