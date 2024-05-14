import { Readable } from 'stream'
import { AbstractConnectionHandler, StorageProviderGetObjectResponse } from './abstractConnectionHandler'

export type AzureConnectionHandlerParams = {
  // Implement Azure connection handler parameters here
}

// NOTE: Showcase on how the Abstract connection handler module works
export class AzureConnectionHandler extends AbstractConnectionHandler {
  get isReady(): boolean {
    throw new Error('Method not implemented.')
  }
  connect(): Promise<void> {
    throw new Error('Method not implemented.')
  }
  uploadFileToRemoteBucket(filename: string, filestream: Readable): Promise<any> {
    throw new Error('Method not implemented.')
  }
  getFileFromRemoteBucket(filename: string): Promise<StorageProviderGetObjectResponse> {
    throw new Error('Method not implemented.')
  }
  listFilesOnRemoteBucket(): Promise<string[]> {
    throw new Error('Method not implemented.')
  }
}
