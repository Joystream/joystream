import { AxiosResponse } from 'axios'
import { Readable } from 'stream'
import { PendingDownload } from '../services/networking/PendingDownload'

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
  pendingDownload: PendingDownload
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
