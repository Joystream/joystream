/**
 * Abstract class representing a connection handler.
 * Connection handlers are responsible for connecting to a remote server and uploading or retrieving files.
 * Implementations of this class should provide the necessary methods in order to read and write files to a specified cloud provider (AWS, Azure, Google, ...)
 * Notice also the use of the Singleton pattern to ensure that only one instance of the connection handler is created.
 */
export abstract class AbstractConnectionHandler {
  private static instance: AbstractConnectionHandler | null = null

  /**
   * Gets the singleton instance of the connection handler.
   */
  static getInstance(): AbstractConnectionHandler {
    if (!AbstractConnectionHandler.instance) {
      AbstractConnectionHandler.instance = new AbstractConnectionHandlerImpl()
    }
    return AbstractConnectionHandler.instance
  }

  /**
   * Gets the readiness status of the connection handler.
   */
  abstract get isReady(): boolean

  /**
   * Connects to the remote server and set the readiness status to true.
   */
  abstract connect(): Promise<void>

  /**
   * Uploads a file to the remote bucket, given an initialized connection.
   * @param opts - The upload parameters.
   * @param cb - The callback function to be called when the upload is complete or encounters an error.
   */
  abstract doUploadFileToRemoteBucket(key: string, cb: (err: Error | null, data: any) => void): void

  /**
   * Retrieves a file from the remote bucket, given an initialized connection
   * @param key - The key of the file to retrieve.
   * @param cb - The callback function to be called when the retrieval is complete or encounters an error.
   */
  abstract doGetFileFromRemoteBucket(key: string, cb: (err: Error | null, data: any) => void): void

  /**
   * Checks if a file exists on the remote bucket, given an initialized connection
   * @param key - The key of the file to check.
   * @param cb - The callback function to be called when the check is complete or encounters an error.
   */
  abstract doCheckFileOnRemoteBucket(key: string, cb: (err: Error | null, data: any) => void): void

  /**
   * Uploads a file to the remote bucket.
   * @param opts - The upload parameters.
   * @param cb - The callback function to be called when the upload is complete or encounters an error.
   */
  uploadFileToRemoteBucket(key: string, cb: (err: Error | null, data: any) => void): void {
    if (!this.isReady) {
      throw new Error('Connection handler is not ready')
    }
    this.doUploadFileToRemoteBucket(key, cb)
  }

  /**
   * Asynchronously uploads a file to the remote bucket.
   * @param opts - The upload parameters.
   * @returns A promise that resolves when the upload is complete or rejects with an error.
   */
  async uploadFileToRemoteBucketAsync(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.uploadFileToRemoteBucket(key, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }

  /**
   * Retrieves a file from the remote bucket, given an initialized connection
   * @param key - The key of the file to retrieve.
   * @param cb - The callback function to be called when the retrieval is complete or encounters an error.
   */
  getFileFromRemoteBucket(key: string, cb: (err: any, data: any) => void): void {
    if (!this.isReady) {
      throw new Error('Connection handler is not ready')
    }
    this.doGetFileFromRemoteBucket(key, cb)
  }
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
  isFileOnRemoteBucket(key: string, cb: (err: any, data: any) => void): void {
    if (!this.isReady) {
      throw new Error('Connection handler is not ready')
    }
    this.doCheckFileOnRemoteBucket(key, cb)
  }

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

class AbstractConnectionHandlerImpl extends AbstractConnectionHandler {
  private ready: boolean = false

  get isReady(): boolean {
    return this.ready
  }

  async connect(): Promise<void> {
    // Implement the connection logic here
    // Set this.ready to true when the connection is established
  }

  doUploadFileToRemoteBucket(key: string, cb: (err: any, data: any) => void): void {
    // Implement the upload logic here
    // Call cb with the appropriate arguments when the upload is complete or encounters an error
  }

  doGetFileFromRemoteBucket(key: string, cb: (err: any, data: any) => void): void {
    // Implement the retrieval logic here
    // Call cb with the appropriate arguments when the retrieval is complete or encounters an error
  }

  doCheckFileOnRemoteBucket(key: string, cb: (err: any, data: any) => void): void {
    // Implement the file check logic here
    // Call cb with the appropriate arguments when the check is complete or encounters an error
  }
}
