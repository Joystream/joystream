export type DataObjectAccessPoints = {
  storageNodes: {
    bucketId: string
    endpoint: string
  }[]
  distributorNodes: {
    bucketId: string
    endpoint: string
  }[]
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
