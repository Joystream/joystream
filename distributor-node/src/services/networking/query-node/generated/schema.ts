export type Maybe<T> = T | null
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  /** The javascript `Date` as string. Type represents date and time as the ISO Date string. */
  DateTime: any
  /** GraphQL representation of Bytes */
  Bytes: any
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: any
  /** GraphQL representation of BigInt */
  BigInt: any
}

export type BaseGraphQlObject = {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
}

export type BaseModel = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
}

export type BaseModelUuid = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
}

export type BaseWhereInput = {
  id_eq?: Maybe<Scalars['String']>
  id_in?: Maybe<Array<Scalars['String']>>
  createdAt_eq?: Maybe<Scalars['String']>
  createdAt_lt?: Maybe<Scalars['String']>
  createdAt_lte?: Maybe<Scalars['String']>
  createdAt_gt?: Maybe<Scalars['String']>
  createdAt_gte?: Maybe<Scalars['String']>
  createdById_eq?: Maybe<Scalars['String']>
  updatedAt_eq?: Maybe<Scalars['String']>
  updatedAt_lt?: Maybe<Scalars['String']>
  updatedAt_lte?: Maybe<Scalars['String']>
  updatedAt_gt?: Maybe<Scalars['String']>
  updatedAt_gte?: Maybe<Scalars['String']>
  updatedById_eq?: Maybe<Scalars['String']>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['String']>
  deletedAt_lt?: Maybe<Scalars['String']>
  deletedAt_lte?: Maybe<Scalars['String']>
  deletedAt_gt?: Maybe<Scalars['String']>
  deletedAt_gte?: Maybe<Scalars['String']>
  deletedById_eq?: Maybe<Scalars['String']>
}

export type DeleteResponse = {
  id: Scalars['ID']
}

export type DistributionBucket = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  distributedBags: Array<StorageBag>
  /** Distribution bucket operator metadata */
  operatorMetadata?: Maybe<Scalars['Bytes']>
}

export type DistributionBucketConnection = {
  totalCount: Scalars['Int']
  edges: Array<DistributionBucketEdge>
  pageInfo: PageInfo
}

export type DistributionBucketCreateInput = {
  operatorMetadata?: Maybe<Scalars['Bytes']>
}

export type DistributionBucketEdge = {
  node: DistributionBucket
  cursor: Scalars['String']
}

export enum DistributionBucketOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  OperatorMetadataAsc = 'operatorMetadata_ASC',
  OperatorMetadataDesc = 'operatorMetadata_DESC',
}

export type DistributionBucketUpdateInput = {
  operatorMetadata?: Maybe<Scalars['Bytes']>
}

export type DistributionBucketWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  operatorMetadata_eq?: Maybe<Scalars['Bytes']>
  operatorMetadata_in?: Maybe<Array<Scalars['Bytes']>>
  distributedBags_none?: Maybe<StorageBagWhereInput>
  distributedBags_some?: Maybe<StorageBagWhereInput>
  distributedBags_every?: Maybe<StorageBagWhereInput>
  AND?: Maybe<Array<DistributionBucketWhereInput>>
  OR?: Maybe<Array<DistributionBucketWhereInput>>
}

export type DistributionBucketWhereUniqueInput = {
  id: Scalars['ID']
}

export type PageInfo = {
  hasNextPage: Scalars['Boolean']
  hasPreviousPage: Scalars['Boolean']
  startCursor?: Maybe<Scalars['String']>
  endCursor?: Maybe<Scalars['String']>
}

export type ProcessorState = {
  lastCompleteBlock: Scalars['Float']
  lastProcessedEvent: Scalars['String']
  indexerHead: Scalars['Float']
  chainHead: Scalars['Float']
}

export type Query = {
  distributionBuckets: Array<DistributionBucket>
  distributionBucketByUniqueInput?: Maybe<DistributionBucket>
  distributionBucketsConnection: DistributionBucketConnection
  storageBags: Array<StorageBag>
  storageBagByUniqueInput?: Maybe<StorageBag>
  storageBagsConnection: StorageBagConnection
  storageBuckets: Array<StorageBucket>
  storageBucketByUniqueInput?: Maybe<StorageBucket>
  storageBucketsConnection: StorageBucketConnection
  storageDataObjects: Array<StorageDataObject>
  storageDataObjectByUniqueInput?: Maybe<StorageDataObject>
  storageDataObjectsConnection: StorageDataObjectConnection
  storageSystemParameters: Array<StorageSystemParameters>
  storageSystemParametersByUniqueInput?: Maybe<StorageSystemParameters>
  storageSystemParametersConnection: StorageSystemParametersConnection
}

