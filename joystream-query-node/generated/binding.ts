import 'graphql-import-node'; // Needed so you can import *.graphql files 

import { makeBindingClass, Options } from 'graphql-binding'
import { GraphQLResolveInfo, GraphQLSchema } from 'graphql'
import { IResolvers } from 'graphql-tools/dist/Interfaces'
import * as schema from  './schema.graphql'

export interface Query {
    memberRegistereds: <T = Array<MemberRegistered>>(args: { offset?: Int | null, limit?: Int | null, where?: MemberRegisteredWhereInput | null, orderBy?: MemberRegisteredOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    memberRegistered: <T = MemberRegistered>(args: { where: MemberRegisteredWhereUniqueInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    memberUpdatedAboutTexts: <T = Array<MemberUpdatedAboutText>>(args: { offset?: Int | null, limit?: Int | null, where?: MemberUpdatedAboutTextWhereInput | null, orderBy?: MemberUpdatedAboutTextOrderByInput | null }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    memberUpdatedAboutText: <T = MemberUpdatedAboutText>(args: { where: MemberUpdatedAboutTextWhereUniqueInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> 
  }

export interface Mutation {
    createMemberRegistered: <T = MemberRegistered>(args: { data: MemberRegisteredCreateInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    createManyMemberRegistereds: <T = Array<MemberRegistered>>(args: { data: Array<MemberRegisteredCreateInput> }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    updateMemberRegistered: <T = MemberRegistered>(args: { data: MemberRegisteredUpdateInput, where: MemberRegisteredWhereUniqueInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    deleteMemberRegistered: <T = StandardDeleteResponse>(args: { where: MemberRegisteredWhereUniqueInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    createMemberUpdatedAboutText: <T = MemberUpdatedAboutText>(args: { data: MemberUpdatedAboutTextCreateInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    createManyMemberUpdatedAboutTexts: <T = Array<MemberUpdatedAboutText>>(args: { data: Array<MemberUpdatedAboutTextCreateInput> }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    updateMemberUpdatedAboutText: <T = MemberUpdatedAboutText>(args: { data: MemberUpdatedAboutTextUpdateInput, where: MemberUpdatedAboutTextWhereUniqueInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> ,
    deleteMemberUpdatedAboutText: <T = StandardDeleteResponse>(args: { where: MemberUpdatedAboutTextWhereUniqueInput }, info?: GraphQLResolveInfo | string, options?: Options) => Promise<T> 
  }

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

export type MemberRegisteredOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'memberId_ASC' |
  'memberId_DESC' |
  'accountId_ASC' |
  'accountId_DESC'

export type MemberUpdatedAboutTextOrderByInput =   'createdAt_ASC' |
  'createdAt_DESC' |
  'updatedAt_ASC' |
  'updatedAt_DESC' |
  'deletedAt_ASC' |
  'deletedAt_DESC' |
  'memberId_ASC' |
  'memberId_DESC'

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

export interface MemberRegisteredCreateInput {
  memberId: Float
  accountId: String
}

export interface MemberRegisteredUpdateInput {
  memberId?: Float | null
  accountId?: String | null
}

export interface MemberRegisteredWhereInput {
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
  memberId_eq?: Int | null
  memberId_gt?: Int | null
  memberId_gte?: Int | null
  memberId_lt?: Int | null
  memberId_lte?: Int | null
  memberId_in?: Int[] | Int | null
  accountId_eq?: String | null
  accountId_contains?: String | null
  accountId_startsWith?: String | null
  accountId_endsWith?: String | null
  accountId_in?: String[] | String | null
}

export interface MemberRegisteredWhereUniqueInput {
  id: ID_Output
}

export interface MemberUpdatedAboutTextCreateInput {
  memberId: Float
}

export interface MemberUpdatedAboutTextUpdateInput {
  memberId?: Float | null
}

export interface MemberUpdatedAboutTextWhereInput {
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
  memberId_eq?: Int | null
  memberId_gt?: Int | null
  memberId_gte?: Int | null
  memberId_lt?: Int | null
  memberId_lte?: Int | null
  memberId_in?: Int[] | Int | null
}

export interface MemberUpdatedAboutTextWhereUniqueInput {
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

export interface MemberRegistered extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  memberId: Int
  accountId: String
}

export interface MemberUpdatedAboutText extends BaseGraphQLObject {
  id: ID_Output
  createdAt: DateTime
  createdById: String
  updatedAt?: DateTime | null
  updatedById?: String | null
  deletedAt?: DateTime | null
  deletedById?: String | null
  version: Int
  memberId: Int
}

export interface PageInfo {
  limit: Float
  offset: Float
  totalCount: Float
  hasNextPage: Boolean
  hasPreviousPage: Boolean
}

export interface StandardDeleteResponse {
  id: ID_Output
}

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
The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.
*/
export type String = string