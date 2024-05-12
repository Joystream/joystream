import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import { pipeline } from 'stream'
import superagent from 'superagent'
import urljoin from 'url-join'
import { promisify } from 'util'
import { v4 as uuidv4 } from 'uuid'
import logger from '../../services/logger'
import { isNewDataObject } from '../caching/newUploads'
import { hashFile } from '../helpers/hashing'
import { moveFile } from '../helpers/moveFile'
import { LocalDataObjects } from '../caching/localDataObjects'
import { AbstractConnectionHandler } from '../cloud'
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
  localCache: LocalDataObjects // by ref
  filename: string

  constructor(serverConfig: ServerConfig, filename: string) {
    this.uploadsDirectory = serverConfig.localPaths!.uploads
    this.filename = filename
    this.localCache = serverConfig.dataObjectCache
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

    const cachedDataObjectId = await this.localCache.getDataObjectIdFromCache(dataObjectId)
    if (cachedDataObjectId && cachedDataObjectId.dataObjectEntry.pinCount) {
      logger.warn(
        `Cleanup - the data object is currently in use by downloading api - file deletion canceled: ${this.filename}`
      )
      return
    }
    const fullPath = path.join(this.uploadsDirectory, this.filename)
    await fsPromises.unlink(fullPath)

    this.localCache.deleteDataObjectIdFromCache(dataObjectId)
  }
}

/**
 * Download the file from the remote storage node to the local storage.
 */
export class DownloadFileTask implements SyncTask {
  operatorUrls: string[]
  localCache: LocalDataObjects // by ref
  uploadsDirectory: string
  tempDirectory: string

  constructor(
    serverConfig: ServerConfig,
    baseUrls: string[],
    protected dataObjectId: string,
    protected expectedHash: string,
    protected downloadTimeout: number,
    protected hostId: string
  ) {
    this.operatorUrls = baseUrls.map((baseUrl) => urljoin(baseUrl, 'api/v1/files', dataObjectId))
    this.localCache = serverConfig.dataObjectCache
    this.uploadsDirectory = serverConfig.localPaths!.uploads
    this.tempDirectory = serverConfig.localPaths!.tempFolder
  }

  description(): string {
    return `Sync - Trying for download of object: ${this.dataObjectId} ...`
  }

  async execute(): Promise<void> {
    await withRandomUrls(this.operatorUrls, async (chosenBaseUrl) => {
      const filepath = path.join(this.uploadsDirectory, this.dataObjectId)
      try {
        // Try downloading file
        await this.tryDownload(chosenBaseUrl, filepath)

        // if download succeeds, break the loop
        await fsPromises.access(filepath, fs.constants.F_OK)
        return
      } catch (err) {
        logger.error(`Sync - fetching data error for ${this.dataObjectId}: ${err}`, { err })
      }
      await this.tryDownload(chosenBaseUrl, filepath)
    })

    logger.warn(`Sync - Failed to download ${this.dataObjectId}`)
  }

  async tryDownload(url: string, filepath: string): Promise<void> {
    const tempFilePath = await this.tryDownloadToTemp(url, filepath)
    if (!tempFilePath) {
      await moveFile(tempFilePath!, filepath)
      this.localCache.addDataObjectIdToCache(this.dataObjectId)
    }
  }
  async tryDownloadToTemp(url: string, filepath: string): Promise<string | null> {
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
      return tempFilePath
    } catch (err) {
      logger.warn(`Sync - fetching data error for ${url}: ${err}`, { err })
      try {
        logger.warn(`Cleaning up file ${tempFilePath}`)
        await fsPromises.unlink(tempFilePath)
      } catch (err) {
        logger.error(`Sync - cannot cleanup file ${tempFilePath}: ${err}`, { err })
      }
    }
    return null
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

// create a similar UploadFileTask
export class UploadFileTask extends DownloadFileTask {
  private connection: AbstractConnectionHandler

  constructor(
    serverConfig: ServerConfig,
    baseUrls: string[],
    dataObjectId: string,
    expectedHash: string,
    downloadTimeout: number,
    hostId: string
  ) {
    super(serverConfig, baseUrls, dataObjectId, expectedHash, downloadTimeout, hostId)
    this.connection = serverConfig.connection!
  }

  description(): string {
    return `Sync - Trying for upload object ${this.dataObjectId} to cloud storage of object...`
  }

  async execute(): Promise<void> {
    const operatorUrls = this.operatorUrls.map((baseUrl) => urljoin(baseUrl, 'api/v1/files', this.dataObjectId))
    await withRandomUrls(operatorUrls, async (chosenBaseUrl) => {
      const tempFilePath = await this.tryDownloadToTemp(chosenBaseUrl, this.dataObjectId)
      // if download fails, break the loop
      if (!tempFilePath) {
        return
      } else {
        // else create a readable stream from the file and upload it using conection
        const fileStream = fs.createReadStream(tempFilePath)
        await this.connection.uploadFileToRemoteBucketAsync(this.dataObjectId, fileStream)
      }
    })
  }
}

async function withRandomUrls(
  operatorUrls: string[],
  callback: (chosenBaseUrl: string) => Promise<void>
): Promise<void> {
  const operatorUrlIndices: number[] = _.shuffle(_.range(operatorUrls.length))

  if (operatorUrlIndices.length === 0) {
    logger.warn(`Sync - No operator URLs provided`)
    return Promise.resolve()
  }

  for (const randomUrlIndex of operatorUrlIndices) {
    const randomUrl = operatorUrls[randomUrlIndex]
    logger.debug(`Sync - random storage node URL was chosen ${randomUrl}`)

    try {
      await callback(randomUrl)
      return
    } catch (err) {
      continue
    }
  }

  logger.warn(`Sync - Failed to execute callback with random URLs`)
  return Promise.resolve()
}
