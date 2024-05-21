import logger from '../../logger'
import path from 'path'
import { getDataObjectIdFromCache, deleteDataObjectIdFromCache } from '../../../services/caching/localDataObjects'
import { isNewDataObject } from '../../../services/caching/newUploads'
import { SyncTask } from './ISyncTask'
import fs from 'fs'
import { getStorageProviderConnection, isStorageProviderConnectionEnabled } from '../../../commands/server'
const fsPromises = fs.promises

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

    const maybeObject = getDataObjectIdFromCache(dataObjectId)
    if (maybeObject === undefined) {
      return
    } else {
      const { dataObjectId: cachedDataObjectId, entry } = maybeObject
      if (cachedDataObjectId && entry.pinCount) {
        logger.warn(
          `Cleanup - the data object is currently in use by downloading api - file deletion canceled: ${this.filename}`
        )
        return
      }
      if (entry.onLocalVolume) {
        const fullPath = path.join(this.uploadsDirectory, this.filename)
        await fsPromises.unlink(fullPath)
      } else {
        if (isStorageProviderConnectionEnabled()) {
          const connection = getStorageProviderConnection()!
          connection.removeObject(this.filename)
        }
      }

      deleteDataObjectIdFromCache(dataObjectId)
    }
  }
}
