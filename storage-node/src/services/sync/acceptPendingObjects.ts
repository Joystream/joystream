import { ApiPromise } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import fs from 'fs'
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
      this.acceptPendingDataObjects(api, workerId, maxTxBatchSize).catch((err) =>
        logger.error(`Failed to register pending data objects as accepted in runtime: ${err}`)
      )

      setTimeout(run, intervalMs)
    }
    run()
  }

  getPendingDataObject(objectId: string): [string, string] | undefined {
    return this.pendingDataObjects.get(objectId)
  }

  private async loadPendingDataObjectsFromIDs(pendingIds: string[]): Promise<void> {
    const pendingDataObjects = await this.qnApi.getDataObjectsByIds(pendingIds)

    pendingDataObjects.forEach((dataObject) => {
      const storageBucket = dataObject.storageBag.storageBuckets.find(({ id }) => this.uploadBuckets.includes(id))
      if (storageBucket) {
        this.push(dataObject.id, storageBucket.id, dataObject.storageBag.id)
      } else {
        logger.warn(
          `Data object ${dataObject.id} in pending directory is not assigned to any of the upload buckets: ${this.uploadBuckets}.`
        )
      }
    })
  }

  private async loadPendingDataObjects(): Promise<void> {
    const pendingIds = await this.getPendingObjectsFromLocalDir(this.pendingDataObjectsDir)

    await this.loadPendingDataObjectsFromIDs(pendingIds)

    logger.debug(`Pending data objects ID cache loaded.`)
  }

  public push(dataObjectId: string, storageBucketId: string, bagId: string): void {
    this.pendingDataObjects.set(dataObjectId, [storageBucketId, bagId])
  }

  private async popN(n: number): Promise<AcceptPendingDataObjectsParams[]> {
    const params: AcceptPendingDataObjectsParams[] = []
    let count = 0

    while (count < n && this.pendingDataObjects.size > 0) {
      // Extract the first element from the map
      const [dataObjectId, [storageBucketId, bagId]]: [string, [string, string]] = this.pendingDataObjects
        .entries()
        .next().value
      this.pendingDataObjects.delete(dataObjectId)

      // Find or create the storage bucket in the params array
      let storageBucket = params.find((p) => p.storageBucket.id === storageBucketId)
      if (!storageBucket) {
        const account = this.bucketKeyPairs.get(storageBucketId.toString())
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

      count++
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

  private async acceptPendingDataObjects(
    api: ApiPromise,
    workerId: number,
    uploadsDir: string,
    maxTxBatchSize: number
  ): Promise<void> {
    const params = await this.popN(maxTxBatchSize)

    let failedObjectsIds: string[]
    try {
      failedObjectsIds = await acceptPendingDataObjectsBatch(api, workerId, params)
    } catch (err) {
      // Re-push all params as failed since the entire batch failed
      params.forEach((param) => {
        param.storageBucket.bags.forEach((bag) => {
          bag.dataObjects.forEach((dataObjectId) => {
            this.push(dataObjectId, param.storageBucket.id, bag.id)
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
      const dataObjectIdStr = dataObjectId.toString()
      const currentPath = path.join(this.pendingDataObjectsDir, dataObjectIdStr)
      const newPath = path.join(uploadsDir, dataObjectIdStr)
      registerNewDataObjectId(dataObjectIdStr)
      await addDataObjectIdToCache(dataObjectIdStr)
      await fsPromises.rename(currentPath, newPath)
    }

    if (successfulObjectsIds.length > 0) {
      logger.info(`Successfully registered ${successfulObjectsIds.length} pending data objects as accepted in runtime.`)
    }
  }
}
