import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream'
import { promisify } from 'util'
import superagent from 'superagent'
import urljoin from 'url-join'
import { v4 as uuidv4 } from 'uuid'
import logger from '../../services/logger'
import _ from 'lodash'
import { getRemoteDataObjects } from './remoteStorageData'
import { TaskSink } from './workingProcess'
import { isNewDataObject } from '../caching/newUploads'
import { addDataObjectIdToCache, deleteDataObjectIdFromCache } from '../caching/localDataObjects'
import { hashFile } from '../helpers/hashing'
import { parseBagId } from '../helpers/bagTypes'
import { hexToString } from '@polkadot/util'
import { ApiPromise } from '@polkadot/api'
const fsPromises = fs.promises

/**
 * Defines syncronization task abstraction.
 */
export interface SyncTask {
  /**
   * Returns human-friendly task description.
   */
  description(): string

  /**
   * Performs the task.
   */
  execute(): Promise<void>
}

/**
 * Deletes the file in the local storage by its name.
 */
export class DeleteLocalFileTask implements SyncTask {
  uploadsDirectory: string
  filename: string

  constructor(uploadsDirectory: string, filename: string) {
    this.uploadsDirectory = uploadsDirectory
    this.filename = filename
  }

  description(): string {
    return `Sync - deleting local file: ${this.filename} ....`
  }

  async execute(): Promise<void> {
    const dataObjectId = this.filename
    if (isNewDataObject(dataObjectId)) {
      logger.warn(`Sync - possible QueryNode update delay (new file) - deleting file canceled: ${this.filename}`)
      return
    }

    const fullPath = path.join(this.uploadsDirectory, this.filename)
    await fsPromises.unlink(fullPath)

    await deleteDataObjectIdFromCache(dataObjectId)
  }
}

/**
 * Download the file from the remote storage node to the local storage.
 */
export class DownloadFileTask implements SyncTask {
  dataObjectId: string
  expectedHash?: string
  uploadsDirectory: string
  tempDirectory: string
  url: string

  constructor(
    baseUrl: string,
    dataObjectId: string,
    expectedHash: string | undefined,
    uploadsDirectory: string,
    tempDirectory: string
  ) {
    this.dataObjectId = dataObjectId
    this.expectedHash = expectedHash
    this.uploadsDirectory = uploadsDirectory
    this.tempDirectory = tempDirectory
    this.url = urljoin(baseUrl, 'api/v1/files', dataObjectId)
  }

  description(): string {
    return `Sync - downloading file: ${this.url} to ${this.uploadsDirectory} ....`
  }

  async execute(): Promise<void> {
    const streamPipeline = promisify(pipeline)
    const filepath = path.join(this.uploadsDirectory, this.dataObjectId)
    // We create tempfile first to mitigate partial downloads on app (or remote node) crash.
    // This partial downloads will be cleaned up during the next sync iteration.
    const tempFilePath = path.join(this.uploadsDirectory, this.tempDirectory, uuidv4())
    try {
      const timeoutMs = 30 * 60 * 1000 // 30 min for large files (~ 10 GB)
      // Casting because of:
      // https://stackoverflow.com/questions/38478034/pipe-superagent-response-to-express-response
      const request = (superagent.get(this.url).timeout(timeoutMs) as unknown) as NodeJS.ReadableStream
      const fileStream = fs.createWriteStream(tempFilePath)

      request.on('response', (res) => {
        if (!res.ok) {
          logger.error(`Sync - unexpected status code(${res.statusCode}) for ${res?.request?.url}`)
        }
      })
      await streamPipeline(request, fileStream)
      await this.verifyDownloadedFile(tempFilePath)
      await fsPromises.rename(tempFilePath, filepath)
      await addDataObjectIdToCache(this.dataObjectId)
    } catch (err) {
      logger.error(`Sync - fetching data error for ${this.url}: ${err}`, { err })
      try {
        logger.warn(`Cleaning up file ${tempFilePath}`)
        await fsPromises.unlink(tempFilePath)
      } catch (err) {
        logger.error(`Sync - cannot cleanup file ${tempFilePath}: ${err}`, { err })
      }
    }
  }

  /** Compares expected and real IPFS hashes
   *
   * @param filePath downloaded file path
   */
  async verifyDownloadedFile(filePath: string): Promise<void> {
    if (!_.isEmpty(this.expectedHash)) {
      const hash = await hashFile(filePath)

      if (hash !== this.expectedHash) {
        throw new Error(`Invalid file hash. Expected: ${this.expectedHash} - real: ${hash}`)
      }
    }
  }
}

/**
 * Resolve remote storage node URLs and creates file downloading tasks (DownloadFileTask).
 */
export class PrepareDownloadFileTask implements SyncTask {
  bagId: string
  dataObjectId: string
  operatorUrlCandidates: string[]
  taskSink: TaskSink
  uploadsDirectory: string
  tempDirectory: string
  api?: ApiPromise

  constructor(
    operatorUrlCandidates: string[],
    bagId: string,
    dataObjectId: string,
    uploadsDirectory: string,
    tempDirectory: string,
    taskSink: TaskSink,
    api?: ApiPromise
  ) {
    this.api = api
    this.bagId = bagId
    this.dataObjectId = dataObjectId
    this.taskSink = taskSink
    this.operatorUrlCandidates = operatorUrlCandidates
    this.uploadsDirectory = uploadsDirectory
    this.tempDirectory = tempDirectory
  }

  description(): string {
    return `Sync - preparing for download of: ${this.dataObjectId} ....`
  }

  async execute(): Promise<void> {
    // Create an array of operator URL indices to maintain a random URL choice
    // cannot use the original array because we shouldn't modify the original data.
    // And cloning it seems like a heavy operation.
    const operatorUrlIndices: number[] = [...Array(this.operatorUrlCandidates.length).keys()]

    if (_.isEmpty(this.bagId)) {
      logger.error(`Sync - invalid task - no bagId for ${this.dataObjectId}`)
      return
    }

    while (!_.isEmpty(operatorUrlIndices)) {
      const randomUrlIndex = _.sample(operatorUrlIndices)
      if (randomUrlIndex === undefined) {
        logger.warn(`Sync - cannot get a random URL`)
        break
      }

      const randomUrl = this.operatorUrlCandidates[randomUrlIndex]
      logger.debug(`Sync - random storage node URL was chosen ${randomUrl}`)

      // Remove random url from the original list.
      _.remove(operatorUrlIndices, (index) => index === randomUrlIndex)

      try {
        const chosenBaseUrl = randomUrl
        const [remoteOperatorIds, hash] = await Promise.all([
          getRemoteDataObjects(chosenBaseUrl),
          this.getExpectedHash(),
        ])

        if (remoteOperatorIds.includes(this.dataObjectId)) {
          const newTask = new DownloadFileTask(
            chosenBaseUrl,
            this.dataObjectId,
            hash,
            this.uploadsDirectory,
            this.tempDirectory
          )

          return this.taskSink.add([newTask])
        }
      } catch (err) {
        logger.error(`Sync - fetching data error for ${this.dataObjectId}: ${err}`, { err })
      }
    }

    logger.warn(`Sync - cannot get operator URLs for ${this.dataObjectId}`)
  }

  async getExpectedHash(): Promise<string | undefined> {
    if (this.api !== undefined) {
      const convertedBagId = parseBagId(this.bagId)
      const dataObject = await this.api.query.storage.dataObjectsById(convertedBagId, this.dataObjectId)
      return hexToString(dataObject.ipfsContentId.toString())
    }

    return undefined
  }
}
