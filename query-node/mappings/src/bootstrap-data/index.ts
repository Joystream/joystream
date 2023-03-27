import { MembershipConfigJson, WorkingGroupJson } from './types'
import workingGroupsJson from './data/workingGroups.json'
import membershipConfigJson from './data/membershipConfig.json'

const workingGroupsData: WorkingGroupJson[] = workingGroupsJson
const membershipConfig: MembershipConfigJson = membershipConfigJson

export { workingGroupsData, membershipConfig }
