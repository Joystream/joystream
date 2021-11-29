export enum PendingDownloadStatusType {
  Waiting = 'Waiting',
  LookingForSource = 'LookingForSource',
  Downloading = 'Downloading',
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

export type PendingDownloadStatus =
  | PendingDownloadStatusWaiting
  | PendingDownloadStatusLookingForSource
  | PendingDownloadStatusDownloading

export const STATUS_ORDER = [
  PendingDownloadStatusType.Waiting,
  PendingDownloadStatusType.LookingForSource,
  PendingDownloadStatusType.Downloading,
] as const

export class PendingDownload {
  private objectId: string
  private objectSize: number
  private status: PendingDownloadStatus = { type: PendingDownloadStatusType.Waiting }
  private statusHandlers: Map<PendingDownloadStatusType, (() => void)[]> = new Map()
  private cleanupHandlers: (() => void)[] = []

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

  private registerCleanupHandler(handler: () => void) {
    this.cleanupHandlers.push(handler)
  }

  untilStatus<T extends PendingDownloadStatusType>(statusType: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (STATUS_ORDER.indexOf(this.status.type) >= STATUS_ORDER.indexOf(statusType)) {
        return resolve()
      }
      this.registerStatusHandler(statusType, () => resolve())
      this.registerCleanupHandler(() => reject(new Error(`Could not download object ${this.objectId} from any source`)))
    })
  }

  cleanup(): void {
    this.cleanupHandlers.forEach((handler) => handler())
  }
}
