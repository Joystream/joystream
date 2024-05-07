import multer from 'multer'
import { AbstractConnectionHandler } from 'src/services/cloud'
import { cloudStorage } from 'src/services/multer-storage/storageEngines'
import { AppConfig } from 'src/services/webApi/controllers/common'

export function createFileUploader(config: AppConfig, connection: AbstractConnectionHandler | null): multer.Options {
  const storage = connection
    ? cloudStorage({}, connection)
    : multer.diskStorage({ destination: config.tempFileUploadingDir })
  const fileUploader = {
    storage,
    // Busboy library settings
    limits: {
      // For multipart forms, the max number of file fields (Default: Infinity)
      files: 1,
      // For multipart forms, the max file size (in bytes) (Default: Infinity)
      fileSize: config.maxFileSize,
    },
  }
  return fileUploader
}
