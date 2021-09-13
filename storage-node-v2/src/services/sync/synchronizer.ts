import { getStorageObligationsFromRuntime, DataObligations } from './storageObligations'
import logger from '../../services/logger'
import { SyncTask, DownloadFileTask, DeleteLocalFileTask, PrepareDownloadFileTask } from './tasks'
import { WorkingStack, TaskProcessorSpawner, TaskSink } from './workingProcess'
import _ from 'lodash'
import fs from 'fs'
const fsPromises = fs.promises

/**
 * Runs the data synchronization workflow. It compares the current node's
 * storage obligations with the local storage and fixes the difference.
 * The sync process uses the QueryNode for defining storage obligations and
 * remote storage nodes' URL for data obtaining.
 *
 * @param workerId - current storage provider ID
 * @param asyncWorkersNumber - maximum parallel downloads number
 * @param queryNodeUrl - Query Node endpoint URL
 * @param uploadDirectory - local directory to get file names from
 * @param operatorUrl - (optional) defines the data source URL. If not set
 * the source URL is resolved for each data object separately using the Query
 * Node information about the storage providers.
 */
export async function performSync(
  workerId: number,
  asyncWorkersNumber: number,
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
  const deletedTasks = deleted.map((fileName) => new DeleteLocalFileTask(uploadDirectory, fileName))

  let addedTasks: SyncTask[]
  if (operatorUrl !== null) {
    addedTasks = await getPrepareDownloadTasks(model, added, uploadDirectory, workingStack)
  } else {
    addedTasks = await getDownloadTasks(operatorUrl, added, uploadDirectory)
  }

  logger.debug(`Sync - started processing...`)

  const processSpawner = new TaskProcessorSpawner(workingStack, asyncWorkersNumber)

  await workingStack.add(addedTasks)
  await workingStack.add(deletedTasks)

  await processSpawner.process()
  logger.info('Sync ended.')
}

/**
 * Returns file names from the local directory.
 *
 * @param directory - local directory to get file names from
 */
async function getLocalFileNames(directory: string): Promise<string[]> {
  return fsPromises.readdir(directory)
}

/**
 * Creates the download preparation tasks.
 *
 * @param dataObligations - defines the current data obligations for the node
 * @param addedCids - data object IDs to download
 * @param uploadDirectory - local directory for data uploading
 * @param taskSink - a destination for the newly created tasks
 */
async function getPrepareDownloadTasks(
  dataObligations: DataObligations,
  addedCids: string[],
  uploadDirectory: string,
  taskSink: TaskSink
): Promise<PrepareDownloadFileTask[]> {
  const cidMap = new Map()
  for (const entry of dataObligations.dataObjects) {
    cidMap.set(entry.cid, entry.bagId)
  }

  const bucketMap = new Map()
  for (const entry of dataObligations.storageBuckets) {
    bucketMap.set(entry.id, entry.operatorUrl)
  }

  const bagMap = new Map()
  for (const entry of dataObligations.bags) {
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

    return new PrepareDownloadFileTask(operatorUrls, cid, uploadDirectory, taskSink)
  })

  return tasks
}

/**
 * Creates the download file tasks.
 *
 * @param operatorUrl - defines the data source URL.
 * @param addedCids - data object IDs to download
 * @param uploadDirectory - local directory for data uploading
 */
async function getDownloadTasks(
  operatorUrl: string,
  addedCids: string[],
  uploadDirectory: string
): Promise<DownloadFileTask[]> {
  const addedTasks = addedCids.map((fileName) => new DownloadFileTask(operatorUrl, fileName, uploadDirectory))

  return addedTasks
}

/**
 * Returns local data objects info.
 *
 * @param uploadDirectory - local directory to get file names from
 */
export async function getLocalDataObjects(uploadDirectory: string): Promise<string[]> {
  const localCids = await getLocalFileNames(uploadDirectory)

  return localCids
}
