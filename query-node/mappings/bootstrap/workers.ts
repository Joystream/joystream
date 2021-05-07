import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import { Worker, WorkerType } from 'query-node'
import {logger} from '../src/common'

export interface IBootstrapWorkers {
  storage: IBootstrapWorker[]
  gateway: IBootstrapWorker[]
}

export interface IBootstrapWorker {
  role_account_id: string
}

export async function bootWorkers(db: DatabaseManager, workers: IBootstrapWorkers): Promise<void> {
  await bootWorkersInGroup(db, workers.storage, WorkerType.STORAGE)
  await bootWorkersInGroup(db, workers.gateway, WorkerType.GATEWAY)
}

export async function bootWorkersInGroup(db: DatabaseManager, workers: IBootstrapWorker[], workerType: WorkerType): Promise<void> {
  if (!workers) {
    return
  }

  for (const rawWorker of workers) {
    // create new membership
    const worker = new Worker({
      // main data
      workerId: rawWorker.role_account_id,
      type: workerType,
      isActive: true,
    })

    // save worker
    await db.save<Worker>(worker)

    // emit log event
    logger.info('Worker has been bootstrapped', {id: rawWorker.role_account_id, workerType})
  }
}
