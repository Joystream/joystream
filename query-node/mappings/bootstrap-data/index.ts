import { MemberJson, StorageSystemJson, WorkingGroupsJson } from './types'
import storageSystemJson from './data/storageSystem.json'
import membersJson from './data/members.json'
import workingGroupsJson from './data/workingGroups.json'
import channelCategoriesData from './data/channelCategories.json'
import videoCategoriesData from './data/videoCategories.json'

const storageSystemData: StorageSystemJson = storageSystemJson
const membersData: MemberJson[] = membersJson
const workingGroupsData: WorkingGroupsJson = workingGroupsJson

export { storageSystemData, membersData, workingGroupsData, channelCategoriesData, videoCategoriesData }