export type QueryDistributionBucketsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<DistributionBucketWhereInput>
  orderBy?: Maybe<Array<DistributionBucketOrderByInput>>
}

export type QueryDistributionBucketByUniqueInputArgs = {
  where: DistributionBucketWhereUniqueInput
}

export type QueryDistributionBucketsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<DistributionBucketWhereInput>
  orderBy?: Maybe<Array<DistributionBucketOrderByInput>>
}

export type QueryStorageBagsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StorageBagWhereInput>
  orderBy?: Maybe<Array<StorageBagOrderByInput>>
}

export type QueryStorageBagByUniqueInputArgs = {
  where: StorageBagWhereUniqueInput
}

export type QueryStorageBagsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StorageBagWhereInput>
  orderBy?: Maybe<Array<StorageBagOrderByInput>>
}

export type QueryStorageBucketsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StorageBucketWhereInput>
  orderBy?: Maybe<Array<StorageBucketOrderByInput>>
}

export type QueryStorageBucketByUniqueInputArgs = {
  where: StorageBucketWhereUniqueInput
}

export type QueryStorageBucketsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StorageBucketWhereInput>
  orderBy?: Maybe<Array<StorageBucketOrderByInput>>
}

export type QueryStorageDataObjectsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StorageDataObjectWhereInput>
  orderBy?: Maybe<Array<StorageDataObjectOrderByInput>>
}

export type QueryStorageDataObjectByUniqueInputArgs = {
  where: StorageDataObjectWhereUniqueInput
}

export type QueryStorageDataObjectsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StorageDataObjectWhereInput>
  orderBy?: Maybe<Array<StorageDataObjectOrderByInput>>
}

export type QueryStorageSystemParametersArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StorageSystemParametersWhereInput>
  orderBy?: Maybe<Array<StorageSystemParametersOrderByInput>>
}

export type QueryStorageSystemParametersByUniqueInputArgs = {
  where: StorageSystemParametersWhereUniqueInput
}

export type QueryStorageSystemParametersConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StorageSystemParametersWhereInput>
  orderBy?: Maybe<Array<StorageSystemParametersOrderByInput>>
}

export type StandardDeleteResponse = {
  id: Scalars['ID']
}

export type StorageBag = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Last time the bag contents (data objects) was updated */
  contentsUpdatedAt?: Maybe<Scalars['DateTime']>
  objects: Array<StorageDataObject>
  storedBy: Array<StorageBucket>
  distributedBy: Array<DistributionBucket>
  /** Owner of the storage bag */
  owner: StorageBagOwner
}

export type StorageBagConnection = {
  totalCount: Scalars['Int']
  edges: Array<StorageBagEdge>
  pageInfo: PageInfo
}

export type StorageBagCreateInput = {
  contentsUpdatedAt?: Maybe<Scalars['DateTime']>
  owner: Scalars['JSONObject']
}

export type StorageBagEdge = {
  node: StorageBag
  cursor: Scalars['String']
}

export enum StorageBagOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  ContentsUpdatedAtAsc = 'contentsUpdatedAt_ASC',
  ContentsUpdatedAtDesc = 'contentsUpdatedAt_DESC',
}

export type StorageBagOwner =
  | StorageBagOwnerCouncil
  | StorageBagOwnerWorkingGroup
  | StorageBagOwnerMember
  | StorageBagOwnerChannel
  | StorageBagOwnerDao

export type StorageBagOwnerChannel = {
  channelId?: Maybe<Scalars['Int']>
}

export type StorageBagOwnerChannelCreateInput = {
  channelId?: Maybe<Scalars['Float']>
}

export type StorageBagOwnerChannelUpdateInput = {
  channelId?: Maybe<Scalars['Float']>
}

export type StorageBagOwnerChannelWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  channelId_eq?: Maybe<Scalars['Int']>
  channelId_gt?: Maybe<Scalars['Int']>
  channelId_gte?: Maybe<Scalars['Int']>
  channelId_lt?: Maybe<Scalars['Int']>
  channelId_lte?: Maybe<Scalars['Int']>
  channelId_in?: Maybe<Array<Scalars['Int']>>
  AND?: Maybe<Array<StorageBagOwnerChannelWhereInput>>
  OR?: Maybe<Array<StorageBagOwnerChannelWhereInput>>
}

