export interface S3FileModel {
  getFileFromS3(key: string): Promise<void>
  uploadFileToS3(key: string): Promise<void>
}

export class FuseS3FileModel implements S3FileModel {
  async getFileFromS3(key: string) {
    // const files = await fs.promises
  }

  async uploadFileToS3(key: string) {
    // const files = await fs.promises
  }
}
