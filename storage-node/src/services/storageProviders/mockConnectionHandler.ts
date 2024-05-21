// create a mock implementation of IConnectionHandler
import { IConnectionHandler } from './IConnectionHandler'

export class MockConnectionHandler implements IConnectionHandler {
  async uploadFileToRemoteBucket(filename: string, filePath: string): Promise<any> {
    console.log(`Uploading file ${filename} to remote bucket`)
  }

  async getRedirectUrlForObject(filename: string): Promise<string> {
    console.log(`Retrieving URL for file ${filename}`)
    return 'https://example.com'
  }

  async listFilesOnRemoteBucket(): Promise<string[]> {
    console.log('Listing all files in remote bucket')
    return ['file1', 'file2']
  }

  async removeObject(filename: string): Promise<void> {
    console.log(`Removing file ${filename} from remote bucket`)
  }
}
