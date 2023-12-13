import { ApiPromise } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import { addDataObjectIdToCache } from '../caching/localDataObjects'
import { registerNewDataObjectId } from '../caching/newUploads'
import logger from '../logger'
import { QueryNodeApi } from '../queryNode/api'
import { acceptPendingDataObjectsBatch } from '../runtime/extrinsics'
const fsPromises = fs.promises

export type AcceptPendingDataObjectsParams = {
  account: KeyringPair
  storageBucket: {
    id: string
    bags: {
      id: string
      dataObjects: string[]
    }[]
  }
}

export class AcceptPendingObjectsService {
  private static instance: AcceptPendingObjectsService | null = null
  private pendingDataObjects: Map<string, [string, string]> // dataObjectId -> [storageBucketId, bagId]

  private constructor(
    private qnApi: QueryNodeApi,
    private pendingDataObjectsDir: string,
    private uploadsDir: string,
    private bucketKeyPairs: Map<string, KeyringPair>,
    private uploadBuckets: string[]
  ) {
    this.pendingDataObjects = new Map()
  }

  public static async create(
    api: ApiPromise,
    qnApi: QueryNodeApi,
    workerId: number,
    uploadsDir: string,
    pendingDataObjectsDir: string,
    bucketKeyPairs: Map<string, KeyringPair>,
    uploadBuckets: string[],
    maxTxBatchSize: number,
    intervalMs: number
  ): Promise<AcceptPendingObjectsService> {
    if (this.instance === null) {
      this.instance = new AcceptPendingObjectsService(
        qnApi,
        pendingDataObjectsDir,
        uploadsDir,
        bucketKeyPairs,
        uploadBuckets
      )
      await this.instance.loadPendingDataObjects()
      this.instance.runWithInterval(api, workerId, maxTxBatchSize, intervalMs)
    }
    return this.instance
  }

  private runWithInterval(api: ApiPromise, workerId: number, maxTxBatchSize: number, intervalMs: number) {
    const run = () => {
      this.acceptPendingDataObjects(api, workerId, maxTxBatchSize)
        .catch((err) => logger.error(`Failed to register pending data objects as accepted in runtime: ${err}`))
        .finally(() => setTimeout(run, intervalMs))
    }
    run()
  }

  getPendingDataObject(objectId: string): [string, string] | undefined {
    return this.pendingDataObjects.get(objectId)
  }

  private async loadPendingDataObjectsFromIDs(pendingIds: string[]): Promise<void> {
    const pendingDataObjects = await this.qnApi.getDataObjectDetails(pendingIds)

    const deletedObjects = _.differenceWith(pendingIds, pendingDataObjects, (id, dataObject) => dataObject.id === id)

    // Remove stale objects from the pending directory
    if (deletedObjects.length) {
      logger.warn(`Found data objects deleted from runtime in Pending directory: ${deletedObjects.length}`)
      await Promise.all(deletedObjects.map((id) => fsPromises.unlink(path.join(this.pendingDataObjectsDir, id))))
    }

    await Promise.all(
      pendingDataObjects.map(async (dataObject) => {
        const storageBucket = dataObject.storageBag.storageBuckets.find(({ id }) => this.uploadBuckets.includes(id))

        if (storageBucket) {
          if (dataObject.isAccepted) {
            await this.movePendingDataObjectToUploadsDir(dataObject.id)
          } else {
            this.add(dataObject.id, storageBucket.id, dataObject.storageBag.id)
          }
        } else {
          logger.warn(
            `Data object ${dataObject.id} in pending directory is no longer assigned to any of the upload buckets: ${this.uploadBuckets}.`
          )
        }
      })
    )
  }

  private async loadPendingDataObjects(): Promise<void> {
    const pendingIds = await this.getPendingObjectsFromLocalDir(this.pendingDataObjectsDir)

    await this.loadPendingDataObjectsFromIDs(pendingIds)

    logger.debug(`Pending data objects ID cache loaded.`)
  }

