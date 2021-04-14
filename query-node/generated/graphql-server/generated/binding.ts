import 'graphql-import-node'; // Needed so you can import *.graphql files 

import { makeBindingClass, Options } from 'graphql-binding'
import { GraphQLResolveInfo, GraphQLSchema } from 'graphql'
import { IResolvers } from 'graphql-tools/dist/Interfaces'
import * as schema from  './schema.graphql'

export interface Query {
    channelCategories: <T = Array<ChannelCategory>>(args: { offset?: Int | null, limit?: Int | null, where?: ChannelCategoryWhereInput | null, orderBy?: ChannelCategoryOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    channelCategoryByUniqueInput: <T = ChannelCategory | null>(args: { where: ChannelCategoryWhereUniqueInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T | null> ,
    channelCategoriesConnection: <T = ChannelCategoryConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: ChannelCategoryWhereInput | null, orderBy?: ChannelCategoryOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    channels: <T = Array<Channel>>(args: { offset?: Int | null, limit?: Int | null, where?: ChannelWhereInput | null, orderBy?: ChannelOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    channelByUniqueInput: <T = Channel | null>(args: { where: ChannelWhereUniqueInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T | null> ,
    channelsConnection: <T = ChannelConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: ChannelWhereInput | null, orderBy?: ChannelOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    curatorGroups: <T = Array<CuratorGroup>>(args: { offset?: Int | null, limit?: Int | null, where?: CuratorGroupWhereInput | null, orderBy?: CuratorGroupOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    curatorGroupByUniqueInput: <T = CuratorGroup | null>(args: { where: CuratorGroupWhereUniqueInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T | null> ,
    curatorGroupsConnection: <T = CuratorGroupConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: CuratorGroupWhereInput | null, orderBy?: CuratorGroupOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    dataObjects: <T = Array<DataObject>>(args: { offset?: Int | null, limit?: Int | null, where?: DataObjectWhereInput | null, orderBy?: DataObjectOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    dataObjectByUniqueInput: <T = DataObject | null>(args: { where: DataObjectWhereUniqueInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T | null> ,
    dataObjectsConnection: <T = DataObjectConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: DataObjectWhereInput | null, orderBy?: DataObjectOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    featuredVideos: <T = Array<FeaturedVideo>>(args: { offset?: Int | null, limit?: Int | null, where?: FeaturedVideoWhereInput | null, orderBy?: FeaturedVideoOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    featuredVideoByUniqueInput: <T = FeaturedVideo | null>(args: { where: FeaturedVideoWhereUniqueInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T | null> ,
    featuredVideosConnection: <T = FeaturedVideoConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: FeaturedVideoWhereInput | null, orderBy?: FeaturedVideoOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    languages: <T = Array<Language>>(args: { offset?: Int | null, limit?: Int | null, where?: LanguageWhereInput | null, orderBy?: LanguageOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    languageByUniqueInput: <T = Language | null>(args: { where: LanguageWhereUniqueInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T | null> ,
    languagesConnection: <T = LanguageConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: LanguageWhereInput | null, orderBy?: LanguageOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    licenses: <T = Array<License>>(args: { offset?: Int | null, limit?: Int | null, where?: LicenseWhereInput | null, orderBy?: LicenseOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    licenseByUniqueInput: <T = License | null>(args: { where: LicenseWhereUniqueInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T | null> ,
    licensesConnection: <T = LicenseConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: LicenseWhereInput | null, orderBy?: LicenseOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    memberships: <T = Array<Membership>>(args: { offset?: Int | null, limit?: Int | null, where?: MembershipWhereInput | null, orderBy?: MembershipOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    membershipByUniqueInput: <T = Membership | null>(args: { where: MembershipWhereUniqueInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T | null> ,
    membershipsConnection: <T = MembershipConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: MembershipWhereInput | null, orderBy?: MembershipOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    channelCategoriesByName: <T = Array<ChannelCategoriesByNameFTSOutput>>(args: { whereChannelCategory?: ChannelCategoryWhereInput | null, skip?: Int | null, limit?: Int | null, text: String }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    membersByHandle: <T = Array<MembersByHandleFTSOutput>>(args: { whereMembership?: MembershipWhereInput | null, skip?: Int | null, limit?: Int | null, text: String }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    search: <T = Array<SearchFTSOutput>>(args: { whereVideo?: VideoWhereInput | null, whereChannel?: ChannelWhereInput | null, skip?: Int | null, limit?: Int | null, text: String }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    videoCategoriesByName: <T = Array<VideoCategoriesByNameFTSOutput>>(args: { whereVideoCategory?: VideoCategoryWhereInput | null, skip?: Int | null, limit?: Int | null, text: String }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    videoCategories: <T = Array<VideoCategory>>(args: { offset?: Int | null, limit?: Int | null, where?: VideoCategoryWhereInput | null, orderBy?: VideoCategoryOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    videoCategoryByUniqueInput: <T = VideoCategory | null>(args: { where: VideoCategoryWhereUniqueInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T | null> ,
    videoCategoriesConnection: <T = VideoCategoryConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: VideoCategoryWhereInput | null, orderBy?: VideoCategoryOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    videoMediaEncodings: <T = Array<VideoMediaEncoding>>(args: { offset?: Int | null, limit?: Int | null, where?: VideoMediaEncodingWhereInput | null, orderBy?: VideoMediaEncodingOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    videoMediaEncodingByUniqueInput: <T = VideoMediaEncoding | null>(args: { where: VideoMediaEncodingWhereUniqueInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T | null> ,
    videoMediaEncodingsConnection: <T = VideoMediaEncodingConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: VideoMediaEncodingWhereInput | null, orderBy?: VideoMediaEncodingOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    videoMediaMetadata: <T = Array<VideoMediaMetadata>>(args: { offset?: Int | null, limit?: Int | null, where?: VideoMediaMetadataWhereInput | null, orderBy?: VideoMediaMetadataOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    videoMediaMetadataByUniqueInput: <T = VideoMediaMetadata | null>(args: { where: VideoMediaMetadataWhereUniqueInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T | null> ,
    videoMediaMetadataConnection: <T = VideoMediaMetadataConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: VideoMediaMetadataWhereInput | null, orderBy?: VideoMediaMetadataOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    videos: <T = Array<Video>>(args: { offset?: Int | null, limit?: Int | null, where?: VideoWhereInput | null, orderBy?: VideoOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    videoByUniqueInput: <T = Video | null>(args: { where: VideoWhereUniqueInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T | null> ,
    videosConnection: <T = VideoConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: VideoWhereInput | null, orderBy?: VideoOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> 
  }

export interface Mutation {}

export interface Subscription {
    stateSubscription: <T = ProcessorState>(args?: {}, info?: GraphQLResolveInfo | string, options?: Options) => Promise<AsyncIterator<T>> 
  }

export interface Binding {
  query: Query
  mutation: Mutation
  subscription: Subscription
  request: <T = any>(query: string, variables?: {[key: string]: any}) => Promise<T>
  delegate(operation: 'query' | 'mutation', fieldName: string, args: {
      [key: string]: any;
  }, infoOrQuery?: GraphQLResolveInfo | string, options?: Options): Promise<any>;
  delegateSubscription(fieldName: string, args?: {
      [key: string]: any;
  }, infoOrQuery?: GraphQLResolveInfo | string, options?: Options): Promise<AsyncIterator<any>>;
  getAbstractResolvers(filterSchema?: GraphQLSchema | string): IResolvers;
}

export interface BindingConstructor<T> {
  new(...args: any[]): T
}

export const Binding = makeBindingClass<BindingConstructor<Binding>>({ schema: schema as any })

/**
 * Types
*/

export type AssetAvailability =   'ACCEPTED' |
  'PENDING' |
  'INVALID'

export type ChannelCategoryOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'name_ASC' |
  'name_DESC' |
  'happenedIn_ASC' |
  'happenedIn_DESC'

export type ChannelOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'ownerMemberId_ASC' |
  'ownerMemberId_DESC' |
  'ownerCuratorGroupId_ASC' |
  'ownerCuratorGroupId_DESC' |
  'categoryId_ASC' |
  'categoryId_DESC' |
  'rewardAccount_ASC' |
  'rewardAccount_DESC' |
  'title_ASC' |
  'title_DESC' |
  'description_ASC' |
  'description_DESC' |
  'coverPhotoDataObjectId_ASC' |
  'coverPhotoDataObjectId_DESC' |
  'coverPhotoAvailability_ASC' |
  'coverPhotoAvailability_DESC' |
  'avatarPhotoDataObjectId_ASC' |
  'avatarPhotoDataObjectId_DESC' |
  'avatarPhotoAvailability_ASC' |
  'avatarPhotoAvailability_DESC' |
  'isPublic_ASC' |
  'isPublic_DESC' |
  'isCensored_ASC' |
  'isCensored_DESC' |
  'languageId_ASC' |
  'languageId_DESC' |
  'happenedIn_ASC' |
  'happenedIn_DESC'

export type CuratorGroupOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'isActive_ASC' |
  'isActive_DESC'

export type DataObjectOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'addedAt_ASC' |
  'addedAt_DESC' |
  'typeId_ASC' |
  'typeId_DESC' |
  'size_ASC' |
  'size_DESC' |
  'liaisonId_ASC' |
  'liaisonId_DESC' |
  'liaisonJudgement_ASC' |
  'liaisonJudgement_DESC' |
  'ipfsContentId_ASC' |
  'ipfsContentId_DESC' |
  'joystreamContentId_ASC' |
  'joystreamContentId_DESC'

export type FeaturedVideoOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'videoId_ASC' |
  'videoId_DESC'

export type LanguageOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'iso_ASC' |
  'iso_DESC' |
  'happenedIn_ASC' |
  'happenedIn_DESC'

export type LiaisonJudgement =   'PENDING' |
  'ACCEPTED' |
  'REJECTED'

export type LicenseOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'code_ASC' |
  'code_DESC' |
  'attribution_ASC' |
  'attribution_DESC' |
  'customText_ASC' |
  'customText_DESC'

export type MembershipEntryMethod =   'PAID' |
  'SCREENING' |
  'GENESIS'

export type MembershipOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'handle_ASC' |
  'handle_DESC' |
  'avatarUri_ASC' |
  'avatarUri_DESC' |
  'about_ASC' |
  'about_DESC' |
  'controllerAccount_ASC' |
  'controllerAccount_DESC' |
  'rootAccount_ASC' |
  'rootAccount_DESC' |
  'registeredAtBlock_ASC' |
  'registeredAtBlock_DESC' |
  'registeredAtTime_ASC' |
  'registeredAtTime_DESC' |
  'entry_ASC' |
  'entry_DESC' |
  'subscription_ASC' |
  'subscription_DESC'

export type VideoCategoryOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'name_ASC' |
  'name_DESC' |
  'happenedIn_ASC' |
  'happenedIn_DESC'

export type VideoMediaEncodingOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'codecName_ASC' |
  'codecName_DESC' |
  'container_ASC' |
  'container_DESC' |
  'mimeMediaType_ASC' |
  'mimeMediaType_DESC'

export type VideoMediaMetadataOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'encodingId_ASC' |
  'encodingId_DESC' |
  'pixelWidth_ASC' |
  'pixelWidth_DESC' |
  'pixelHeight_ASC' |
  'pixelHeight_DESC' |
  'size_ASC' |
  'size_DESC' |
  'happenedIn_ASC' |
  'happenedIn_DESC'

export type VideoOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'channelId_ASC' |
  'channelId_DESC' |
  'categoryId_ASC' |
  'categoryId_DESC' |
  'title_ASC' |
  'title_DESC' |
  'description_ASC' |
  'description_DESC' |
  'duration_ASC' |
  'duration_DESC' |
  'thumbnailPhotoDataObjectId_ASC' |
  'thumbnailPhotoDataObjectId_DESC' |
  'thumbnailPhotoAvailability_ASC' |
  'thumbnailPhotoAvailability_DESC' |
  'languageId_ASC' |
  'languageId_DESC' |
  'hasMarketing_ASC' |
  'hasMarketing_DESC' |
  'publishedBeforeJoystream_ASC' |
  'publishedBeforeJoystream_DESC' |
  'isPublic_ASC' |
  'isPublic_DESC' |
  'isCensored_ASC' |
  'isCensored_DESC' |
  'isExplicit_ASC' |
  'isExplicit_DESC' |
  'licenseId_ASC' |
  'licenseId_DESC' |
  'mediaDataObjectId_ASC' |
  'mediaDataObjectId_DESC' |
  'mediaAvailability_ASC' |
  'mediaAvailability_DESC' |
  'mediaMetadataId_ASC' |
  'mediaMetadataId_DESC' |
  'happenedIn_ASC' |
  'happenedIn_DESC' |
  'isFeatured_ASC' |
  'isFeatured_DESC'

export interface BaseWhereInput {
  id_eq?: String | null
  id_in?: String[] | String | null
  createdAt_eq?: String | null
  createdAt_lt?: String | null
  createdAt_lte?: String | null
  createdAt_gt?: String | null
  createdAt_gte?: String | null
  createdById_eq?: String | null
  updatedAt_eq?: String | null
  updatedAt_lt?: String | null
  updatedAt_lte?: String | null
  updatedAt_gt?: String | null
  updatedAt_gte?: String | null
  updatedById_eq?: String | null
  deletedAt_all?: Boolean | null
  deletedAt_eq?: String | null
  deletedAt_lt?: String | null
  deletedAt_lte?: String | null
  deletedAt_gt?: String | null
  deletedAt_gte?: String | null
  deletedById_eq?: String | null
}

export interface ChannelCategoryCreateInput {
  name?: String | null
  happenedIn: Float
}

export interface ChannelCategoryUpdateInput {
  name?: String | null
  happenedIn?: Float | null
}

export interface ChannelCategoryWhereInput {
  id_eq?: ID_Input | null
  id_in?: ID_Output[] | ID_Output | null
  createdAt_eq?: DateTime | null
  createdAt_lt?: DateTime | null
  createdAt_lte?: DateTime | null
  createdAt_gt?: DateTime | null
  createdAt_gte?: DateTime | null
  createdById_eq?: ID_Input | null
  createdById_in?: ID_Output[] | ID_Output | null
  updatedAt_eq?: DateTime | null
  updatedAt_lt?: DateTime | null
  updatedAt_lte?: DateTime | null
  updatedAt_gt?: DateTime | null
  updatedAt_gte?: DateTime | null
  updatedById_eq?: ID_Input | null
  updatedById_in?: ID_Output[] | ID_Output | null
  deletedAt_all?: Boolean | null
  deletedAt_eq?: DateTime | null
  deletedAt_lt?: DateTime | null
  deletedAt_lte?: DateTime | null
  deletedAt_gt?: DateTime | null
  deletedAt_gte?: DateTime | null
  deletedById_eq?: ID_Input | null
  deletedById_in?: ID_Output[] | ID_Output | null
  name_eq?: String | null
  name_contains?: String | null
  name_startsWith?: String | null
  name_endsWith?: String | null
  name_in?: String[] | String | null
  happenedIn_eq?: Int | null
  happenedIn_gt?: Int | null
  happenedIn_gte?: Int | null
  happenedIn_lt?: Int | null
  happenedIn_lte?: Int | null
  happenedIn_in?: Int[] | Int | null
}

export interface ChannelCategoryWhereUniqueInput {
  id: ID_Output
}

export interface ChannelCreateInput {
  ownerMemberId?: ID_Input | null
  ownerCuratorGroupId?: ID_Input | null
  categoryId?: ID_Input | null
  rewardAccount?: String | null
  title?: String | null
  description?: String | null
  coverPhotoDataObjectId?: ID_Input | null
  coverPhotoUrls: Array<String>
  coverPhotoAvailability: AssetAvailability
  avatarPhotoDataObjectId?: ID_Input | null
  avatarPhotoUrls: Array<String>
  avatarPhotoAvailability: AssetAvailability
  isPublic?: Boolean | null
  isCensored: Boolean
  languageId?: ID_Input | null
  happenedIn: Float
}

export interface ChannelUpdateInput {
  ownerMemberId?: ID_Input | null
  ownerCuratorGroupId?: ID_Input | null
  categoryId?: ID_Input | null
  rewardAccount?: String | null
  title?: String | null
  description?: String | null
  coverPhotoDataObjectId?: ID_Input | null
  coverPhotoUrls?: String[] | String | null
  coverPhotoAvailability?: AssetAvailability | null
  avatarPhotoDataObjectId?: ID_Input | null
  avatarPhotoUrls?: String[] | String | null
  avatarPhotoAvailability?: AssetAvailability | null
  isPublic?: Boolean | null
  isCensored?: Boolean | null
  languageId?: ID_Input | null
  happenedIn?: Float | null
}

export interface ChannelWhereInput {
  id_eq?: ID_Input | null
  id_in?: ID_Output[] | ID_Output | null
  createdAt_eq?: DateTime | null
  createdAt_lt?: DateTime | null
  createdAt_lte?: DateTime | null
  createdAt_gt?: DateTime | null
  createdAt_gte?: DateTime | null
  createdById_eq?: ID_Input | null
  createdById_in?: ID_Output[] | ID_Output | null
  updatedAt_eq?: DateTime | null
  updatedAt_lt?: DateTime | null
  updatedAt_lte?: DateTime | null
  updatedAt_gt?: DateTime | null
  updatedAt_gte?: DateTime | null
  updatedById_eq?: ID_Input | null
  updatedById_in?: ID_Output[] | ID_Output | null
  deletedAt_all?: Boolean | null
  deletedAt_eq?: DateTime | null
  deletedAt_lt?: DateTime | null
  deletedAt_lte?: DateTime | null
  deletedAt_gt?: DateTime | null
  deletedAt_gte?: DateTime | null
  deletedById_eq?: ID_Input | null
  deletedById_in?: ID_Output[] | ID_Output | null
  ownerMemberId_eq?: ID_Input | null
  ownerMemberId_in?: ID_Output[] | ID_Output | null
  ownerCuratorGroupId_eq?: ID_Input | null
  ownerCuratorGroupId_in?: ID_Output[] | ID_Output | null
  categoryId_eq?: ID_Input | null
  categoryId_in?: ID_Output[] | ID_Output | null
  rewardAccount_eq?: String | null
  rewardAccount_contains?: String | null
  rewardAccount_startsWith?: String | null
  rewardAccount_endsWith?: String | null
  rewardAccount_in?: String[] | String | null
  title_eq?: String | null
  title_contains?: String | null
  title_startsWith?: String | null
  title_endsWith?: String | null
  title_in?: String[] | String | null
  description_eq?: String | null
  description_contains?: String | null
  description_startsWith?: String | null
  description_endsWith?: String | null
  description_in?: String[] | String | null
  coverPhotoDataObjectId_eq?: ID_Input | null
  coverPhotoDataObjectId_in?: ID_Output[] | ID_Output | null
  coverPhotoAvailability_eq?: AssetAvailability | null
  coverPhotoAvailability_in?: AssetAvailability[] | AssetAvailability | null
  avatarPhotoDataObjectId_eq?: ID_Input | null
  avatarPhotoDataObjectId_in?: ID_Output[] | ID_Output | null
  avatarPhotoAvailability_eq?: AssetAvailability | null
  avatarPhotoAvailability_in?: AssetAvailability[] | AssetAvailability | null
  isPublic_eq?: Boolean | null
  isPublic_in?: Boolean[] | Boolean | null
  isCensored_eq?: Boolean | null
  isCensored_in?: Boolean[] | Boolean | null
  languageId_eq?: ID_Input | null
  languageId_in?: ID_Output[] | ID_Output | null
  happenedIn_eq?: Int | null
  happenedIn_gt?: Int | null
  happenedIn_gte?: Int | null
  happenedIn_lt?: Int | null
  happenedIn_lte?: Int | null
  happenedIn_in?: Int[] | Int | null
}

export interface ChannelWhereUniqueInput {
  id: ID_Output
}

export interface CuratorGroupCreateInput {
  curatorIds: Array<BigInt>
  isActive: Boolean
}

export interface CuratorGroupUpdateInput {
  curatorIds?: BigInt[] | BigInt | null
  isActive?: Boolean | null
}

export interface CuratorGroupWhereInput {
  id_eq?: ID_Input | null
  id_in?: ID_Output[] | ID_Output | null
  createdAt_eq?: DateTime | null
  createdAt_lt?: DateTime | null
  createdAt_lte?: DateTime | null
  createdAt_gt?: DateTime | null
  createdAt_gte?: DateTime | null
  createdById_eq?: ID_Input | null
  createdById_in?: ID_Output[] | ID_Output | null
  updatedAt_eq?: DateTime | null
  updatedAt_lt?: DateTime | null
  updatedAt_lte?: DateTime | null
  updatedAt_gt?: DateTime | null
  updatedAt_gte?: DateTime | null
  updatedById_eq?: ID_Input | null
  updatedById_in?: ID_Output[] | ID_Output | null
  deletedAt_all?: Boolean | null
  deletedAt_eq?: DateTime | null
  deletedAt_lt?: DateTime | null
  deletedAt_lte?: DateTime | null
  deletedAt_gt?: DateTime | null
  deletedAt_gte?: DateTime | null
  deletedById_eq?: ID_Input | null
  deletedById_in?: ID_Output[] | ID_Output | null
  isActive_eq?: Boolean | null
  isActive_in?: Boolean[] | Boolean | null
}

export interface CuratorGroupWhereUniqueInput {
  id: ID_Output
}

export interface DataObjectCreateInput {
  owner: JSONObject
  addedAt: Float
  typeId: Float
  size: BigInt
  liaisonId: BigInt
  liaisonJudgement: LiaisonJudgement
  ipfsContentId: String
  joystreamContentId: String
}

export interface DataObjectOwnerChannelCreateInput {
  channel: BigInt
  dummy?: Float | null
}

export interface DataObjectOwnerChannelUpdateInput {
  channel?: BigInt | null
  dummy?: Float | null
}

export interface DataObjectOwnerChannelWhereInput {
  id_eq?: ID_Input | null
  id_in?: ID_Output[] | ID_Output | null
  createdAt_eq?: DateTime | null
  createdAt_lt?: DateTime | null
  createdAt_lte?: DateTime | null
  createdAt_gt?: DateTime | null
  createdAt_gte?: DateTime | null
  createdById_eq?: ID_Input | null
  createdById_in?: ID_Output[] | ID_Output | null
  updatedAt_eq?: DateTime | null
  updatedAt_lt?: DateTime | null
  updatedAt_lte?: DateTime | null
  updatedAt_gt?: DateTime | null
  updatedAt_gte?: DateTime | null
  updatedById_eq?: ID_Input | null
  updatedById_in?: ID_Output[] | ID_Output | null
  deletedAt_all?: Boolean | null
  deletedAt_eq?: DateTime | null
  deletedAt_lt?: DateTime | null
  deletedAt_lte?: DateTime | null
  deletedAt_gt?: DateTime | null
  deletedAt_gte?: DateTime | null
  deletedById_eq?: ID_Input | null
  deletedById_in?: ID_Output[] | ID_Output | null
  channel_eq?: BigInt | null
  channel_gt?: BigInt | null
  channel_gte?: BigInt | null
  channel_lt?: BigInt | null
  channel_lte?: BigInt | null
  channel_in?: BigInt[] | BigInt | null
  dummy_eq?: Int | null
  dummy_gt?: Int | null
  dummy_gte?: Int | null
  dummy_lt?: Int | null
  dummy_lte?: Int | null
  dummy_in?: Int[] | Int | null
}

export interface DataObjectOwnerChannelWhereUniqueInput {
  id: ID_Output
}

export interface DataObjectOwnerCouncilCreateInput {
  dummy?: Float | null
}

export interface DataObjectOwnerCouncilUpdateInput {
  dummy?: Float | null
}

export interface DataObjectOwnerCouncilWhereInput {
  id_eq?: ID_Input | null
  id_in?: ID_Output[] | ID_Output | null
  createdAt_eq?: DateTime | null
  createdAt_lt?: DateTime | null
  createdAt_lte?: DateTime | null
  createdAt_gt?: DateTime | null
  createdAt_gte?: DateTime | null
  createdById_eq?: ID_Input | null
  createdById_in?: ID_Output[] | ID_Output | null
  updatedAt_eq?: DateTime | null
  updatedAt_lt?: DateTime | null
  updatedAt_lte?: DateTime | null
  updatedAt_gt?: DateTime | null
  updatedAt_gte?: DateTime | null
  updatedById_eq?: ID_Input | null
  updatedById_in?: ID_Output[] | ID_Output | null
  deletedAt_all?: Boolean | null
  deletedAt_eq?: DateTime | null
  deletedAt_lt?: DateTime | null
  deletedAt_lte?: DateTime | null
  deletedAt_gt?: DateTime | null
  deletedAt_gte?: DateTime | null
  deletedById_eq?: ID_Input | null
  deletedById_in?: ID_Output[] | ID_Output | null
  dummy_eq?: Int | null
  dummy_gt?: Int | null
  dummy_gte?: Int | null
  dummy_lt?: Int | null
  dummy_lte?: Int | null
  dummy_in?: Int[] | Int | null
}

export interface DataObjectOwnerCouncilWhereUniqueInput {
  id: ID_Output
}

export interface DataObjectOwnerDaoCreateInput {
  dao: BigInt
}

export interface DataObjectOwnerDaoUpdateInput {
  dao?: BigInt | null
}

export interface DataObjectOwnerDaoWhereInput {
  id_eq?: ID_Input | null
  id_in?: ID_Output[] | ID_Output | null
  createdAt_eq?: DateTime | null
  createdAt_lt?: DateTime | null
  createdAt_lte?: DateTime | null
  createdAt_gt?: DateTime | null
  createdAt_gte?: DateTime | null
  createdById_eq?: ID_Input | null
  createdById_in?: ID_Output[] | ID_Output | null
  updatedAt_eq?: DateTime | null
  updatedAt_lt?: DateTime | null
  updatedAt_lte?: DateTime | null
  updatedAt_gt?: DateTime | null
  updatedAt_gte?: DateTime | null
  updatedById_eq?: ID_Input | null
  updatedById_in?: ID_Output[] | ID_Output | null
  deletedAt_all?: Boolean | null
  deletedAt_eq?: DateTime | null
  deletedAt_lt?: DateTime | null
  deletedAt_lte?: DateTime | null
  deletedAt_gt?: DateTime | null
  deletedAt_gte?: DateTime | null
  deletedById_eq?: ID_Input | null
  deletedById_in?: ID_Output[] | ID_Output | null
  dao_eq?: BigInt | null
  dao_gt?: BigInt | null
  dao_gte?: BigInt | null
  dao_lt?: BigInt | null
  dao_lte?: BigInt | null
  dao_in?: BigInt[] | BigInt | null
}

export interface DataObjectOwnerDaoWhereUniqueInput {
  id: ID_Output
}

export interface DataObjectOwnerMemberCreateInput {
  member: BigInt
  dummy?: Float | null
}

export interface DataObjectOwnerMemberUpdateInput {
  member?: BigInt | null
  dummy?: Float | null
}

export interface DataObjectOwnerMemberWhereInput {
  id_eq?: ID_Input | null
  id_in?: ID_Output[] | ID_Output | null
  createdAt_eq?: DateTime | null
  createdAt_lt?: DateTime | null
  createdAt_lte?: DateTime | null
  createdAt_gt?: DateTime | null
  createdAt_gte?: DateTime | null
  createdById_eq?: ID_Input | null
  createdById_in?: ID_Output[] | ID_Output | null
  updatedAt_eq?: DateTime | null
  updatedAt_lt?: DateTime | null
  updatedAt_lte?: DateTime | null
  updatedAt_gt?: DateTime | null
  updatedAt_gte?: DateTime | null
  updatedById_eq?: ID_Input | null
  updatedById_in?: ID_Output[] | ID_Output | null
  deletedAt_all?: Boolean | null
  deletedAt_eq?: DateTime | null
  deletedAt_lt?: DateTime | null
  deletedAt_lte?: DateTime | null
  deletedAt_gt?: DateTime | null
  deletedAt_gte?: DateTime | null
  deletedById_eq?: ID_Input | null
  deletedById_in?: ID_Output[] | ID_Output | null
  member_eq?: BigInt | null
  member_gt?: BigInt | null
  member_gte?: BigInt | null
  member_lt?: BigInt | null
  member_lte?: BigInt | null
  member_in?: BigInt[] | BigInt | null
  dummy_eq?: Int | null
  dummy_gt?: Int | null
  dummy_gte?: Int | null
  dummy_lt?: Int | null
  dummy_lte?: Int | null
  dummy_in?: Int[] | Int | null
}

export interface DataObjectOwnerMemberWhereUniqueInput {
  id: ID_Output
}

export interface DataObjectOwnerWorkingGroupCreateInput {
  dummy?: Float | null
}

export interface DataObjectOwnerWorkingGroupUpdateInput {
  dummy?: Float | null
}

export interface DataObjectOwnerWorkingGroupWhereInput {
  id_eq?: ID_Input | null
  id_in?: ID_Output[] | ID_Output | null
  createdAt_eq?: DateTime | null
  createdAt_lt?: DateTime | null
  createdAt_lte?: DateTime | null
  createdAt_gt?: DateTime | null
  createdAt_gte?: DateTime | null
  createdById_eq?: ID_Input | null
  createdById_in?: ID_Output[] | ID_Output | null
  updatedAt_eq?: DateTime | null
  updatedAt_lt?: DateTime | null
  updatedAt_lte?: DateTime | null
  updatedAt_gt?: DateTime | null
  updatedAt_gte?: DateTime | null
  updatedById_eq?: ID_Input | null
  updatedById_in?: ID_Output[] | ID_Output | null
  deletedAt_all?: Boolean | null
  deletedAt_eq?: DateTime | null
  deletedAt_lt?: DateTime | null
  deletedAt_lte?: DateTime | null
  deletedAt_gt?: DateTime | null
  deletedAt_gte?: DateTime | null
  deletedById_eq?: ID_Input | null
  deletedById_in?: ID_Output[] | ID_Output | null
  dummy_eq?: Int | null
  dummy_gt?: Int | null
  dummy_gte?: Int | null
  dummy_lt?: Int | null
  dummy_lte?: Int | null
  dummy_in?: Int[] | Int | null
}

export interface DataObjectOwnerWorkingGroupWhereUniqueInput {
  id: ID_Output
}

export interface DataObjectUpdateInput {
  owner?: JSONObject | null
  addedAt?: Float | null
  typeId?: Float | null
  size?: BigInt | null
  liaisonId?: BigInt | null
  liaisonJudgement?: LiaisonJudgement | null
  ipfsContentId?: String | null
  joystreamContentId?: String | null
}

export interface DataObjectWhereInput {
  id_eq?: ID_Input | null
  id_in?: ID_Output[] | ID_Output | null
  createdAt_eq?: DateTime | null
  createdAt_lt?: DateTime | null
  createdAt_lte?: DateTime | null
  createdAt_gt?: DateTime | null
  createdAt_gte?: DateTime | null
  createdById_eq?: ID_Input | null
  createdById_in?: ID_Output[] | ID_Output | null
  updatedAt_eq?: DateTime | null
  updatedAt_lt?: DateTime | null
  updatedAt_lte?: DateTime | null
  updatedAt_gt?: DateTime | null
  updatedAt_gte?: DateTime | null
  updatedById_eq?: ID_Input | null
  updatedById_in?: ID_Output[] | ID_Output | null
  deletedAt_all?: Boolean | null
  deletedAt_eq?: DateTime | null
  deletedAt_lt?: DateTime | null
  deletedAt_lte?: DateTime | null
  deletedAt_gt?: DateTime | null
  deletedAt_gte?: DateTime | null
  deletedById_eq?: ID_Input | null
  deletedById_in?: ID_Output[] | ID_Output | null
  owner_json?: JSONObject | null
  addedAt_eq?: Int | null
  addedAt_gt?: Int | null
  addedAt_gte?: Int | null
  addedAt_lt?: Int | null
  addedAt_lte?: Int | null
  addedAt_in?: Int[] | Int | null
  typeId_eq?: Int | null
  typeId_gt?: Int | null
  typeId_gte?: Int | null
  typeId_lt?: Int | null
  typeId_lte?: Int | null
  typeId_in?: Int[] | Int | null
  size_eq?: BigInt | null
  size_gt?: BigInt | null
  size_gte?: BigInt | null
  size_lt?: BigInt | null
  size_lte?: BigInt | null
  size_in?: BigInt[] | BigInt | null
  liaisonId_eq?: BigInt | null
  liaisonId_gt?: BigInt | null
  liaisonId_gte?: BigInt | null
  liaisonId_lt?: BigInt | null
  liaisonId_lte?: BigInt | null
  liaisonId_in?: BigInt[] | BigInt | null
  liaisonJudgement_eq?: LiaisonJudgement | null
  liaisonJudgement_in?: LiaisonJudgement[] | LiaisonJudgement | null
  ipfsContentId_eq?: String | null
  ipfsContentId_contains?: String | null
  ipfsContentId_startsWith?: String | null
  ipfsContentId_endsWith?: String | null
  ipfsContentId_in?: String[] | String | null
  joystreamContentId_eq?: String | null
  joystreamContentId_contains?: String | null
  joystreamContentId_startsWith?: String | null
  joystreamContentId_endsWith?: String | null
  joystreamContentId_in?: String[] | String | null
}

export interface DataObjectWhereUniqueInput {
  id: ID_Output
}

export interface FeaturedVideoCreateInput {
  videoId: ID_Output
}

export interface FeaturedVideoUpdateInput {
  videoId?: ID_Input | null
}

export interface FeaturedVideoWhereInput {
  id_eq?: ID_Input | null
  id_in?: ID_Output[] | ID_Output | null
  createdAt_eq?: DateTime | null
  createdAt_lt?: DateTime | null
  createdAt_lte?: DateTime | null
  createdAt_gt?: DateTime | null
  createdAt_gte?: DateTime | null
  createdById_eq?: ID_Input | null
  createdById_in?: ID_Output[] | ID_Output | null
  updatedAt_eq?: DateTime | null
  updatedAt_lt?: DateTime | null
  updatedAt_lte?: DateTime | null
  updatedAt_gt?: DateTime | null
  updatedAt_gte?: DateTime | null
  updatedById_eq?: ID_Input | null
  updatedById_in?: ID_Output[] | ID_Output | null
  deletedAt_all?: Boolean | null
  deletedAt_eq?: DateTime | null
  deletedAt_lt?: DateTime | null
  deletedAt_lte?: DateTime | null
  deletedAt_gt?: DateTime | null
  deletedAt_gte?: DateTime | null
  deletedById_eq?: ID_Input | null
  deletedById_in?: ID_Output[] | ID_Output | null
  videoId_eq?: ID_Input | null
  videoId_in?: ID_Output[] | ID_Output | null
}

export interface FeaturedVideoWhereUniqueInput {
  id: ID_Output
}

export interface LanguageCreateInput {
  iso: String
  happenedIn: Float
}

export interface LanguageUpdateInput {
  iso?: String | null
  happenedIn?: Float | null
}

export interface LanguageWhereInput {
  id_eq?: ID_Input | null
  id_in?: ID_Output[] | ID_Output | null
  createdAt_eq?: DateTime | null
  createdAt_lt?: DateTime | null
  createdAt_lte?: DateTime | null
  createdAt_gt?: DateTime | null
  createdAt_gte?: DateTime | null
  createdById_eq?: ID_Input | null
  createdById_in?: ID_Output[] | ID_Output | null
  updatedAt_eq?: DateTime | null
  updatedAt_lt?: DateTime | null
  updatedAt_lte?: DateTime | null
  updatedAt_gt?: DateTime | null
  updatedAt_gte?: DateTime | null
  updatedById_eq?: ID_Input | null
  updatedById_in?: ID_Output[] | ID_Output | null
  deletedAt_all?: Boolean | null
  deletedAt_eq?: DateTime | null
  deletedAt_lt?: DateTime | null
  deletedAt_lte?: DateTime | null
  deletedAt_gt?: DateTime | null
  deletedAt_gte?: DateTime | null
  deletedById_eq?: ID_Input | null
  deletedById_in?: ID_Output[] | ID_Output | null
  iso_eq?: String | null
  iso_contains?: String | null
  iso_startsWith?: String | null
  iso_endsWith?: String | null
  iso_in?: String[] | String | null
  happenedIn_eq?: Int | null
  happenedIn_gt?: Int | null
  happenedIn_gte?: Int | null
  happenedIn_lt?: Int | null
  happenedIn_lte?: Int | null
  happenedIn_in?: Int[] | Int | null
}

export interface LanguageWhereUniqueInput {
  id: ID_Output
}

export interface LicenseCreateInput {
  code?: Float | null
  attribution?: String | null
  customText?: String | null
}

export interface LicenseUpdateInput {
  code?: Float | null
  attribution?: String | null
  customText?: String | null
}

export interface LicenseWhereInput {
  id_eq?: ID_Input | null
  id_in?: ID_Output[] | ID_Output | null
  createdAt_eq?: DateTime | null
  createdAt_lt?: DateTime | null
  createdAt_lte?: DateTime | null
  createdAt_gt?: DateTime | null
  createdAt_gte?: DateTime | null
  createdById_eq?: ID_Input | null
  createdById_in?: ID_Output[] | ID_Output | null
  updatedAt_eq?: DateTime | null
  updatedAt_lt?: DateTime | null
  updatedAt_lte?: DateTime | null
  updatedAt_gt?: DateTime | null
  updatedAt_gte?: DateTime | null
  updatedById_eq?: ID_Input | null
  updatedById_in?: ID_Output[] | ID_Output | null
  deletedAt_all?: Boolean | null
  deletedAt_eq?: DateTime | null
  deletedAt_lt?: DateTime | null
  deletedAt_lte?: DateTime | null
  deletedAt_gt?: DateTime | null
  deletedAt_gte?: DateTime | null
  deletedById_eq?: ID_Input | null
  deletedById_in?: ID_Output[] | ID_Output | null
  code_eq?: Int | null
  code_gt?: Int | null
  code_gte?: Int | null
  code_lt?: Int | null
  code_lte?: Int | null
  code_in?: Int[] | Int | null
  attribution_eq?: String | null
  attribution_contains?: String | null
  attribution_startsWith?: String | null
  attribution_endsWith?: String | null
  attribution_in?: String[] | String | null
  customText_eq?: String | null
  customText_contains?: String | null
  customText_startsWith?: String | null
  customText_endsWith?: String | null
  customText_in?: String[] | String | null
}

export interface LicenseWhereUniqueInput {
  id: ID_Output
}

export interface MembershipCreateInput {
  handle: String
  avatarUri?: String | null
  about?: String | null
  controllerAccount: String
  rootAccount: String
  registeredAtBlock: Float
  registeredAtTime: DateTime
  entry: MembershipEntryMethod
  subscription?: BigInt | null
}

export interface MembershipUpdateInput {
  handle?: String | null
  avatarUri?: String | null
  about?: String | null
  controllerAccount?: String | null
  rootAccount?: String | null
  registeredAtBlock?: Float | null
  registeredAtTime?: DateTime | null
  entry?: MembershipEntryMethod | null
  subscription?: BigInt | null
}

export interface MembershipWhereInput {
  id_eq?: ID_Input | null
  id_in?: ID_Output[] | ID_Output | null
  createdAt_eq?: DateTime | null
  createdAt_lt?: DateTime | null
  createdAt_lte?: DateTime | null
  createdAt_gt?: DateTime | null
  createdAt_gte?: DateTime | null
  createdById_eq?: ID_Input | null
  createdById_in?: ID_Output[] | ID_Output | null
  updatedAt_eq?: DateTime | null
  updatedAt_lt?: DateTime | null
  updatedAt_lte?: DateTime | null
  updatedAt_gt?: DateTime | null
  updatedAt_gte?: DateTime | null
  updatedById_eq?: ID_Input | null
  updatedById_in?: ID_Output[] | ID_Output | null
  deletedAt_all?: Boolean | null
  deletedAt_eq?: DateTime | null
  deletedAt_lt?: DateTime | null
  deletedAt_lte?: DateTime | null
  deletedAt_gt?: DateTime | null
  deletedAt_gte?: DateTime | null
  deletedById_eq?: ID_Input | null
  deletedById_in?: ID_Output[] | ID_Output | null
  handle_eq?: String | null
  handle_contains?: String | null
  handle_startsWith?: String | null
  handle_endsWith?: String | null
  handle_in?: String[] | String | null
  avatarUri_eq?: String | null
  avatarUri_contains?: String | null
  avatarUri_startsWith?: String | null
  avatarUri_endsWith?: String | null
  avatarUri_in?: String[] | String | null
  about_eq?: String | null
  about_contains?: String | null
  about_startsWith?: String | null
  about_endsWith?: String | null
  about_in?: String[] | String | null
  controllerAccount_eq?: String | null
  controllerAccount_contains?: String | null
  controllerAccount_startsWith?: String | null
  controllerAccount_endsWith?: String | null
  controllerAccount_in?: String[] | String | null
  rootAccount_eq?: String | null
  rootAccount_contains?: String | null
  rootAccount_startsWith?: String | null
  rootAccount_endsWith?: String | null
  rootAccount_in?: String[] | String | null
  registeredAtBlock_eq?: Int | null
  registeredAtBlock_gt?: Int | null
  registeredAtBlock_gte?: Int | null
  registeredAtBlock_lt?: Int | null
  registeredAtBlock_lte?: Int | null
  registeredAtBlock_in?: Int[] | Int | null
  registeredAtTime_eq?: DateTime | null
  registeredAtTime_lt?: DateTime | null
  registeredAtTime_lte?: DateTime | null
  registeredAtTime_gt?: DateTime | null
  registeredAtTime_gte?: DateTime | null
  entry_eq?: MembershipEntryMethod | null
  entry_in?: MembershipEntryMethod[] | MembershipEntryMethod | null
  subscription_eq?: BigInt | null
  subscription_gt?: BigInt | null
  subscription_gte?: BigInt | null
  subscription_lt?: BigInt | null
  subscription_lte?: BigInt | null
  subscription_in?: BigInt[] | BigInt | null
}

export interface MembershipWhereUniqueInput {
  id?: ID_Input | null
  handle?: String | null
}

export interface VideoCategoryCreateInput {
  name?: String | null
  happenedIn: Float
}

export interface VideoCategoryUpdateInput {
  name?: String | null
  happenedIn?: Float | null
}

export interface VideoCategoryWhereInput {
  id_eq?: ID_Input | null
  id_in?: ID_Output[] | ID_Output | null
  createdAt_eq?: DateTime | null
  createdAt_lt?: DateTime | null
  createdAt_lte?: DateTime | null
  createdAt_gt?: DateTime | null
  createdAt_gte?: DateTime | null
  createdById_eq?: ID_Input | null
  createdById_in?: ID_Output[] | ID_Output | null
  updatedAt_eq?: DateTime | null
  updatedAt_lt?: DateTime | null
  updatedAt_lte?: DateTime | null
  updatedAt_gt?: DateTime | null
  updatedAt_gte?: DateTime | null
  updatedById_eq?: ID_Input | null
  updatedById_in?: ID_Output[] | ID_Output | null
  deletedAt_all?: Boolean | null
  deletedAt_eq?: DateTime | null
  deletedAt_lt?: DateTime | null
  deletedAt_lte?: DateTime | null
  deletedAt_gt?: DateTime | null
  deletedAt_gte?: DateTime | null
  deletedById_eq?: ID_Input | null
  deletedById_in?: ID_Output[] | ID_Output | null
  name_eq?: String | null
  name_contains?: String | null
  name_startsWith?: String | null
  name_endsWith?: String | null
  name_in?: String[] | String | null
  happenedIn_eq?: Int | null
  happenedIn_gt?: Int | null
  happenedIn_gte?: Int | null
  happenedIn_lt?: Int | null
  happenedIn_lte?: Int | null
  happenedIn_in?: Int[] | Int | null
}

export interface VideoCategoryWhereUniqueInput {
  id: ID_Output
}

export interface VideoCreateInput {
  channelId: ID_Output
  categoryId?: ID_Input | null
  title?: String | null
  description?: String | null
  duration?: Float | null
  thumbnailPhotoDataObjectId?: ID_Input | null
  thumbnailPhotoUrls: Array<String>
  thumbnailPhotoAvailability: AssetAvailability
  languageId?: ID_Input | null
  hasMarketing?: Boolean | null
  publishedBeforeJoystream?: DateTime | null
  isPublic?: Boolean | null
  isCensored: Boolean
  isExplicit?: Boolean | null
  licenseId?: ID_Input | null
  mediaDataObjectId?: ID_Input | null
  mediaUrls: Array<String>
  mediaAvailability: AssetAvailability
  mediaMetadataId?: ID_Input | null
  happenedIn: Float
  isFeatured: Boolean
}

export interface VideoMediaEncodingCreateInput {
  codecName?: String | null
  container?: String | null
  mimeMediaType?: String | null
}

export interface VideoMediaEncodingUpdateInput {
  codecName?: String | null
  container?: String | null
  mimeMediaType?: String | null
}

export interface VideoMediaEncodingWhereInput {
  id_eq?: ID_Input | null
  id_in?: ID_Output[] | ID_Output | null
  createdAt_eq?: DateTime | null
  createdAt_lt?: DateTime | null
  createdAt_lte?: DateTime | null
  createdAt_gt?: DateTime | null
  createdAt_gte?: DateTime | null
  createdById_eq?: ID_Input | null
  createdById_in?: ID_Output[] | ID_Output | null
  updatedAt_eq?: DateTime | null
  updatedAt_lt?: DateTime | null
  updatedAt_lte?: DateTime | null
  updatedAt_gt?: DateTime | null
  updatedAt_gte?: DateTime | null
  updatedById_eq?: ID_Input | null
  updatedById_in?: ID_Output[] | ID_Output | null
  deletedAt_all?: Boolean | null
  deletedAt_eq?: DateTime | null
  deletedAt_lt?: DateTime | null
  deletedAt_lte?: DateTime | null
  deletedAt_gt?: DateTime | null
  deletedAt_gte?: DateTime | null
  deletedById_eq?: ID_Input | null
  deletedById_in?: ID_Output[] | ID_Output | null
  codecName_eq?: String | null
  codecName_contains?: String | null
  codecName_startsWith?: String | null
  codecName_endsWith?: String | null
  codecName_in?: String[] | String | null
  container_eq?: String | null
  container_contains?: String | null
  container_startsWith?: String | null
  container_endsWith?: String | null
  container_in?: String[] | String | null
  mimeMediaType_eq?: String | null
  mimeMediaType_contains?: String | null
  mimeMediaType_startsWith?: String | null
  mimeMediaType_endsWith?: String | null
  mimeMediaType_in?: String[] | String | null
}

export interface VideoMediaEncodingWhereUniqueInput {
  id: ID_Output
}

export interface VideoMediaMetadataCreateInput {
  encodingId?: ID_Input | null
  pixelWidth?: Float | null
  pixelHeight?: Float | null
  size?: BigInt | null
  happenedIn: Float
}

export interface VideoMediaMetadataUpdateInput {
  encodingId?: ID_Input | null
  pixelWidth?: Float | null
  pixelHeight?: Float | null
  size?: BigInt | null
  happenedIn?: Float | null
}

export interface VideoMediaMetadataWhereInput {
  id_eq?: ID_Input | null
  id_in?: ID_Output[] | ID_Output | null
  createdAt_eq?: DateTime | null
  createdAt_lt?: DateTime | null
  createdAt_lte?: DateTime | null
  createdAt_gt?: DateTime | null
  createdAt_gte?: DateTime | null
  createdById_eq?: ID_Input | null
  createdById_in?: ID_Output[] | ID_Output | null
  updatedAt_eq?: DateTime | null
  updatedAt_lt?: DateTime | null
  updatedAt_lte?: DateTime | null
  updatedAt_gt?: DateTime | null
  updatedAt_gte?: DateTime | null
  updatedById_eq?: ID_Input | null
  updatedById_in?: ID_Output[] | ID_Output | null
  deletedAt_all?: Boolean | null
  deletedAt_eq?: DateTime | null
  deletedAt_lt?: DateTime | null
  deletedAt_lte?: DateTime | null
  deletedAt_gt?: DateTime | null
  deletedAt_gte?: DateTime | null
  deletedById_eq?: ID_Input | null
  deletedById_in?: ID_Output[] | ID_Output | null
  encodingId_eq?: ID_Input | null
  encodingId_in?: ID_Output[] | ID_Output | null
  pixelWidth_eq?: Int | null
  pixelWidth_gt?: Int | null
  pixelWidth_gte?: Int | null
  pixelWidth_lt?: Int | null
  pixelWidth_lte?: Int | null
  pixelWidth_in?: Int[] | Int | null
  pixelHeight_eq?: Int | null
  pixelHeight_gt?: Int | null
  pixelHeight_gte?: Int | null
  pixelHeight_lt?: Int | null
  pixelHeight_lte?: Int | null
  pixelHeight_in?: Int[] | Int | null
  size_eq?: BigInt | null
  size_gt?: BigInt | null
  size_gte?: BigInt | null
  size_lt?: BigInt | null
  size_lte?: BigInt | null
  size_in?: BigInt[] | BigInt | null
  happenedIn_eq?: Int | null
  happenedIn_gt?: Int | null
  happenedIn_gte?: Int | null
  happenedIn_lt?: Int | null
  happenedIn_lte?: Int | null
  happenedIn_in?: Int[] | Int | null
}

export interface VideoMediaMetadataWhereUniqueInput {
  id: ID_Output
}

export interface VideoUpdateInput {
  channelId?: ID_Input | null
  categoryId?: ID_Input | null
  title?: String | null
  description?: String | null
  duration?: Float | null
  thumbnailPhotoDataObjectId?: ID_Input | null
  thumbnailPhotoUrls?: String[] | String | null
  thumbnailPhotoAvailability?: AssetAvailability | null
  languageId?: ID_Input | null
  hasMarketing?: Boolean | null
  publishedBeforeJoystream?: DateTime | null
  isPublic?: Boolean | null
  isCensored?: Boolean | null
  isExplicit?: Boolean | null
  licenseId?: ID_Input | null
  mediaDataObjectId?: ID_Input | null
  mediaUrls?: String[] | String | null
  mediaAvailability?: AssetAvailability | null
  mediaMetadataId?: ID_Input | null
  happenedIn?: Float | null
  isFeatured?: Boolean | null
}

export interface VideoWhereInput {
  id_eq?: ID_Input | null
  id_in?: ID_Output[] | ID_Output | null
  createdAt_eq?: DateTime | null
  createdAt_lt?: DateTime | null
  createdAt_lte?: DateTime | null
  createdAt_gt?: DateTime | null
  createdAt_gte?: DateTime | null
  createdById_eq?: ID_Input | null
  createdById_in?: ID_Output[] | ID_Output | null
  updatedAt_eq?: DateTime | null
  updatedAt_lt?: DateTime | null
  updatedAt_lte?: DateTime | null
  updatedAt_gt?: DateTime | null
  updatedAt_gte?: DateTime | null
  updatedById_eq?: ID_Input | null
  updatedById_in?: ID_Output[] | ID_Output | null
  deletedAt_all?: Boolean | null
  deletedAt_eq?: DateTime | null
  deletedAt_lt?: DateTime | null
  deletedAt_lte?: DateTime | null
  deletedAt_gt?: DateTime | null
  deletedAt_gte?: DateTime | null
  deletedById_eq?: ID_Input | null
  deletedById_in?: ID_Output[] | ID_Output | null
  channelId_eq?: ID_Input | null
  channelId_in?: ID_Output[] | ID_Output | null
  categoryId_eq?: ID_Input | null
  categoryId_in?: ID_Output[] | ID_Output | null
  title_eq?: String | null
  title_contains?: String | null
  title_startsWith?: String | null
  title_endsWith?: String | null
  title_in?: String[] | String | null
  description_eq?: String | null
  description_contains?: String | null
  description_startsWith?: String | null
  description_endsWith?: String | null
  description_in?: String[] | String | null
  duration_eq?: Int | null
  duration_gt?: Int | null
  duration_gte?: Int | null
  duration_lt?: Int | null
  duration_lte?: Int | null
  duration_in?: Int[] | Int | null
  thumbnailPhotoDataObjectId_eq?: ID_Input | null
  thumbnailPhotoDataObjectId_in?: ID_Output[] | ID_Output | null
  thumbnailPhotoAvailability_eq?: AssetAvailability | null
  thumbnailPhotoAvailability_in?: AssetAvailability[] | AssetAvailability | null
  languageId_eq?: ID_Input | null
  languageId_in?: ID_Output[] | ID_Output | null
  hasMarketing_eq?: Boolean | null
  hasMarketing_in?: Boolean[] | Boolean | null
  publishedBeforeJoystream_eq?: DateTime | null
  publishedBeforeJoystream_lt?: DateTime | null
  publishedBeforeJoystream_lte?: DateTime | null
  publishedBeforeJoystream_gt?: DateTime | null
  publishedBeforeJoystream_gte?: DateTime | null
  isPublic_eq?: Boolean | null
  isPublic_in?: Boolean[] | Boolean | null
  isCensored_eq?: Boolean | null
  isCensored_in?: Boolean[] | Boolean | null
  isExplicit_eq?: Boolean | null
  isExplicit_in?: Boolean[] | Boolean | null
  licenseId_eq?: ID_Input | null
  licenseId_in?: ID_Output[] | ID_Output | null
  mediaDataObjectId_eq?: ID_Input | null
  mediaDataObjectId_in?: ID_Output[] | ID_Output | null
  mediaAvailability_eq?: AssetAvailability | null
  mediaAvailability_in?: AssetAvailability[] | AssetAvailability | null
  mediaMetadataId_eq?: ID_Input | null
  mediaMetadataId_in?: ID_Output[] | ID_Output | null
  happenedIn_eq?: Int | null
  happenedIn_gt?: Int | null
  happenedIn_gte?: Int | null
  happenedIn_lt?: Int | null
  happenedIn_lte?: Int | null
  happenedIn_in?: Int[] | Int | null
  isFeatured_eq?: Boolean | null
  isFeatured_in?: Boolean[] | Boolean | null
}

export interface VideoWhereUniqueInput {
  id: ID_Output
}

export interface BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
}

export interface DeleteResponse {
  id: ID_Output
}

export interface BaseModel extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
}

export interface BaseModelUUID extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
}

export interface Channel extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  ownerMember?: Membership | null
  ownerMemberId?: String | null
  ownerCuratorGroup?: CuratorGroup | null
  ownerCuratorGroupId?: String | null
  category?: ChannelCategory | null
  categoryId?: String | null
  rewardAccount?: String | null
  title?: String | null
  description?: String | null
  coverPhotoDataObject?: DataObject | null
  coverPhotoDataObjectId?: String | null
  coverPhotoUrls: Array<String>
  coverPhotoAvailability: AssetAvailability
  avatarPhotoDataObject?: DataObject | null
  avatarPhotoDataObjectId?: String | null
  avatarPhotoUrls: Array<String>
  avatarPhotoAvailability: AssetAvailability
  isPublic?: Boolean | null
  isCensored: Boolean
  language?: Language | null
  languageId?: String | null
  videos: Array<Video>
  happenedIn: Int
}

export interface ChannelCategoriesByNameFTSOutput {
  item: ChannelCategoriesByNameSearchResult
  rank: Float
  isTypeOf: String
  highlight: String
}

/*
 * Category of media channel

 */
export interface ChannelCategory extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  name?: String | null
  channels: Array<Channel>
  happenedIn: Int
}

export interface ChannelCategoryConnection {
  totalCount: Int
  edges: Array<ChannelCategoryEdge>
  pageInfo: PageInfo
}

export interface ChannelCategoryEdge {
  node: ChannelCategory
  cursor: String
}

export interface ChannelConnection {
  totalCount: Int
  edges: Array<ChannelEdge>
  pageInfo: PageInfo
}

export interface ChannelEdge {
  node: Channel
  cursor: String
}

export interface CuratorGroup extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  curatorIds: Array<BigInt>
  isActive: Boolean
  channels: Array<Channel>
}

export interface CuratorGroupConnection {
  totalCount: Int
  edges: Array<CuratorGroupEdge>
  pageInfo: PageInfo
}

export interface CuratorGroupEdge {
  node: CuratorGroup
  cursor: String
}

/*
 * Manages content ids, type and storage provider decision about it

 */
export interface DataObject extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  owner: DataObjectOwner
  addedAt: Int
  typeId: Int
  size: BigInt
  liaisonId: BigInt
  liaisonJudgement: LiaisonJudgement
  ipfsContentId: String
  joystreamContentId: String
  channelcoverPhotoDataObject?: Array<Channel> | null
  channelavatarPhotoDataObject?: Array<Channel> | null
  videothumbnailPhotoDataObject?: Array<Video> | null
  videomediaDataObject?: Array<Video> | null
}

export interface DataObjectConnection {
  totalCount: Int
  edges: Array<DataObjectEdge>
  pageInfo: PageInfo
}

export interface DataObjectEdge {
  node: DataObject
  cursor: String
}

export interface DataObjectOwnerChannel {
  channel: BigInt
  dummy?: Int | null
}

export interface DataObjectOwnerCouncil {
  dummy?: Int | null
}

export interface DataObjectOwnerDao {
  dao: BigInt
}

export interface DataObjectOwnerMember {
  member: BigInt
  dummy?: Int | null
}

export interface DataObjectOwnerWorkingGroup {
  dummy?: Int | null
}

export interface FeaturedVideo extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  video: Video
  videoId: String
}

export interface FeaturedVideoConnection {
  totalCount: Int
  edges: Array<FeaturedVideoEdge>
  pageInfo: PageInfo
}

export interface FeaturedVideoEdge {
  node: FeaturedVideo
  cursor: String
}

export interface Language extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  iso: String
  happenedIn: Int
  channellanguage?: Array<Channel> | null
  videolanguage?: Array<Video> | null
}

export interface LanguageConnection {
  totalCount: Int
  edges: Array<LanguageEdge>
  pageInfo: PageInfo
}

export interface LanguageEdge {
  node: Language
  cursor: String
}

export interface License extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  code?: Int | null
  attribution?: String | null
  customText?: String | null
  videolicense?: Array<Video> | null
}

export interface LicenseConnection {
  totalCount: Int
  edges: Array<LicenseEdge>
  pageInfo: PageInfo
}

export interface LicenseEdge {
  node: License
  cursor: String
}

export interface MembersByHandleFTSOutput {
  item: MembersByHandleSearchResult
  rank: Float
  isTypeOf: String
  highlight: String
}

/*
 * Stored information about a registered user

 */
export interface Membership extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  handle: String
  avatarUri?: String | null
  about?: String | null
  controllerAccount: String
  rootAccount: String
  registeredAtBlock: Int
  registeredAtTime: DateTime
  entry: MembershipEntryMethod
  subscription?: BigInt | null
  channels: Array<Channel>
}

export interface MembershipConnection {
  totalCount: Int
  edges: Array<MembershipEdge>
  pageInfo: PageInfo
}

export interface MembershipEdge {
  node: Membership
  cursor: String
}

export interface PageInfo {
  hasNextPage: Boolean
  hasPreviousPage: Boolean
  startCursor?: String | null
  endCursor?: String | null
}

export interface ProcessorState {
  lastCompleteBlock: Float
  lastProcessedEvent: String
  indexerHead: Float
  chainHead: Float
}

export interface SearchFTSOutput {
  item: SearchSearchResult
  rank: Float
  isTypeOf: String
  highlight: String
}

export interface StandardDeleteResponse {
  id: ID_Output
}

export interface Video extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  channel: Channel
  channelId: String
  category?: VideoCategory | null
  categoryId?: String | null
  title?: String | null
  description?: String | null
  duration?: Int | null
  thumbnailPhotoDataObject?: DataObject | null
  thumbnailPhotoDataObjectId?: String | null
  thumbnailPhotoUrls: Array<String>
  thumbnailPhotoAvailability: AssetAvailability
  language?: Language | null
  languageId?: String | null
  hasMarketing?: Boolean | null
  publishedBeforeJoystream?: DateTime | null
  isPublic?: Boolean | null
  isCensored: Boolean
  isExplicit?: Boolean | null
  license?: License | null
  licenseId?: String | null
  mediaDataObject?: DataObject | null
  mediaDataObjectId?: String | null
  mediaUrls: Array<String>
  mediaAvailability: AssetAvailability
  mediaMetadata?: VideoMediaMetadata | null
  mediaMetadataId?: String | null
  happenedIn: Int
  isFeatured: Boolean
  featured?: FeaturedVideo | null
}

export interface VideoCategoriesByNameFTSOutput {
  item: VideoCategoriesByNameSearchResult
  rank: Float
  isTypeOf: String
  highlight: String
}

export interface VideoCategory extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  name?: String | null
  videos: Array<Video>
  happenedIn: Int
}

export interface VideoCategoryConnection {
  totalCount: Int
  edges: Array<VideoCategoryEdge>
  pageInfo: PageInfo
}

export interface VideoCategoryEdge {
  node: VideoCategory
  cursor: String
}

export interface VideoConnection {
  totalCount: Int
  edges: Array<VideoEdge>
  pageInfo: PageInfo
}

export interface VideoEdge {
  node: Video
  cursor: String
}

export interface VideoMediaEncoding extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  codecName?: String | null
  container?: String | null
  mimeMediaType?: String | null
  videomediametadataencoding?: Array<VideoMediaMetadata> | null
}

export interface VideoMediaEncodingConnection {
  totalCount: Int
  edges: Array<VideoMediaEncodingEdge>
  pageInfo: PageInfo
}

export interface VideoMediaEncodingEdge {
  node: VideoMediaEncoding
  cursor: String
}

export interface VideoMediaMetadata extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  encoding?: VideoMediaEncoding | null
  encodingId?: String | null
  pixelWidth?: Int | null
  pixelHeight?: Int | null
  size?: BigInt | null
  video?: Video | null
  happenedIn: Int
}

export interface VideoMediaMetadataConnection {
  totalCount: Int
  edges: Array<VideoMediaMetadataEdge>
  pageInfo: PageInfo
}

export interface VideoMediaMetadataEdge {
  node: VideoMediaMetadata
  cursor: String
}

/*
GraphQL representation of BigInt
*/
export type BigInt = string

/*
The `Boolean` scalar type represents `true` or `false`.
*/
export type Boolean = boolean

/*
The javascript `Date` as string. Type represents date and time as the ISO Date string.
*/
export type DateTime = Date | string

/*
The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point).
*/
export type Float = number

/*
The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.
*/
export type ID_Input = string | number
export type ID_Output = string

/*
The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1.
*/
export type Int = number

/*
The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
*/

    export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

    export type JsonPrimitive = string | number | boolean | null | {};
    
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface JsonArray extends Array<JsonValue> {}
    
    export type JsonObject = { [member: string]: JsonValue };

    export type JSONObject = JsonObject;
  

/*
The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.
*/
export type String = string

export type ChannelCategoriesByNameSearchResult = ChannelCategory

export type DataObjectOwner = DataObjectOwnerMember | DataObjectOwnerChannel | DataObjectOwnerDao | DataObjectOwnerCouncil | DataObjectOwnerWorkingGroup

export type MembersByHandleSearchResult = Membership

export type SearchSearchResult = Channel | Video

export type VideoCategoriesByNameSearchResult = VideoCategory