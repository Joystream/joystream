import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import { FindConditions } from 'typeorm'
import { Bytes } from '@polkadot/types'

import {
  inconsistentState,
  logger,
} from './common'

import {
  Channel,
  StorageProvider,
  StorageProviderType,
} from 'query-node'
import {
  GatewayWorkingGroup,
  StorageWorkingGroup,
} from '../../generated/types'
import {
  ApplicationId,
  ApplicationIdToWorkerIdMap,
  WorkerId,
} from "@joystream/types/augment";

/////////////////// Storage working group //////////////////////////////////////

export async function storageWorkingGroup_OpeningFilled(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {applicationIdToWorkerIdMap} = new StorageWorkingGroup.OpeningFilledEvent(event).data

  // call generic processing
  await workingGroup_OpeningFilled(db, StorageProviderType.STORAGE, applicationIdToWorkerIdMap)
}

export async function storageWorkingGroup_WorkerStorageUpdated(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {workerId: storageProviderId, bytes: newMetadata} = new StorageWorkingGroup.WorkerStorageUpdatedEvent(event).data

  // call generic processing
  await workingGroup_WorkerStorageUpdated(db, storageProviderId, newMetadata)
}

export async function storageWorkingGroup_TerminatedWorker(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {workerId: storageProviderId} = new StorageWorkingGroup.TerminatedWorkerEvent(event).data

  // call generic processing
  await workingGroup_TerminatedWorker(db, storageProviderId)
}

export async function storageWorkingGroup_WorkerExited(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {workerId: storageProviderId} = new StorageWorkingGroup.WorkerExitedEvent(event).data

  // call generic processing
  await workingGroup_WorkerExited(db, storageProviderId)
}

/////////////////// Gateway working group //////////////////////////////////////

export async function gatewayWorkingGroup_OpeningFilled(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {applicationIdToWorkerIdMap} = new GatewayWorkingGroup.OpeningFilledEvent(event).data

  // call generic processing
  await workingGroup_OpeningFilled(db, StorageProviderType.GATEWAY, applicationIdToWorkerIdMap)
}

export async function gatewayWorkingGroup_WorkerStorageUpdated(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {workerId: storageProviderId, bytes: newMetadata} = new GatewayWorkingGroup.WorkerStorageUpdatedEvent(event).data

  // call generic processing
  await workingGroup_WorkerStorageUpdated(db, storageProviderId, newMetadata)
}

export async function gatewayWorkingGroup_TerminatedWorker(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {workerId: storageProviderId} = new StorageWorkingGroup.TerminatedWorkerEvent(event).data

  // call generic processing
  await workingGroup_TerminatedWorker(db, storageProviderId)
}

export async function gatewayWorkingGroup_WorkerExited(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {workerId: storageProviderId} = new StorageWorkingGroup.WorkerExitedEvent(event).data

  // call generic processing
  await workingGroup_WorkerExited(db, storageProviderId)
}

/////////////////// Generic working group processing ///////////////////////////

export async function workingGroup_OpeningFilled(
  db: DatabaseManager,
  storageProviderType: StorageProviderType,
  applicationIdToWorkerIdMap: ApplicationIdToWorkerIdMap
): Promise<void> {
  const storageProviderIds = [...applicationIdToWorkerIdMap.values()]

  for (const storageProviderId of storageProviderIds) {
    // load storage provider
    const storageProvider = await db.get(StorageProvider, { where: { id: storageProviderId.toString() } as FindConditions<StorageProvider> })

    // reactivate storage provider if it already exists
    if (storageProvider) {
      await reactivateStorageProvider(db, storageProvider)
      continue
    }

    // create new storage provider
    const newStorageProvider = new StorageProvider({
      id: storageProviderId.toString(),
      type: storageProviderType,
      isActive: true,
    })

    await db.save<StorageProvider>(newStorageProvider)
  }

  // emit log event
  logger.info("Storage provider has beed created", {ids: storageProviderIds.map(item => item.toString())})
}

export async function workingGroup_WorkerStorageUpdated(db: DatabaseManager, storageProviderId: WorkerId, newMetadata: Bytes): Promise<void> {
  // load storage provider
  const storageProvider = await db.get(StorageProvider, { where: { id: storageProviderId.toString() } as FindConditions<StorageProvider> })

  // ensure storageProvider exists
  if (!storageProvider) {
    return inconsistentState('Non-existing storage provider update requested', storageProviderId)
  }

  storageProvider.metadata = newMetadata.toUtf8()

  await db.save<StorageProvider>(storageProvider)

  // emit log event
  logger.info("Storage provider has been updated", {id: storageProviderId})
}

export async function workingGroup_TerminatedWorker(db: DatabaseManager, storageProviderId: WorkerId): Promise<void> {
  // do removal logic
  await deactivateStorageProvider(db, storageProviderId)

  // emit log event
  logger.info("Storage provider has beed removed (worker terminated)", {id: storageProviderId})
}

export async function workingGroup_WorkerExited(db: DatabaseManager, storageProviderId: WorkerId): Promise<void> {
  // do removal logic
  await deactivateStorageProvider(db, storageProviderId)

  // emit log event
  logger.info("Storage provider has beed removed (worker exited)", {id: storageProviderId})
}

/////////////////// Helpers ////////////////////////////////////////////////////

async function reactivateStorageProvider(db: DatabaseManager, storageProvider: StorageProvider) {
  storageProvider.isActive = true

  await db.save<StorageProvider>(storageProvider)
}

async function deactivateStorageProvider(db: DatabaseManager, storageProviderId: WorkerId) {
  // load storage provider
  const storageProvider = await db.get(StorageProvider, { where: { id: storageProviderId.toString() } as FindConditions<StorageProvider> })

  // ensure storageProvider exists
  if (!storageProvider) {
    return inconsistentState('Non-existing storage provider deletion requested', storageProviderId)
  }

  storageProvider.isActive = false

  await db.save<StorageProvider>(storageProvider)
}
