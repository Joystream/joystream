import fs from 'fs'
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
  } else {
    const connection = getStorageProviderConnection()!
    await connection.uploadFileToRemoteBucket(filename, src.toString())
    await fsPromises.unlink(src)
  }
  addDataObjectIdToCache(filename)
}