export type StorageBagOwnerChannelWhereUniqueInput = {
  id: Scalars['ID']
}

export type StorageBagOwnerCouncil = {
  phantom?: Maybe<Scalars['Int']>
}

export type StorageBagOwnerCouncilCreateInput = {
  phantom?: Maybe<Scalars['Float']>
}

export type StorageBagOwnerCouncilUpdateInput = {
  phantom?: Maybe<Scalars['Float']>
}

export type StorageBagOwnerCouncilWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  phantom_eq?: Maybe<Scalars['Int']>
  phantom_gt?: Maybe<Scalars['Int']>
  phantom_gte?: Maybe<Scalars['Int']>
  phantom_lt?: Maybe<Scalars['Int']>
  phantom_lte?: Maybe<Scalars['Int']>
  phantom_in?: Maybe<Array<Scalars['Int']>>
  AND?: Maybe<Array<StorageBagOwnerCouncilWhereInput>>
  OR?: Maybe<Array<StorageBagOwnerCouncilWhereInput>>
}

export type StorageBagOwnerCouncilWhereUniqueInput = {
  id: Scalars['ID']
}

export type StorageBagOwnerDao = {
  daoId?: Maybe<Scalars['Int']>
}

export type StorageBagOwnerDaoCreateInput = {
  daoId?: Maybe<Scalars['Float']>
}

export type StorageBagOwnerDaoUpdateInput = {
  daoId?: Maybe<Scalars['Float']>
}

export type StorageBagOwnerDaoWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  daoId_eq?: Maybe<Scalars['Int']>
  daoId_gt?: Maybe<Scalars['Int']>
  daoId_gte?: Maybe<Scalars['Int']>
  daoId_lt?: Maybe<Scalars['Int']>
  daoId_lte?: Maybe<Scalars['Int']>
  daoId_in?: Maybe<Array<Scalars['Int']>>
  AND?: Maybe<Array<StorageBagOwnerDaoWhereInput>>
  OR?: Maybe<Array<StorageBagOwnerDaoWhereInput>>
}

export type StorageBagOwnerDaoWhereUniqueInput = {
  id: Scalars['ID']
}

export type StorageBagOwnerMember = {
  memberId?: Maybe<Scalars['Int']>
}

export type StorageBagOwnerMemberCreateInput = {
  memberId?: Maybe<Scalars['Float']>
}

export type StorageBagOwnerMemberUpdateInput = {
  memberId?: Maybe<Scalars['Float']>
}

export type StorageBagOwnerMemberWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  memberId_eq?: Maybe<Scalars['Int']>
  memberId_gt?: Maybe<Scalars['Int']>
  memberId_gte?: Maybe<Scalars['Int']>
  memberId_lt?: Maybe<Scalars['Int']>
  memberId_lte?: Maybe<Scalars['Int']>
  memberId_in?: Maybe<Array<Scalars['Int']>>
  AND?: Maybe<Array<StorageBagOwnerMemberWhereInput>>
  OR?: Maybe<Array<StorageBagOwnerMemberWhereInput>>
}

export type StorageBagOwnerMemberWhereUniqueInput = {
  id: Scalars['ID']
}

export type StorageBagOwnerWorkingGroup = {
  workingGroupId?: Maybe<Scalars['String']>
}

export type StorageBagOwnerWorkingGroupCreateInput = {
  workingGroupId?: Maybe<Scalars['String']>
}

export type StorageBagOwnerWorkingGroupUpdateInput = {
  workingGroupId?: Maybe<Scalars['String']>
}

export type StorageBagOwnerWorkingGroupWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  workingGroupId_eq?: Maybe<Scalars['String']>
  workingGroupId_contains?: Maybe<Scalars['String']>
  workingGroupId_startsWith?: Maybe<Scalars['String']>
  workingGroupId_endsWith?: Maybe<Scalars['String']>
  workingGroupId_in?: Maybe<Array<Scalars['String']>>
  AND?: Maybe<Array<StorageBagOwnerWorkingGroupWhereInput>>
  OR?: Maybe<Array<StorageBagOwnerWorkingGroupWhereInput>>
}

export type StorageBagOwnerWorkingGroupWhereUniqueInput = {
  id: Scalars['ID']
}

export type StorageBagUpdateInput = {
  contentsUpdatedAt?: Maybe<Scalars['DateTime']>
  owner?: Maybe<Scalars['JSONObject']>
}

