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
/**
 * Represents an abstract connection handler for interacting with a remote server and performing file operations.
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
   * Asynchronously uploads a file to the remote bucket.
   * @param filename - The key of the file in the remote bucket.
   * @param filestream - The file stream to upload.
   * @returns A promise that resolves when the upload is complete or rejects with an error.
   */
  abstract uploadFileToRemoteBucket(filename: string, filestream: ColossusFileStream): Promise<any>

  /**
   * Asynchronously retrieves a file from the remote bucket.
   * @param filename - The key of the file to retrieve from the remote bucket.
   * @returns A promise that resolves with the retrieved file data or rejects with an error.
   */
  abstract getFileFromRemoteBucket(filename: string): Promise<StorageProviderGetObjectResponse>

  /**
   * Asynchronously checks if a file exists on the remote bucket.
   * @param filename - The key of the file to check in the remote bucket.
   * @returns A promise that resolves with a boolean indicating if the file exists or rejects with an error.
   */
  abstract isFileOnRemoteBucket(filename: string): Promise<boolean>

  /**
   * Asynchronously lists files in the remote bucket.
   * @returns A promise that resolves with an array of file keys or rejects with an error.
   */
  abstract listFilesOnRemoteBucket(): Promise<string[]>
}

export type ColossusFileStream = Readable

export type StorageProviderGetObjectResponse = {
  Body: ColossusFileStream
  ContentType: string
  ContentLength: number
}
