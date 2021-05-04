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
  Worker,
  WorkerType,
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
  await workingGroup_OpeningFilled(db, WorkerType.STORAGE, applicationIdToWorkerIdMap)
}

export async function storageWorkingGroup_WorkerStorageUpdated(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {workerId, bytes: newMetadata} = new StorageWorkingGroup.WorkerStorageUpdatedEvent(event).data

  // call generic processing
  await workingGroup_WorkerStorageUpdated(db, WorkerType.STORAGE, workerId, newMetadata)
}

export async function storageWorkingGroup_TerminatedWorker(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {workerId} = new StorageWorkingGroup.TerminatedWorkerEvent(event).data

  // call generic processing
  await workingGroup_TerminatedWorker(db, WorkerType.STORAGE, workerId)
}

export async function storageWorkingGroup_WorkerExited(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {workerId} = new StorageWorkingGroup.WorkerExitedEvent(event).data

  // call generic processing
  await workingGroup_WorkerExited(db, WorkerType.STORAGE, workerId)
}

/////////////////// Gateway working group //////////////////////////////////////

export async function gatewayWorkingGroup_OpeningFilled(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {applicationIdToWorkerIdMap} = new GatewayWorkingGroup.OpeningFilledEvent(event).data

  // call generic processing
  await workingGroup_OpeningFilled(db, WorkerType.GATEWAY, applicationIdToWorkerIdMap)
}

export async function gatewayWorkingGroup_WorkerStorageUpdated(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {workerId, bytes: newMetadata} = new GatewayWorkingGroup.WorkerStorageUpdatedEvent(event).data

  // call generic processing
  await workingGroup_WorkerStorageUpdated(db, WorkerType.GATEWAY, workerId, newMetadata)
}

export async function gatewayWorkingGroup_TerminatedWorker(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {workerId} = new StorageWorkingGroup.TerminatedWorkerEvent(event).data

  // call generic processing
  await workingGroup_TerminatedWorker(db, WorkerType.GATEWAY, workerId)
}

export async function gatewayWorkingGroup_WorkerExited(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const {workerId} = new StorageWorkingGroup.WorkerExitedEvent(event).data

  // call generic processing
  await workingGroup_WorkerExited(db, WorkerType.GATEWAY, workerId)
}

/////////////////// Generic working group processing ///////////////////////////

export async function workingGroup_OpeningFilled(
  db: DatabaseManager,
  workerType: WorkerType,
  applicationIdToWorkerIdMap: ApplicationIdToWorkerIdMap
): Promise<void> {
  const workerIds = [...applicationIdToWorkerIdMap.values()]

  for (const workerId of workerIds) {
    // create new worker
    const newWorker = new Worker({
      workerId: workerId.toString(),
      type: workerType,
      isActive: true,
    })

    await db.save<Worker>(newWorker)
  }

  // emit log event
  logger.info("Worker has been created", {ids: workerIds.map(item => item.toString()), workerType})
}

export async function workingGroup_WorkerStorageUpdated(db: DatabaseManager, workerType: WorkerType, workerId: WorkerId, newMetadata: Bytes): Promise<void> {
  // load worker
  const worker = await db.get(Worker, {
    where: {
      workerId: workerId.toString(),
      type: workerType,
    } as FindConditions<Worker>
  })

  // ensure worker exists
  if (!worker) {
    return inconsistentState('Non-existing worker update requested', workerId)
  }

  worker.metadata = newMetadata.toUtf8()

  await db.save<Worker>(worker)

  // emit log event
  logger.info("Storage provider has been updated", {workerId, workerType})
}

export async function workingGroup_TerminatedWorker(db: DatabaseManager, workerType: WorkerType, workerId: WorkerId): Promise<void> {
  // do removal logic
  await deactivateWorker(db, workerType, workerId)

  // emit log event
  logger.info("Storage provider has beed removed (worker terminated)", {workerId, workerType})
}

export async function workingGroup_WorkerExited(db: DatabaseManager, workerType: WorkerType, workerId: WorkerId): Promise<void> {
  // do removal logic
  await deactivateWorker(db, workerType, workerId)

  // emit log event
  logger.info("Storage provider has beed removed (worker exited)", {workerId, workerType})
}

/////////////////// Helpers ////////////////////////////////////////////////////

async function deactivateWorker(db: DatabaseManager, workerType: WorkerType, workerId: WorkerId) {
  // load worker
  const worker = await db.get(Worker, {
    where: {
      workerId: workerId.toString(),
      type: workerType,
    } as FindConditions<Worker>
  })

  // ensure worker exists
  if (!worker) {
    return inconsistentState('Non-existing worker deletion requested', workerId)
  }

  worker.isActive = false

  await db.save<Worker>(worker)
}
