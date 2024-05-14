import {
  AbstractConnectionHandler,
  ColossusFileStream,
  StorageProviderGetObjectResponse,
} from './abstractConnectionHandler'
import { cloudAcceptedPathForFile, cloudPendingPathForFile } from './const'
import {
  GetObjectCommand,
  ListObjectsCommand,
  ListObjectsCommandInput,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
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

  private isSuccessfulResponse(response: any): boolean {
    // Response status code info: https://docs.aws.amazon.com/AmazonS3/latest/API/ErrorResponses.html
    return response.$metadata.httpStatusCode === 200
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
    if (!this.isSuccessfulResponse(response)) {
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
    let listingComplete = false
    let input: ListObjectsCommandInput = {
      Bucket: this.bucket,
    }

    let files = []

    // the listing is paginated so we need to keep track of the marker
    while (!listingComplete) {
      const response = await this.client.send(new ListObjectsCommand(input))
      if (!this.isSuccessfulResponse(response)) {
        throw new Error('Response unsuccessful when listing files in S3 bucket')
      }
      if (!response.Contents) {
        throw new Error('Response contents are undefined when listing files in S3 bucket, bucket possibly empty')
      }
      files.push(...response.Contents.filter((file) => file.Key).map((file) => file.Key!))
      listingComplete = !response.IsTruncated
      input = {
        Bucket: this.bucket,
        Marker: files[files.length - 1], // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-s3/Interface/ListObjectsCommandOutput/
      }
    }

    return files
  }
}
