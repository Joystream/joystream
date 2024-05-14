import { Readable } from 'stream'

/**
 * Represents an abstract connection handler for a storage provider.
 */
export abstract class AbstractConnectionHandler {
  /**
   * Gets the readiness status of the connection handler.
   * @returns A boolean indicating whether the connection handler is ready or not.
   */
  abstract get isReady(): boolean

  /**
   * Connects to the remote server and sets the readiness status to true.
   * @returns A promise that resolves when the connection is established.
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
   * Asynchronously lists ALL files in the remote bucket, to be used during cache initialization only as it can be very slow.
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
