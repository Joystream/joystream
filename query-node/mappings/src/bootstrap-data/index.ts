import { StorageSystemJson, WorkingGroupJson, MembershipSystemJson } from './types'
import storageSystemJson from './data/storageSystem.json'
import workingGroupsJson from './data/workingGroups.json'
import membershipSystemJson from './data/membershipSystem.json'

const storageSystemData: StorageSystemJson = storageSystemJson
const workingGroupsData: WorkingGroupJson[] = workingGroupsJson
const membershipSystemData: MembershipSystemJson = membershipSystemJson

export { storageSystemData, workingGroupsData, membershipSystemData }
