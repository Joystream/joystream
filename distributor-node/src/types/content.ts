import { AxiosResponse } from 'axios'
import { Readable } from 'stream'

export type StorageNodeEndpointData = {
  bucketId: string
  endpoint: string
}

export type DataObjectAccessPoints = {
  storageNodes: StorageNodeEndpointData[]
}

export type DataObjectData = {
  objectId: string
  size: number
  contentHash: string
  accessPoints?: DataObjectAccessPoints
}

export type StorageNodeDownloadResponse = AxiosResponse<Readable>

export type DownloadData = {
  startAt?: number
  objectData: DataObjectData
}

export type DataObjectInfo = {
  exists: boolean
  isSupported: boolean
  data?: DataObjectData
}

export enum PendingDownloadStatus {
  Waiting = 'Waiting',
  LookingForSource = 'LookingForSource',
  Downloading = 'Downloading',
}

export type PendingDownloadData = {
  objectSize: number
  status: PendingDownloadStatus
  promise: Promise<StorageNodeDownloadResponse>
}

export enum ObjectStatusType {
  Available = 'Available',
  PendingDownload = 'PendingDownload',
  NotFound = 'NotFound',
  NotSupported = 'NotSupported',
  Missing = 'Missing',
}

export type ObjectStatusAvailable = {
  type: ObjectStatusType.Available
  path: string
}

export type ObjectStatusPendingDownload = {
  type: ObjectStatusType.PendingDownload
  pendingDownloadData: PendingDownloadData
}

export type ObjectStatusNotFound = {
  type: ObjectStatusType.NotFound
}

export type ObjectStatusNotSupported = {
  type: ObjectStatusType.NotSupported
}

export type ObjectStatusMissing = {
  type: ObjectStatusType.Missing
  objectData: DataObjectData
}

export type ObjectStatus =
  | ObjectStatusAvailable
  | ObjectStatusPendingDownload
  | ObjectStatusNotFound
  | ObjectStatusNotSupported
  | ObjectStatusMissing
