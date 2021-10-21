import { MemberJson, StorageSystemJson, WorkingGroupsJson, VideoCategoryJson, ChannelCategoryJson } from './types'
import storageSystemJson from './data/storageSystem.json'
import membersJson from './data/members.json'
import workingGroupsJson from './data/workingGroups.json'
import channelCategoriesJson from './data/channelCategories.json'
import videoCategoriesJson from './data/videoCategories.json'

const storageSystemData: StorageSystemJson = storageSystemJson
const membersData: MemberJson[] = membersJson
const workingGroupsData: WorkingGroupsJson = workingGroupsJson
const channelCategoriesData: ChannelCategoryJson[] = channelCategoriesJson
const videoCategoriesData: VideoCategoryJson[] = videoCategoriesJson

export { storageSystemData, membersData, workingGroupsData, channelCategoriesData, videoCategoriesData }
