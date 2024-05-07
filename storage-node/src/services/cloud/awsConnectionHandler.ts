import AWS from 'aws-sdk'
import { AbstractConnectionHandler, ColossusFileStream } from './abstractConnectionHandler'

export type AwsConnectionHandlerParams = {
  accessKeyId: string
  secretAccessKey: string
  region: string
  bucketName: string
}

export class AwsConnectionHandler extends AbstractConnectionHandler {
  s3: AWS.S3
  private bucket: string

  constructor(opts: AwsConnectionHandlerParams) {
    super()
    AWS.config.update({ accessKeyId: opts.accessKeyId, secretAccessKey: opts.secretAccessKey })
    this.s3 = new AWS.S3()
    this.bucket = opts.bucketName
  }

  // no extra connection setup needed for aws
  async connect(): Promise<void> {}

  get isReady(): boolean {
    // Implement isReady method here
    return false
  }

  doUploadFileToRemoteBucket(
    key: string,
    filestream: ColossusFileStream,
    cb: (err: Error | null, data: any) => void
  ): void {
    // Setting up S3 upload parameters

    const input = {
      Bucket: this.bucket,
      Key: key, // File name you want to save as in S3
      Body: filestream,
    }

    // Uploading files to the bucket
    const command = this.s3.putObject(input, (err, data) => {
      if (err) {
        console.log(`File ${key} uploaded successfully to ${this.bucket} bucket`)
        cb(err, null)
      } else {
        cb(null, data)
      }
    })
    command.send()
  }

  doGetFileFromRemoteBucket(key: string, cb: (err: Error | null, data: ColossusFileStream | null) => void): void {
    // Implement getFileFromRemoteBucket method here
    const input = {
      'Bucket': this.bucket,
      'Key': key,
    }

    // Uploading files to the bucket
    const command = this.s3.getObject(input, (err, data) => {
      if (err) {
        console.log(`File ${key} downloaded successfully from ${this.bucket} bucket`)
        cb(err, null)
      } else {
        if (data.Body === undefined) {
          cb(Error('No data found'), null)
        } else {
          cb(null, data.Body! as ColossusFileStream)
        }
      }
    })
    command.send()
  }

  doListFilesOnRemoteBucket(cb: (err: Error | null, data: string[] | null) => void): void {
    const input = {
      'Bucket': this.bucket,
    }

    this.s3.listObjects(input, (err, data) => {
      if (err) {
        cb(err, null)
      } else {
        if (data.Contents === undefined) {
          cb(Error('No data found'), null)
        } else {
          const keys = data.Contents.map((content) => content.Key)
            .filter((k) => k !== undefined)
            .map((k) => k!)
          cb(null, keys)
        }
      }
    })
  }

  doCheckFileOnRemoteBucket(key: string, cb: (err: Error | null, objectPresent: boolean) => void): void {
    const input = {
      'Bucket': this.bucket,
      'Key': key,
    }

    this.s3.headObject(input, (err, data) => {
      if (err) {
        cb(err, false)
      } else {
        if (data === undefined) {
          cb(null, false)
        } else {
          cb(null, true)
        }
      }
    })
  }
}
