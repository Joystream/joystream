export type UploadFileOutput = {
  key: string
  filePath: string
}

export type UploadFileIfNotExistsOutput = {
  key: string
  filePath: string
  alreadyExists: boolean
}
/**
 * Represents a connection handler for interacting with a remote storage unit.
 * The storage unit can be a bucket in S3, a container in Azure Blob Storage, or similar concepts in other cloud storage services.
 * Within this storage unit, objects are organized using keys. A key is a string that defines the location of an object
 * within the storage unit. Keys use the format "<directory>/<filename>" with "/" as a delimiter to separate directories.
 */
export interface IConnectionHandler<StorageClassType> {
  /**
   * Asynchronously uploads an object to the storage unit. It doesn't check if the object already exists.
   * @param key - The key of the object in the storage unit.
   * @param filePath - The local file path of the object to upload.
   * @param storageClass - Optional. The storage class of the object.
   * @returns A promise that resolves when the upload is complete or rejects with an error.
   */
  uploadFileToRemoteBucket(key: string, filePath: string, storageClass?: StorageClassType): Promise<UploadFileOutput>

  /**
   * Asynchronously uploads an object to the storage unit if it does not exist.
   * @param key - The key of the object in the storage unit.
   * @param filePath - The local file path of the object to upload.
   * @param storageClass - Optional. The storage class of the object.
   * @returns A promise that resolves when the upload is complete or rejects with an error.
   */
  uploadFileToRemoteBucketIfNotExists(
    key: string,
    filePath: string,
    storageClass?: StorageClassType
  ): Promise<UploadFileIfNotExistsOutput>

  /**
   * Asynchronously retrieves a presigned URL for an object in the storage unit.
   * @param key - The key of the object in the storage unit.
   * @returns A promise that resolves with the presigned URL of the object (1h expiry) or rejects with an error.
   */
  getRedirectUrlForObject(key: string): Promise<string>

  // /**
  //  * Asynchronously retrieves an URL for an object in the storage unit.
  //  * @param key - The key of the object in the storage unit.
  //  * @returns A promise that resolves with the URL of the object or rejects with an error.
  //  */
  // getUrlForObject(key: string): Promise<string>

  /**
   * Asynchronously lists ALL objects in the storage unit. To be used during cache initialization only as it can be very slow.
   * @returns A promise that resolves with an array of object keys or rejects with an error.
   */
  listFilesOnRemoteBucket(): Promise<string[]>

  /**
   * Asynchronously removes an object from the storage unit.
   * @param key - The key of the object to remove from the storage unit.
   * @returns A promise that resolves when the removal is complete or rejects with an error.
   */
  removeObject(key: string): Promise<void>
}
