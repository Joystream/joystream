import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import logger from '../../logger'
import _ from 'lodash'
import { AbstractConnectionHandler } from 'src/services/storageProviders'
import urljoin from 'url-join'
import { DownloadFileTask } from './DownloadTask'
import { getStorageProviderConnection } from 'src/commands/server'
import path from 'path'
import { withRandomUrls } from './utils'

export class UploadFileTask extends DownloadFileTask {
  private connection: AbstractConnectionHandler

  constructor(
    baseUrls: string[],
    dataObjectId: string,
    expectedHash: string,
    uploadsDirectory: string,
    tempDirectory: string,
    downloadTimeout: number,
    hostId: string
  ) {
    super(baseUrls, dataObjectId, expectedHash, uploadsDirectory, tempDirectory, downloadTimeout, hostId)
    this.connection = getStorageProviderConnection()!
  }

  description(): string {
    return `Sync - Trying for upload object ${this.dataObjectId} to cloud storage of object...`
  }

  // internal error handling
  async execute(): Promise<void> {
    const operatorUrls = this.operatorUrls.map((baseUrl) => urljoin(baseUrl, 'api/v1/files', this.dataObjectId))
    const tempFilePath = path.join(this.tempDirectory, uuidv4())
    try {
      await withRandomUrls(operatorUrls, async (chosenBaseUrl) => {
        await this.tryDownloadTemp(chosenBaseUrl, this.dataObjectId)
        // at this point the file is downloaded to the temp filepath, create a file stream and upload it to storage
        const fileStream = fs.createReadStream(tempFilePath)
        await this.connection.uploadFileToRemoteBucketAsync(this.dataObjectId, fileStream)
      })
    } catch (err) {
      logger.error(`Sync - error when synching asset ${this.dataObjectId} with remote storage provider: ${err}`, {
        err,
      })
    }
  }
}
