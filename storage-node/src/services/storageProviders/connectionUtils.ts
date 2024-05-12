// The following class should
// 1. Distinguish between several types of connection handlers: one for AWS, one for Azure, and one for Google.
// 2. It should initialize the connection handler based on the type of cloud provider and return the appropriate instance connected
// 3. It should be such that the connection happens just once and the same instance is returned for subsequent calls.

import { AbstractConnectionHandler } from './abstractConnectionHandler'
import { AwsConnectionHandlerParams, AwsConnectionHandler } from './awsConnectionHandler'
import { AzureConnectionHandlerParams, AzureConnectionHandler } from './azureConnectionHandler'

function createAwsConnectionHandler(opts: AwsConnectionHandlerParams): AwsConnectionHandler {
  const connection = new AwsConnectionHandler(opts)
  return connection
}

function createAzureConnectionHandler(opts: AzureConnectionHandlerParams): AzureConnectionHandler {
  const connection = new AzureConnectionHandler(opts)
  return connection
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
  return connection
}
