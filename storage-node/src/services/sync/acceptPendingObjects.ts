import { ApiPromise } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import { registerNewDataObjectId } from '../caching/newUploads'
import { hashFile } from '../helpers/hashing'
import { acceptObject } from '../helpers/moveFile'
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
      this.instance.runWithInterval(api, workerId, maxTxBatchSize, intervalMs)
    }
    return this.instance
  }

  async pendingObjectExists(id: string): Promise<boolean> {
    return fsPromises
      .access(path.join(this.pendingDataObjectsDir, id), fs.constants.F_OK)
      .then(() => true)
      .catch(() => false)
  }

  private async getPendingObjectsFromFolder(): Promise<string[]> {
    const dirEntries = await fsPromises.readdir(this.pendingDataObjectsDir, { withFileTypes: true })
    return dirEntries.filter((entry) => entry.isFile()).map((entry) => entry.name)
  }

  private runWithInterval(api: ApiPromise, workerId: number, maxTxBatchSize: number, intervalMs: number) {
    const run = () => {
      this.getPendingObjectsFromFolder()
        .then((ids) => this.processPendingObjects(ids))
        .then((objectsToAccept) => this.acceptPendingDataObjects(api, workerId, objectsToAccept, maxTxBatchSize))
        .catch((err) => logger.error(`Error processing pending objects: ${err}`))
        .finally(() => setTimeout(run, intervalMs))
    }
    run()
  }

  private async processPendingObjects(pendingIds: string[]): Promise<PendingObjectDetails> {
    const pendingDataObjects = await this.qnApi.getDataObjectDetails(pendingIds)

    // objects not found in the query node
    const maybeDeletedObjectIds = pendingIds.filter(
      (id) => !pendingDataObjects.some((dataObject) => dataObject.id === id)
    )

    if (maybeDeletedObjectIds.length) {
      logger.debug(`Found ${maybeDeletedObjectIds.length} stale pending objects in pending folder`)

      // Check if the stale objects have been ACTUALLY deleted using the deleted events from Storage Squid
      const deletedObjectIds = await this.qnApi.getDataObjectDeletedEvents(maybeDeletedObjectIds)

      // Delete the stale objects from the pending folder
      await Promise.allSettled(
        deletedObjectIds.map(({ data: { dataObjectId } }) =>
          fsPromises.unlink(path.join(this.pendingDataObjectsDir, dataObjectId))
        )
      )
    }

    const objectsToAccept: PendingObjectDetails = []

    await Promise.allSettled(
      pendingDataObjects.map(async (dataObject) => {
        // Verify the ipfshash. It may be redundant for objects that just came in through the http api and have already been validated.
        // Bit important however to make sure objects that might have been placed by operator directly into the pending folder
        // are correct. Operator may do this under following scenarios:
        // - moving files from other location after chainging pending folder path.
        // - recovering "lost" objects from a backup/archive and placing them into the pending folder for processing..
        // - bootstrapping storage from archive (which may be faster than syncing from other nodes..)
        const ipfsHash = await hashFile(path.join(this.pendingDataObjectsDir, dataObject.id))
        if (ipfsHash !== dataObject.ipfsHash) {
          logger.warn(`Dropping object in pending folder with invalid ipfshash ${dataObject.id}`)
          await fsPromises.unlink(path.join(this.pendingDataObjectsDir, dataObject.id))
          return
        }

        const storageBucket = dataObject.storageBag.storageBuckets.find(({ storageBucket }) =>
          this.uploadBuckets.includes(storageBucket.id)
        )
        if (storageBucket) {
          if (dataObject.isAccepted) {
            await this.movePendingDataObjectToUploadsDir(dataObject.id)
          } else {
            objectsToAccept.push([dataObject.id, [storageBucket.storageBucket.id, dataObject.storageBag.id]])
          }
        } else {
          logger.debug(
            `Data object ${dataObject.id} in pending directory is no longer assigned to any of the upload buckets: ${this.uploadBuckets}. Moving it to the uploads directory.`
          )
          await this.movePendingDataObjectToUploadsDir(dataObject.id)
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
        await acceptObject(dataObjectId, currentPath, newPath)
        registerNewDataObjectId(dataObjectId)
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
