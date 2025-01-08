import { getDataObjectIDs, isDataObjectIdInCache } from '../../services/caching/localDataObjects'
import logger from '../../services/logger'
import { QueryNodeApi } from '../queryNode/api'
import {
  DataObject,
  DataObligations,
  getDataObjectsByIDs,
  getStorageObligationsFromRuntime,
} from './storageObligations'
import { DownloadFileTask } from './tasks'
import { TaskProcessorSpawner, WorkingStack } from '../processing/workingProcess'
import _ from 'lodash'

/**
 * Temporary directory name for data uploading.
 */
export const TempDirName = 'temp'

/**
 * Temporary Directory name for data objects not yet accepted (pending) in runtime.
 */
export const PendingDirName = 'pending'

/**
 * Runs the data synchronization workflow. It compares the current node's
 * storage obligations with the local storage and fixes the difference.
 * The sync process uses the QueryNode for defining storage obligations and
 * remote storage nodes' URL for data obtaining.
 *
 * @param api - (optional) runtime API promise
 * @param workerId - current storage provider ID
 * @param buckets - Selected storage buckets
 * @param asyncWorkersNumber - maximum parallel downloads number
 * @param asyncWorkersTimeout - downloading asset timeout
 * @param qnApi - Query Node API
 * @param uploadDirectory - local directory to get file names from
 * @param tempDirectory - local directory for temporary data uploading
 * @param batchSize - maximum number of data objects to process in a single batch
 * @param selectedOperatorUrl - (optional) defines the data source URL. If not set
 * the source URL is resolved for each data object separately using the Query
 * Node information about the storage providers.
 */
export async function performSync(
  buckets: string[],
  asyncWorkersNumber: number,
  asyncWorkersTimeout: number,
  qnApi: QueryNodeApi,
  uploadDirectory: string,
  tempDirectory: string,
  batchSize: number,
  hostId: string,
  selectedOperatorUrl?: string
): Promise<void> {
  logger.info('Started syncing...')
  const model = await getStorageObligationsFromRuntime(qnApi, buckets)
  const storedObjectIds = getDataObjectIDs()

  const assignedObjectIds = new Set(await model.getAssignedDataObjectIds(true))

  const unsyncedObjectIds = [...assignedObjectIds].filter((id) => !isDataObjectIdInCache(id))
  const obsoleteObjectsNum = storedObjectIds.reduce((count, id) => (assignedObjectIds.has(id) ? count : count + 1), 0)

  logger.debug(`Sync - new objects: ${unsyncedObjectIds.length}`)
  logger.debug(`Sync - obsolete objects: ${obsoleteObjectsNum}`)

  const workingStack = new WorkingStack()
  const processSpawner = new TaskProcessorSpawner(workingStack, asyncWorkersNumber)

  // Process unsynced objects in batches
  logger.debug(`Sync - started processing...`)
  let processed = 0
  for (const unsyncedIdsBatch of _.chunk(unsyncedObjectIds, batchSize)) {
    const objectsBatch = await getDataObjectsByIDs(qnApi, unsyncedIdsBatch)
    const syncTasks = await getDownloadTasks(
      model,
      objectsBatch,
      uploadDirectory,
      tempDirectory,
      asyncWorkersTimeout,
      hostId,
      selectedOperatorUrl
    )
    await workingStack.add(syncTasks)
    await processSpawner.process()
    processed += objectsBatch.length
    logger.debug(`Sync - processed ${processed} / ${unsyncedObjectIds.length} objects...`)
  }

  logger.info('Sync ended.')
}

/**
 * Creates the download tasks.
 *
 * @param dataObligations - defines the current data obligations for the node
 * @param dataObjects - list of data objects to download
 * @param uploadDirectory - local directory for data uploading
 * @param tempDirectory - local directory for temporary data uploading
 * @param taskSink - a destination for the newly created tasks
 * @param asyncWorkersTimeout - downloading asset timeout
 * @param hostId - Random host UUID assigned to each node during bootstrap
 * @param selectedOperatorUrl - operator URL selected for syncing objects
 */
export async function getDownloadTasks(
  dataObligations: DataObligations,
  dataObjects: DataObject[],
  uploadDirectory: string,
  tempDirectory: string,
  asyncWorkersTimeout: number,
  hostId: string,
  selectedOperatorUrl?: string
): Promise<DownloadFileTask[]> {
  const { bagOperatorsUrlsById } = dataObligations

  const tasks = dataObjects.map((dataObject) => {
    return new DownloadFileTask(
      selectedOperatorUrl ? [selectedOperatorUrl] : bagOperatorsUrlsById.get(dataObject.bagId) || [],
      dataObject.id,
      dataObject.ipfsHash,
      dataObject.size,
      uploadDirectory,
      tempDirectory,
      asyncWorkersTimeout,
      hostId
    )
  })

  return tasks
}