  private async movePendingDataObjectToUploadsDir(dataObjectId: string): Promise<void> {
    const currentPath = path.join(this.pendingDataObjectsDir, dataObjectId)
    const newPath = path.join(this.uploadsDir, dataObjectId)

    try {
      // Check if the file already exists in the uploads directory (i.e. synced from other operators)
      try {
        await fsPromises.access(newPath, fs.constants.F_OK)
        logger.warn(`File ${dataObjectId} already exists in uploads directory. Deleting current file.`)
        await fsPromises.unlink(currentPath)
      } catch {
        // If the file does not exist in the uploads directory, proceed with the rename
        registerNewDataObjectId(dataObjectId)
        await addDataObjectIdToCache(dataObjectId)
        await fsPromises.rename(currentPath, newPath)
      }
    } catch (err) {
      logger.error(`Error handling data object ${dataObjectId}: ${err}`)
    }
  }

  public add(dataObjectId: string, storageBucketId: string, bagId: string): void {
    this.pendingDataObjects.set(dataObjectId, [storageBucketId, bagId])
  }

  private take(n: number): Array<[string, [string, string]]> {
    const pending: Array<[string, [string, string]]> = []
    let count = 0

    for (const [dataObjectId, bucketAndBag] of this.pendingDataObjects.entries()) {
      if (count >= n) break
      pending.push([dataObjectId, bucketAndBag])
      this.pendingDataObjects.delete(dataObjectId)
      count++
    }

    return pending
  }

  private async createAcceptPendingObjectsParams(
    pendingObjects: Array<[string, [string, string]]>
  ): Promise<AcceptPendingDataObjectsParams[]> {
    const params: AcceptPendingDataObjectsParams[] = []

    // Find or create the storage bucket in the params array
    for (const [dataObjectId, [storageBucketId, bagId]] of pendingObjects) {
      let storageBucket = params.find((p) => p.storageBucket.id === storageBucketId)
      if (!storageBucket) {
        const account = this.bucketKeyPairs.get(storageBucketId)
        if (!account) {
          logger.error(`No key pair found for storage bucket ${storageBucketId}.`)
          continue
        }

        storageBucket = {
          account,
          storageBucket: {
            id: storageBucketId,
            bags: [],
          },
        }
        params.push(storageBucket)
      }

      // Find or create the bag in the storage bucket in the params array
      let bag = storageBucket.storageBucket.bags.find((b) => b.id === bagId)
      if (!bag) {
        bag = {
          id: bagId,
          dataObjects: [],
        }
        storageBucket.storageBucket.bags.push(bag)
      }

      // Add the data object to the bag in the params array
      bag.dataObjects.push(dataObjectId)
    }

    return params
  }

  /**
   * Returns file names from the pending objects directory.
   *
   * @param directory - local directory to get file names from
   */
  private async getPendingObjectsFromLocalDir(directory: string): Promise<string[]> {
    // Check if directory exists and if not, create it
    if (!fs.existsSync(directory)) {
      await fsPromises.mkdir(directory)
    }

    // Read the directory contents
    return await fsPromises.readdir(directory)
  }

  private async acceptPendingDataObjects(api: ApiPromise, workerId: number, maxTxBatchSize: number): Promise<void> {
    const params = await this.createAcceptPendingObjectsParams(this.take(maxTxBatchSize))

    let failedObjectsIds: string[]
    try {
      failedObjectsIds = await acceptPendingDataObjectsBatch(api, workerId, params)
    } catch (err) {
      // Re-push all params as failed since the entire batch failed
      params.forEach((param) => {
        param.storageBucket.bags.forEach((bag) => {
          bag.dataObjects.forEach((dataObjectId) => {
            this.add(dataObjectId, param.storageBucket.id, bag.id)
          })
        })
      })

      throw err
    }

    // Handle failed calls
    await this.loadPendingDataObjectsFromIDs(failedObjectsIds)

    const successfulObjectsIds = params.flatMap((param) =>
      param.storageBucket.bags.flatMap((bag) =>
        bag.dataObjects.filter(
          (dataObjectId) => !failedObjectsIds.some((failedId) => failedId === dataObjectId.toString())
        )
      )
    )

    // Handle successful calls
    for (const dataObjectId of successfulObjectsIds) {
      await this.movePendingDataObjectToUploadsDir(dataObjectId.toString())
    }

    if (successfulObjectsIds.length > 0) {
      logger.info(`Successfully registered ${successfulObjectsIds.length} pending data objects as accepted in runtime.`)
    }
  }
}
