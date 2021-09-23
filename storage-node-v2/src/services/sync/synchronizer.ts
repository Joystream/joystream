import { getStorageObligationsFromRuntime, DataObligations } from './storageObligations'
import logger from '../../services/logger'
import { SyncTask, DownloadFileTask, DeleteLocalFileTask, PrepareDownloadFileTask } from './tasks'
import { WorkingStack, TaskProcessorSpawner, TaskSink } from './workingProcess'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
const fsPromises = fs.promises

/**
 * Temporary directory name for data uploading.
 */
export const TempDirName = 'temp'

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
    getLocalDataObjects(uploadDirectory, TempDirName),
  ])

  const requiredIds = model.dataObjects.map((obj) => obj.id)

  const added = _.difference(requiredIds, files)
  const deleted = _.difference(files, requiredIds)

  logger.debug(`Sync - added objects: ${added.length}`)
  logger.debug(`Sync - deleted objects: ${deleted.length}`)

  const workingStack = new WorkingStack()
  const deletedTasks = deleted.map((fileName) => new DeleteLocalFileTask(uploadDirectory, fileName))

  let addedTasks: SyncTask[]
  if (operatorUrl === undefined) {
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
 * Creates the download preparation tasks.
 *
 * @param dataObligations - defines the current data obligations for the node
 * @param addedIds - data object IDs to download
 * @param uploadDirectory - local directory for data uploading
 * @param taskSink - a destination for the newly created tasks
 */
async function getPrepareDownloadTasks(
  dataObligations: DataObligations,
  addedIds: string[],
  uploadDirectory: string,
  taskSink: TaskSink
): Promise<PrepareDownloadFileTask[]> {
  const idMap = new Map()
  for (const entry of dataObligations.dataObjects) {
    idMap.set(entry.id, entry.bagId)
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

  const tasks = addedIds.map((id) => {
    let operatorUrls: string[] = [] // can be empty after look up
    if (idMap.has(id)) {
      const bagid = idMap.get(id)
      if (bagMap.has(bagid)) {
        operatorUrls = bagMap.get(bagid)
      }
    }

    return new PrepareDownloadFileTask(operatorUrls, id, uploadDirectory, taskSink)
  })

  return tasks
}

/**
 * Creates the download file tasks.
 *
 * @param operatorUrl - defines the data source URL.
 * @param addedIds - data object IDs to download
 * @param uploadDirectory - local directory for data uploading
 */
async function getDownloadTasks(
  operatorUrl: string,
  addedIds: string[],
  uploadDirectory: string
): Promise<DownloadFileTask[]> {
  const addedTasks = addedIds.map((fileName) => new DownloadFileTask(operatorUrl, fileName, uploadDirectory))

  return addedTasks
}

/**
 * Returns local data objects info.
 *
 * @param uploadDirectory - local directory to get file names from
 */
export async function getLocalDataObjects(uploadDirectory: string, tempDirName: string): Promise<string[]> {
  const localIds = await getLocalFileNames(uploadDirectory)

  // Filter temporary directory name.
  const tempDirectoryName = path.parse(tempDirName).name
  const data = localIds.filter((dataObjectId) => dataObjectId !== tempDirectoryName)

  return data
}

/**
 * Returns file names from the local directory.
 *
 * @param directory - local directory to get file names from
 */
async function getLocalFileNames(directory: string): Promise<string[]> {
  return fsPromises.readdir(directory)
}
