import { EventContext, StoreContext, DatabaseManager, SubstrateEvent } from '@joystream/hydra-common'
import { bytesToString, inconsistentState, logger } from './common'
import { Worker, WorkerType } from 'query-node/dist/model'
import { StorageWorkingGroup } from './generated/types'
import { WorkerId } from '@joystream/types/augment'

export async function workingGroup_OpeningFilled({ event, store }: EventContext & StoreContext): Promise<void> {
  const workerType = getWorkerType(event)
  if (!workerType) {
    return
  }

  const [, applicationIdToWorkerIdMap] = new StorageWorkingGroup.OpeningFilledEvent(event).params
  const workerIds = [...applicationIdToWorkerIdMap.values()]

  for (const workerId of workerIds) {
    await createWorker(store, workerId, workerType, event)
  }

  // emit log event
  logger.info('Workers have been created', { ids: workerIds.map((item) => item.toString()), workerType })
}

export async function workingGroup_WorkerStorageUpdated({ event, store }: EventContext & StoreContext): Promise<void> {
  const workerType = getWorkerType(event)
  if (!workerType) {
    return
  }
  const [workerId, newMetadata] = new StorageWorkingGroup.WorkerStorageUpdatedEvent(event).params

  // load worker
  const worker = await store.get(Worker, {
    where: {
      workerId: workerId.toString(),
      type: workerType,
    },
  })

  // ensure worker exists
  if (!worker) {
    return inconsistentState('Non-existing worker update requested', workerId)
  }

  worker.metadata = bytesToString(newMetadata)

  await store.save<Worker>(worker)

  // emit log event
  logger.info('Worker has been updated', { workerId, workerType })
}

export async function workingGroup_TerminatedWorker({ event, store }: EventContext & StoreContext): Promise<void> {
  const workerType = getWorkerType(event)
  if (!workerType) {
    return
  }
  const [workerId] = new StorageWorkingGroup.TerminatedWorkerEvent(event).params

  // do removal logic
  await deactivateWorker(store, event, workerType, workerId)

  // emit log event
  logger.info('Worker has been removed (worker terminated)', { workerId, workerType })
}

export async function workingGroup_WorkerExited({ event, store }: EventContext & StoreContext): Promise<void> {
  const workerType = getWorkerType(event)
  if (!workerType) {
    return
  }
  const [workerId] = new StorageWorkingGroup.WorkerExitedEvent(event).params

  // do removal logic
  await deactivateWorker(store, event, workerType, workerId)

  // emit log event
  logger.info('Worker has been removed (worker exited)', { workerId, workerType })
}

export async function workingGroup_TerminatedLeader({ event, store }: EventContext & StoreContext): Promise<void> {
  const workerType = getWorkerType(event)
  if (!workerType) {
    return
  }
  const [workerId] = new StorageWorkingGroup.WorkerExitedEvent(event).params

  // do removal logic
  await deactivateWorker(store, event, workerType, workerId)

  // emit log event
  logger.info('Working group leader has been removed (worker exited)', { workerId, workerType })
}

/// ///////////////// Helpers ////////////////////////////////////////////////////

function getWorkerType(event: SubstrateEvent): WorkerType | null {
  if (event.section === 'storageWorkingGroup') {
    return WorkerType.STORAGE
  } else if (event.section === 'gatewayWorkingGroup') {
    return WorkerType.GATEWAY
  }
  return null
}

async function createWorker(
  db: DatabaseManager,
  workerId: WorkerId,
  workerType: WorkerType,
  event: SubstrateEvent
): Promise<void> {
  // create entity
  const newWorker = new Worker({
    id: `${workerType}-${workerId.toString()}`,
    workerId: workerId.toString(),
    type: workerType,
    isActive: true,

    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),
  })

  // save worker
  await db.save<Worker>(newWorker)
}

async function deactivateWorker(
  db: DatabaseManager,
  event: SubstrateEvent,
  workerType: WorkerType,
  workerId: WorkerId
) {
  // load worker
  const worker = await db.get(Worker, {
    where: {
      workerId: workerId.toString(),
      type: workerType,
    },
  })

  // ensure worker exists
  if (!worker) {
    return inconsistentState('Non-existing worker deletion requested', workerId)
  }

  // update worker
  worker.isActive = false

  // set last update time
  worker.updatedAt = new Date(event.blockTimestamp)

  // save worker
  await db.save<Worker>(worker)
}