export type StorageBagWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  contentsUpdatedAt_eq?: Maybe<Scalars['DateTime']>
  contentsUpdatedAt_lt?: Maybe<Scalars['DateTime']>
  contentsUpdatedAt_lte?: Maybe<Scalars['DateTime']>
  contentsUpdatedAt_gt?: Maybe<Scalars['DateTime']>
  contentsUpdatedAt_gte?: Maybe<Scalars['DateTime']>
  owner_json?: Maybe<Scalars['JSONObject']>
  objects_none?: Maybe<StorageDataObjectWhereInput>
  objects_some?: Maybe<StorageDataObjectWhereInput>
  objects_every?: Maybe<StorageDataObjectWhereInput>
  storedBy_none?: Maybe<StorageBucketWhereInput>
  storedBy_some?: Maybe<StorageBucketWhereInput>
  storedBy_every?: Maybe<StorageBucketWhereInput>
  distributedBy_none?: Maybe<DistributionBucketWhereInput>
  distributedBy_some?: Maybe<DistributionBucketWhereInput>
  distributedBy_every?: Maybe<DistributionBucketWhereInput>
  AND?: Maybe<Array<StorageBagWhereInput>>
  OR?: Maybe<Array<StorageBagWhereInput>>
}

export type StorageBagWhereUniqueInput = {
  id: Scalars['ID']
}

export type StorageBucket = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Current bucket operator status */
  operatorStatus: StorageBucketOperatorStatus
  /** Storage bucket operator metadata */
  operatorMetadata?: Maybe<Scalars['Bytes']>
  /** Whether the bucket is accepting any new storage bags */
  acceptingNewBags: Scalars['Boolean']
  storedBags: Array<StorageBag>
  /** Bucket's data object size limit in bytes */
  dataObjectsSizeLimit: Scalars['BigInt']
  /** Bucket's data object count limit */
  dataObjectCountLimit: Scalars['BigInt']
}

export type StorageBucketConnection = {
  totalCount: Scalars['Int']
  edges: Array<StorageBucketEdge>
  pageInfo: PageInfo
}

export type StorageBucketCreateInput = {
  operatorStatus: Scalars['JSONObject']
  operatorMetadata?: Maybe<Scalars['Bytes']>
  acceptingNewBags: Scalars['Boolean']
  dataObjectsSizeLimit: Scalars['BigInt']
  dataObjectCountLimit: Scalars['BigInt']
}

export type StorageBucketEdge = {
  node: StorageBucket
  cursor: Scalars['String']
}

export type StorageBucketOperatorStatus =
  | StorageBucketOperatorStatusMissing
  | StorageBucketOperatorStatusInvited
  | StorageBucketOperatorStatusActive

export type StorageBucketOperatorStatusActive = {
  workerId: Scalars['Int']
}

export type StorageBucketOperatorStatusActiveCreateInput = {
  workerId: Scalars['Float']
}

export type StorageBucketOperatorStatusActiveUpdateInput = {
  workerId?: Maybe<Scalars['Float']>
}

export type StorageBucketOperatorStatusActiveWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  workerId_eq?: Maybe<Scalars['Int']>
  workerId_gt?: Maybe<Scalars['Int']>
  workerId_gte?: Maybe<Scalars['Int']>
  workerId_lt?: Maybe<Scalars['Int']>
  workerId_lte?: Maybe<Scalars['Int']>
  workerId_in?: Maybe<Array<Scalars['Int']>>
  AND?: Maybe<Array<StorageBucketOperatorStatusActiveWhereInput>>
  OR?: Maybe<Array<StorageBucketOperatorStatusActiveWhereInput>>
}

export type StorageBucketOperatorStatusActiveWhereUniqueInput = {
  id: Scalars['ID']
}

export type StorageBucketOperatorStatusInvited = {
  workerId: Scalars['Int']
}

export type StorageBucketOperatorStatusInvitedCreateInput = {
  workerId: Scalars['Float']
}

export type StorageBucketOperatorStatusInvitedUpdateInput = {
  workerId?: Maybe<Scalars['Float']>
}

export type StorageBucketOperatorStatusInvitedWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  workerId_eq?: Maybe<Scalars['Int']>
  workerId_gt?: Maybe<Scalars['Int']>
  workerId_gte?: Maybe<Scalars['Int']>
  workerId_lt?: Maybe<Scalars['Int']>
  workerId_lte?: Maybe<Scalars['Int']>
  workerId_in?: Maybe<Array<Scalars['Int']>>
  AND?: Maybe<Array<StorageBucketOperatorStatusInvitedWhereInput>>
  OR?: Maybe<Array<StorageBucketOperatorStatusInvitedWhereInput>>
}

