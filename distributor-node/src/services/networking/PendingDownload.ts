export enum PendingDownloadStatusType {
  Waiting = 'Waiting',
  LookingForSource = 'LookingForSource',
  Downloading = 'Downloading',
  Failed = 'Failed',
  Completed = 'Completed',
}

export type PendingDownloadStatusWaiting = {
  type: PendingDownloadStatusType.Waiting
}

export type PendingDownloadStatusLookingForSource = {
  type: PendingDownloadStatusType.LookingForSource
}

export type PendingDownloadStatusDownloading = {
  type: PendingDownloadStatusType.Downloading
  source: string
  contentType?: string
}

export type PendingDownloadStatusFailed = {
  type: PendingDownloadStatusType.Failed
}

export type PendingDownloadStatusCompleted = {
  type: PendingDownloadStatusType.Completed
}

export type PendingDownloadStatus =
  | PendingDownloadStatusWaiting
  | PendingDownloadStatusLookingForSource
  | PendingDownloadStatusDownloading
  | PendingDownloadStatusFailed
  | PendingDownloadStatusCompleted

export class PendingDownload {
  private objectId: string
  private objectSize: number
  private status: PendingDownloadStatus = { type: PendingDownloadStatusType.Waiting }
  private statusHandlers: Map<PendingDownloadStatusType, (() => void)[]> = new Map()

  constructor(objectId: string, objectSize: number) {
    this.objectId = objectId
    this.objectSize = objectSize
  }

  setStatus(status: PendingDownloadStatus): void {
    this.status = status
    const handlers = this.statusHandlers.get(status.type) || []
    handlers.forEach((handler) => handler())
  }

  getStatus(): PendingDownloadStatus {
    return this.status
  }

  getObjectId(): string {
    return this.objectId
  }

  getObjectSize(): number {
    return this.objectSize
  }

  private registerStatusHandler(statusType: PendingDownloadStatusType, handler: () => void) {
    const currentHandlers = this.statusHandlers.get(statusType) || []
    this.statusHandlers.set(statusType, [...currentHandlers, handler])
  }

  public onError(handler: () => void): void {
    this.registerStatusHandler(PendingDownloadStatusType.Failed, handler)
  }

  sourceData(): Promise<PendingDownloadStatusDownloading> {
    return new Promise((resolve, reject) => {
      if (this.status.type === PendingDownloadStatusType.Completed) {
        return reject(new Error(`Trying to get source data from already completed download task`))
      }
      if (this.status.type === PendingDownloadStatusType.Failed) {
        return reject(new Error(`Could not download object ${this.objectId} from any source`))
      }
      if (this.status.type === PendingDownloadStatusType.Downloading) {
        return resolve(this.status)
      }

      this.registerStatusHandler(PendingDownloadStatusType.Downloading, () =>
        resolve({ ...this.status } as PendingDownloadStatusDownloading)
      )
      this.registerStatusHandler(PendingDownloadStatusType.Failed, () =>
        reject(new Error(`Could not download object ${this.objectId} from any source`))
      )
    })
  }
}
