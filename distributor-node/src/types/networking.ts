import { AxiosResponse } from 'axios'
import { Readable } from 'stream'

export type StorageNodeDownloadResponse = AxiosResponse<Readable>
