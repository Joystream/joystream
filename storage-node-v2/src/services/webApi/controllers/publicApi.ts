import * as express from 'express'
import { acceptPendingDataObjects } from '../../runtime/extrinsics'
import { getAlicePair } from '../../runtime/api'
import { hashFile } from '../../../services/hashing'
import fs from 'fs'
const fsPromises = fs.promises

// TODO: test api connection?
// TODO: error handling
// TODO: convert to JSON
// TODO: bagId
interface UploadRequest {
  dataObjectId: number
  storageBucketId: number
  workerId: number
}

export async function upload(
  req: express.Request,
  res: express.Response
): Promise<void> {
  const uploadRequest: UploadRequest = req.body

  try {
    const fileObj = getFileObject(req)
    console.log(fileObj)

    const hash = await hashFile(fileObj.path)
    const newPath = fileObj.path.replace(fileObj.filename, hash)
    console.log(hash)

    // Overwrites existing file.
    await fsPromises.rename(fileObj.path, newPath)

    // TODO: account
    await acceptPendingDataObjects(
      getAlicePair(),
      uploadRequest.workerId,
      uploadRequest.storageBucketId,
      [uploadRequest.dataObjectId]
    )
    res.status(200).json({
      file: 'received',
    })
  } catch (err) {
    res.status(500).json({
      errorMsg: err.toString(),
    })
  }
}

function getFileObject(req: express.Request): Express.Multer.File {
  if (req.file) {
    return req.file
  }

  const files = req.files as Express.Multer.File[]
  if (files && files.length > 0) {
    return files[0]
  }

  throw new Error('No file uploaded')
}
