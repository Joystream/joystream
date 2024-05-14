import AWS from 'aws-sdk'
import {
  AbstractConnectionHandler,
  ColossusFileStream,
  StorageProviderGetObjectResponse,
} from './abstractConnectionHandler'
import { BUCKET_ACCEPTED_PREFIX, cloudAcceptedPathForFile, cloudPendingPathForFile } from './const'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Readable } from 'stream'

export type AwsConnectionHandlerParams = {
  accessKeyId: string
  secretAccessKey: string
  region: string
  bucketName: string
}

export class AwsConnectionHandler extends AbstractConnectionHandler {
  private client: S3Client
  private bucket: string

  constructor(opts: AwsConnectionHandlerParams) {
    super()
    this.client = new S3Client({ region: opts.region })
    this.bucket = opts.bucketName
  }

  // no extra connection setup needed for aws
  async connect(): Promise<void> {}

  get isReady(): boolean {
    // Implement isReady method here
    return false
  }

  async uploadFileToRemoteBucket(filename: string, filestream: ColossusFileStream): Promise<any> {
    // Setting up S3 upload parameters

    const input = {
      Bucket: this.bucket,
      Key: cloudPendingPathForFile(filename), // File name you want to save as in S3
      Body: filestream,
    }

    // Uploading files to the bucket
    const command = new PutObjectCommand(input)
    const response = await this.client.send(command)
    return response.$metadata
  }

  async getFileFromRemoteBucket(filename: string): Promise<StorageProviderGetObjectResponse> {
    // Implement getFileFromRemoteBucket method here
    const input = {
      Bucket: this.bucket,
      Key: cloudAcceptedPathForFile(filename),
    }

    const command = new GetObjectCommand(input)
    const response = await this.client.send(command)

    if (!response.Body || !response.ContentType || !response.ContentLength) {
      throw new Error('Response body, content type, or content length is undefined')
    }

    return {
      Body: new Readable({
        read() {
          this.push(response.Body)
          this.push(null)
        },
      }),
      ContentType: response.ContentType!,
      ContentLength: response.ContentLength!,
    }
  }

  doListFilesOnRemoteBucket(cb: (err: Error | null, data: string[] | null) => void): void {
    const input = {
      Bucket: this.bucket,
      Prefix: BUCKET_ACCEPTED_PREFIX,
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

  doCheckFileOnRemoteBucket(filename: string, cb: (err: Error | null, objectPresent: boolean) => void): void {
    const input = {
      Bucket: this.bucket,
      Key: cloudAcceptedPathForFile(filename),
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
