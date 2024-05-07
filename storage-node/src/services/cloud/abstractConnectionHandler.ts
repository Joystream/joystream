import { Readable } from 'stream'

/**
 * Abstract class representing a connection handler.
 * Connection handlers are responsible for connecting to a remote server and uploading or retrieving files.
 * Implementations of this class should provide the necessary methods in order to read and write files to a specified cloud provider (AWS, Azure, Google, ...)
 * Notice also the use of the Singleton pattern to ensure that only one instance of the connection handler is created.
 */
/**
 * Represents an abstract connection handler for interacting with a remote server and bucket.
 */
/**
 * Represents an abstract connection handler for interacting with a remote server.
 */
export abstract class AbstractConnectionHandler {
  /**
   * Gets the readiness status of the connection handler.
   */
  abstract get isReady(): boolean

  /**
   * Connects to the remote server and sets the readiness status to true.
   */
  abstract connect(): Promise<void>

  /**
   * Uploads a file to the remote bucket, given an initialized connection.
   * @param key - The key of the file in the remote bucket.
   * @param filestream - The file stream to upload.
   * @param cb - The callback function to be called when the upload is complete or encounters an error.
   */
  abstract doUploadFileToRemoteBucket(
    key: string,
    filestream: ColossusFileStream,
    cb: (err: Error | null, data: any) => void
  ): void

  /**
   * Retrieves a file from the remote bucket, given an initialized connection.
   * @param key - The key of the file to retrieve from the remote bucket.
   * @param cb - The callback function to be called when the retrieval is complete or encounters an error.
   */
  abstract doGetFileFromRemoteBucket(
    key: string,
    cb: (err: Error | null, data: ColossusFileStream | null) => void
  ): void

  /**
   * Checks if a file exists on the remote bucket, given an initialized connection.
   * @param key - The key of the file to check in the remote bucket.
   * @param cb - The callback function to be called when the check is complete or encounters an error.
   */
  abstract doCheckFileOnRemoteBucket(key: string, cb: (err: Error | null, data: boolean) => void): void

  /**
   * Lists files in the remote bucket, given an initialized connection.
   * @param cb - The callback function to be called when the listing is complete or encounters an error.
   */
  abstract doListFilesOnRemoteBucket(cb: (err: Error | null, data: string[] | null) => void): void

  /**
   * Uploads a file to the remote bucket.
   * @param key - The key of the file in the remote bucket.
   * @param filestream - The file stream to upload.
   * @param cb - The callback function to be called when the upload is complete or encounters an error.
   */
  uploadFileToRemoteBucket(
    key: string,
    filestream: ColossusFileStream,
    cb: (err: Error | null, data: any) => void
  ): void {
    if (!this.isReady) {
      throw new Error('Connection handler is not ready')
    }
    this.doUploadFileToRemoteBucket(key, filestream, cb)
  }

  /**
   * Asynchronously uploads a file to the remote bucket.
   * @param key - The key of the file in the remote bucket.
   * @param filestream - The file stream to upload.
   * @returns A promise that resolves when the upload is complete or rejects with an error.
   */
  async uploadFileToRemoteBucketAsync(key: string, filestream: ColossusFileStream): Promise<any> {
    return new Promise((resolve, reject) => {
      this.uploadFileToRemoteBucket(key, filestream, (err, data) => {
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
   * @param key - The key of the file to retrieve from the remote bucket.
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
   * @param key - The key of the file to retrieve from the remote bucket.
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
   * @param key - The key of the file to check in the remote bucket.
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
   * @param key - The key of the file to check in the remote bucket.
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

  /**
   * Lists files in the remote bucket.
   * @param cb - The callback function to be called when the listing is complete or encounters an error.
   */
  listFilesOnRemoteBucket(cb: (err: Error | null, data: string[] | null) => void): void {
    if (!this.isReady) {
      throw new Error('Connection handler is not ready')
    }
    this.doListFilesOnRemoteBucket(cb)
  }

  /**
   * Asynchronously lists files in the remote bucket.
   * @returns A promise that resolves with an array of file keys or rejects with an error.
   */
  async listFilesOnRemoteBucketAsync(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.listFilesOnRemoteBucket((err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data ?? [])
        }
      })
    })
  }
}

// @todo : refactor this according to some pattern
export type ColossusFileStream = NodeJS.ReadableStream | Buffer | string | Uint8Array | ReadableStream | Readable
