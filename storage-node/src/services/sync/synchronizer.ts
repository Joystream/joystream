import _ from 'lodash'
import { getDataObjectIDs } from '../../services/caching/localDataObjects'
import logger from '../../services/logger'
import { QueryNodeApi } from '../queryNode/api'
import { DataObligations, getStorageObligationsFromRuntime } from './storageObligations'
import { DownloadFileTask } from './tasks'
import { TaskProcessorSpawner, WorkingStack } from './workingProcess'

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
  hostId: string,
  selectedOperatorUrl?: string
): Promise<void> {
  logger.info('Started syncing...')
  const [model, files] = await Promise.all([getStorageObligationsFromRuntime(qnApi, buckets), getDataObjectIDs()])

  const required = model.dataObjects

  const added = _.differenceWith(required, files, (required, file) => required.id === file)
  const removed = _.differenceWith(files, required, (file, required) => file === required.id)

  logger.debug(`Sync - new objects: ${added.length}`)
  logger.debug(`Sync - obsolete objects: ${removed.length}`)

  const workingStack = new WorkingStack()

  const addedTasks = await getDownloadTasks(
    model,
    buckets,
    added,
    uploadDirectory,
    tempDirectory,
    asyncWorkersTimeout,
    hostId,
    selectedOperatorUrl
  )

  logger.debug(`Sync - started processing...`)

  const processSpawner = new TaskProcessorSpawner(workingStack, asyncWorkersNumber)

  await workingStack.add(addedTasks)

  await processSpawner.process()
  logger.info('Sync ended.')
}

/**
 * Creates the download tasks.
 *
 * @param dataObligations - defines the current data obligations for the node
 * @param ownBuckets - list of bucket ids operated this node
 * @param addedIds - data object IDs to download
 * @param uploadDirectory - local directory for data uploading
 * @param tempDirectory - local directory for temporary data uploading
 * @param taskSink - a destination for the newly created tasks
 * @param asyncWorkersTimeout - downloading asset timeout
 * @param hostId - Random host UUID assigned to each node during bootstrap
 * @param selectedOperatorUrl - operator URL selected for syncing objects
 */
async function getDownloadTasks(
  dataObligations: DataObligations,
  ownBuckets: string[],
  added: DataObligations['dataObjects'],
  uploadDirectory: string,
  tempDirectory: string,
  asyncWorkersTimeout: number,
  hostId: string,
  selectedOperatorUrl?: string
): Promise<DownloadFileTask[]> {
  const bagIdByDataObjectId = new Map()
  for (const entry of dataObligations.dataObjects) {
    bagIdByDataObjectId.set(entry.id, entry.bagId)
  }

  const ownOperatorUrls: string[] = []
  for (const entry of dataObligations.storageBuckets) {
    if (ownBuckets.includes(entry.id)) {
      ownOperatorUrls.push(entry.operatorUrl)
    }
  }

  const bucketOperatorUrlById = new Map()
  for (const entry of dataObligations.storageBuckets) {
    if (!ownBuckets.includes(entry.id)) {
      if (ownOperatorUrls.includes(entry.operatorUrl)) {
        logger.warn(`(sync) Skipping remote bucket ${entry.id} - ${entry.operatorUrl}`)
      } else {
        bucketOperatorUrlById.set(entry.id, entry.operatorUrl)
      }
    }
  }

  const bagOperatorsUrlsById = new Map()
  for (const entry of dataObligations.bags) {
    const operatorUrls = []

    for (const bucket of entry.buckets) {
      if (bucketOperatorUrlById.has(bucket)) {
        const operatorUrl = bucketOperatorUrlById.get(bucket)
        if (operatorUrl) {
          operatorUrls.push(operatorUrl)
        }
      }
    }

    bagOperatorsUrlsById.set(entry.id, operatorUrls)
  }

  const tasks = added.map((dataObject) => {
    let operatorUrls: string[] = [] // can be empty after look up
    let bagId = null
    if (bagIdByDataObjectId.has(dataObject.id)) {
      bagId = bagIdByDataObjectId.get(dataObject.id)
      if (bagOperatorsUrlsById.has(bagId)) {
        operatorUrls = bagOperatorsUrlsById.get(bagId)
      }
    }

    return new DownloadFileTask(
      selectedOperatorUrl ? [selectedOperatorUrl] : operatorUrls,
      dataObject.id,
      dataObject.ipfsHash,
      uploadDirectory,
      tempDirectory,
      asyncWorkersTimeout,
      hostId
    )
  })

  return tasks
}