export type StorageBucketOperatorStatusInvitedWhereUniqueInput = {
  id: Scalars['ID']
}

export type StorageBucketOperatorStatusMissing = {
  phantom?: Maybe<Scalars['Int']>
}

export type StorageBucketOperatorStatusMissingCreateInput = {
  phantom?: Maybe<Scalars['Float']>
}

export type StorageBucketOperatorStatusMissingUpdateInput = {
  phantom?: Maybe<Scalars['Float']>
}

export type StorageBucketOperatorStatusMissingWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  phantom_eq?: Maybe<Scalars['Int']>
  phantom_gt?: Maybe<Scalars['Int']>
  phantom_gte?: Maybe<Scalars['Int']>
  phantom_lt?: Maybe<Scalars['Int']>
  phantom_lte?: Maybe<Scalars['Int']>
  phantom_in?: Maybe<Array<Scalars['Int']>>
  AND?: Maybe<Array<StorageBucketOperatorStatusMissingWhereInput>>
  OR?: Maybe<Array<StorageBucketOperatorStatusMissingWhereInput>>
}

export type StorageBucketOperatorStatusMissingWhereUniqueInput = {
  id: Scalars['ID']
}

export enum StorageBucketOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  OperatorMetadataAsc = 'operatorMetadata_ASC',
  OperatorMetadataDesc = 'operatorMetadata_DESC',
  AcceptingNewBagsAsc = 'acceptingNewBags_ASC',
  AcceptingNewBagsDesc = 'acceptingNewBags_DESC',
  DataObjectsSizeLimitAsc = 'dataObjectsSizeLimit_ASC',
  DataObjectsSizeLimitDesc = 'dataObjectsSizeLimit_DESC',
  DataObjectCountLimitAsc = 'dataObjectCountLimit_ASC',
  DataObjectCountLimitDesc = 'dataObjectCountLimit_DESC',
}

export type StorageBucketUpdateInput = {
  operatorStatus?: Maybe<Scalars['JSONObject']>
  operatorMetadata?: Maybe<Scalars['Bytes']>
  acceptingNewBags?: Maybe<Scalars['Boolean']>
  dataObjectsSizeLimit?: Maybe<Scalars['BigInt']>
  dataObjectCountLimit?: Maybe<Scalars['BigInt']>
}

export type StorageBucketWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  operatorStatus_json?: Maybe<Scalars['JSONObject']>
  operatorMetadata_eq?: Maybe<Scalars['Bytes']>
  operatorMetadata_in?: Maybe<Array<Scalars['Bytes']>>
  acceptingNewBags_eq?: Maybe<Scalars['Boolean']>
  acceptingNewBags_in?: Maybe<Array<Scalars['Boolean']>>
  dataObjectsSizeLimit_eq?: Maybe<Scalars['BigInt']>
  dataObjectsSizeLimit_gt?: Maybe<Scalars['BigInt']>
  dataObjectsSizeLimit_gte?: Maybe<Scalars['BigInt']>
  dataObjectsSizeLimit_lt?: Maybe<Scalars['BigInt']>
  dataObjectsSizeLimit_lte?: Maybe<Scalars['BigInt']>
  dataObjectsSizeLimit_in?: Maybe<Array<Scalars['BigInt']>>
  dataObjectCountLimit_eq?: Maybe<Scalars['BigInt']>
  dataObjectCountLimit_gt?: Maybe<Scalars['BigInt']>
  dataObjectCountLimit_gte?: Maybe<Scalars['BigInt']>
  dataObjectCountLimit_lt?: Maybe<Scalars['BigInt']>
  dataObjectCountLimit_lte?: Maybe<Scalars['BigInt']>
  dataObjectCountLimit_in?: Maybe<Array<Scalars['BigInt']>>
  storedBags_none?: Maybe<StorageBagWhereInput>
  storedBags_some?: Maybe<StorageBagWhereInput>
  storedBags_every?: Maybe<StorageBagWhereInput>
  AND?: Maybe<Array<StorageBucketWhereInput>>
  OR?: Maybe<Array<StorageBucketWhereInput>>
}

export type StorageBucketWhereUniqueInput = {
  id: Scalars['ID']
}

