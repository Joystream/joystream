import { ApiPromise } from '@polkadot/api'
import _ from 'lodash'
import superagent from 'superagent'
import urljoin from 'url-join'
import { getDataObjectIDs } from '../../services/caching/localDataObjects'
import rootLogger from '../../services/logger'
import { QueryNodeApi } from '../queryNode/api'
import { DataObjectIdsLoader, DataObligations, getStorageObligationsFromRuntime } from './storageObligations'
import { DeleteLocalFileTask } from './tasks'
import { TaskProcessorSpawner, WorkingStack } from '../processing/workingProcess'
import { DataObjectWithBagDetailsFragment } from '../queryNode/generated/queries'
import { Logger } from 'winston'

/**
 * The maximum allowed threshold by which the QN processor can lag behind
 * the chainHead (current block), beyond that Cleanup service won't be
 * run to avoid pruning the assets based on the outdated state
 */
export const MAXIMUM_QN_LAGGING_THRESHOLD = 100

/**
 * The number of (peer) storage operators that should hold the assets, before the
 * cleanup/pruning of the outdated assets from this storage node can be initialed.
 * Default=2.
 */
export const MINIMUM_REPLICATION_THRESHOLD = parseInt(process.env.CLEANUP_MIN_REPLICATION_THRESHOLD || '0') || 2

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
 * @param asyncWorkersNumber - maximum parallel cleanups number
 * @param asyncWorkersTimeout - downloading asset timeout
 * @param qnApi - Query Node API
 * @param uploadDirectory - local directory to get file names from
 * @param tempDirectory - local directory for temporary data uploading
 */
export async function performCleanup(
  buckets: string[],
  asyncWorkersNumber: number,
  api: ApiPromise,
  qnApi: QueryNodeApi,
  uploadDirectory: string,
  hostId: string
): Promise<void> {
  const logger = rootLogger.child({ label: 'Cleanup' })
  logger.info('Started cleanup service...')
  const squidStatus = await qnApi.getState()
  if (!squidStatus || !squidStatus.height) {
    throw new Error("Can't perform cleanup because QueryNode state info is unavailable")
  }

  const chainHead = (await api.derive.chain.bestNumber()).toNumber() || 0

  const qnCurrentLag = chainHead - squidStatus.height

  if (qnCurrentLag > MAXIMUM_QN_LAGGING_THRESHOLD) {
    throw new Error(
      `Can't perform cleanup as QueryNode processing is lagging by more than` +
        `max allowed lagging threshold of ${MAXIMUM_QN_LAGGING_THRESHOLD}`
    )
  }

  const model = await getStorageObligationsFromRuntime(qnApi, buckets)
  const storedObjectsIds = getDataObjectIDs()

  const assignedObjectsLoader = model.createAssignedObjectsIdsLoader()
  const assignedObjectIds = new Set(await assignedObjectsLoader.getAll())
  const obsoleteObjectIds = new Set(storedObjectsIds.filter((id) => !assignedObjectIds.has(id)))

  // If objects are obsolete but still exist: They are "moved" objects
  const movedObjectsLoader = new DataObjectIdsLoader(qnApi, { by: 'ids', ids: Array.from(obsoleteObjectIds) })
  const movedObjectIds = new Set(await movedObjectsLoader.getAll())

  // If objects are obsolete and don't exist: They are "deleted objects"
  const deletedDataObjectIds = new Set([...obsoleteObjectIds].filter((id) => !movedObjectIds.has(id)))

  logger.info(`stored objects: ${storedObjectsIds.length}, assigned objects: ${assignedObjectIds.size}`)
  if (obsoleteObjectIds.size) {
    logger.info(
      `pruning ${obsoleteObjectIds.size} obsolete objects ` +
        `(${movedObjectIds.size} moved, ${deletedDataObjectIds.size} deleted)`
    )

    const workingStack = new WorkingStack()
    const processSpawner = new TaskProcessorSpawner(workingStack, asyncWorkersNumber)

    // Execute deleted objects removal tasks in batches of 10_000
    if (deletedDataObjectIds.size) {
      let deletedProcessed = 0
      logger.info(`removing ${deletedDataObjectIds.size} deleted objects...`)
      for (let deletedObjectsIdsBatch of _.chunk([...deletedDataObjectIds], 10_000)) {
        // Confirm whether the objects were actually deleted by fetching the related deletion events
        const dataObjectDeletedEvents = await qnApi.getDataObjectDeletedEvents(deletedObjectsIdsBatch)
        const confirmedIds = new Set(dataObjectDeletedEvents.map((e) => e.data.dataObjectId))
        deletedObjectsIdsBatch = deletedObjectsIdsBatch.filter((id) => {
          if (confirmedIds.has(id)) {
            return true
          } else {
            logger.warn(`Could not find DataObjectDeleted event for object ${id}, skipping from cleanup...`)
            return false
          }
        })
        const deletionTasks = deletedObjectsIdsBatch.map((id) => new DeleteLocalFileTask(uploadDirectory, id))
        await workingStack.add(deletionTasks)
        await processSpawner.process()
        deletedProcessed += deletedObjectsIdsBatch.length
        logger.debug(`${deletedProcessed} / ${deletedDataObjectIds.size} deleted objects processed...`)
      }
    }

    // Execute moved objects removal tasks in batches of 10_000
    if (movedObjectIds.size) {
      let movedProcessed = 0
      logger.info(`removing ${movedObjectIds.size} moved objects...`)
      for (const movedObjectsIdsBatch of _.chunk([...movedObjectIds], 10_000)) {
        const movedDataObjectsBatch = await qnApi.getDataObjectsWithBagDetails(movedObjectsIdsBatch)
        const deletionTasksOfMovedDataObjects = await getDeletionTasksFromMovedDataObjects(
          logger,
          uploadDirectory,
          model,
          movedDataObjectsBatch,
          hostId
        )
        await workingStack.add(deletionTasksOfMovedDataObjects)
        await processSpawner.process()
        movedProcessed += movedDataObjectsBatch.length
        logger.debug(`${movedProcessed} / ${movedObjectIds.size} moved objects processed...`)
      }
    }
  } else {
    logger.info('No objects to prune, skipping...')
  }

  logger.info('Cleanup ended.')
}

