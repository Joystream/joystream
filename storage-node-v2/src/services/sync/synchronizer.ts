import {
  getStorageObligationsFromRuntime,
  DataObligations,
} from './storageObligations'
import logger from '../../services/logger'
import {
  SyncTask,
  DownloadFileTask,
  DeleteLocalFileTask,
  PrepareDownloadFileTask,
} from './tasks'
import { WorkingStack, TaskProcessorSpawner, TaskSink } from './workingProcess'
import _ from 'lodash'
import fs from 'fs'
const fsPromises = fs.promises

// TODO: use caching
// TODO: move data acquiring to the services
export async function getLocalDataObjects(
  uploadDirectory: string
): Promise<string[]> {
  const localCids = await getLocalFileNames(uploadDirectory)

  return localCids
}

export async function performSync(
  workerId: number,
  syncWorkersNumber: number,
  queryNodeUrl: string,
  uploadDirectory: string,
  operatorUrl?: string
): Promise<void> {
  logger.info('Started syncing...')
  const [model, files] = await Promise.all([
    getStorageObligationsFromRuntime(queryNodeUrl, workerId),
    getLocalFileNames(uploadDirectory),
  ])

  const requiredCids = model.dataObjects.map((obj) => obj.cid)

  const added = _.difference(requiredCids, files)
  const deleted = _.difference(files, requiredCids)

  logger.debug(`Sync - added objects: ${added.length}`)
  logger.debug(`Sync - deleted objects: ${deleted.length}`)

  const workingStack = new WorkingStack()
  const deletedTasks = deleted.map(
    (fileName) => new DeleteLocalFileTask(uploadDirectory, fileName)
  )

  let addedTasks: SyncTask[]
  if (operatorUrl !== null) {
    addedTasks = await getPrepareDownloadTasks(
      model,
      added,
      uploadDirectory,
      workingStack
    )
  } else {
    addedTasks = await getDownloadTasks(operatorUrl, added, uploadDirectory)
  }

  logger.debug(`Sync - started processing...`)

  const processSpawner = new TaskProcessorSpawner(
    workingStack,
    syncWorkersNumber
  )

  await workingStack.add(addedTasks)
  await workingStack.add(deletedTasks)

  await processSpawner.process()
  logger.info('Sync ended.')
}

async function getLocalFileNames(directory: string): Promise<string[]> {
  return fsPromises.readdir(directory)
}

async function getPrepareDownloadTasks(
  model: DataObligations,
  addedCids: string[],
  uploadDirectory: string,
  taskSink: TaskSink
): Promise<PrepareDownloadFileTask[]> {
  const cidMap = new Map()
  for (const entry of model.dataObjects) {
    cidMap.set(entry.cid, entry.bagId)
  }

  const bucketMap = new Map()
  for (const entry of model.storageBuckets) {
    bucketMap.set(entry.id, entry.operatorUrl)
  }

  const bagMap = new Map()
  for (const entry of model.bags) {
    const operatorUrls = []

    for (const bucket of entry.buckets) {
      if (bucketMap.has(bucket)) {
        const operatorUrl = bucketMap.get(bucket)
        if (operatorUrl) {
          operatorUrls.push(operatorUrl)
        }
      }
    }

    bagMap.set(entry.id, operatorUrls)
  }

  const tasks = addedCids.map((cid) => {
    let operatorUrls: string[] = [] // can be empty after look up
    if (cidMap.has(cid)) {
      const bagid = cidMap.get(cid)
      if (bagMap.has(bagid)) {
        operatorUrls = bagMap.get(bagid)
      }
    }

    return new PrepareDownloadFileTask(
      operatorUrls,
      cid,
      uploadDirectory,
      taskSink
    )
  })

  return tasks
}

async function getDownloadTasks(
  operatorUrl: string,
  addedCids: string[],
  uploadDirectory: string
): Promise<DownloadFileTask[]> {
  const addedTasks = addedCids.map(
    (fileName) => new DownloadFileTask(operatorUrl, fileName, uploadDirectory)
  )

  return addedTasks
}
