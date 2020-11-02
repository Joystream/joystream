import 'graphql-import-node'; // Needed so you can import *.graphql files 

import { makeBindingClass, Options } from 'graphql-binding'
import { GraphQLResolveInfo, GraphQLSchema } from 'graphql'
import { IResolvers } from 'graphql-tools/dist/Interfaces'
import * as schema from  './schema.graphql'

export interface Query {
    blocks: <T = Array<Block>>(args: { offset?: Int | null, limit?: Int | null, where?: BlockWhereInput | null, orderBy?: BlockOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    blockConnection: <T = BlockConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: BlockWhereInput | null, orderBy?: BlockOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    categorys: <T = Array<Category>>(args: { offset?: Int | null, limit?: Int | null, where?: CategoryWhereInput | null, orderBy?: CategoryOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    categoryConnection: <T = CategoryConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: CategoryWhereInput | null, orderBy?: CategoryOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    channels: <T = Array<Channel>>(args: { offset?: Int | null, limit?: Int | null, where?: ChannelWhereInput | null, orderBy?: ChannelOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    channelConnection: <T = ChannelConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: ChannelWhereInput | null, orderBy?: ChannelOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    classEntitys: <T = Array<ClassEntity>>(args: { offset?: Int | null, limit?: Int | null, where?: ClassEntityWhereInput | null, orderBy?: ClassEntityOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    classEntityConnection: <T = ClassEntityConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: ClassEntityWhereInput | null, orderBy?: ClassEntityOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    httpMediaLocations: <T = Array<HttpMediaLocation>>(args: { offset?: Int | null, limit?: Int | null, where?: HttpMediaLocationWhereInput | null, orderBy?: HttpMediaLocationOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    httpMediaLocationConnection: <T = HttpMediaLocationConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: HttpMediaLocationWhereInput | null, orderBy?: HttpMediaLocationOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    joystreamMediaLocations: <T = Array<JoystreamMediaLocation>>(args: { offset?: Int | null, limit?: Int | null, where?: JoystreamMediaLocationWhereInput | null, orderBy?: JoystreamMediaLocationOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    joystreamMediaLocationConnection: <T = JoystreamMediaLocationConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: JoystreamMediaLocationWhereInput | null, orderBy?: JoystreamMediaLocationOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    knownLicenses: <T = Array<KnownLicense>>(args: { offset?: Int | null, limit?: Int | null, where?: KnownLicenseWhereInput | null, orderBy?: KnownLicenseOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    knownLicenseConnection: <T = KnownLicenseConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: KnownLicenseWhereInput | null, orderBy?: KnownLicenseOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    languages: <T = Array<Language>>(args: { offset?: Int | null, limit?: Int | null, where?: LanguageWhereInput | null, orderBy?: LanguageOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    languageConnection: <T = LanguageConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: LanguageWhereInput | null, orderBy?: LanguageOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    members: <T = Array<Member>>(args: { offset?: Int | null, limit?: Int | null, where?: MemberWhereInput | null, orderBy?: MemberOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    memberConnection: <T = MemberConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: MemberWhereInput | null, orderBy?: MemberOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    handles: <T = Array<HandlesFTSOutput>>(args: { limit?: Int | null, text: String }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    names: <T = Array<NamesFTSOutput>>(args: { limit?: Int | null, text: String }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    titles: <T = Array<TitlesFTSOutput>>(args: { limit?: Int | null, text: String }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    userDefinedLicenses: <T = Array<UserDefinedLicense>>(args: { offset?: Int | null, limit?: Int | null, where?: UserDefinedLicenseWhereInput | null, orderBy?: UserDefinedLicenseOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    userDefinedLicenseConnection: <T = UserDefinedLicenseConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: UserDefinedLicenseWhereInput | null, orderBy?: UserDefinedLicenseOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    videoMediaEncodings: <T = Array<VideoMediaEncoding>>(args: { offset?: Int | null, limit?: Int | null, where?: VideoMediaEncodingWhereInput | null, orderBy?: VideoMediaEncodingOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    videoMediaEncodingConnection: <T = VideoMediaEncodingConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: VideoMediaEncodingWhereInput | null, orderBy?: VideoMediaEncodingOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    videoMedias: <T = Array<VideoMedia>>(args: { offset?: Int | null, limit?: Int | null, where?: VideoMediaWhereInput | null, orderBy?: VideoMediaOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    videoMediaConnection: <T = VideoMediaConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: VideoMediaWhereInput | null, orderBy?: VideoMediaOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    videos: <T = Array<Video>>(args: { offset?: Int | null, limit?: Int | null, where?: VideoWhereInput | null, orderBy?: VideoOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    videoConnection: <T = VideoConnection>(args: { first?: Int | null, after?: String | null, last?: Int | null, before?: String | null, where?: VideoWhereInput | null, orderBy?: VideoOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> 
  }

export interface Mutation {}

export interface Subscription {}

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

export type BlockOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'block_ASC' |
  'block_DESC' |
  'timestamp_ASC' |
  'timestamp_DESC' |
  'nework_ASC' |
  'nework_DESC'

export type CategoryOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'name_ASC' |
  'name_DESC' |
  'description_ASC' |
  'description_DESC' |
  'happenedInId_ASC' |
  'happenedInId_DESC'

export type ChannelOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'title_ASC' |
  'title_DESC' |
  'description_ASC' |
  'description_DESC' |
  'coverPhotoUrl_ASC' |
  'coverPhotoUrl_DESC' |
  'avatarPhotoUrl_ASC' |
  'avatarPhotoUrl_DESC' |
  'isPublic_ASC' |
  'isPublic_DESC' |
  'isCurated_ASC' |
  'isCurated_DESC' |
  'languageId_ASC' |
  'languageId_DESC' |
  'happenedInId_ASC' |
  'happenedInId_DESC'

export type ClassEntityOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'classId_ASC' |
  'classId_DESC' |
  'happenedInId_ASC' |
  'happenedInId_DESC'

export type HttpMediaLocationOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'url_ASC' |
  'url_DESC' |
  'port_ASC' |
  'port_DESC' |
  'happenedInId_ASC' |
  'happenedInId_DESC'

export type JoystreamMediaLocationOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'dataObjectId_ASC' |
  'dataObjectId_DESC' |
  'happenedInId_ASC' |
  'happenedInId_DESC'

export type KnownLicenseOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'code_ASC' |
  'code_DESC' |
  'name_ASC' |
  'name_DESC' |
  'description_ASC' |
  'description_DESC' |
  'url_ASC' |
  'url_DESC' |
  'happenedInId_ASC' |
  'happenedInId_DESC'

export type LanguageOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'name_ASC' |
  'name_DESC' |
  'code_ASC' |
  'code_DESC' |
  'happenedInId_ASC' |
  'happenedInId_DESC'

export type MemberOrderByInput =   'createdAt_ASC' |
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
  'registeredAtBlock_ASC' |
  'registeredAtBlock_DESC' |
  'controllerAccount_ASC' |
  'controllerAccount_DESC' |
  'rootAccount_ASC' |
  'rootAccount_DESC' |
  'happenedInId_ASC' |
  'happenedInId_DESC'

export type Network =   'BABYLON' |
  'ALEXANDRIA' |
  'ROME'

export type UserDefinedLicenseOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'content_ASC' |
  'content_DESC' |
  'happenedInId_ASC' |
  'happenedInId_DESC'

export type VideoMediaEncodingOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'name_ASC' |
  'name_DESC'

export type VideoMediaOrderByInput =   'createdAt_ASC' |
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
  'locationId_ASC' |
  'locationId_DESC' |
  'happenedInId_ASC' |
  'happenedInId_DESC'

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
  'skippableIntroDuration_ASC' |
  'skippableIntroDuration_DESC' |
  'thumbnailUrl_ASC' |
  'thumbnailUrl_DESC' |
  'languageId_ASC' |
  'languageId_DESC' |
  'videoMediaId_ASC' |
  'videoMediaId_DESC' |
  'hasMarketing_ASC' |
  'hasMarketing_DESC' |
  'publishedBeforeJoystream_ASC' |
  'publishedBeforeJoystream_DESC' |
  'isPublic_ASC' |
  'isPublic_DESC' |
  'isCurated_ASC' |
  'isCurated_DESC' |
  'isExplicit_ASC' |
  'isExplicit_DESC' |
  'licenseId_ASC' |
  'licenseId_DESC' |
  'happenedInId_ASC' |
  'happenedInId_DESC'

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

export interface BlockCreateInput {
  block: Float
  timestamp: Float
  nework: Network
}

export interface BlockUpdateInput {
  block?: Float | null
  timestamp?: Float | null
  nework?: Network | null
}

export interface BlockWhereInput {
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
  block_eq?: Int | null
  block_gt?: Int | null
  block_gte?: Int | null
  block_lt?: Int | null
  block_lte?: Int | null
  block_in?: Int[] | Int | null
  timestamp_eq?: Int | null
  timestamp_gt?: Int | null
  timestamp_gte?: Int | null
  timestamp_lt?: Int | null
  timestamp_lte?: Int | null
  timestamp_in?: Int[] | Int | null
  nework_eq?: Network | null
  nework_in?: Network[] | Network | null
}

export interface BlockWhereUniqueInput {
  id: ID_Output
}

export interface CategoryCreateInput {
  name: String
  description?: String | null
  happenedInId: ID_Output
}

export interface CategoryUpdateInput {
  name?: String | null
  description?: String | null
  happenedInId?: ID_Input | null
}

export interface CategoryWhereInput {
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
  description_eq?: String | null
  description_contains?: String | null
  description_startsWith?: String | null
  description_endsWith?: String | null
  description_in?: String[] | String | null
  happenedInId_eq?: ID_Input | null
  happenedInId_in?: ID_Output[] | ID_Output | null
}

export interface CategoryWhereUniqueInput {
  id?: ID_Input | null
  name?: String | null
}

export interface ChannelCreateInput {
  title: String
  description: String
  coverPhotoUrl: String
  avatarPhotoUrl: String
  isPublic: Boolean
  isCurated: Boolean
  languageId?: Float | null
  happenedInId: ID_Output
}

export interface ChannelUpdateInput {
  title?: String | null
  description?: String | null
  coverPhotoUrl?: String | null
  avatarPhotoUrl?: String | null
  isPublic?: Boolean | null
  isCurated?: Boolean | null
  languageId?: Float | null
  happenedInId?: ID_Input | null
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
  coverPhotoUrl_eq?: String | null
  coverPhotoUrl_contains?: String | null
  coverPhotoUrl_startsWith?: String | null
  coverPhotoUrl_endsWith?: String | null
  coverPhotoUrl_in?: String[] | String | null
  avatarPhotoUrl_eq?: String | null
  avatarPhotoUrl_contains?: String | null
  avatarPhotoUrl_startsWith?: String | null
  avatarPhotoUrl_endsWith?: String | null
  avatarPhotoUrl_in?: String[] | String | null
  isPublic_eq?: Boolean | null
  isPublic_in?: Boolean[] | Boolean | null
  isCurated_eq?: Boolean | null
  isCurated_in?: Boolean[] | Boolean | null
  languageId_eq?: Int | null
  languageId_gt?: Int | null
  languageId_gte?: Int | null
  languageId_lt?: Int | null
  languageId_lte?: Int | null
  languageId_in?: Int[] | Int | null
  happenedInId_eq?: ID_Input | null
  happenedInId_in?: ID_Output[] | ID_Output | null
}

export interface ChannelWhereUniqueInput {
  id: ID_Output
}

export interface ClassEntityCreateInput {
  classId: Float
  happenedInId: ID_Output
}

export interface ClassEntityUpdateInput {
  classId?: Float | null
  happenedInId?: ID_Input | null
}

export interface ClassEntityWhereInput {
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
  classId_eq?: Int | null
  classId_gt?: Int | null
  classId_gte?: Int | null
  classId_lt?: Int | null
  classId_lte?: Int | null
  classId_in?: Int[] | Int | null
  happenedInId_eq?: ID_Input | null
  happenedInId_in?: ID_Output[] | ID_Output | null
}

export interface ClassEntityWhereUniqueInput {
  id: ID_Output
}

export interface HttpMediaLocationCreateInput {
  url: String
  port?: Float | null
  happenedInId: ID_Output
}

export interface HttpMediaLocationUpdateInput {
  url?: String | null
  port?: Float | null
  happenedInId?: ID_Input | null
}

export interface HttpMediaLocationWhereInput {
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
  url_eq?: String | null
  url_contains?: String | null
  url_startsWith?: String | null
  url_endsWith?: String | null
  url_in?: String[] | String | null
  port_eq?: Int | null
  port_gt?: Int | null
  port_gte?: Int | null
  port_lt?: Int | null
  port_lte?: Int | null
  port_in?: Int[] | Int | null
  happenedInId_eq?: ID_Input | null
  happenedInId_in?: ID_Output[] | ID_Output | null
}

export interface HttpMediaLocationWhereUniqueInput {
  id: ID_Output
}

export interface JoystreamMediaLocationCreateInput {
  dataObjectId: String
  happenedInId: ID_Output
}

export interface JoystreamMediaLocationUpdateInput {
  dataObjectId?: String | null
  happenedInId?: ID_Input | null
}

export interface JoystreamMediaLocationWhereInput {
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
  dataObjectId_eq?: String | null
  dataObjectId_contains?: String | null
  dataObjectId_startsWith?: String | null
  dataObjectId_endsWith?: String | null
  dataObjectId_in?: String[] | String | null
  happenedInId_eq?: ID_Input | null
  happenedInId_in?: ID_Output[] | ID_Output | null
}

export interface JoystreamMediaLocationWhereUniqueInput {
  id?: ID_Input | null
  dataObjectId?: String | null
}

export interface KnownLicenseCreateInput {
  code: String
  name?: String | null
  description?: String | null
  url?: String | null
  happenedInId: ID_Output
}

export interface KnownLicenseUpdateInput {
  code?: String | null
  name?: String | null
  description?: String | null
  url?: String | null
  happenedInId?: ID_Input | null
}

export interface KnownLicenseWhereInput {
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
  code_eq?: String | null
  code_contains?: String | null
  code_startsWith?: String | null
  code_endsWith?: String | null
  code_in?: String[] | String | null
  name_eq?: String | null
  name_contains?: String | null
  name_startsWith?: String | null
  name_endsWith?: String | null
  name_in?: String[] | String | null
  description_eq?: String | null
  description_contains?: String | null
  description_startsWith?: String | null
  description_endsWith?: String | null
  description_in?: String[] | String | null
  url_eq?: String | null
  url_contains?: String | null
  url_startsWith?: String | null
  url_endsWith?: String | null
  url_in?: String[] | String | null
  happenedInId_eq?: ID_Input | null
  happenedInId_in?: ID_Output[] | ID_Output | null
}

export interface KnownLicenseWhereUniqueInput {
  id?: ID_Input | null
  code?: String | null
}

export interface LanguageCreateInput {
  name: String
  code: String
  happenedInId: ID_Output
}

export interface LanguageUpdateInput {
  name?: String | null
  code?: String | null
  happenedInId?: ID_Input | null
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
  name_eq?: String | null
  name_contains?: String | null
  name_startsWith?: String | null
  name_endsWith?: String | null
  name_in?: String[] | String | null
  code_eq?: String | null
  code_contains?: String | null
  code_startsWith?: String | null
  code_endsWith?: String | null
  code_in?: String[] | String | null
  happenedInId_eq?: ID_Input | null
  happenedInId_in?: ID_Output[] | ID_Output | null
}

export interface LanguageWhereUniqueInput {
  id: ID_Output
}

export interface MemberCreateInput {
  handle?: String | null
  avatarUri?: String | null
  about?: String | null
  registeredAtBlock: Float
  controllerAccount: Bytes
  rootAccount: Bytes
  happenedInId: ID_Output
}

export interface MemberUpdateInput {
  handle?: String | null
  avatarUri?: String | null
  about?: String | null
  registeredAtBlock?: Float | null
  controllerAccount?: Bytes | null
  rootAccount?: Bytes | null
  happenedInId?: ID_Input | null
}

export interface MemberWhereInput {
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
  registeredAtBlock_eq?: Int | null
  registeredAtBlock_gt?: Int | null
  registeredAtBlock_gte?: Int | null
  registeredAtBlock_lt?: Int | null
  registeredAtBlock_lte?: Int | null
  registeredAtBlock_in?: Int[] | Int | null
  controllerAccount_eq?: Bytes | null
  controllerAccount_in?: Bytes[] | Bytes | null
  rootAccount_eq?: Bytes | null
  rootAccount_in?: Bytes[] | Bytes | null
  happenedInId_eq?: ID_Input | null
  happenedInId_in?: ID_Output[] | ID_Output | null
}

export interface MemberWhereUniqueInput {
  id?: ID_Input | null
  handle?: String | null
}

export interface UserDefinedLicenseCreateInput {
  content: String
  happenedInId: ID_Output
}

export interface UserDefinedLicenseUpdateInput {
  content?: String | null
  happenedInId?: ID_Input | null
}

export interface UserDefinedLicenseWhereInput {
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
  content_eq?: String | null
  content_contains?: String | null
  content_startsWith?: String | null
  content_endsWith?: String | null
  content_in?: String[] | String | null
  happenedInId_eq?: ID_Input | null
  happenedInId_in?: ID_Output[] | ID_Output | null
}

export interface UserDefinedLicenseWhereUniqueInput {
  id: ID_Output
}

export interface VideoCreateInput {
  channelId: Float
  categoryId: Float
  title: String
  description: String
  duration: Float
  skippableIntroDuration?: Float | null
  thumbnailUrl: String
  languageId?: Float | null
  videoMediaId: Float
  hasMarketing?: Boolean | null
  publishedBeforeJoystream?: Float | null
  isPublic: Boolean
  isCurated: Boolean
  isExplicit: Boolean
  licenseId: Float
  happenedInId: ID_Output
}

export interface VideoMediaCreateInput {
  encodingId: Float
  pixelWidth: Float
  pixelHeight: Float
  size?: Float | null
  locationId: Float
  happenedInId: ID_Output
}

export interface VideoMediaEncodingCreateInput {
  name: String
}

export interface VideoMediaEncodingUpdateInput {
  name?: String | null
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
  name_eq?: String | null
  name_contains?: String | null
  name_startsWith?: String | null
  name_endsWith?: String | null
  name_in?: String[] | String | null
}

export interface VideoMediaEncodingWhereUniqueInput {
  id: ID_Output
}

export interface VideoMediaUpdateInput {
  encodingId?: Float | null
  pixelWidth?: Float | null
  pixelHeight?: Float | null
  size?: Float | null
  locationId?: Float | null
  happenedInId?: ID_Input | null
}

export interface VideoMediaWhereInput {
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
  encodingId_eq?: Int | null
  encodingId_gt?: Int | null
  encodingId_gte?: Int | null
  encodingId_lt?: Int | null
  encodingId_lte?: Int | null
  encodingId_in?: Int[] | Int | null
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
  size_eq?: Int | null
  size_gt?: Int | null
  size_gte?: Int | null
  size_lt?: Int | null
  size_lte?: Int | null
  size_in?: Int[] | Int | null
  locationId_eq?: Int | null
  locationId_gt?: Int | null
  locationId_gte?: Int | null
  locationId_lt?: Int | null
  locationId_lte?: Int | null
  locationId_in?: Int[] | Int | null
  happenedInId_eq?: ID_Input | null
  happenedInId_in?: ID_Output[] | ID_Output | null
}

export interface VideoMediaWhereUniqueInput {
  id: ID_Output
}

export interface VideoUpdateInput {
  channelId?: Float | null
  categoryId?: Float | null
  title?: String | null
  description?: String | null
  duration?: Float | null
  skippableIntroDuration?: Float | null
  thumbnailUrl?: String | null
  languageId?: Float | null
  videoMediaId?: Float | null
  hasMarketing?: Boolean | null
  publishedBeforeJoystream?: Float | null
  isPublic?: Boolean | null
  isCurated?: Boolean | null
  isExplicit?: Boolean | null
  licenseId?: Float | null
  happenedInId?: ID_Input | null
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
  channelId_eq?: Int | null
  channelId_gt?: Int | null
  channelId_gte?: Int | null
  channelId_lt?: Int | null
  channelId_lte?: Int | null
  channelId_in?: Int[] | Int | null
  categoryId_eq?: Int | null
  categoryId_gt?: Int | null
  categoryId_gte?: Int | null
  categoryId_lt?: Int | null
  categoryId_lte?: Int | null
  categoryId_in?: Int[] | Int | null
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
  skippableIntroDuration_eq?: Int | null
  skippableIntroDuration_gt?: Int | null
  skippableIntroDuration_gte?: Int | null
  skippableIntroDuration_lt?: Int | null
  skippableIntroDuration_lte?: Int | null
  skippableIntroDuration_in?: Int[] | Int | null
  thumbnailUrl_eq?: String | null
  thumbnailUrl_contains?: String | null
  thumbnailUrl_startsWith?: String | null
  thumbnailUrl_endsWith?: String | null
  thumbnailUrl_in?: String[] | String | null
  languageId_eq?: Int | null
  languageId_gt?: Int | null
  languageId_gte?: Int | null
  languageId_lt?: Int | null
  languageId_lte?: Int | null
  languageId_in?: Int[] | Int | null
  videoMediaId_eq?: Int | null
  videoMediaId_gt?: Int | null
  videoMediaId_gte?: Int | null
  videoMediaId_lt?: Int | null
  videoMediaId_lte?: Int | null
  videoMediaId_in?: Int[] | Int | null
  hasMarketing_eq?: Boolean | null
  hasMarketing_in?: Boolean[] | Boolean | null
  publishedBeforeJoystream_eq?: Int | null
  publishedBeforeJoystream_gt?: Int | null
  publishedBeforeJoystream_gte?: Int | null
  publishedBeforeJoystream_lt?: Int | null
  publishedBeforeJoystream_lte?: Int | null
  publishedBeforeJoystream_in?: Int[] | Int | null
  isPublic_eq?: Boolean | null
  isPublic_in?: Boolean[] | Boolean | null
  isCurated_eq?: Boolean | null
  isCurated_in?: Boolean[] | Boolean | null
  isExplicit_eq?: Boolean | null
  isExplicit_in?: Boolean[] | Boolean | null
  licenseId_eq?: Int | null
  licenseId_gt?: Int | null
  licenseId_gte?: Int | null
  licenseId_lt?: Int | null
  licenseId_lte?: Int | null
  licenseId_in?: Int[] | Int | null
  happenedInId_eq?: ID_Input | null
  happenedInId_in?: ID_Output[] | ID_Output | null
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

export interface Block extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  block: Int
  timestamp: Int
  nework: Network
  categorys?: Array<Category> | null
  channels?: Array<Channel> | null
  classEntitys?: Array<ClassEntity> | null
  httpMediaLocations?: Array<HttpMediaLocation> | null
  joystreamMediaLocations?: Array<JoystreamMediaLocation> | null
  knownLicenses?: Array<KnownLicense> | null
  languages?: Array<Language> | null
  members?: Array<Member> | null
  userDefinedLicenses?: Array<UserDefinedLicense> | null
  videos?: Array<Video> | null
  videoMedias?: Array<VideoMedia> | null
}

export interface BlockConnection {
  totalCount: Int
  edges: Array<BlockEdge>
  pageInfo: PageInfo
}

export interface BlockEdge {
  node: Block
  cursor: String
}

export interface Category extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  name: String
  description?: String | null
  happenedIn?: Block | null
  happenedInId: String
}

export interface CategoryConnection {
  totalCount: Int
  edges: Array<CategoryEdge>
  pageInfo: PageInfo
}

export interface CategoryEdge {
  node: Category
  cursor: String
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
  title: String
  description: String
  coverPhotoUrl: String
  avatarPhotoUrl: String
  isPublic: Boolean
  isCurated: Boolean
  languageId?: Int | null
  happenedIn?: Block | null
  happenedInId: String
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

/*
 * This type is to keep which entity belongs to which class. This type will be used
, * by EntityCreated event. When a new schema support added to an Entity we will get the
, * class name from this table.
, * We need this because we can't create a database row (Channel, Video etc) without
, * with empty fields.

 */
export interface ClassEntity extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  classId: Int
  happenedIn?: Block | null
  happenedInId: String
}

export interface ClassEntityConnection {
  totalCount: Int
  edges: Array<ClassEntityEdge>
  pageInfo: PageInfo
}

export interface ClassEntityEdge {
  node: ClassEntity
  cursor: String
}

export interface HandlesFTSOutput {
  item: HandlesSearchResult
  rank: Float
  isTypeOf: String
  highlight: String
}

export interface HttpMediaLocation extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  url: String
  port?: Int | null
  happenedIn?: Block | null
  happenedInId: String
}

export interface HttpMediaLocationConnection {
  totalCount: Int
  edges: Array<HttpMediaLocationEdge>
  pageInfo: PageInfo
}

export interface HttpMediaLocationEdge {
  node: HttpMediaLocation
  cursor: String
}

export interface JoystreamMediaLocation extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  dataObjectId: String
  happenedIn?: Block | null
  happenedInId: String
}

export interface JoystreamMediaLocationConnection {
  totalCount: Int
  edges: Array<JoystreamMediaLocationEdge>
  pageInfo: PageInfo
}

export interface JoystreamMediaLocationEdge {
  node: JoystreamMediaLocation
  cursor: String
}

export interface KnownLicense extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  code: String
  name?: String | null
  description?: String | null
  url?: String | null
  happenedIn?: Block | null
  happenedInId: String
}

export interface KnownLicenseConnection {
  totalCount: Int
  edges: Array<KnownLicenseEdge>
  pageInfo: PageInfo
}

export interface KnownLicenseEdge {
  node: KnownLicense
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
  name: String
  code: String
  happenedIn?: Block | null
  happenedInId: String
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

/*
 * Stored information about a registered user

 */
export interface Member extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  handle?: String | null
  avatarUri?: String | null
  about?: String | null
  registeredAtBlock: Int
  controllerAccount: Bytes
  rootAccount: Bytes
  happenedIn?: Block | null
  happenedInId: String
}

export interface MemberConnection {
  totalCount: Int
  edges: Array<MemberEdge>
  pageInfo: PageInfo
}

export interface MemberEdge {
  node: Member
  cursor: String
}

export interface NamesFTSOutput {
  item: NamesSearchResult
  rank: Float
  isTypeOf: String
  highlight: String
}

export interface PageInfo {
  hasNextPage: Boolean
  hasPreviousPage: Boolean
  startCursor?: String | null
  endCursor?: String | null
}

export interface StandardDeleteResponse {
  id: ID_Output
}

export interface TitlesFTSOutput {
  item: TitlesSearchResult
  rank: Float
  isTypeOf: String
  highlight: String
}

export interface UserDefinedLicense extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  content: String
  happenedIn?: Block | null
  happenedInId: String
}

export interface UserDefinedLicenseConnection {
  totalCount: Int
  edges: Array<UserDefinedLicenseEdge>
  pageInfo: PageInfo
}

export interface UserDefinedLicenseEdge {
  node: UserDefinedLicense
  cursor: String
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
  channelId: Int
  categoryId: Int
  title: String
  description: String
  duration: Int
  skippableIntroDuration?: Int | null
  thumbnailUrl: String
  languageId?: Int | null
  videoMediaId: Int
  hasMarketing?: Boolean | null
  publishedBeforeJoystream?: Int | null
  isPublic: Boolean
  isCurated: Boolean
  isExplicit: Boolean
  licenseId: Int
  happenedIn?: Block | null
  happenedInId: String
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

export interface VideoMedia extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  encodingId: Int
  pixelWidth: Int
  pixelHeight: Int
  size?: Int | null
  locationId: Int
  happenedIn?: Block | null
  happenedInId: String
}

export interface VideoMediaConnection {
  totalCount: Int
  edges: Array<VideoMediaEdge>
  pageInfo: PageInfo
}

export interface VideoMediaEdge {
  node: VideoMedia
  cursor: String
}

/*
 * Encoding and containers

 */
export interface VideoMediaEncoding extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  name: String
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

/*
The `Boolean` scalar type represents `true` or `false`.
*/
export type Boolean = boolean

/*
GraphQL representation of Bytes
*/
export type Bytes = string

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
The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.
*/
export type String = string

export type HandlesSearchResult = Member

export type NamesSearchResult = Category

export type TitlesSearchResult = Channel | Video