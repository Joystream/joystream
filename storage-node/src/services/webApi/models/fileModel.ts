export class RemoteFileModelFactory {
  /**
  /**
   * Loads configuration from .env file and establishes a connection.
   * @returns A promise that resolves in a RemoteFileModel with an established connection to the cloud provider.
   */
  static async createAndConnect(): Promise<RemoteFileModel> {
    return new awsS3FileModel()
  }
}
/**
 * Represents a remote file model.
 */
export interface RemoteFileModel {
  /**
   * Retrieves a file from the remote bucket.
   * @param key - The key of the file to retrieve.
   * @returns A promise that resolves when the file is retrieved.
   */
  getFileFromRemoteBucket(key: string): Promise<void>

  /**
   * Uploads a file to the remote bucket.
   * @param key - The key of the file to upload.
   * @returns A promise that resolves when the file is uploaded.
   */
  uploadFileToRemoteBucket(key: string): Promise<void>

  /**
   * Checks if a file exists in the remote bucket.
   * @param key - The key of the file to check.
   * @returns A promise that resolves with a boolean indicating if the file exists.
   */
  isFileOnRemoteBucket(key: string): Promise<boolean>
}
export class awsS3FileModel implements RemoteFileModel {
  async getFileFromRemoteBucket(key: string) {
    // const files = await fs.promises
  }

  async uploadFileToRemoteBucket(key: string) {
    // const files = await fs.promises
  }

  async isFileOnRemoteBucket(key: string): Promise<boolean> {
    // const files = await fs.promises
    return false
  }

  async connect() {}
}
