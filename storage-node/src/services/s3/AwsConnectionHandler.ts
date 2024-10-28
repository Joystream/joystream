import { IConnectionHandler, UploadFileIfNotExistsOutput, UploadFileOutput } from './IConnectionHandler'
import {
  CreateMultipartUploadCommand,
  CreateMultipartUploadCommandOutput,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsCommand,
  ListObjectsCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
  StorageClass,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { fromEnv } from '@aws-sdk/credential-provider-env'
import logger from '../logger'
import fs from 'fs'

export type AwsConnectionHandlerParams = {
  region: string
  bucketName: string
  defaultStorageClass?: StorageClass
}

export class AwsConnectionHandler implements IConnectionHandler<StorageClass> {
  private client: S3Client
  private bucket: string
  private defaultStorageClass?: StorageClass

  // Official doc at https://docs.aws.amazon.com/AmazonS3/latest/userguide/upload-objects.html:
  // Upload an object in a single operation by using the AWS SDKs, REST API, or AWS CLI – With a single PUT operation, you can upload a single object up to 5 GB in size.
  private multiPartThresholdGB = 5

  constructor(opts: AwsConnectionHandlerParams) {
    if (process.env.LOCALSTACK_ENABLED === 'true') {
      this.client = this.constructWithLocalstack(opts)
    } else {
      this.client = this.constructProduction(opts)
    }
    this.bucket = opts.bucketName
    this.defaultStorageClass = opts.defaultStorageClass
    logger.info(
      `AWS connection handler initialized with bucket config ${
        process.env.LOCALSTACK_ENABLED === 'true' ? 'LOCALSTACK' : 'PRODUCTION'
      }`
    )
    if (this.defaultStorageClass) {
      logger.info(`Using default AWS S3 storage class: ${this.defaultStorageClass}`)
    }
  }

  private constructProduction(opts: AwsConnectionHandlerParams): S3Client {
    return new S3Client({
      credentials: fromEnv(),
      region: opts.region,
    })
  }

  private constructWithLocalstack(opts: AwsConnectionHandlerParams): S3Client {
    return new S3Client({
      region: opts.region,
      credentials: fromEnv(),
      endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
      tls: false,
      forcePathStyle: true,
    })
  }

  private isSuccessfulResponse(response: any): boolean {
    // Response status code info: https://docs.aws.amazon.com/AmazonS3/latest/API/ErrorResponses.html
    return response.$metadata.httpStatusCode === 200
  }

  private isMultiPartNeeded(filePath: string): boolean {
    const stats = fs.statSync(filePath)
    const fileSizeInBytes = stats.size
    return fileSizeInBytes > this.multiPartThresholdGB * 1_000_000_000
  }

  async uploadFileToRemoteBucket(
    key: string,
    filePath: string,
    storageClass?: StorageClass
  ): Promise<UploadFileOutput> {
    await this.uploadFileToAWSBucket(key, filePath, storageClass)
    return {
      key,
      filePath,
    }
  }

  async uploadFileToRemoteBucketIfNotExists(
    key: string,
    filePath: string,
    storageClass?: StorageClass
  ): Promise<UploadFileIfNotExistsOutput> {
    // check if file exists at key
    const fileExists = await this.checkIfFileExists(key)
    // if it does, return
    if (fileExists) {
      return {
        key,
        filePath,
        alreadyExists: true,
      }
    }
    // if it doesn't, upload the file
    await this.uploadFileToAWSBucket(key, filePath, storageClass)
    return {
      key,
      filePath,
      alreadyExists: false,
    }
  }

  private async uploadFileToAWSBucket(
    filename: string,
    filePath: string,
    storageClass?: StorageClass
  ): Promise<CreateMultipartUploadCommandOutput> {
    const fileStream = fs.createReadStream(filePath)

    const input: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: filename,
      Body: fileStream,
      StorageClass: storageClass || this.defaultStorageClass,
    }

    // Uploading files to the bucket: multipart
    const command = this.isMultiPartNeeded(filePath)
      ? new CreateMultipartUploadCommand(input)
      : new PutObjectCommand(input)

    return await this.client.send(command)
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

    const files = []

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

  private async checkIfFileExists(filename: string): Promise<boolean> {
    const input = {
      Bucket: this.bucket,
      Key: filename,
    }

    const command = new HeadObjectCommand(input)
    try {
      await this.client.send(command)
      return true
    } catch (error) {
      if (error.$metadata && error.$metadata.httpStatusCode) {
        switch (error.$metadata.httpStatusCode) {
          case 404:
            return false
          case 403:
            throw new Error('Insufficient permissions to check if file exists in S3 bucket')
          default:
            throw new Error(
              `Unknown error when checking if file exists in S3 bucket: error ${error.$metadata.httpStatusCode}`
            )
        }
      } else {
        throw new Error('Unexpected error format when checking if file exists in S3 bucket')
      }
    }
  }
}
