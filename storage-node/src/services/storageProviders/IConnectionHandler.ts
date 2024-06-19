/**
 * Represents an abstract connection handler for a storage provider.
 */
/**
 * Represents a connection handler for interacting with a remote storage bucket.
 */
export interface IConnectionHandler {
  /**
   * Asynchronously uploads a file to the remote bucket.
   * @param filename - The key of the file in the remote bucket.
   * @param filePath - The file path of the file to upload.
   * @returns A promise that resolves when the upload is complete or rejects with an error.
   */
  uploadFileToRemoteBucket(filename: string, filePath: string): Promise<any>

  /**
   * Asynchronously retrieves a file from the remote bucket.
   * @param filename - The key of the file to retrieve from the remote bucket.
   * @returns A promise that resolves in the presigned URL of the file or rejects with an error, 1h expiry
   */
  getRedirectUrlForObject(filename: string): Promise<string>

  /**
   * Asynchronously lists ALL files in the remote bucket, to be used during cache initialization only as it can be very slow.
   * @returns A promise that resolves with an array of file keys or rejects with an error.
   */
  listFilesOnRemoteBucket(): Promise<string[]>

  /**
   * Asynchronously removes a file from the remote bucket.
   * @param filename - The key of the file to remove from the remote bucket.
   * @returns A promise that resolves when the removal is complete or rejects with an error.
   */
  removeObject(filename: string): Promise<void>
}
