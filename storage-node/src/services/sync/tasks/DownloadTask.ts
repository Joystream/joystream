import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import logger from '../../logger'
import { pipeline } from 'stream'
import superagent from 'superagent'
import urljoin from 'url-join'
import { promisify } from 'util'
import { v4 as uuidv4 } from 'uuid'
import { addDataObjectIdToCache } from '../../caching/localDataObjects'
import { moveFile } from '../../helpers/moveFile'
import { SyncTask } from './ISyncTask'
import { withRandomUrls, verifyFileHash } from './utils'
import { isStorageProviderConnectionEnabled } from '../../../commands/server'
const fsPromises = fs.promises

/**
 * Download the file from the remote storage node to the local storage.
 */
export class DownloadFileTask implements SyncTask {
  operatorUrls: string[]

  constructor(
    baseUrls: string[],
    protected dataObjectId: string,
    protected expectedHash: string,
    protected uploadsDirectory: string,
    protected tempDirectory: string,
    protected downloadTimeout: number,
    protected hostId: string
  ) {
    this.operatorUrls = baseUrls.map((baseUrl) => urljoin(baseUrl, 'api/v1/files', dataObjectId))
  }

  description(): string {
    return `Sync - Trying for download of object: ${this.dataObjectId} ...`
  }

  // internal error handling
  async execute(): Promise<void> {
    const filepath = path.join(this.uploadsDirectory, this.dataObjectId)
    try {
      await withRandomUrls(this.operatorUrls, async (chosenBaseUrl) => {
        this.tryDownload(chosenBaseUrl, filepath)
      })
    } catch (err) {
      logger.warn(`Sync - Failed to download ${this.dataObjectId}`)
    }
  }

  // public for testing puroposes
  public async tryDownloadTemp(url: string, tempFilePath: string): Promise<void> {
    const streamPipeline = promisify(pipeline)
    // We create tempfile first to mitigate partial downloads on app (or remote node) crash.
    // This partial downloads will be cleaned up during the next sync iteration.
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
    await verifyFileHash(tempFilePath, this.expectedHash)
  }

  async tryDownload(url: string, filepath: string): Promise<void> {
    const tempFilePath = path.join(this.tempDirectory, uuidv4())
    try {
      await this.tryDownloadTemp(url, tempFilePath)
      await moveFile(tempFilePath, filepath)
      addDataObjectIdToCache(this.dataObjectId, isStorageProviderConnectionEnabled())
    } catch (err) {
      logger.warn(`Sync - fetching data error for ${url}: ${err}`, { err })
      try {
        logger.warn(`Cleaning up file ${tempFilePath}`)
        await fsPromises.unlink(tempFilePath)
      } catch (err) {
        logger.error(`Sync - cannot cleanup file ${tempFilePath}: ${err}`, { err })
        throw err
      }
      throw err
    }
  }
}
