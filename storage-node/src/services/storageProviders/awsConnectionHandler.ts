import {
  AbstractConnectionHandler,
  ColossusFileStream,
  StorageProviderGetObjectResponse,
} from './abstractConnectionHandler'
import { cloudAcceptedPathForFile, cloudPendingPathForFile } from './const'
import { GetObjectCommand, HeadObjectCommand, ListObjectsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
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
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error('Failed to upload file to S3')
    }
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

  async listFilesOnRemoteBucket(): Promise<string[]> {
    const input = {
      Bucket: this.bucket,
    }
    const command = new ListObjectsCommand(input)
    const response = await this.client.send(command)
    if (!response.Contents) {
      throw new Error('Response contents is undefined')
    }
    const files = response.Contents.filter((f) => f.Key).map((file) => file.Key!)
    return files
  }

  async isFileOnRemoteBucket(filename: string): Promise<boolean> {
    const input = {
      Bucket: this.bucket,
      Key: filename,
    }
    const command = new HeadObjectCommand(input)
    const response = await this.client.send(command)
    return response.$metadata.httpStatusCode === 200
  }
}
