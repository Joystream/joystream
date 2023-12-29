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

type PendingObjectDetails = [string, [string, string]][] // dataObjectId -> [storageBucketId, bagId]

export class AcceptPendingObjectsService {
  private static instance: AcceptPendingObjectsService | null = null

  private constructor(
    private qnApi: QueryNodeApi,
    private pendingDataObjectsDir: string,
    private uploadsDir: string,
    private bucketKeyPairs: Map<string, KeyringPair>,
    private uploadBuckets: string[]
  ) {
    this.qnApi = qnApi
    this.pendingDataObjectsDir = pendingDataObjectsDir
    this.uploadsDir = uploadsDir
    this.bucketKeyPairs = bucketKeyPairs
    this.uploadBuckets = uploadBuckets
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
      await this.instance.initPendingFolder()
      this.instance.runWithInterval(api, workerId, maxTxBatchSize, intervalMs)
    }
    return this.instance
  }

  private async initPendingFolder(): Promise<void> {
    if (!fs.existsSync(this.pendingDataObjectsDir)) {
      await fsPromises.mkdir(this.pendingDataObjectsDir, { recursive: true })
    }
  }

  pendingObjectExists(id: string): boolean {
    return fs.existsSync(path.join(this.pendingDataObjectsDir, id))
  }

  private async getPendingObjectsFromFolder(): Promise<string[]> {
    const dirEntries = await fsPromises.readdir(this.pendingDataObjectsDir, { withFileTypes: true })
    return dirEntries.filter((entry) => entry.isFile()).map((entry) => entry.name)
  }

  private runWithInterval(api: ApiPromise, workerId: number, maxTxBatchSize: number, intervalMs: number) {
    ;(async () => {
      for (;;) {
        try {
          const ids = await this.getPendingObjectsFromFolder()
          const objectsToAccept = await this.processPendingObjects(ids)
          await this.acceptPendingDataObjects(api, workerId, objectsToAccept, maxTxBatchSize)
          await new Promise((resolve) => setTimeout(resolve, intervalMs))
        } catch (err) {
          logger.error(`Error processing pending objects: ${err}`)
        }
      }
    })().catch((err) => {
      logger.error(`Accept pending objects service died: ${err}`)
    })
  }

  private async processPendingObjects(pendingIds: string[]): Promise<PendingObjectDetails> {
    const pendingDataObjects = await this.qnApi.getDataObjectsByIds(pendingIds)

    // objects not found in the query node
    const maybeDeletedObjects = _.differenceWith(
      pendingIds,
      pendingDataObjects,
      (id, dataObject) => dataObject.id === id
    )

    if (maybeDeletedObjects.length) {
      // unlink the pending object once we determined it is gone!
      logger.debug(`Found ${maybeDeletedObjects.length} stale pending objects in pending folder`)
    }

    const objectsToAccept: PendingObjectDetails = []

    await Promise.allSettled(
      pendingDataObjects.map(async (dataObject) => {
        const storageBucket = dataObject.storageBag.storageBuckets.find(({ id }) => this.uploadBuckets.includes(id))
        if (storageBucket) {
          if (dataObject.isAccepted) {
            await this.movePendingDataObjectToUploadsDir(dataObject.id)
          } else {
            objectsToAccept.push([dataObject.id, [storageBucket.id, dataObject.storageBag.id]])
          }
        } else {
          logger.debug(
            `Data object ${dataObject.id} in pending directory is no longer assigned to any of the upload buckets: ${this.uploadBuckets}.`
          )
          await fsPromises.unlink(path.join(this.pendingDataObjectsDir, dataObject.id))
        }
      })
    )
    return objectsToAccept
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
        await fsPromises.rename(currentPath, newPath)
        registerNewDataObjectId(dataObjectId)
        addDataObjectIdToCache(dataObjectId)
      }
    } catch (err) {
      logger.error(`Error handling data object ${dataObjectId}: ${err}`)
    }
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

  private async acceptPendingDataObjects(
    api: ApiPromise,
    workerId: number,
    objectsToAccept: PendingObjectDetails,
    maxTxBatchSize: number
  ): Promise<void> {
    const acceptedObjects: string[] = []

    for (const batch of _.chunk(objectsToAccept, maxTxBatchSize)) {
      const params = await this.createAcceptPendingObjectsParams(batch)
      const accepted = await acceptPendingDataObjectsBatch(api, workerId, params)
      acceptedObjects.push(...accepted)
    }

    let moved = 0
    for (const dataObjectId of acceptedObjects) {
      await this.movePendingDataObjectToUploadsDir(dataObjectId)
      moved++
    }

    if (moved > 0) {
      logger.info(`Successfully registered ${moved} pending data objects as accepted in runtime.`)
    }
  }
}
