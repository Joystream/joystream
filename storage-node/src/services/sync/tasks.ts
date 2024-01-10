import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import { pipeline } from 'stream'
import superagent from 'superagent'
import urljoin from 'url-join'
import { promisify } from 'util'
import { v4 as uuidv4 } from 'uuid'
import logger from '../../services/logger'
import {
  addDataObjectIdToCache,
  deleteDataObjectIdFromCache,
  getDataObjectIdFromCache,
} from '../caching/localDataObjects'
import { isNewDataObject } from '../caching/newUploads'
import { hashFile } from '../helpers/hashing'
import { moveFile } from '../helpers/moveFile'
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

export class NoopTask implements SyncTask {
  description(): string {
    return 'noop'
  }

  async execute(): Promise<void> {
    // noop
    console.log('Noop Task Executed')
  }
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
    return `Cleanup - deleting local file: ${this.filename} ....`
  }

  async execute(): Promise<void> {
    const dataObjectId = this.filename
    if (isNewDataObject(dataObjectId)) {
      logger.warn(`Cleanup - possible QueryNode update delay (new file) - deleting file canceled: ${this.filename}`)
      return
    }

    const cachedDataObjectId = getDataObjectIdFromCache(dataObjectId)
    if (cachedDataObjectId && cachedDataObjectId.pinnedCount) {
      logger.warn(
        `Cleanup - the data object is currently in use by downloading api - file deletion canceled: ${this.filename}`
      )
      return
    }
    const fullPath = path.join(this.uploadsDirectory, this.filename)
    await fsPromises.unlink(fullPath)

    deleteDataObjectIdFromCache(dataObjectId)
  }
}

/**
 * Download the file from the remote storage node to the local storage.
 */
export class DownloadFileTask implements SyncTask {
  operatorUrls: string[]

  constructor(
    baseUrls: string[],
    private dataObjectId: string,
    private expectedHash: string,
    private uploadsDirectory: string,
    private tempDirectory: string,
    private downloadTimeout: number,
    private hostId: string
  ) {
    this.operatorUrls = baseUrls.map((baseUrl) => urljoin(baseUrl, 'api/v1/files', dataObjectId))
  }

  description(): string {
    return `Sync - Trying for download of: ${this.dataObjectId} ....`
  }

  async execute(): Promise<void> {
    const operatorUrlIndices: number[] = _.shuffle(_.range(this.operatorUrls.length))

    for (const randomUrlIndex of operatorUrlIndices) {
      const chosenBaseUrl = this.operatorUrls[randomUrlIndex]
      logger.debug(`Sync - random storage node URL was chosen ${chosenBaseUrl}`)

      const filepath = path.join(this.uploadsDirectory, this.dataObjectId)
      try {
        // Try downloading file
        await this.tryDownload(chosenBaseUrl, filepath)

        // if download succeeds, break the loop
        // make this async
        if (fs.existsSync(filepath)) {
          return
        }
      } catch (err) {
        logger.error(`Sync - fetching data error for ${this.dataObjectId}: ${err}`, { err })
      }
    }

    logger.warn(`Sync - cannot get operator URLs for ${this.dataObjectId}`)
  }

  async tryDownload(url: string, filepath: string): Promise<void> {
    const streamPipeline = promisify(pipeline)
    // We create tempfile first to mitigate partial downloads on app (or remote node) crash.
    // This partial downloads will be cleaned up during the next sync iteration.
    const tempFilePath = path.join(this.tempDirectory, uuidv4())
    try {
      const timeoutMs = this.downloadTimeout * 60 * 1000
      // Casting because of:
      // https://stackoverflow.com/questions/38478034/pipe-superagent-response-to-express-response
      const request = superagent
        .get(url)
        .timeout(timeoutMs)
        .set('X-COLOSSUS-HOST-ID', this.hostId) as unknown as NodeJS.ReadableStream
      const fileStream = fs.createWriteStream(tempFilePath)

      request.on('response', (res) => {
        if (!res.ok && res.statusCode !== 404) {
          logger.warn(`Sync - unexpected status code(${res.statusCode}) for ${res?.request?.url}`)
        }

        // Handle 'error' event on Response too, because it will be emitted if request was
        // prematurely aborted/closed due to timeout and the response still was not completed
        // See: https://github.com/nodejs/node/blob/cd171576b2d1376dae3eb371b6da5ccf04dc4a85/lib/_http_client.js#L439-L441
        res.on('error', (err: Error) => {
          logger.warn(`Sync - fetching data error for ${url}: ${err}`, { err })
        })
      })

      request.on('error', (err) => {
        logger.warn(`Sync - fetching data error for ${url}: ${err}`, { err })
      })
      await streamPipeline(request, fileStream)
      await this.verifyDownloadedFile(tempFilePath)
      await moveFile(tempFilePath, filepath)
      addDataObjectIdToCache(this.dataObjectId)
    } catch (err) {
      logger.warn(`Sync - fetching data error for ${url}: ${err}`, { err })
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
    const hash = await hashFile(filePath)

    if (hash !== this.expectedHash) {
      throw new Error(`Invalid file hash. Expected: ${this.expectedHash} - real: ${hash}`)
    }
  }
}
