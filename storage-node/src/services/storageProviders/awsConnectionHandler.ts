import { IConnectionHandler } from './IConnectionHandler'
import {
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsCommand,
  ListObjectsCommandInput,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import fs from 'fs'

export type AwsConnectionHandlerParams = {
  accessKeyId: string
  secretAccessKey: string
  region: string
  bucketName: string
}

export class AwsConnectionHandler implements IConnectionHandler {
  private client: S3Client
  private bucket: string

  // Official doc at https://docs.aws.amazon.com/AmazonS3/latest/userguide/upload-objects.html:
  // Upload an object in a single operation by using the AWS SDKs, REST API, or AWS CLI – With a single PUT operation, you can upload a single object up to 5 GB in size.
  private multiPartThresholdGB = 5

  constructor(opts: AwsConnectionHandlerParams) {
    this.client = new S3Client({
      credentials: {
        accessKeyId: opts.accessKeyId,
        secretAccessKey: opts.secretAccessKey,
      },
      region: opts.region,
      endpoint:
        process.env.LOCALSTACK_ENABLED === 'true'
          ? `http://localhost:${process.env.LOCALSTACK_PORT || 4566}/`
          : undefined,
      tls: process.env.LOCALSTACK_ENABLED === 'true' ? false : undefined,
      forcePathStyle: process.env.LOCALSTACK_ENABLED === 'true',
    })
    this.bucket = opts.bucketName
  }

  private isSuccessfulResponse(response: any): boolean {
    // Response status code info: https://docs.aws.amazon.com/AmazonS3/latest/API/ErrorResponses.html
    return response.$metadata.httpStatusCode === 200
  }
  private isMultiPartNeeded(filePath: string): boolean {
    const stats = fs.statSync(filePath)
    const fileSizeInBytes = stats.size
    const fileSizeInGigabytes = fileSizeInBytes / (1024 * 1024 * 1024)
    return fileSizeInGigabytes > this.multiPartThresholdGB
  }

  async uploadFileToRemoteBucket(filename: string, filePath: string): Promise<any> {
    const input = {
      Bucket: this.bucket,
      Key: filename,
      Body: filePath,
    }

    // Uploading files to the bucket: multipart
    const command = this.isMultiPartNeeded(filePath)
      ? new CreateMultipartUploadCommand(input)
      : new PutObjectCommand(input)
    const response = await this.client.send(command)
    if (!this.isSuccessfulResponse(response)) {
      throw new Error('Failed to upload file to S3')
    }
  }

  async getRedirectUrlForObject(filename: string): Promise<string> {
    const input = {
      Bucket: this.bucket,
      Key: filename,
    }

    const command = new GetObjectCommand(input)
    return await getSignedUrl(this.client, command, { expiresIn: 60 * 60 })
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

  async removeObject(filename: string): Promise<void> {
    const input = {
      Bucket: this.bucket,
      Key: filename,
    }

    await this.client.send(new DeleteObjectCommand(input))
  }
}
