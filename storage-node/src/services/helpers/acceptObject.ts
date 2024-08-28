import fs from 'fs'
import logger from '../logger'
import { getStorageProviderConnection, isStorageProviderConnectionEnabled } from '../../commands/server'
import { addDataObjectIdToCache } from '../caching/localDataObjects'
import { moveFile } from './moveFile'
const fsPromises = fs.promises

export async function acceptObject(
  filename: string,
  src: fs.PathLike,
  dest: fs.PathLike | undefined = undefined
): Promise<void> {
  const toBeAcceptedOnLocalVolume = !isStorageProviderConnectionEnabled()
  if (toBeAcceptedOnLocalVolume) {
    if (dest === undefined) {
      throw new Error('Destination path is undefined')
    }
    await moveFile(src, dest)
    logger.info(`File ${filename} accepted on local volume`)
  } else {
    const connection = getStorageProviderConnection()!
    await connection.uploadFileToRemoteBucket(filename, src.toString())
    await fsPromises.unlink(src)
    logger.info(`File ${filename} accepted to remote storage`)
  }
  addDataObjectIdToCache(filename, toBeAcceptedOnLocalVolume)
  logger.info(`File ${filename} added to local cache`)
}
