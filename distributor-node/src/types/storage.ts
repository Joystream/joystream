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

export type DataObjectInfo = {
  exists: boolean
  isSupported: boolean
  data?: DataObjectData
}
