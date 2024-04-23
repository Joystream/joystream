export type BucketUploadParameters = {
  bucketName: string
  key: string
  file: string
}

export type AwsConnectionHandlerParams = {
  awsKey: string
  awsSecret: string
  s3bucketId: string
}
/**
 * Abstract class representing a connection handler.
 */
export abstract class AbstractConnectionHandler {
  protected _ready = false

  /**
   * Gets the readiness status of the connection handler.
   */
  get isReady(): boolean {
    return this._ready
  }

  /**
   * Connects to the remote server and set the readiness status to true.
   */
  abstract connect(): void

  /**
   * Uploads a file to the remote bucket.
   * @param opts - The upload parameters.
   * @param cb - The callback function to be called when the upload is complete or encounters an error.
   */
  abstract uploadFileToRemoteBucket(opts: BucketUploadParameters, cb: (err: any, data: any) => void): void

  /**
   * Asynchronously uploads a file to the remote bucket.
   * @param opts - The upload parameters.
   * @returns A promise that resolves when the upload is complete or rejects with an error.
   */
  async uploadFileToRemoteBucketAsync(opts: BucketUploadParameters): Promise<any> {
    return new Promise((resolve, reject) => {
      this.uploadFileToRemoteBucket(opts, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }

  /**
   * Retrieves a file from the remote bucket.
   * @param key - The key of the file to retrieve.
   * @param cb - The callback function to be called when the retrieval is complete or encounters an error.
   */
  abstract getFileFromRemoteBucket(key: string, cb: (err: any, data: any) => void): void

  /**
   * Asynchronously retrieves a file from the remote bucket.
   * @param key - The key of the file to retrieve.
   * @returns A promise that resolves with the retrieved file data or rejects with an error.
   */
  async getFileFromRemoteBucketAsync(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getFileFromRemoteBucket(key, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }

  /**
   * Checks if a file exists on the remote bucket.
   * @param key - The key of the file to check.
   * @param cb - The callback function to be called when the check is complete or encounters an error.
   */
  abstract isFileOnRemoteBucket(key: string, cb: (err: any, data: any) => void): void

  /**
   * Asynchronously checks if a file exists on the remote bucket.
   * @param key - The key of the file to check.
   * @returns A promise that resolves with a boolean indicating if the file exists or rejects with an error.
   */
  async isFileOnRemoteBucketAsync(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.isFileOnRemoteBucket(key, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }
}

export class AwsConnectionHandler extends AbstractConnectionHandler {
  connectionParams: AwsConnectionHandlerParams

  constructor(opts: AwsConnectionHandlerParams) {
    super()
    this.connectionParams = opts
  }

  connect(): void {
    // Implement connect method here
  }

  uploadFileToRemoteBucket(opts: BucketUploadParameters, cb: (err: any, data: any) => void): void {
    // Implement uploadFileToRemoteBucket method here
  }

  getFileFromRemoteBucket(key: string, cb: (err: any, data: any) => void): void {
    // Implement getFileFromRemoteBucket method here
  }

  isFileOnRemoteBucket(key: string, cb: (err: any, data: any) => void): void {
    // Implement isFileOnRemoteBucket method here
  }
}
