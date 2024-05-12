import { AbstractConnectionHandler, ColossusFileStream } from './abstractConnectionHandler'

export type AzureConnectionHandlerParams = {
  // Implement Azure connection handler parameters here
}
export class AzureConnectionHandler extends AbstractConnectionHandler {
  connectionParams: AzureConnectionHandlerParams

  constructor(opts: AzureConnectionHandlerParams) {
    super()
    this.connectionParams = opts
  }

  doUploadFileToRemoteBucket(key: string, filestream: ColossusFileStream, cb: (err: any, data: any) => void): void {
    // Implement uploadFileToRemoteBucket method here
  }

  doGetFileFromRemoteBucket(key: string, cb: (err: any, data: any) => void): void {
    // Implement getFileFromRemoteBucket method here
  }

  doCheckFileOnRemoteBucket(key: string, cb: (err: any, data: any) => void): void {
    // Implement isFileOnRemoteBucket method here
  }

  doListFilesOnRemoteBucket(cb: (err: Error | null, data: string[] | null) => void): void {
    // Implement listFilesOnRemoteBucket method here
  }

  get isReady(): boolean {
    // Implement isReady method here
    return true
  }

  async connect(): Promise<void> {
    // Implement connect method here
  }
}
