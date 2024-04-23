import multer from 'multer'
import {
  AbstractConnectionHandler,
  AwsConnectionHandler,
  AwsConnectionHandlerParams,
  AzureConnectionHandler,
  AzureConnectionHandlerParams,
} from 'src/services/cloud'
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

export async function parseConfigOptionAndBuildConnection(): Promise<AbstractConnectionHandler | null> {
  // Implement parseConfigOptionAndBuildConnection method here
  // parse spec from .env configuration and build connection, in case of error return null
  let connection: AbstractConnectionHandler
  if (process.env.CLOUD_CONNECTION_TYPE === 'aws') {
    const params: AwsConnectionHandlerParams = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      region: process.env.AWS_REGION!,
      bucketName: process.env.AWS_BUCKET_NAME!,
    }
    connection = createAwsConnectionHandler(params)
  } else if (process.env.CLOUD_CONNECTION_TYPE === 'azure') {
    connection = createAzureConnectionHandler({})
  } else {
    return null
  }
  await connection!.connect()
  return connection!
}

function createAwsConnectionHandler(opts: AwsConnectionHandlerParams): AwsConnectionHandler {
  const connection = new AwsConnectionHandler(opts)
  return connection
}

function createAzureConnectionHandler(opts: AzureConnectionHandlerParams): AzureConnectionHandler {
  const connection = new AzureConnectionHandler(opts)
  return connection
}
