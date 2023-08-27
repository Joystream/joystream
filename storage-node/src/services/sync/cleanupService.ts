import _ from 'lodash'
import superagent from 'superagent'
import urljoin from 'url-join'
import { getDataObjectIDs } from '../../services/caching/localDataObjects'
import logger from '../../services/logger'
import { QueryNodeApi } from '../queryNode/api'
import { DataObjectDetailsFragment } from '../queryNode/generated/queries'
import { DataObligations, getDataObjectsByIDs, getStorageObligationsFromRuntime } from './storageObligations'
import { DeleteLocalFileTask } from './tasks'
import { TaskProcessorSpawner, WorkingStack } from './workingProcess'

/**
 * The maximum allowed threshold by which the QN processor can lag behind
 * the chainHead (current block), beyond that Cleanup service won't be
 * run to avoid pruning the assets based on the outdated state
 */
export const MAXIMUM_QN_LAGGING_THRESHOLD = 100

/**
 * The number of (peer) storage operators that should hold the assets, before the
 * cleanup/pruning of the outdated assets from this storage node can be initialed.
 */
export const MINIMUM_REPLICATION_THRESHOLD = 2

/**
 * Runs the data objects cleanup/pruning workflow. It removes all the local
 * stored data objects that the operator is no longer obliged to store, because
 * either the data object has been deleted from the runtime or it has been
 * moved to some other bucket/s
 *
 * PRECONDITIONS:
 * - The QueryNode processor should not lag more that "MAXIMUM_QN_LAGGING_THRESHOLD"
 *   blocks, otherwise cleanup workflow would not be performed
 * - If the asset being pruned from this storage-node still exists in the runtime
 *   (i.e. it's storage obligation has been moved), then at least `X` other storage
 *   nodes should hold the asset, otherwise cleanup workflow would not be performed,
 *   where `X` is defined by "MINIMUM_REPLICATION_THRESHOLD"
 * - If the asset being pruned from this storage-node is currently being downloaded
 *   by some external actors, then the cleanup action for this asset would be postponed
 *
 * @param api - (optional) runtime API promise
 * @param workerId - current storage provider ID
 * @param buckets - Selected storage buckets
 * @param asyncWorkersNumber - maximum parallel downloads number
 * @param asyncWorkersTimeout - downloading asset timeout
 * @param qnApi - Query Node API
 * @param uploadDirectory - local directory to get file names from
 * @param tempDirectory - local directory for temporary data uploading
 */
export async function performCleanup(
  workerId: number,
  buckets: string[],
  asyncWorkersNumber: number,
  qnApi: QueryNodeApi,
  uploadDirectory: string
): Promise<void> {
  logger.info('Started cleanup service...')
  const qnState = await qnApi.getQueryNodeState()
  if (!qnState) {
    throw new Error("Can't perform cleanup because QueryNode state info is unavailable")
  }

  const qnCurrentLag = qnState.chainHead - qnState.lastCompleteBlock

  if (qnCurrentLag > MAXIMUM_QN_LAGGING_THRESHOLD) {
    throw new Error(
      `Can't perform cleanup as QueryNode processing is lagging by more than` +
        `max allowed lagging threshold of ${MAXIMUM_QN_LAGGING_THRESHOLD}`
    )
  }

  const [model, storedObjectsIds] = await Promise.all([
    getStorageObligationsFromRuntime(qnApi, buckets),
    getDataObjectIDs(),
  ])
  const assignedObjectsIds = model.dataObjects.map((obj) => obj.id)
  const removedIds = _.difference(storedObjectsIds, assignedObjectsIds)
  const removedObjects = await getDataObjectsByIDs(qnApi, removedIds)

  logger.debug(`Cleanup - pruning ${removedIds.length} obsolete objects`)

  // Data objects permanently deleted from the runtime
  const deletedDataObjects = removedIds.filter(
    (removedId) => !removedObjects.some((removedObject) => removedObject.id === removedId)
  )

  // Data objects no-longer assigned to current storage-node
  // operated buckets, and have been moved to other buckets
  const movedDataObjects = removedObjects

  const workingStack = new WorkingStack()
  const processSpawner = new TaskProcessorSpawner(workingStack, asyncWorkersNumber)

  const deletionTasksOfDeletedDataObjects = await Promise.all(
    deletedDataObjects.map((dataObject) => new DeleteLocalFileTask(uploadDirectory, dataObject))
  )
  const deletionTasksOfMovedDataObjects = await getDeletionTasksFromMovedDataObjects(
    workerId,
    uploadDirectory,
    model,
    movedDataObjects
  )

  await workingStack.add(deletionTasksOfDeletedDataObjects)
  await workingStack.add(deletionTasksOfMovedDataObjects)
  await processSpawner.process()
  logger.info('Cleanup ended.')
}

/**
 * Creates the local file deletion tasks.
 *
 * @param currentWorkerId - Worker ID
 * @param uploadDirectory - local directory for data uploading
 * @param dataObligations - defines the current data obligations for the node
 * @param movedDataObjects- obsolete (no longer assigned) data objects that has been moved to other buckets
 */
async function getDeletionTasksFromMovedDataObjects(
  currentWorkerId: number,
  uploadDirectory: string,
  dataObligations: DataObligations,
  movedDataObjects: DataObjectDetailsFragment[]
): Promise<DeleteLocalFileTask[]> {
  const bucketOperatorUrlById = new Map()
  for (const entry of dataObligations.storageBuckets) {
    // Skip all buckets of the current WorkerId (this storage provider)
    if (entry.workerId !== currentWorkerId) {
      bucketOperatorUrlById.set(entry.id, entry.operatorUrl)
    }
  }

  const timeoutMs = 60 * 1000 // 1 minute since it's only a HEAD request
  const deletionTasks: DeleteLocalFileTask[] = []
  await Promise.all(
    movedDataObjects.map(async (movedDataObject) => {
      let dataObjectReplicationCount = 0

      for (const { id } of movedDataObject.storageBag.storageBuckets) {
        const url = urljoin(bucketOperatorUrlById.get(id), 'api/v1/files', movedDataObject.id)
        await superagent.head(url).timeout(timeoutMs)
        dataObjectReplicationCount++
      }

      if (dataObjectReplicationCount < MINIMUM_REPLICATION_THRESHOLD) {
        logger.warn(`Cleanup - data object replication threshold unmet - file deletion canceled: ${movedDataObject.id}`)
        return
      }

      deletionTasks.push(new DeleteLocalFileTask(uploadDirectory, movedDataObject.id))
    })
  )

  return deletionTasks
}
