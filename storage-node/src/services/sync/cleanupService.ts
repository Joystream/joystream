import { ApiPromise } from '@polkadot/api'
import _ from 'lodash'
import superagent from 'superagent'
import urljoin from 'url-join'
import { getDataObjectIDs } from '../../services/caching/localDataObjects'
import rootLogger from '../../services/logger'
import { QueryNodeApi } from '../queryNode/api'
import { DataObligations, getStorageObligationsFromRuntime } from './storageObligations'
import { DeleteLocalFileTask } from './tasks'
import { TaskProcessorSpawner, WorkingStack } from '../processing/workingProcess'
import { DataObjectWithBagDetailsFragment } from '../queryNode/generated/queries'
import { Logger } from 'winston'
import pLimit from 'p-limit'

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
 * @param buckets - selected storage buckets
 * @param asyncWorkersNumber - maximum parallel cleanups number
 * @param api - runtime API promise
 * @param qnApi - Query Node API
 * @param uploadDirectory - local directory to get file names from
 * @param batchSize - max. number of data objects to process in a single batch
 * @param hostId
 */
export async function performCleanup(
  buckets: string[],
  asyncWorkersNumber: number,
  api: ApiPromise,
  qnApi: QueryNodeApi,
  uploadDirectory: string,
  batchSize: number,
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

  const assignedObjectIds = new Set(await model.getAssignedDataObjectIds())
  const obsoleteObjectIds = new Set(storedObjectsIds.filter((id) => !assignedObjectIds.has(id)))

  // If objects are obsolete but still exist: They are "moved" objects
  const movedObjectIds = new Set(await qnApi.getExistingDataObjectsIdsByIds([...obsoleteObjectIds]))

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

    // Execute deleted objects removal tasks in batches
    if (deletedDataObjectIds.size) {
      let deletedProcessed = 0
      logger.info(`removing ${deletedDataObjectIds.size} deleted objects...`)
      for (let deletedObjectsIdsBatch of _.chunk([...deletedDataObjectIds], batchSize)) {
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
      logger.info(`${deletedProcessed}/${deletedDataObjectIds.size} deleted data objects successfully cleared.`)
    }

    // Execute moved objects removal tasks in batches
    if (movedObjectIds.size) {
      let movedProcessed = 0
      logger.info(`removing ${movedObjectIds.size} moved objects...`)
      for (const movedObjectsIdsBatch of _.chunk([...movedObjectIds], batchSize)) {
        const movedDataObjectsBatch = await qnApi.getDataObjectsWithBagDetails(movedObjectsIdsBatch)
        const deletionTasksOfMovedDataObjects = await getDeletionTasksFromMovedDataObjects(
          logger,
          uploadDirectory,
          model,
          movedDataObjectsBatch,
          asyncWorkersNumber,
          hostId
        )
        const numberOfTasks = deletionTasksOfMovedDataObjects.length
        if (numberOfTasks !== movedObjectsIdsBatch.length) {
          logger.warn(
            `Only ${numberOfTasks} / ${movedObjectsIdsBatch.length} moved objects will be removed in this batch...`
          )
        }
        await workingStack.add(deletionTasksOfMovedDataObjects)
        await processSpawner.process()
        movedProcessed += numberOfTasks
        logger.debug(`${movedProcessed} / ${movedObjectIds.size} moved objects processed...`)
      }
      logger.info(`${movedProcessed}/${movedObjectIds.size} moved data objects successfully cleared.`)
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
 * @param asyncWorkersNumber - number of async workers assigned for cleanup tasks
 * @param hostId - host id of the current node
 */
async function getDeletionTasksFromMovedDataObjects(
  logger: Logger,
  uploadDirectory: string,
  dataObligations: DataObligations,
  movedDataObjects: DataObjectWithBagDetailsFragment[],
  asyncWorkersNumber: number,
  hostId: string
): Promise<DeleteLocalFileTask[]> {
  const timeoutMs = 60 * 1000 // 1 minute since it's only a HEAD request
  const deletionTasks: DeleteLocalFileTask[] = []

  const { bucketOperatorUrlById } = dataObligations
  const limit = pLimit(asyncWorkersNumber)
  let checkedObjects = 0
  const checkReplicationThreshold = async (movedDataObject: DataObjectWithBagDetailsFragment) => {
    ++checkedObjects
    if (checkedObjects % asyncWorkersNumber === 0) {
      logger.debug(
        `Checking replication: ${checkedObjects}/${movedDataObjects.length} (active: ${limit.activeCount}, pending: ${limit.pendingCount})`
      )
    }

    const externaBucketEndpoints = movedDataObject.storageBag.storageBuckets
      .map(({ storageBucket: { id } }) => {
        return bucketOperatorUrlById.get(id)
      })
      .filter((url): url is string => !!url)
    let lastErr = ''
    let successes = 0
    let failures = 0

    if (externaBucketEndpoints.length >= MINIMUM_REPLICATION_THRESHOLD) {
      for (const nodeUrl of externaBucketEndpoints) {
        const fileUrl = urljoin(nodeUrl, 'api/v1/files', movedDataObject.id)
        try {
          await superagent.head(fileUrl).timeout(timeoutMs).set('X-COLOSSUS-HOST-ID', hostId)
          ++successes
        } catch (e) {
          ++failures
          lastErr = e instanceof Error ? e.message : e.toString()
        }
        if (successes >= MINIMUM_REPLICATION_THRESHOLD) {
          break
        }
      }
    }

    if (successes < MINIMUM_REPLICATION_THRESHOLD) {
      logger.debug(
        `Replication threshold unmet for object ${movedDataObject.id} ` +
          `(buckets: ${externaBucketEndpoints.length}, successes: ${successes}, failures: ${failures}). ` +
          (lastErr ? `Last error: ${lastErr}. ` : '') +
          `File deletion canceled...`
      )
      return
    }

    deletionTasks.push(new DeleteLocalFileTask(uploadDirectory, movedDataObject.id))
  }

  await Promise.all(movedDataObjects.map((movedDataObject) => limit(() => checkReplicationThreshold(movedDataObject))))

  const failedCount = movedDataObjects.length - deletionTasks.length
  if (failedCount > 0) {
    logger.warn(
      `Replication threshold was unmet or couldn't be verified for ${failedCount} / ${movedDataObjects.length} objects in the current batch.`
    )
  }

  logger.debug('Checking replication: Done')

  return deletionTasks
}