export type StorageDataObject = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Whether the data object was uploaded and accepted by the storage provider */
  isAccepted: Scalars['Boolean']
  /** Data object size in bytes */
  size: Scalars['BigInt']
  storageBag: StorageBag
  storageBagId: Scalars['String']
  /** IPFS content hash */
  ipfsHash: Scalars['String']
  /** Public key used to authenticate the uploader by the storage provider */
  authenticationKey?: Maybe<Scalars['String']>
}

export type StorageDataObjectConnection = {
  totalCount: Scalars['Int']
  edges: Array<StorageDataObjectEdge>
  pageInfo: PageInfo
}

export type StorageDataObjectCreateInput = {
  isAccepted: Scalars['Boolean']
  size: Scalars['BigInt']
  storageBag: Scalars['ID']
  ipfsHash: Scalars['String']
  authenticationKey?: Maybe<Scalars['String']>
}

export type StorageDataObjectEdge = {
  node: StorageDataObject
  cursor: Scalars['String']
}

export enum StorageDataObjectOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  IsAcceptedAsc = 'isAccepted_ASC',
  IsAcceptedDesc = 'isAccepted_DESC',
  SizeAsc = 'size_ASC',
  SizeDesc = 'size_DESC',
  StorageBagAsc = 'storageBag_ASC',
  StorageBagDesc = 'storageBag_DESC',
  IpfsHashAsc = 'ipfsHash_ASC',
  IpfsHashDesc = 'ipfsHash_DESC',
  AuthenticationKeyAsc = 'authenticationKey_ASC',
  AuthenticationKeyDesc = 'authenticationKey_DESC',
}

export type StorageDataObjectUpdateInput = {
  isAccepted?: Maybe<Scalars['Boolean']>
  size?: Maybe<Scalars['BigInt']>
  storageBag?: Maybe<Scalars['ID']>
  ipfsHash?: Maybe<Scalars['String']>
  authenticationKey?: Maybe<Scalars['String']>
}

export type StorageDataObjectWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  isAccepted_eq?: Maybe<Scalars['Boolean']>
  isAccepted_in?: Maybe<Array<Scalars['Boolean']>>
  size_eq?: Maybe<Scalars['BigInt']>
  size_gt?: Maybe<Scalars['BigInt']>
  size_gte?: Maybe<Scalars['BigInt']>
  size_lt?: Maybe<Scalars['BigInt']>
  size_lte?: Maybe<Scalars['BigInt']>
  size_in?: Maybe<Array<Scalars['BigInt']>>
  storageBag_eq?: Maybe<Scalars['ID']>
  storageBag_in?: Maybe<Array<Scalars['ID']>>
  ipfsHash_eq?: Maybe<Scalars['String']>
  ipfsHash_contains?: Maybe<Scalars['String']>
  ipfsHash_startsWith?: Maybe<Scalars['String']>
  ipfsHash_endsWith?: Maybe<Scalars['String']>
  ipfsHash_in?: Maybe<Array<Scalars['String']>>
  authenticationKey_eq?: Maybe<Scalars['String']>
  authenticationKey_contains?: Maybe<Scalars['String']>
  authenticationKey_startsWith?: Maybe<Scalars['String']>
  authenticationKey_endsWith?: Maybe<Scalars['String']>
  authenticationKey_in?: Maybe<Array<Scalars['String']>>
  storageBag?: Maybe<StorageBagWhereInput>
  AND?: Maybe<Array<StorageDataObjectWhereInput>>
  OR?: Maybe<Array<StorageDataObjectWhereInput>>
}

export type StorageDataObjectWhereUniqueInput = {
  id: Scalars['ID']
}

/** Global storage system parameters */
export type StorageSystemParameters = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Blacklisted content hashes */
  blacklist: Array<Scalars['String']>
}

export type StorageSystemParametersConnection = {
  totalCount: Scalars['Int']
  edges: Array<StorageSystemParametersEdge>
  pageInfo: PageInfo
}

export type StorageSystemParametersCreateInput = {
  blacklist: Array<Scalars['String']>
}

export type StorageSystemParametersEdge = {
  node: StorageSystemParameters
  cursor: Scalars['String']
}

export enum StorageSystemParametersOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
}

export type StorageSystemParametersUpdateInput = {
  blacklist?: Maybe<Array<Scalars['String']>>
}

export type StorageSystemParametersWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  AND?: Maybe<Array<StorageSystemParametersWhereInput>>
  OR?: Maybe<Array<StorageSystemParametersWhereInput>>
}

export type StorageSystemParametersWhereUniqueInput = {
  id: Scalars['ID']
}

export type Subscription = {
  stateSubscription: ProcessorState
}
