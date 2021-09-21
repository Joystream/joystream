import { DatabaseManager } from '@joystream/hydra-common'
import { DataObjectCreationParameters } from '@joystream/types/augment'
import { registry } from '@joystream/types'
import { DataObjectCreationParameters as ObjectCreationParams } from '@joystream/types/storage'
import { StorageBag, StorageDataObject, StorageSystemParameters } from 'query-node/dist/model'
import BN from 'bn.js'
import { bytesToString, inconsistentState } from '../common'
import { In } from 'typeorm'
import { unsetAssetRelations } from '../content/utils'

export async function getStorageSystem(store: DatabaseManager): Promise<StorageSystemParameters> {
  const storageSystem = await store.get(StorageSystemParameters, {})
  if (!storageSystem) {
    throw new Error('Storage system entity is missing!')
  }

  return storageSystem
}

export async function createDataObjects(
  store: DatabaseManager,
  objectsParams: DataObjectCreationParameters[],
  storageBag: StorageBag,
  objectIds?: BN[]
): Promise<StorageDataObject[]> {
  const storageSystem = await getStorageSystem(store)

  const dataObjects = objectsParams.map((objectParams, i) => {
    const params = new ObjectCreationParams(registry, objectParams.toJSON() as any)
    const objectId = objectIds ? objectIds[i] : storageSystem.nextDataObjectId
    const object = new StorageDataObject({
      id: objectId.toString(),
      isAccepted: false,
      ipfsHash: bytesToString(objectParams.ipfsContentId),
      size: new BN(params.getField('size').toString()),
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
  await unsetAssetRelations(store, object)
  await store.save<StorageDataObject>(object)
}
