export type MemberJson = {
  member_id: string
  root_account: string
  controller_account: string
  handle: string
  about?: string
  avatar_uri?: string
  registered_at_time: number
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
