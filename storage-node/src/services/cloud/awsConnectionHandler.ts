import * as AWS from 'aws-sdk'
import * as fs from 'fs'
import { AbstractConnectionHandler } from './abstractConnectionHandler'

export type AwsConnectionHandlerParams = {
  accessKeyId: string
  secretAccessKey: string
  region: string
  bucketName: string
}

export class AwsConnectionHandler extends AbstractConnectionHandler {
  s3: AWS.S3
  private bucketName: string

  constructor(opts: AwsConnectionHandlerParams) {
    super()
    AWS.config.update({ accessKeyId: opts.accessKeyId, secretAccessKey: opts.secretAccessKey })
    this.s3 = new AWS.S3()
    this.bucketName = opts.bucketName
  }

  async connect(): Promise<void> {
    // Implement connect method here
  }

  get isReady(): boolean {
    // Implement isReady method here
    return false
  }

  doUploadFileToRemoteBucket(key: string, cb: (err: Error | null, data: any) => void): void {
    // Read content from the file
    const fileContent = fs.readFileSync(key)

    // Setting up S3 upload parameters
    const params = {
      Bucket: this.bucketName,
      Key: key, // File name you want to save as in S3
      Body: fileContent,
    }

    // Uploading files to the bucket
    try {
      // const command = new AWS.S3.PutObjectCommand(params)
      // const response = await this.s3.send(command)
      // console.log(`File uploaded successfully. ${data.Location}`)
    } catch (err) {
      cb(err, null)
    }
  }

  doGetFileFromRemoteBucket(key: string, cb: (err: any, data: any) => void): void {
    // Implement getFileFromRemoteBucket method here
    const input = {
      'Bucket': 'examplebucket',
      'Key': 'SampleFile.txt',
    }

    // Uploading files to the bucket
    try {
      // const command = new GetObjectCommand(input)
      // const response = await client.send(command)
      // response contains a stream object with the file content
    } catch (err) {
      cb(err, null)
    }
  }

  doCheckFileOnRemoteBucket(key: string, cb: (err: Error | null, data: any) => void): void {
    const input = {
      'Bucket': 'examplebucket',
      'MaxKeys': '2',
    }
    try {
      // const command = new ListObjectsCommand(input);
      // const response = await client.send(command);
    } catch (err) {
      cb(err, null)
    }
    // Implement isFileOnRemoteBucket method here
  }
}