/**
 * Creates the local file deletion tasks.
 *
 * @param logger - cleanup service logger
 * @param uploadDirectory - local directory for data uploading
 * @param dataObligations - defines the current data obligations for the node
 * @param movedDataObjects- obsolete (no longer assigned) data objects that has been moved to other buckets
 * @param hostId - host id of the current node
 */
async function getDeletionTasksFromMovedDataObjects(
  logger: Logger,
  uploadDirectory: string,
  dataObligations: DataObligations,
  movedDataObjects: DataObjectWithBagDetailsFragment[],
  hostId: string
): Promise<DeleteLocalFileTask[]> {
  const timeoutMs = 60 * 1000 // 1 minute since it's only a HEAD request
  const deletionTasks: DeleteLocalFileTask[] = []

  const { bucketOperatorUrlById } = dataObligations
  await Promise.allSettled(
    movedDataObjects.map(async (movedDataObject) => {
      let dataObjectReplicationCount = 0

      for (const { storageBucket } of movedDataObject.storageBag.storageBuckets) {
        const nodeUrl = bucketOperatorUrlById.get(storageBucket.id)
        if (nodeUrl) {
          const fileUrl = urljoin(nodeUrl, 'api/v1/files', movedDataObject.id)
          await superagent.head(fileUrl).timeout(timeoutMs).set('X-COLOSSUS-HOST-ID', hostId)
          dataObjectReplicationCount++
        }
      }

      if (dataObjectReplicationCount < MINIMUM_REPLICATION_THRESHOLD) {
        logger.warn(`data object replication threshold unmet - file deletion canceled: ${movedDataObject.id}`)
        return
      }

      deletionTasks.push(new DeleteLocalFileTask(uploadDirectory, movedDataObject.id))
    })
  )

  return deletionTasks
}
