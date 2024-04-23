import { AbstractConnectionHandler } from './abstractConnectionHandler'

export type AwsConnectionHandlerParams = {
  accessKeyId: string
  secretAccessKey: string
  region: string
  bucketName: string
}

export class AwsConnectionHandler extends AbstractConnectionHandler {
  connectionParams: AwsConnectionHandlerParams

  constructor(opts: AwsConnectionHandlerParams) {
    super()
    this.connectionParams = opts
  }

  async connect(): Promise<void> {
    // Implement connect method here
  }

  get isReady(): boolean {
    // Implement isReady method here
    return false
  }

  doUploadFileToRemoteBucket(key: string, cb: (err: any, data: any) => void): void {
    // Implement uploadFileToRemoteBucket method here
  }

  doGetFileFromRemoteBucket(key: string, cb: (err: any, data: any) => void): void {
    // Implement getFileFromRemoteBucket method here
  }

  doCheckFileOnRemoteBucket(key: string, cb: (err: any, data: any) => void): void {
    // Implement isFileOnRemoteBucket method here
  }
}
