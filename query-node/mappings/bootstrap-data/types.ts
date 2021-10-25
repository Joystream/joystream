export type MemberJson = {
  memberId: string
  rootAccount: string
  controllerAccount: string
  handle: string
  about?: string
  avatarUri?: string
  registeredAtTime: number
  registeredAtBlock: number
}

export type StorageSystemJson = {
  id: string
  blacklist: string[]
  storageBucketsPerBagLimit: number
  distributionBucketsPerBagLimit: number
  uploadingBlocked: boolean
  dataObjectFeePerMb: number | string
  storageBucketMaxObjectsCountLimit: number | string
  storageBucketMaxObjectsSizeLimit: number | string
}

export type WorkerJson = {
  workerId: string
  metadata?: string
  createdAt: number
}

export type WorkingGroupJson = {
  workers: WorkerJson[]
}

export type WorkingGroupsJson = {
  [group in 'GATEWAY' | 'STORAGE']?: WorkingGroupJson
}

export type VideoCategoryJson = {
  id: string
  name: string
  createdInBlock: number
  createdAt: Date
  updatedAt: Date
}

export type ChannelCategoryJson = {
  id: string
  name: string
  createdInBlock: number
  createdAt: Date
  updatedAt: Date
}
