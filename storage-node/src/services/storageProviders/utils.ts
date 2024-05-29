import { IConnectionHandler } from './IConnectionHandler'
import { AwsConnectionHandlerParams, AwsConnectionHandler } from './awsConnectionHandler'
import dotenv from 'dotenv'
dotenv.config()

/**
 * Parses the configuration options and builds a connection handler for the storage provider.
 *
 * @param enableProvider - A boolean indicating whether a provider is expected to be enabled.
 * @returns A promise that resolves to an instance of IConnectionHandler if the provider is enabled, otherwise undefined.
 * @throws An error if the storage cloud provider type is invalid or unsupported.
 */
export async function parseConfigOptionAndBuildConnection(): Promise<IConnectionHandler | undefined> {
  const enableProvider = process.env.ENABLE_STORAGE_PROVIDER === 'true'
  if (!enableProvider) {
    return undefined
  }
  let connection: IConnectionHandler
  if (process.env.CLOUD_STORAGE_PROVIDER_NAME === 'aws') {
    const params: AwsConnectionHandlerParams = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      region: process.env.AWS_REGION!,
      bucketName: process.env.AWS_BUCKET_NAME!,
    }
    connection = createAwsConnectionHandler(params)
  } else {
    throw new Error('Invalid storage cloud provider type or unsupported provider type.')
  }
  return connection
}

function createAwsConnectionHandler(opts: AwsConnectionHandlerParams): AwsConnectionHandler {
  const connection = new AwsConnectionHandler(opts)
  return connection
}
