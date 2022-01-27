import { MemberJson, StorageSystemJson, WorkingGroupJson, MembershipSystemJson } from './types'
import storageSystemJson from './data/storageSystem.json'
import membersJson from './data/members.json'
import workingGroupsJson from './data/workingGroups.json'
import membershipSystemJson from './data/membershipSystem.json'

const storageSystemData: StorageSystemJson = storageSystemJson
const membersData: MemberJson[] = membersJson
const workingGroupsData: WorkingGroupJson[] = workingGroupsJson
const membershipSystemData: MembershipSystemJson = membershipSystemJson

export { storageSystemData, membersData, workingGroupsData, membershipSystemData }
