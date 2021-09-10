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
  blacklist: string[]
}
