import * as express from 'express'
import { acceptPendingDataObjects } from '../../runtime/extrinsics'
import { getAlicePair } from '../../runtime/api'

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

  // TODO: add file hash check

  try {
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
