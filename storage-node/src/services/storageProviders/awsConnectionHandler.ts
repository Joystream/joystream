import { IConnectionHandler, ColossusFileStream } from './IConnectionHandler'
import {
  GetObjectCommand,
  ListObjectsCommand,
  ListObjectsCommandInput,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export type AwsConnectionHandlerParams = {
  accessKeyId: string
  secretAccessKey: string
  region: string
  bucketName: string
}

export class AwsConnectionHandler implements IConnectionHandler {
  private client: S3Client
  private bucket: string

  constructor(opts: AwsConnectionHandlerParams) {
    this.client = new S3Client({
      credentials: {
        accessKeyId: opts.accessKeyId,
        secretAccessKey: opts.secretAccessKey,
      },
      region: opts.region,
    })
    this.bucket = opts.bucketName
  }

  private isSuccessfulResponse(response: any): boolean {
    // Response status code info: https://docs.aws.amazon.com/AmazonS3/latest/API/ErrorResponses.html
    return response.$metadata.httpStatusCode === 200
  }

  async uploadFileToRemoteBucket(filename: string, filestream: ColossusFileStream): Promise<any> {
    // Setting up S3 upload parameters

    const input = {
      Bucket: this.bucket,
      Key: filename, // File name you want to save as in S3
      Body: filestream,
    }

    // Uploading files to the bucket
    const command = new PutObjectCommand(input)
    const response = await this.client.send(command)
    if (!this.isSuccessfulResponse(response)) {
      throw new Error('Failed to upload file to S3')
    }
  }

  async getRedirectUrlForObject(filename: string): Promise<string> {
    // Implement getRedirectUrlForObject method here
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
}
