import { AxiosResponse } from 'axios'
import { Readable } from 'stream'
import { DataObjectData } from './storage'

export type StorageNodeDownloadResponse = AxiosResponse<Readable>

export type DownloadData = {
  startAt?: number
  objectData: DataObjectData
}
