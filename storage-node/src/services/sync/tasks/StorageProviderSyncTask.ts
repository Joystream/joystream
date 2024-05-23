import { v4 as uuidv4 } from 'uuid'
import logger from '../../logger'
import _ from 'lodash'
import { IConnectionHandler } from '../../../services/storageProviders'
import { DownloadFileTask } from './DownloadTask'
import { getStorageProviderConnection } from '../../../commands/server'
import path from 'path'
import { withRandomUrls } from './utils'
import { addDataObjectIdToCache } from '../../../services/caching/localDataObjects'

export class ProviderSyncTask extends DownloadFileTask {
  private connection: IConnectionHandler

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
    this.connection = getStorageProviderConnection()! // rightfully panic here if connection is not set
  }

  description(): string {
    return `Sync - Trying for upload object ${this.dataObjectId} to cloud storage of object...`
  }

  // internal error handling
  async execute(): Promise<void> {
    const tempFilePath = path.join(this.tempDirectory, uuidv4())
    try {
      // TODO: I have added a HashFileVerificationError to the utils file, but it is not used here, we should establish what to do in case the file is corrupted
      await withRandomUrls(this.operatorUrls, async (chosenBaseUrl) => {
        await this.tryDownloadTemp(chosenBaseUrl, this.dataObjectId)
        await this.connection.uploadFileToRemoteBucket(this.dataObjectId, tempFilePath) // NOTE: consider converting to non blocking promise
        addDataObjectIdToCache(this.dataObjectId)
      })
    } catch (err) {
      logger.error(`Sync - error when synching asset ${this.dataObjectId} with remote storage provider: ${err}`, {
        err,
      })
    }
  }
}
