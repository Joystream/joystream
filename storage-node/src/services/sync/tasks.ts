import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import { pipeline } from 'stream'
import superagent from 'superagent'
import superagentTimings from 'superagent-node-http-timings'
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
const fsPromises = fs.promises

class DownloadSpeedTracker {
  private downloadSpeedsByUrl: Map<string, number[]>

  constructor(private maxRecordsPerUrl: number) {
    this.downloadSpeedsByUrl = new Map()
  }

  recordDownloadSpeed(url: string, speed: number): void {
    const downloadSpeeds = this.downloadSpeedsByUrl.get(url) || []
    downloadSpeeds.push(speed)

    // Keep only the last `maxRecordsPerUrl` records
    if (downloadSpeeds.length > this.maxRecordsPerUrl) {
      downloadSpeeds.shift()
    }

    // Update the map with the new download times list
    this.downloadSpeedsByUrl.set(url, downloadSpeeds)
  }

  getAverageDownloadSpeed(url: string): number {
    const downloadSpeeds = this.downloadSpeedsByUrl.get(url)
    return _.mean(downloadSpeeds) || 0
  }
}

const downloadSpeedTracker = new DownloadSpeedTracker(10)

/**
 * Defines synchronization task abstraction.
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
    return `Cleanup - deleting local file: ${this.filename} ....`
  }

  async execute(): Promise<void> {
    const dataObjectId = this.filename
    if (isNewDataObject(dataObjectId)) {
      logger.warn(`Cleanup - possible QueryNode update delay (new file) - deleting file canceled: ${this.filename}`)
      return
    }

    const cachedDataObjectId = await getDataObjectIdFromCache(dataObjectId)
    if (cachedDataObjectId && cachedDataObjectId.pinnedCount) {
      logger.warn(
        `Cleanup - the data object is currently in use by downloading api - file deletion canceled: ${this.filename}`
      )
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
  constructor(
    private baseUrls: string[],
    private dataObjectId: string,
    private expectedSize: string,
    private expectedHash: string,
    private uploadsDirectory: string,
    private tempDirectory: string,
    private downloadTimeout: number,
    private hostId: string
  ) {}

  description(): string {
    return `Sync - Trying for download of: ${this.dataObjectId} ....`
  }

  async execute(): Promise<void> {
    const baseUrls: string[] = this.getBaseUrlsOrderedByAvgDownloadSpeed()

    for (const baseUrl of baseUrls) {
      logger.debug(`Sync - storage node URL chosen for download: ${baseUrl}`)

      const filepath = path.join(this.uploadsDirectory, this.dataObjectId)

      // Try downloading file
      await this.tryDownload(baseUrl, filepath)

      // if download succeeds, break the loop
      if (fs.existsSync(filepath)) {
        return
      }
    }

    logger.warn(`Sync - cannot get operator URLs for ${this.dataObjectId}`)
  }

  async tryDownload(baseUrl: string, filepath: string): Promise<void> {
    const streamPipeline = promisify(pipeline)
    // We create tempfile first to mitigate partial downloads on app (or remote node) crash.
    // This partial downloads will be cleaned up during the next sync iteration.
    const tempFilePath = path.join(this.tempDirectory, uuidv4())
    const url = urljoin(baseUrl, 'api/v1/files', this.dataObjectId)
    try {
      const timeoutMs = this.downloadTimeout * 60 * 1000
      // Casting because of:
      // https://stackoverflow.com/questions/38478034/pipe-superagent-response-to-express-response
      const request = superagent
        .get(url)
        .use(
          superagentTimings((err: unknown, result: { status: number; timings: { total: number } }) => {
            if (err) {
              logger.error(`Sync - error measuring download time for ${url}: ${err}`, { err })
            }

            // Record download speed for given operator (speed = bytes/ms)
            if (result.status === 200) {
              downloadSpeedTracker.recordDownloadSpeed(baseUrl, parseInt(this.expectedSize) / result.timings.total)
            }
          })
        )
        .timeout(timeoutMs)
        .set('X-COLOSSUS-HOST-ID', this.hostId) as unknown as NodeJS.ReadableStream
      const fileStream = fs.createWriteStream(tempFilePath)

      request.on('response', (res) => {
        if (!res.ok && res.statusCode !== 404) {
          logger.error(`Sync - unexpected status code(${res.statusCode}) for ${res?.request?.url}`)
        }

        // Handle 'error' event on Response too, because it will be emitted if request was
        // prematurely aborted/closed due to timeout and the response still was not completed
        // See: https://github.com/nodejs/node/blob/cd171576b2d1376dae3eb371b6da5ccf04dc4a85/lib/_http_client.js#L439-L441
        res.on('error', (err: Error) => {
          logger.error(`Sync - fetching data error for ${url}: ${err}`, { err })
        })
      })

      request.on('error', (err) => {
        logger.error(`Sync - fetching data error for ${url}: ${err}`, { err })
      })
      await streamPipeline(request, fileStream)
      await this.verifyDownloadedFile(tempFilePath)
      await fsPromises.rename(tempFilePath, filepath)
      await addDataObjectIdToCache(this.dataObjectId)
    } catch (err) {
      logger.error(`Sync - fetching data error for ${url}: ${err}`, { err })
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

  getBaseUrlsOrderedByAvgDownloadSpeed(): string[] {
    const urlsWithAvgSpeeds = []

    for (const baseUrl of this.baseUrls) {
      const avgSpeed = downloadSpeedTracker.getAverageDownloadSpeed(baseUrl)
      urlsWithAvgSpeeds.push({ baseUrl, avgSpeed })
    }

    return urlsWithAvgSpeeds.sort((a, b) => b.avgSpeed - a.avgSpeed).map((item) => item.baseUrl)
  }
}
