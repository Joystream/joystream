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
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: any
  /** GraphQL representation of BigInt */
  BigInt: any
}

export type Asset = AssetExternal | AssetJoystreamStorage | AssetNone

export type AssetExternal = {
  /** JSON array of the urls */
  urls: Scalars['String']
}

export type AssetExternalCreateInput = {
  urls: Scalars['String']
}

export type AssetExternalUpdateInput = {
  urls?: Maybe<Scalars['String']>
}

export type AssetExternalWhereInput = {
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
  urls_eq?: Maybe<Scalars['String']>
  urls_contains?: Maybe<Scalars['String']>
  urls_startsWith?: Maybe<Scalars['String']>
  urls_endsWith?: Maybe<Scalars['String']>
  urls_in?: Maybe<Array<Scalars['String']>>
  AND?: Maybe<Array<AssetExternalWhereInput>>
  OR?: Maybe<Array<AssetExternalWhereInput>>
}

export type AssetExternalWhereUniqueInput = {
  id: Scalars['ID']
}

export type AssetJoystreamStorage = {
  /** Related data object */
  dataObject?: Maybe<StorageDataObject>
}

export type AssetNone = {
  phantom?: Maybe<Scalars['Int']>
}

export type AssetNoneCreateInput = {
  phantom?: Maybe<Scalars['Float']>
}

export type AssetNoneUpdateInput = {
  phantom?: Maybe<Scalars['Float']>
}

export type AssetNoneWhereInput = {
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
  AND?: Maybe<Array<AssetNoneWhereInput>>
  OR?: Maybe<Array<AssetNoneWhereInput>>
}

export type AssetNoneWhereUniqueInput = {
  id: Scalars['ID']
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

export type Channel = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  ownerMember?: Maybe<Membership>
  ownerMemberId?: Maybe<Scalars['String']>
  ownerCuratorGroup?: Maybe<CuratorGroup>
  ownerCuratorGroupId?: Maybe<Scalars['String']>
  category?: Maybe<ChannelCategory>
  categoryId?: Maybe<Scalars['String']>
  /** Reward account where revenue is sent if set. */
  rewardAccount?: Maybe<Scalars['String']>
  /** Destination account for the prize associated with channel deletion */
  deletionPrizeDestAccount: Scalars['String']
  /** The title of the Channel */
  title?: Maybe<Scalars['String']>
  /** The description of a Channel */
  description?: Maybe<Scalars['String']>
  /** Channel's cover (background) photo asset. Recommended ratio: 16:9. */
  coverPhoto: Asset
  /** Channel's avatar photo asset. */
  avatarPhoto: Asset
  /** Flag signaling whether a channel is public. */
  isPublic?: Maybe<Scalars['Boolean']>
  /** Flag signaling whether a channel is censored. */
  isCensored: Scalars['Boolean']
  language?: Maybe<Language>
  languageId?: Maybe<Scalars['String']>
  videos: Array<Video>
  createdInBlock: Scalars['Int']
}

export type ChannelCategoriesByNameFtsOutput = {
  item: ChannelCategoriesByNameSearchResult
  rank: Scalars['Float']
  isTypeOf: Scalars['String']
  highlight: Scalars['String']
}

export type ChannelCategoriesByNameSearchResult = ChannelCategory

/** Category of media channel */
export type ChannelCategory = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** The name of the category */
  name?: Maybe<Scalars['String']>
  channels: Array<Channel>
  createdInBlock: Scalars['Int']
}

export type ChannelCategoryConnection = {
  totalCount: Scalars['Int']
  edges: Array<ChannelCategoryEdge>
  pageInfo: PageInfo
}

export type ChannelCategoryCreateInput = {
  name?: Maybe<Scalars['String']>
  createdInBlock: Scalars['Float']
}

export type ChannelCategoryEdge = {
  node: ChannelCategory
  cursor: Scalars['String']
}

export enum ChannelCategoryOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  CreatedInBlockAsc = 'createdInBlock_ASC',
  CreatedInBlockDesc = 'createdInBlock_DESC',
}

export type ChannelCategoryUpdateInput = {
  name?: Maybe<Scalars['String']>
  createdInBlock?: Maybe<Scalars['Float']>
}

export type ChannelCategoryWhereInput = {
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
  name_eq?: Maybe<Scalars['String']>
  name_contains?: Maybe<Scalars['String']>
  name_startsWith?: Maybe<Scalars['String']>
  name_endsWith?: Maybe<Scalars['String']>
  name_in?: Maybe<Array<Scalars['String']>>
  createdInBlock_eq?: Maybe<Scalars['Int']>
  createdInBlock_gt?: Maybe<Scalars['Int']>
  createdInBlock_gte?: Maybe<Scalars['Int']>
  createdInBlock_lt?: Maybe<Scalars['Int']>
  createdInBlock_lte?: Maybe<Scalars['Int']>
  createdInBlock_in?: Maybe<Array<Scalars['Int']>>
  channels_none?: Maybe<ChannelWhereInput>
  channels_some?: Maybe<ChannelWhereInput>
  channels_every?: Maybe<ChannelWhereInput>
  AND?: Maybe<Array<ChannelCategoryWhereInput>>
  OR?: Maybe<Array<ChannelCategoryWhereInput>>
}

export type ChannelCategoryWhereUniqueInput = {
  id: Scalars['ID']
}

export type ChannelConnection = {
  totalCount: Scalars['Int']
  edges: Array<ChannelEdge>
  pageInfo: PageInfo
}

export type ChannelCreateInput = {
  ownerMember?: Maybe<Scalars['ID']>
  ownerCuratorGroup?: Maybe<Scalars['ID']>
  category?: Maybe<Scalars['ID']>
  rewardAccount?: Maybe<Scalars['String']>
  deletionPrizeDestAccount: Scalars['String']
  title?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  coverPhoto: Scalars['JSONObject']
  avatarPhoto: Scalars['JSONObject']
  isPublic?: Maybe<Scalars['Boolean']>
  isCensored: Scalars['Boolean']
  language?: Maybe<Scalars['ID']>
  createdInBlock: Scalars['Float']
}

export type ChannelEdge = {
  node: Channel
  cursor: Scalars['String']
}

export enum ChannelOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  OwnerMemberAsc = 'ownerMember_ASC',
  OwnerMemberDesc = 'ownerMember_DESC',
  OwnerCuratorGroupAsc = 'ownerCuratorGroup_ASC',
  OwnerCuratorGroupDesc = 'ownerCuratorGroup_DESC',
  CategoryAsc = 'category_ASC',
  CategoryDesc = 'category_DESC',
  RewardAccountAsc = 'rewardAccount_ASC',
  RewardAccountDesc = 'rewardAccount_DESC',
  DeletionPrizeDestAccountAsc = 'deletionPrizeDestAccount_ASC',
  DeletionPrizeDestAccountDesc = 'deletionPrizeDestAccount_DESC',
  TitleAsc = 'title_ASC',
  TitleDesc = 'title_DESC',
  DescriptionAsc = 'description_ASC',
  DescriptionDesc = 'description_DESC',
  IsPublicAsc = 'isPublic_ASC',
  IsPublicDesc = 'isPublic_DESC',
  IsCensoredAsc = 'isCensored_ASC',
  IsCensoredDesc = 'isCensored_DESC',
  LanguageAsc = 'language_ASC',
  LanguageDesc = 'language_DESC',
  CreatedInBlockAsc = 'createdInBlock_ASC',
  CreatedInBlockDesc = 'createdInBlock_DESC',
}

export type ChannelUpdateInput = {
  ownerMember?: Maybe<Scalars['ID']>
  ownerCuratorGroup?: Maybe<Scalars['ID']>
  category?: Maybe<Scalars['ID']>
  rewardAccount?: Maybe<Scalars['String']>
  deletionPrizeDestAccount?: Maybe<Scalars['String']>
  title?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  coverPhoto?: Maybe<Scalars['JSONObject']>
  avatarPhoto?: Maybe<Scalars['JSONObject']>
  isPublic?: Maybe<Scalars['Boolean']>
  isCensored?: Maybe<Scalars['Boolean']>
  language?: Maybe<Scalars['ID']>
  createdInBlock?: Maybe<Scalars['Float']>
}

export type ChannelWhereInput = {
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
  ownerMember_eq?: Maybe<Scalars['ID']>
  ownerMember_in?: Maybe<Array<Scalars['ID']>>
  ownerCuratorGroup_eq?: Maybe<Scalars['ID']>
  ownerCuratorGroup_in?: Maybe<Array<Scalars['ID']>>
  category_eq?: Maybe<Scalars['ID']>
  category_in?: Maybe<Array<Scalars['ID']>>
  rewardAccount_eq?: Maybe<Scalars['String']>
  rewardAccount_contains?: Maybe<Scalars['String']>
  rewardAccount_startsWith?: Maybe<Scalars['String']>
  rewardAccount_endsWith?: Maybe<Scalars['String']>
  rewardAccount_in?: Maybe<Array<Scalars['String']>>
  deletionPrizeDestAccount_eq?: Maybe<Scalars['String']>
  deletionPrizeDestAccount_contains?: Maybe<Scalars['String']>
  deletionPrizeDestAccount_startsWith?: Maybe<Scalars['String']>
  deletionPrizeDestAccount_endsWith?: Maybe<Scalars['String']>
  deletionPrizeDestAccount_in?: Maybe<Array<Scalars['String']>>
  title_eq?: Maybe<Scalars['String']>
  title_contains?: Maybe<Scalars['String']>
  title_startsWith?: Maybe<Scalars['String']>
  title_endsWith?: Maybe<Scalars['String']>
  title_in?: Maybe<Array<Scalars['String']>>
  description_eq?: Maybe<Scalars['String']>
  description_contains?: Maybe<Scalars['String']>
  description_startsWith?: Maybe<Scalars['String']>
  description_endsWith?: Maybe<Scalars['String']>
  description_in?: Maybe<Array<Scalars['String']>>
  coverPhoto_json?: Maybe<Scalars['JSONObject']>
  avatarPhoto_json?: Maybe<Scalars['JSONObject']>
  isPublic_eq?: Maybe<Scalars['Boolean']>
  isPublic_in?: Maybe<Array<Scalars['Boolean']>>
  isCensored_eq?: Maybe<Scalars['Boolean']>
  isCensored_in?: Maybe<Array<Scalars['Boolean']>>
  language_eq?: Maybe<Scalars['ID']>
  language_in?: Maybe<Array<Scalars['ID']>>
  createdInBlock_eq?: Maybe<Scalars['Int']>
  createdInBlock_gt?: Maybe<Scalars['Int']>
  createdInBlock_gte?: Maybe<Scalars['Int']>
  createdInBlock_lt?: Maybe<Scalars['Int']>
  createdInBlock_lte?: Maybe<Scalars['Int']>
  createdInBlock_in?: Maybe<Array<Scalars['Int']>>
  ownerMember?: Maybe<MembershipWhereInput>
  ownerCuratorGroup?: Maybe<CuratorGroupWhereInput>
  category?: Maybe<ChannelCategoryWhereInput>
  language?: Maybe<LanguageWhereInput>
  videos_none?: Maybe<VideoWhereInput>
  videos_some?: Maybe<VideoWhereInput>
  videos_every?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<ChannelWhereInput>>
  OR?: Maybe<Array<ChannelWhereInput>>
}

export type ChannelWhereUniqueInput = {
  id: Scalars['ID']
}

export type CuratorGroup = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Curators belonging to this group */
  curatorIds: Array<Scalars['Int']>
  /** Is group active or not */
  isActive: Scalars['Boolean']
  channels: Array<Channel>
}

export type CuratorGroupConnection = {
  totalCount: Scalars['Int']
  edges: Array<CuratorGroupEdge>
  pageInfo: PageInfo
}

export type CuratorGroupCreateInput = {
  curatorIds: Array<Scalars['Int']>
  isActive: Scalars['Boolean']
}

export type CuratorGroupEdge = {
  node: CuratorGroup
  cursor: Scalars['String']
}

export enum CuratorGroupOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  IsActiveAsc = 'isActive_ASC',
  IsActiveDesc = 'isActive_DESC',
}

export type CuratorGroupUpdateInput = {
  curatorIds?: Maybe<Array<Scalars['Int']>>
  isActive?: Maybe<Scalars['Boolean']>
}

export type CuratorGroupWhereInput = {
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
  isActive_eq?: Maybe<Scalars['Boolean']>
  isActive_in?: Maybe<Array<Scalars['Boolean']>>
  channels_none?: Maybe<ChannelWhereInput>
  channels_some?: Maybe<ChannelWhereInput>
  channels_every?: Maybe<ChannelWhereInput>
  AND?: Maybe<Array<CuratorGroupWhereInput>>
  OR?: Maybe<Array<CuratorGroupWhereInput>>
}

export type CuratorGroupWhereUniqueInput = {
  id: Scalars['ID']
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
  family: DistributionBucketFamily
  familyId: Scalars['String']
  operators: Array<DistributionBucketOperator>
  /** Whether the bucket is accepting any new bags */
  acceptingNewBags: Scalars['Boolean']
  /** Whether the bucket is currently distributing content */
  distributing: Scalars['Boolean']
  bagAssignments: Array<StorageBagDistributionAssignment>
}

export type DistributionBucketConnection = {
  totalCount: Scalars['Int']
  edges: Array<DistributionBucketEdge>
  pageInfo: PageInfo
}

export type DistributionBucketCreateInput = {
  family: Scalars['ID']
  acceptingNewBags: Scalars['Boolean']
  distributing: Scalars['Boolean']
}

export type DistributionBucketEdge = {
  node: DistributionBucket
  cursor: Scalars['String']
}

export type DistributionBucketFamily = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  metadata?: Maybe<DistributionBucketFamilyMetadata>
  metadataId?: Maybe<Scalars['String']>
  buckets: Array<DistributionBucket>
}

export type DistributionBucketFamilyConnection = {
  totalCount: Scalars['Int']
  edges: Array<DistributionBucketFamilyEdge>
  pageInfo: PageInfo
}

export type DistributionBucketFamilyCreateInput = {
  metadata?: Maybe<Scalars['ID']>
}

export type DistributionBucketFamilyEdge = {
  node: DistributionBucketFamily
  cursor: Scalars['String']
}

export type DistributionBucketFamilyMetadata = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Name of the geographical region covered by the family (ie.: us-east-1) */
  region?: Maybe<Scalars['String']>
  /** Optional, more specific description of the region covered by the family */
  description?: Maybe<Scalars['String']>
  boundary: Array<GeoCoordinates>
  distributionbucketfamilymetadata?: Maybe<Array<DistributionBucketFamily>>
}

export type DistributionBucketFamilyMetadataConnection = {
  totalCount: Scalars['Int']
  edges: Array<DistributionBucketFamilyMetadataEdge>
  pageInfo: PageInfo
}

export type DistributionBucketFamilyMetadataCreateInput = {
  region?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
}

export type DistributionBucketFamilyMetadataEdge = {
  node: DistributionBucketFamilyMetadata
  cursor: Scalars['String']
}

export enum DistributionBucketFamilyMetadataOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  RegionAsc = 'region_ASC',
  RegionDesc = 'region_DESC',
  DescriptionAsc = 'description_ASC',
  DescriptionDesc = 'description_DESC',
}

export type DistributionBucketFamilyMetadataUpdateInput = {
  region?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
}

export type DistributionBucketFamilyMetadataWhereInput = {
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
  region_eq?: Maybe<Scalars['String']>
  region_contains?: Maybe<Scalars['String']>
  region_startsWith?: Maybe<Scalars['String']>
  region_endsWith?: Maybe<Scalars['String']>
  region_in?: Maybe<Array<Scalars['String']>>
  description_eq?: Maybe<Scalars['String']>
  description_contains?: Maybe<Scalars['String']>
  description_startsWith?: Maybe<Scalars['String']>
  description_endsWith?: Maybe<Scalars['String']>
  description_in?: Maybe<Array<Scalars['String']>>
  boundary_none?: Maybe<GeoCoordinatesWhereInput>
  boundary_some?: Maybe<GeoCoordinatesWhereInput>
  boundary_every?: Maybe<GeoCoordinatesWhereInput>
  distributionbucketfamilymetadata_none?: Maybe<DistributionBucketFamilyWhereInput>
  distributionbucketfamilymetadata_some?: Maybe<DistributionBucketFamilyWhereInput>
  distributionbucketfamilymetadata_every?: Maybe<DistributionBucketFamilyWhereInput>
  AND?: Maybe<Array<DistributionBucketFamilyMetadataWhereInput>>
  OR?: Maybe<Array<DistributionBucketFamilyMetadataWhereInput>>
}

export type DistributionBucketFamilyMetadataWhereUniqueInput = {
  id: Scalars['ID']
}

export enum DistributionBucketFamilyOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  MetadataAsc = 'metadata_ASC',
  MetadataDesc = 'metadata_DESC',
}

export type DistributionBucketFamilyUpdateInput = {
  metadata?: Maybe<Scalars['ID']>
}

export type DistributionBucketFamilyWhereInput = {
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
  metadata_eq?: Maybe<Scalars['ID']>
  metadata_in?: Maybe<Array<Scalars['ID']>>
  metadata?: Maybe<DistributionBucketFamilyMetadataWhereInput>
  buckets_none?: Maybe<DistributionBucketWhereInput>
  buckets_some?: Maybe<DistributionBucketWhereInput>
  buckets_every?: Maybe<DistributionBucketWhereInput>
  AND?: Maybe<Array<DistributionBucketFamilyWhereInput>>
  OR?: Maybe<Array<DistributionBucketFamilyWhereInput>>
}

export type DistributionBucketFamilyWhereUniqueInput = {
  id: Scalars['ID']
}

export type DistributionBucketOperator = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  distributionBucket: DistributionBucket
  distributionBucketId: Scalars['String']
  /** ID of the distribution group worker */
  workerId: Scalars['Int']
  /** Current operator status */
  status: DistributionBucketOperatorStatus
  metadata?: Maybe<DistributionBucketOperatorMetadata>
  metadataId?: Maybe<Scalars['String']>
}

export type DistributionBucketOperatorConnection = {
  totalCount: Scalars['Int']
  edges: Array<DistributionBucketOperatorEdge>
  pageInfo: PageInfo
}

export type DistributionBucketOperatorCreateInput = {
  distributionBucket: Scalars['ID']
  workerId: Scalars['Float']
  status: DistributionBucketOperatorStatus
  metadata?: Maybe<Scalars['ID']>
}

export type DistributionBucketOperatorEdge = {
  node: DistributionBucketOperator
  cursor: Scalars['String']
}

export type DistributionBucketOperatorMetadata = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Root distributor node api endpoint */
  nodeEndpoint?: Maybe<Scalars['String']>
  nodeLocation?: Maybe<NodeLocationMetadata>
  nodeLocationId?: Maybe<Scalars['String']>
  /** Additional information about the node/operator */
  extra?: Maybe<Scalars['String']>
  distributionbucketoperatormetadata?: Maybe<Array<DistributionBucketOperator>>
}

export type DistributionBucketOperatorMetadataConnection = {
  totalCount: Scalars['Int']
  edges: Array<DistributionBucketOperatorMetadataEdge>
  pageInfo: PageInfo
}

export type DistributionBucketOperatorMetadataCreateInput = {
  nodeEndpoint?: Maybe<Scalars['String']>
  nodeLocation?: Maybe<Scalars['ID']>
  extra?: Maybe<Scalars['String']>
}

export type DistributionBucketOperatorMetadataEdge = {
  node: DistributionBucketOperatorMetadata
  cursor: Scalars['String']
}

export enum DistributionBucketOperatorMetadataOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  NodeEndpointAsc = 'nodeEndpoint_ASC',
  NodeEndpointDesc = 'nodeEndpoint_DESC',
  NodeLocationAsc = 'nodeLocation_ASC',
  NodeLocationDesc = 'nodeLocation_DESC',
  ExtraAsc = 'extra_ASC',
  ExtraDesc = 'extra_DESC',
}

export type DistributionBucketOperatorMetadataUpdateInput = {
  nodeEndpoint?: Maybe<Scalars['String']>
  nodeLocation?: Maybe<Scalars['ID']>
  extra?: Maybe<Scalars['String']>
}

export type DistributionBucketOperatorMetadataWhereInput = {
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
  nodeEndpoint_eq?: Maybe<Scalars['String']>
  nodeEndpoint_contains?: Maybe<Scalars['String']>
  nodeEndpoint_startsWith?: Maybe<Scalars['String']>
  nodeEndpoint_endsWith?: Maybe<Scalars['String']>
  nodeEndpoint_in?: Maybe<Array<Scalars['String']>>
  nodeLocation_eq?: Maybe<Scalars['ID']>
  nodeLocation_in?: Maybe<Array<Scalars['ID']>>
  extra_eq?: Maybe<Scalars['String']>
  extra_contains?: Maybe<Scalars['String']>
  extra_startsWith?: Maybe<Scalars['String']>
  extra_endsWith?: Maybe<Scalars['String']>
  extra_in?: Maybe<Array<Scalars['String']>>
  nodeLocation?: Maybe<NodeLocationMetadataWhereInput>
  distributionbucketoperatormetadata_none?: Maybe<DistributionBucketOperatorWhereInput>
  distributionbucketoperatormetadata_some?: Maybe<DistributionBucketOperatorWhereInput>
  distributionbucketoperatormetadata_every?: Maybe<DistributionBucketOperatorWhereInput>
  AND?: Maybe<Array<DistributionBucketOperatorMetadataWhereInput>>
  OR?: Maybe<Array<DistributionBucketOperatorMetadataWhereInput>>
}

export type DistributionBucketOperatorMetadataWhereUniqueInput = {
  id: Scalars['ID']
}

export enum DistributionBucketOperatorOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  DistributionBucketAsc = 'distributionBucket_ASC',
  DistributionBucketDesc = 'distributionBucket_DESC',
  WorkerIdAsc = 'workerId_ASC',
  WorkerIdDesc = 'workerId_DESC',
  StatusAsc = 'status_ASC',
  StatusDesc = 'status_DESC',
  MetadataAsc = 'metadata_ASC',
  MetadataDesc = 'metadata_DESC',
}

export enum DistributionBucketOperatorStatus {
  Invited = 'INVITED',
  Active = 'ACTIVE',
}

export type DistributionBucketOperatorUpdateInput = {
  distributionBucket?: Maybe<Scalars['ID']>
  workerId?: Maybe<Scalars['Float']>
  status?: Maybe<DistributionBucketOperatorStatus>
  metadata?: Maybe<Scalars['ID']>
}

export type DistributionBucketOperatorWhereInput = {
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
  distributionBucket_eq?: Maybe<Scalars['ID']>
  distributionBucket_in?: Maybe<Array<Scalars['ID']>>
  workerId_eq?: Maybe<Scalars['Int']>
  workerId_gt?: Maybe<Scalars['Int']>
  workerId_gte?: Maybe<Scalars['Int']>
  workerId_lt?: Maybe<Scalars['Int']>
  workerId_lte?: Maybe<Scalars['Int']>
  workerId_in?: Maybe<Array<Scalars['Int']>>
  status_eq?: Maybe<DistributionBucketOperatorStatus>
  status_in?: Maybe<Array<DistributionBucketOperatorStatus>>
  metadata_eq?: Maybe<Scalars['ID']>
  metadata_in?: Maybe<Array<Scalars['ID']>>
  distributionBucket?: Maybe<DistributionBucketWhereInput>
  metadata?: Maybe<DistributionBucketOperatorMetadataWhereInput>
  AND?: Maybe<Array<DistributionBucketOperatorWhereInput>>
  OR?: Maybe<Array<DistributionBucketOperatorWhereInput>>
}

export type DistributionBucketOperatorWhereUniqueInput = {
  id: Scalars['ID']
}

export enum DistributionBucketOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  FamilyAsc = 'family_ASC',
  FamilyDesc = 'family_DESC',
  AcceptingNewBagsAsc = 'acceptingNewBags_ASC',
  AcceptingNewBagsDesc = 'acceptingNewBags_DESC',
  DistributingAsc = 'distributing_ASC',
  DistributingDesc = 'distributing_DESC',
}

export type DistributionBucketUpdateInput = {
  family?: Maybe<Scalars['ID']>
  acceptingNewBags?: Maybe<Scalars['Boolean']>
  distributing?: Maybe<Scalars['Boolean']>
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
  family_eq?: Maybe<Scalars['ID']>
  family_in?: Maybe<Array<Scalars['ID']>>
  acceptingNewBags_eq?: Maybe<Scalars['Boolean']>
  acceptingNewBags_in?: Maybe<Array<Scalars['Boolean']>>
  distributing_eq?: Maybe<Scalars['Boolean']>
  distributing_in?: Maybe<Array<Scalars['Boolean']>>
  family?: Maybe<DistributionBucketFamilyWhereInput>
  operators_none?: Maybe<DistributionBucketOperatorWhereInput>
  operators_some?: Maybe<DistributionBucketOperatorWhereInput>
  operators_every?: Maybe<DistributionBucketOperatorWhereInput>
  bagAssignments_none?: Maybe<StorageBagDistributionAssignmentWhereInput>
  bagAssignments_some?: Maybe<StorageBagDistributionAssignmentWhereInput>
  bagAssignments_every?: Maybe<StorageBagDistributionAssignmentWhereInput>
  AND?: Maybe<Array<DistributionBucketWhereInput>>
  OR?: Maybe<Array<DistributionBucketWhereInput>>
}

export type DistributionBucketWhereUniqueInput = {
  id: Scalars['ID']
}

export type GeoCoordinates = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  latitude: Scalars['Float']
  longitude: Scalars['Float']
  boundarySourceBucketFamilyMeta?: Maybe<DistributionBucketFamilyMetadata>
  boundarySourceBucketFamilyMetaId?: Maybe<Scalars['String']>
  nodelocationmetadatacoordinates?: Maybe<Array<NodeLocationMetadata>>
}

export type GeoCoordinatesConnection = {
  totalCount: Scalars['Int']
  edges: Array<GeoCoordinatesEdge>
  pageInfo: PageInfo
}

export type GeoCoordinatesCreateInput = {
  latitude: Scalars['Float']
  longitude: Scalars['Float']
  boundarySourceBucketFamilyMeta?: Maybe<Scalars['ID']>
}

export type GeoCoordinatesEdge = {
  node: GeoCoordinates
  cursor: Scalars['String']
}

export enum GeoCoordinatesOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  LatitudeAsc = 'latitude_ASC',
  LatitudeDesc = 'latitude_DESC',
  LongitudeAsc = 'longitude_ASC',
  LongitudeDesc = 'longitude_DESC',
  BoundarySourceBucketFamilyMetaAsc = 'boundarySourceBucketFamilyMeta_ASC',
  BoundarySourceBucketFamilyMetaDesc = 'boundarySourceBucketFamilyMeta_DESC',
}

export type GeoCoordinatesUpdateInput = {
  latitude?: Maybe<Scalars['Float']>
  longitude?: Maybe<Scalars['Float']>
  boundarySourceBucketFamilyMeta?: Maybe<Scalars['ID']>
}

export type GeoCoordinatesWhereInput = {
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
  latitude_eq?: Maybe<Scalars['Float']>
  latitude_gt?: Maybe<Scalars['Float']>
  latitude_gte?: Maybe<Scalars['Float']>
  latitude_lt?: Maybe<Scalars['Float']>
  latitude_lte?: Maybe<Scalars['Float']>
  latitude_in?: Maybe<Array<Scalars['Float']>>
  longitude_eq?: Maybe<Scalars['Float']>
  longitude_gt?: Maybe<Scalars['Float']>
  longitude_gte?: Maybe<Scalars['Float']>
  longitude_lt?: Maybe<Scalars['Float']>
  longitude_lte?: Maybe<Scalars['Float']>
  longitude_in?: Maybe<Array<Scalars['Float']>>
  boundarySourceBucketFamilyMeta_eq?: Maybe<Scalars['ID']>
  boundarySourceBucketFamilyMeta_in?: Maybe<Array<Scalars['ID']>>
  boundarySourceBucketFamilyMeta?: Maybe<DistributionBucketFamilyMetadataWhereInput>
  nodelocationmetadatacoordinates_none?: Maybe<NodeLocationMetadataWhereInput>
  nodelocationmetadatacoordinates_some?: Maybe<NodeLocationMetadataWhereInput>
  nodelocationmetadatacoordinates_every?: Maybe<NodeLocationMetadataWhereInput>
  AND?: Maybe<Array<GeoCoordinatesWhereInput>>
  OR?: Maybe<Array<GeoCoordinatesWhereInput>>
}

export type GeoCoordinatesWhereUniqueInput = {
  id: Scalars['ID']
}

export type Language = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Language identifier ISO 639-1 */
  iso: Scalars['String']
  createdInBlock: Scalars['Int']
  channellanguage?: Maybe<Array<Channel>>
  videolanguage?: Maybe<Array<Video>>
}

export type LanguageConnection = {
  totalCount: Scalars['Int']
  edges: Array<LanguageEdge>
  pageInfo: PageInfo
}

export type LanguageCreateInput = {
  iso: Scalars['String']
  createdInBlock: Scalars['Float']
}

export type LanguageEdge = {
  node: Language
  cursor: Scalars['String']
}

export enum LanguageOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  IsoAsc = 'iso_ASC',
  IsoDesc = 'iso_DESC',
  CreatedInBlockAsc = 'createdInBlock_ASC',
  CreatedInBlockDesc = 'createdInBlock_DESC',
}

export type LanguageUpdateInput = {
  iso?: Maybe<Scalars['String']>
  createdInBlock?: Maybe<Scalars['Float']>
}

export type LanguageWhereInput = {
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
  iso_eq?: Maybe<Scalars['String']>
  iso_contains?: Maybe<Scalars['String']>
  iso_startsWith?: Maybe<Scalars['String']>
  iso_endsWith?: Maybe<Scalars['String']>
  iso_in?: Maybe<Array<Scalars['String']>>
  createdInBlock_eq?: Maybe<Scalars['Int']>
  createdInBlock_gt?: Maybe<Scalars['Int']>
  createdInBlock_gte?: Maybe<Scalars['Int']>
  createdInBlock_lt?: Maybe<Scalars['Int']>
  createdInBlock_lte?: Maybe<Scalars['Int']>
  createdInBlock_in?: Maybe<Array<Scalars['Int']>>
  channellanguage_none?: Maybe<ChannelWhereInput>
  channellanguage_some?: Maybe<ChannelWhereInput>
  channellanguage_every?: Maybe<ChannelWhereInput>
  videolanguage_none?: Maybe<VideoWhereInput>
  videolanguage_some?: Maybe<VideoWhereInput>
  videolanguage_every?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<LanguageWhereInput>>
  OR?: Maybe<Array<LanguageWhereInput>>
}

export type LanguageWhereUniqueInput = {
  id: Scalars['ID']
}

export type License = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** License code defined by Joystream */
  code?: Maybe<Scalars['Int']>
  /** Attribution (if required by the license) */
  attribution?: Maybe<Scalars['String']>
  /** Custom license content */
  customText?: Maybe<Scalars['String']>
  videolicense?: Maybe<Array<Video>>
}

export type LicenseConnection = {
  totalCount: Scalars['Int']
  edges: Array<LicenseEdge>
  pageInfo: PageInfo
}

export type LicenseCreateInput = {
  code?: Maybe<Scalars['Float']>
  attribution?: Maybe<Scalars['String']>
  customText?: Maybe<Scalars['String']>
}

export type LicenseEdge = {
  node: License
  cursor: Scalars['String']
}

export enum LicenseOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  CodeAsc = 'code_ASC',
  CodeDesc = 'code_DESC',
  AttributionAsc = 'attribution_ASC',
  AttributionDesc = 'attribution_DESC',
  CustomTextAsc = 'customText_ASC',
  CustomTextDesc = 'customText_DESC',
}

export type LicenseUpdateInput = {
  code?: Maybe<Scalars['Float']>
  attribution?: Maybe<Scalars['String']>
  customText?: Maybe<Scalars['String']>
}

export type LicenseWhereInput = {
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
  code_eq?: Maybe<Scalars['Int']>
  code_gt?: Maybe<Scalars['Int']>
  code_gte?: Maybe<Scalars['Int']>
  code_lt?: Maybe<Scalars['Int']>
  code_lte?: Maybe<Scalars['Int']>
  code_in?: Maybe<Array<Scalars['Int']>>
  attribution_eq?: Maybe<Scalars['String']>
  attribution_contains?: Maybe<Scalars['String']>
  attribution_startsWith?: Maybe<Scalars['String']>
  attribution_endsWith?: Maybe<Scalars['String']>
  attribution_in?: Maybe<Array<Scalars['String']>>
  customText_eq?: Maybe<Scalars['String']>
  customText_contains?: Maybe<Scalars['String']>
  customText_startsWith?: Maybe<Scalars['String']>
  customText_endsWith?: Maybe<Scalars['String']>
  customText_in?: Maybe<Array<Scalars['String']>>
  videolicense_none?: Maybe<VideoWhereInput>
  videolicense_some?: Maybe<VideoWhereInput>
  videolicense_every?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<LicenseWhereInput>>
  OR?: Maybe<Array<LicenseWhereInput>>
}

export type LicenseWhereUniqueInput = {
  id: Scalars['ID']
}

export type MembersByHandleFtsOutput = {
  item: MembersByHandleSearchResult
  rank: Scalars['Float']
  isTypeOf: Scalars['String']
  highlight: Scalars['String']
}

export type MembersByHandleSearchResult = Membership

/** Stored information about a registered user */
export type Membership = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** The unique handle chosen by member */
  handle: Scalars['String']
  /** A Url to member's Avatar image */
  avatarUri?: Maybe<Scalars['String']>
  /** Short text chosen by member to share information about themselves */
  about?: Maybe<Scalars['String']>
  /** Member's controller account id */
  controllerAccount: Scalars['String']
  /** Member's root account id */
  rootAccount: Scalars['String']
  /** Blocknumber when member was registered */
  createdInBlock: Scalars['Int']
  /** How the member was registered */
  entry: MembershipEntryMethod
  /** The type of subscription the member has purchased if any. */
  subscription?: Maybe<Scalars['Int']>
  channels: Array<Channel>
}

export type MembershipConnection = {
  totalCount: Scalars['Int']
  edges: Array<MembershipEdge>
  pageInfo: PageInfo
}

export type MembershipCreateInput = {
  handle: Scalars['String']
  avatarUri?: Maybe<Scalars['String']>
  about?: Maybe<Scalars['String']>
  controllerAccount: Scalars['String']
  rootAccount: Scalars['String']
  createdInBlock: Scalars['Float']
  entry: MembershipEntryMethod
  subscription?: Maybe<Scalars['Float']>
}

export type MembershipEdge = {
  node: Membership
  cursor: Scalars['String']
}

export enum MembershipEntryMethod {
  Paid = 'PAID',
  Screening = 'SCREENING',
  Genesis = 'GENESIS',
}

export enum MembershipOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  HandleAsc = 'handle_ASC',
  HandleDesc = 'handle_DESC',
  AvatarUriAsc = 'avatarUri_ASC',
  AvatarUriDesc = 'avatarUri_DESC',
  AboutAsc = 'about_ASC',
  AboutDesc = 'about_DESC',
  ControllerAccountAsc = 'controllerAccount_ASC',
  ControllerAccountDesc = 'controllerAccount_DESC',
  RootAccountAsc = 'rootAccount_ASC',
  RootAccountDesc = 'rootAccount_DESC',
  CreatedInBlockAsc = 'createdInBlock_ASC',
  CreatedInBlockDesc = 'createdInBlock_DESC',
  EntryAsc = 'entry_ASC',
  EntryDesc = 'entry_DESC',
  SubscriptionAsc = 'subscription_ASC',
  SubscriptionDesc = 'subscription_DESC',
}

export type MembershipUpdateInput = {
  handle?: Maybe<Scalars['String']>
  avatarUri?: Maybe<Scalars['String']>
  about?: Maybe<Scalars['String']>
  controllerAccount?: Maybe<Scalars['String']>
  rootAccount?: Maybe<Scalars['String']>
  createdInBlock?: Maybe<Scalars['Float']>
  entry?: Maybe<MembershipEntryMethod>
  subscription?: Maybe<Scalars['Float']>
}

export type MembershipWhereInput = {
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
  handle_eq?: Maybe<Scalars['String']>
  handle_contains?: Maybe<Scalars['String']>
  handle_startsWith?: Maybe<Scalars['String']>
  handle_endsWith?: Maybe<Scalars['String']>
  handle_in?: Maybe<Array<Scalars['String']>>
  avatarUri_eq?: Maybe<Scalars['String']>
  avatarUri_contains?: Maybe<Scalars['String']>
  avatarUri_startsWith?: Maybe<Scalars['String']>
  avatarUri_endsWith?: Maybe<Scalars['String']>
  avatarUri_in?: Maybe<Array<Scalars['String']>>
  about_eq?: Maybe<Scalars['String']>
  about_contains?: Maybe<Scalars['String']>
  about_startsWith?: Maybe<Scalars['String']>
  about_endsWith?: Maybe<Scalars['String']>
  about_in?: Maybe<Array<Scalars['String']>>
  controllerAccount_eq?: Maybe<Scalars['String']>
  controllerAccount_contains?: Maybe<Scalars['String']>
  controllerAccount_startsWith?: Maybe<Scalars['String']>
  controllerAccount_endsWith?: Maybe<Scalars['String']>
  controllerAccount_in?: Maybe<Array<Scalars['String']>>
  rootAccount_eq?: Maybe<Scalars['String']>
  rootAccount_contains?: Maybe<Scalars['String']>
  rootAccount_startsWith?: Maybe<Scalars['String']>
  rootAccount_endsWith?: Maybe<Scalars['String']>
  rootAccount_in?: Maybe<Array<Scalars['String']>>
  createdInBlock_eq?: Maybe<Scalars['Int']>
  createdInBlock_gt?: Maybe<Scalars['Int']>
  createdInBlock_gte?: Maybe<Scalars['Int']>
  createdInBlock_lt?: Maybe<Scalars['Int']>
  createdInBlock_lte?: Maybe<Scalars['Int']>
  createdInBlock_in?: Maybe<Array<Scalars['Int']>>
  entry_eq?: Maybe<MembershipEntryMethod>
  entry_in?: Maybe<Array<MembershipEntryMethod>>
  subscription_eq?: Maybe<Scalars['Int']>
  subscription_gt?: Maybe<Scalars['Int']>
  subscription_gte?: Maybe<Scalars['Int']>
  subscription_lt?: Maybe<Scalars['Int']>
  subscription_lte?: Maybe<Scalars['Int']>
  subscription_in?: Maybe<Array<Scalars['Int']>>
  channels_none?: Maybe<ChannelWhereInput>
  channels_some?: Maybe<ChannelWhereInput>
  channels_every?: Maybe<ChannelWhereInput>
  AND?: Maybe<Array<MembershipWhereInput>>
  OR?: Maybe<Array<MembershipWhereInput>>
}

export type MembershipWhereUniqueInput = {
  id?: Maybe<Scalars['ID']>
  handle?: Maybe<Scalars['String']>
}

export type NodeLocationMetadata = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** ISO 3166-1 alpha-2 country code (2 letters) */
  countryCode?: Maybe<Scalars['String']>
  /** City name */
  city?: Maybe<Scalars['String']>
  coordinates?: Maybe<GeoCoordinates>
  coordinatesId?: Maybe<Scalars['String']>
  distributionbucketoperatormetadatanodeLocation?: Maybe<Array<DistributionBucketOperatorMetadata>>
  storagebucketoperatormetadatanodeLocation?: Maybe<Array<StorageBucketOperatorMetadata>>
}

export type NodeLocationMetadataConnection = {
  totalCount: Scalars['Int']
  edges: Array<NodeLocationMetadataEdge>
  pageInfo: PageInfo
}

export type NodeLocationMetadataCreateInput = {
  countryCode?: Maybe<Scalars['String']>
  city?: Maybe<Scalars['String']>
  coordinates?: Maybe<Scalars['ID']>
}

export type NodeLocationMetadataEdge = {
  node: NodeLocationMetadata
  cursor: Scalars['String']
}

export enum NodeLocationMetadataOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  CountryCodeAsc = 'countryCode_ASC',
  CountryCodeDesc = 'countryCode_DESC',
  CityAsc = 'city_ASC',
  CityDesc = 'city_DESC',
  CoordinatesAsc = 'coordinates_ASC',
  CoordinatesDesc = 'coordinates_DESC',
}

export type NodeLocationMetadataUpdateInput = {
  countryCode?: Maybe<Scalars['String']>
  city?: Maybe<Scalars['String']>
  coordinates?: Maybe<Scalars['ID']>
}

export type NodeLocationMetadataWhereInput = {
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
  countryCode_eq?: Maybe<Scalars['String']>
  countryCode_contains?: Maybe<Scalars['String']>
  countryCode_startsWith?: Maybe<Scalars['String']>
  countryCode_endsWith?: Maybe<Scalars['String']>
  countryCode_in?: Maybe<Array<Scalars['String']>>
  city_eq?: Maybe<Scalars['String']>
  city_contains?: Maybe<Scalars['String']>
  city_startsWith?: Maybe<Scalars['String']>
  city_endsWith?: Maybe<Scalars['String']>
  city_in?: Maybe<Array<Scalars['String']>>
  coordinates_eq?: Maybe<Scalars['ID']>
  coordinates_in?: Maybe<Array<Scalars['ID']>>
  coordinates?: Maybe<GeoCoordinatesWhereInput>
  distributionbucketoperatormetadatanodeLocation_none?: Maybe<DistributionBucketOperatorMetadataWhereInput>
  distributionbucketoperatormetadatanodeLocation_some?: Maybe<DistributionBucketOperatorMetadataWhereInput>
  distributionbucketoperatormetadatanodeLocation_every?: Maybe<DistributionBucketOperatorMetadataWhereInput>
  storagebucketoperatormetadatanodeLocation_none?: Maybe<StorageBucketOperatorMetadataWhereInput>
  storagebucketoperatormetadatanodeLocation_some?: Maybe<StorageBucketOperatorMetadataWhereInput>
  storagebucketoperatormetadatanodeLocation_every?: Maybe<StorageBucketOperatorMetadataWhereInput>
  AND?: Maybe<Array<NodeLocationMetadataWhereInput>>
  OR?: Maybe<Array<NodeLocationMetadataWhereInput>>
}

export type NodeLocationMetadataWhereUniqueInput = {
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
  channelCategories: Array<ChannelCategory>
  channelCategoryByUniqueInput?: Maybe<ChannelCategory>
  channelCategoriesConnection: ChannelCategoryConnection
  channels: Array<Channel>
  channelByUniqueInput?: Maybe<Channel>
  channelsConnection: ChannelConnection
  curatorGroups: Array<CuratorGroup>
  curatorGroupByUniqueInput?: Maybe<CuratorGroup>
  curatorGroupsConnection: CuratorGroupConnection
  distributionBucketFamilyMetadata: Array<DistributionBucketFamilyMetadata>
  distributionBucketFamilyMetadataByUniqueInput?: Maybe<DistributionBucketFamilyMetadata>
  distributionBucketFamilyMetadataConnection: DistributionBucketFamilyMetadataConnection
  distributionBucketFamilies: Array<DistributionBucketFamily>
  distributionBucketFamilyByUniqueInput?: Maybe<DistributionBucketFamily>
  distributionBucketFamiliesConnection: DistributionBucketFamilyConnection
  distributionBucketOperatorMetadata: Array<DistributionBucketOperatorMetadata>
  distributionBucketOperatorMetadataByUniqueInput?: Maybe<DistributionBucketOperatorMetadata>
  distributionBucketOperatorMetadataConnection: DistributionBucketOperatorMetadataConnection
  distributionBucketOperators: Array<DistributionBucketOperator>
  distributionBucketOperatorByUniqueInput?: Maybe<DistributionBucketOperator>
  distributionBucketOperatorsConnection: DistributionBucketOperatorConnection
  distributionBuckets: Array<DistributionBucket>
  distributionBucketByUniqueInput?: Maybe<DistributionBucket>
  distributionBucketsConnection: DistributionBucketConnection
  geoCoordinates: Array<GeoCoordinates>
  geoCoordinatesByUniqueInput?: Maybe<GeoCoordinates>
  geoCoordinatesConnection: GeoCoordinatesConnection
  languages: Array<Language>
  languageByUniqueInput?: Maybe<Language>
  languagesConnection: LanguageConnection
  licenses: Array<License>
  licenseByUniqueInput?: Maybe<License>
  licensesConnection: LicenseConnection
  memberships: Array<Membership>
  membershipByUniqueInput?: Maybe<Membership>
  membershipsConnection: MembershipConnection
  nodeLocationMetadata: Array<NodeLocationMetadata>
  nodeLocationMetadataByUniqueInput?: Maybe<NodeLocationMetadata>
  nodeLocationMetadataConnection: NodeLocationMetadataConnection
  channelCategoriesByName: Array<ChannelCategoriesByNameFtsOutput>
  membersByHandle: Array<MembersByHandleFtsOutput>
  search: Array<SearchFtsOutput>
  videoCategoriesByName: Array<VideoCategoriesByNameFtsOutput>
  storageBagDistributionAssignments: Array<StorageBagDistributionAssignment>
  storageBagDistributionAssignmentByUniqueInput?: Maybe<StorageBagDistributionAssignment>
  storageBagDistributionAssignmentsConnection: StorageBagDistributionAssignmentConnection
  storageBagStorageAssignments: Array<StorageBagStorageAssignment>
  storageBagStorageAssignmentByUniqueInput?: Maybe<StorageBagStorageAssignment>
  storageBagStorageAssignmentsConnection: StorageBagStorageAssignmentConnection
  storageBags: Array<StorageBag>
  storageBagByUniqueInput?: Maybe<StorageBag>
  storageBagsConnection: StorageBagConnection
  storageBucketOperatorMetadata: Array<StorageBucketOperatorMetadata>
  storageBucketOperatorMetadataByUniqueInput?: Maybe<StorageBucketOperatorMetadata>
  storageBucketOperatorMetadataConnection: StorageBucketOperatorMetadataConnection
  storageBuckets: Array<StorageBucket>
  storageBucketByUniqueInput?: Maybe<StorageBucket>
  storageBucketsConnection: StorageBucketConnection
  storageDataObjects: Array<StorageDataObject>
  storageDataObjectByUniqueInput?: Maybe<StorageDataObject>
  storageDataObjectsConnection: StorageDataObjectConnection
  storageSystemParameters: Array<StorageSystemParameters>
  storageSystemParametersByUniqueInput?: Maybe<StorageSystemParameters>
  storageSystemParametersConnection: StorageSystemParametersConnection
  videoCategories: Array<VideoCategory>
  videoCategoryByUniqueInput?: Maybe<VideoCategory>
  videoCategoriesConnection: VideoCategoryConnection
  videoMediaEncodings: Array<VideoMediaEncoding>
  videoMediaEncodingByUniqueInput?: Maybe<VideoMediaEncoding>
  videoMediaEncodingsConnection: VideoMediaEncodingConnection
  videoMediaMetadata: Array<VideoMediaMetadata>
  videoMediaMetadataByUniqueInput?: Maybe<VideoMediaMetadata>
  videoMediaMetadataConnection: VideoMediaMetadataConnection
  videos: Array<Video>
  videoByUniqueInput?: Maybe<Video>
  videosConnection: VideoConnection
  workers: Array<Worker>
  workerByUniqueInput?: Maybe<Worker>
  workersConnection: WorkerConnection
}

export type QueryChannelCategoriesArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<ChannelCategoryWhereInput>
  orderBy?: Maybe<Array<ChannelCategoryOrderByInput>>
}

export type QueryChannelCategoryByUniqueInputArgs = {
  where: ChannelCategoryWhereUniqueInput
}

export type QueryChannelCategoriesConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<ChannelCategoryWhereInput>
  orderBy?: Maybe<Array<ChannelCategoryOrderByInput>>
}

export type QueryChannelsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<ChannelWhereInput>
  orderBy?: Maybe<Array<ChannelOrderByInput>>
}

export type QueryChannelByUniqueInputArgs = {
  where: ChannelWhereUniqueInput
}

export type QueryChannelsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<ChannelWhereInput>
  orderBy?: Maybe<Array<ChannelOrderByInput>>
}

export type QueryCuratorGroupsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<CuratorGroupWhereInput>
  orderBy?: Maybe<Array<CuratorGroupOrderByInput>>
}

export type QueryCuratorGroupByUniqueInputArgs = {
  where: CuratorGroupWhereUniqueInput
}

export type QueryCuratorGroupsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<CuratorGroupWhereInput>
  orderBy?: Maybe<Array<CuratorGroupOrderByInput>>
}

export type QueryDistributionBucketFamilyMetadataArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<DistributionBucketFamilyMetadataWhereInput>
  orderBy?: Maybe<Array<DistributionBucketFamilyMetadataOrderByInput>>
}

export type QueryDistributionBucketFamilyMetadataByUniqueInputArgs = {
  where: DistributionBucketFamilyMetadataWhereUniqueInput
}

export type QueryDistributionBucketFamilyMetadataConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<DistributionBucketFamilyMetadataWhereInput>
  orderBy?: Maybe<Array<DistributionBucketFamilyMetadataOrderByInput>>
}

export type QueryDistributionBucketFamiliesArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<DistributionBucketFamilyWhereInput>
  orderBy?: Maybe<Array<DistributionBucketFamilyOrderByInput>>
}

export type QueryDistributionBucketFamilyByUniqueInputArgs = {
  where: DistributionBucketFamilyWhereUniqueInput
}

export type QueryDistributionBucketFamiliesConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<DistributionBucketFamilyWhereInput>
  orderBy?: Maybe<Array<DistributionBucketFamilyOrderByInput>>
}

export type QueryDistributionBucketOperatorMetadataArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<DistributionBucketOperatorMetadataWhereInput>
  orderBy?: Maybe<Array<DistributionBucketOperatorMetadataOrderByInput>>
}

export type QueryDistributionBucketOperatorMetadataByUniqueInputArgs = {
  where: DistributionBucketOperatorMetadataWhereUniqueInput
}

export type QueryDistributionBucketOperatorMetadataConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<DistributionBucketOperatorMetadataWhereInput>
  orderBy?: Maybe<Array<DistributionBucketOperatorMetadataOrderByInput>>
}

export type QueryDistributionBucketOperatorsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<DistributionBucketOperatorWhereInput>
  orderBy?: Maybe<Array<DistributionBucketOperatorOrderByInput>>
}

export type QueryDistributionBucketOperatorByUniqueInputArgs = {
  where: DistributionBucketOperatorWhereUniqueInput
}

export type QueryDistributionBucketOperatorsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<DistributionBucketOperatorWhereInput>
  orderBy?: Maybe<Array<DistributionBucketOperatorOrderByInput>>
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

export type QueryGeoCoordinatesArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<GeoCoordinatesWhereInput>
  orderBy?: Maybe<Array<GeoCoordinatesOrderByInput>>
}

export type QueryGeoCoordinatesByUniqueInputArgs = {
  where: GeoCoordinatesWhereUniqueInput
}

export type QueryGeoCoordinatesConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<GeoCoordinatesWhereInput>
  orderBy?: Maybe<Array<GeoCoordinatesOrderByInput>>
}

export type QueryLanguagesArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<LanguageWhereInput>
  orderBy?: Maybe<Array<LanguageOrderByInput>>
}

export type QueryLanguageByUniqueInputArgs = {
  where: LanguageWhereUniqueInput
}

export type QueryLanguagesConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<LanguageWhereInput>
  orderBy?: Maybe<Array<LanguageOrderByInput>>
}

export type QueryLicensesArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<LicenseWhereInput>
  orderBy?: Maybe<Array<LicenseOrderByInput>>
}

export type QueryLicenseByUniqueInputArgs = {
  where: LicenseWhereUniqueInput
}

export type QueryLicensesConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<LicenseWhereInput>
  orderBy?: Maybe<Array<LicenseOrderByInput>>
}

export type QueryMembershipsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<MembershipWhereInput>
  orderBy?: Maybe<Array<MembershipOrderByInput>>
}

export type QueryMembershipByUniqueInputArgs = {
  where: MembershipWhereUniqueInput
}

export type QueryMembershipsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<MembershipWhereInput>
  orderBy?: Maybe<Array<MembershipOrderByInput>>
}

export type QueryNodeLocationMetadataArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<NodeLocationMetadataWhereInput>
  orderBy?: Maybe<Array<NodeLocationMetadataOrderByInput>>
}

export type QueryNodeLocationMetadataByUniqueInputArgs = {
  where: NodeLocationMetadataWhereUniqueInput
}

export type QueryNodeLocationMetadataConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<NodeLocationMetadataWhereInput>
  orderBy?: Maybe<Array<NodeLocationMetadataOrderByInput>>
}

export type QueryChannelCategoriesByNameArgs = {
  whereChannelCategory?: Maybe<ChannelCategoryWhereInput>
  skip?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  text: Scalars['String']
}

export type QueryMembersByHandleArgs = {
  whereMembership?: Maybe<MembershipWhereInput>
  skip?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  text: Scalars['String']
}

export type QuerySearchArgs = {
  whereVideo?: Maybe<VideoWhereInput>
  whereChannel?: Maybe<ChannelWhereInput>
  skip?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  text: Scalars['String']
}

export type QueryVideoCategoriesByNameArgs = {
  whereVideoCategory?: Maybe<VideoCategoryWhereInput>
  skip?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  text: Scalars['String']
}

export type QueryStorageBagDistributionAssignmentsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StorageBagDistributionAssignmentWhereInput>
  orderBy?: Maybe<Array<StorageBagDistributionAssignmentOrderByInput>>
}

export type QueryStorageBagDistributionAssignmentByUniqueInputArgs = {
  where: StorageBagDistributionAssignmentWhereUniqueInput
}

export type QueryStorageBagDistributionAssignmentsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StorageBagDistributionAssignmentWhereInput>
  orderBy?: Maybe<Array<StorageBagDistributionAssignmentOrderByInput>>
}

export type QueryStorageBagStorageAssignmentsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StorageBagStorageAssignmentWhereInput>
  orderBy?: Maybe<Array<StorageBagStorageAssignmentOrderByInput>>
}

export type QueryStorageBagStorageAssignmentByUniqueInputArgs = {
  where: StorageBagStorageAssignmentWhereUniqueInput
}

export type QueryStorageBagStorageAssignmentsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StorageBagStorageAssignmentWhereInput>
  orderBy?: Maybe<Array<StorageBagStorageAssignmentOrderByInput>>
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

export type QueryStorageBucketOperatorMetadataArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StorageBucketOperatorMetadataWhereInput>
  orderBy?: Maybe<Array<StorageBucketOperatorMetadataOrderByInput>>
}

export type QueryStorageBucketOperatorMetadataByUniqueInputArgs = {
  where: StorageBucketOperatorMetadataWhereUniqueInput
}

export type QueryStorageBucketOperatorMetadataConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StorageBucketOperatorMetadataWhereInput>
  orderBy?: Maybe<Array<StorageBucketOperatorMetadataOrderByInput>>
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

export type QueryVideoCategoriesArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<VideoCategoryWhereInput>
  orderBy?: Maybe<Array<VideoCategoryOrderByInput>>
}

export type QueryVideoCategoryByUniqueInputArgs = {
  where: VideoCategoryWhereUniqueInput
}

export type QueryVideoCategoriesConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<VideoCategoryWhereInput>
  orderBy?: Maybe<Array<VideoCategoryOrderByInput>>
}

export type QueryVideoMediaEncodingsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<VideoMediaEncodingWhereInput>
  orderBy?: Maybe<Array<VideoMediaEncodingOrderByInput>>
}

export type QueryVideoMediaEncodingByUniqueInputArgs = {
  where: VideoMediaEncodingWhereUniqueInput
}

export type QueryVideoMediaEncodingsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<VideoMediaEncodingWhereInput>
  orderBy?: Maybe<Array<VideoMediaEncodingOrderByInput>>
}

export type QueryVideoMediaMetadataArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<VideoMediaMetadataWhereInput>
  orderBy?: Maybe<Array<VideoMediaMetadataOrderByInput>>
}

export type QueryVideoMediaMetadataByUniqueInputArgs = {
  where: VideoMediaMetadataWhereUniqueInput
}

export type QueryVideoMediaMetadataConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<VideoMediaMetadataWhereInput>
  orderBy?: Maybe<Array<VideoMediaMetadataOrderByInput>>
}

export type QueryVideosArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<VideoWhereInput>
  orderBy?: Maybe<Array<VideoOrderByInput>>
}

export type QueryVideoByUniqueInputArgs = {
  where: VideoWhereUniqueInput
}

export type QueryVideosConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<VideoWhereInput>
  orderBy?: Maybe<Array<VideoOrderByInput>>
}

export type QueryWorkersArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<WorkerWhereInput>
  orderBy?: Maybe<Array<WorkerOrderByInput>>
}

export type QueryWorkerByUniqueInputArgs = {
  where: WorkerWhereUniqueInput
}

export type QueryWorkersConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<WorkerWhereInput>
  orderBy?: Maybe<Array<WorkerOrderByInput>>
}

export type SearchFtsOutput = {
  item: SearchSearchResult
  rank: Scalars['Float']
  isTypeOf: Scalars['String']
  highlight: Scalars['String']
}

export type SearchSearchResult = Channel | Video

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
  objects: Array<StorageDataObject>
  storageAssignments: Array<StorageBagStorageAssignment>
  distirbutionAssignments: Array<StorageBagDistributionAssignment>
  /** Owner of the storage bag */
  owner: StorageBagOwner
}

export type StorageBagConnection = {
  totalCount: Scalars['Int']
  edges: Array<StorageBagEdge>
  pageInfo: PageInfo
}

export type StorageBagCreateInput = {
  owner: Scalars['JSONObject']
}

export type StorageBagDistributionAssignment = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  storageBag: StorageBag
  storageBagId?: Maybe<Scalars['String']>
  distributionBucket: DistributionBucket
  distributionBucketId?: Maybe<Scalars['String']>
}

export type StorageBagDistributionAssignmentConnection = {
  totalCount: Scalars['Int']
  edges: Array<StorageBagDistributionAssignmentEdge>
  pageInfo: PageInfo
}

export type StorageBagDistributionAssignmentCreateInput = {
  storageBag: Scalars['ID']
  distributionBucket: Scalars['ID']
  storageBagId?: Maybe<Scalars['String']>
  distributionBucketId?: Maybe<Scalars['String']>
}

export type StorageBagDistributionAssignmentEdge = {
  node: StorageBagDistributionAssignment
  cursor: Scalars['String']
}

export enum StorageBagDistributionAssignmentOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  StorageBagAsc = 'storageBag_ASC',
  StorageBagDesc = 'storageBag_DESC',
  DistributionBucketAsc = 'distributionBucket_ASC',
  DistributionBucketDesc = 'distributionBucket_DESC',
  StorageBagIdAsc = 'storageBagId_ASC',
  StorageBagIdDesc = 'storageBagId_DESC',
  DistributionBucketIdAsc = 'distributionBucketId_ASC',
  DistributionBucketIdDesc = 'distributionBucketId_DESC',
}

export type StorageBagDistributionAssignmentUpdateInput = {
  storageBag?: Maybe<Scalars['ID']>
  distributionBucket?: Maybe<Scalars['ID']>
  storageBagId?: Maybe<Scalars['String']>
  distributionBucketId?: Maybe<Scalars['String']>
}

export type StorageBagDistributionAssignmentWhereInput = {
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
  storageBag_eq?: Maybe<Scalars['ID']>
  storageBag_in?: Maybe<Array<Scalars['ID']>>
  distributionBucket_eq?: Maybe<Scalars['ID']>
  distributionBucket_in?: Maybe<Array<Scalars['ID']>>
  storageBagId_eq?: Maybe<Scalars['String']>
  storageBagId_contains?: Maybe<Scalars['String']>
  storageBagId_startsWith?: Maybe<Scalars['String']>
  storageBagId_endsWith?: Maybe<Scalars['String']>
  storageBagId_in?: Maybe<Array<Scalars['String']>>
  distributionBucketId_eq?: Maybe<Scalars['String']>
  distributionBucketId_contains?: Maybe<Scalars['String']>
  distributionBucketId_startsWith?: Maybe<Scalars['String']>
  distributionBucketId_endsWith?: Maybe<Scalars['String']>
  distributionBucketId_in?: Maybe<Array<Scalars['String']>>
  storageBag?: Maybe<StorageBagWhereInput>
  distributionBucket?: Maybe<DistributionBucketWhereInput>
  AND?: Maybe<Array<StorageBagDistributionAssignmentWhereInput>>
  OR?: Maybe<Array<StorageBagDistributionAssignmentWhereInput>>
}

export type StorageBagDistributionAssignmentWhereUniqueInput = {
  id: Scalars['ID']
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

export type StorageBagStorageAssignment = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  storageBag: StorageBag
  storageBagId?: Maybe<Scalars['String']>
  storageBucket: StorageBucket
  storageBucketId?: Maybe<Scalars['String']>
}

export type StorageBagStorageAssignmentConnection = {
  totalCount: Scalars['Int']
  edges: Array<StorageBagStorageAssignmentEdge>
  pageInfo: PageInfo
}

export type StorageBagStorageAssignmentCreateInput = {
  storageBag: Scalars['ID']
  storageBucket: Scalars['ID']
  storageBagId?: Maybe<Scalars['String']>
  storageBucketId?: Maybe<Scalars['String']>
}

export type StorageBagStorageAssignmentEdge = {
  node: StorageBagStorageAssignment
  cursor: Scalars['String']
}

export enum StorageBagStorageAssignmentOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  StorageBagAsc = 'storageBag_ASC',
  StorageBagDesc = 'storageBag_DESC',
  StorageBucketAsc = 'storageBucket_ASC',
  StorageBucketDesc = 'storageBucket_DESC',
  StorageBagIdAsc = 'storageBagId_ASC',
  StorageBagIdDesc = 'storageBagId_DESC',
  StorageBucketIdAsc = 'storageBucketId_ASC',
  StorageBucketIdDesc = 'storageBucketId_DESC',
}

export type StorageBagStorageAssignmentUpdateInput = {
  storageBag?: Maybe<Scalars['ID']>
  storageBucket?: Maybe<Scalars['ID']>
  storageBagId?: Maybe<Scalars['String']>
  storageBucketId?: Maybe<Scalars['String']>
}

export type StorageBagStorageAssignmentWhereInput = {
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
  storageBag_eq?: Maybe<Scalars['ID']>
  storageBag_in?: Maybe<Array<Scalars['ID']>>
  storageBucket_eq?: Maybe<Scalars['ID']>
  storageBucket_in?: Maybe<Array<Scalars['ID']>>
  storageBagId_eq?: Maybe<Scalars['String']>
  storageBagId_contains?: Maybe<Scalars['String']>
  storageBagId_startsWith?: Maybe<Scalars['String']>
  storageBagId_endsWith?: Maybe<Scalars['String']>
  storageBagId_in?: Maybe<Array<Scalars['String']>>
  storageBucketId_eq?: Maybe<Scalars['String']>
  storageBucketId_contains?: Maybe<Scalars['String']>
  storageBucketId_startsWith?: Maybe<Scalars['String']>
  storageBucketId_endsWith?: Maybe<Scalars['String']>
  storageBucketId_in?: Maybe<Array<Scalars['String']>>
  storageBag?: Maybe<StorageBagWhereInput>
  storageBucket?: Maybe<StorageBucketWhereInput>
  AND?: Maybe<Array<StorageBagStorageAssignmentWhereInput>>
  OR?: Maybe<Array<StorageBagStorageAssignmentWhereInput>>
}

export type StorageBagStorageAssignmentWhereUniqueInput = {
  id: Scalars['ID']
}

export type StorageBagUpdateInput = {
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
  owner_json?: Maybe<Scalars['JSONObject']>
  objects_none?: Maybe<StorageDataObjectWhereInput>
  objects_some?: Maybe<StorageDataObjectWhereInput>
  objects_every?: Maybe<StorageDataObjectWhereInput>
  storageAssignments_none?: Maybe<StorageBagStorageAssignmentWhereInput>
  storageAssignments_some?: Maybe<StorageBagStorageAssignmentWhereInput>
  storageAssignments_every?: Maybe<StorageBagStorageAssignmentWhereInput>
  distirbutionAssignments_none?: Maybe<StorageBagDistributionAssignmentWhereInput>
  distirbutionAssignments_some?: Maybe<StorageBagDistributionAssignmentWhereInput>
  distirbutionAssignments_every?: Maybe<StorageBagDistributionAssignmentWhereInput>
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
  operatorMetadata?: Maybe<StorageBucketOperatorMetadata>
  operatorMetadataId?: Maybe<Scalars['String']>
  /** Whether the bucket is accepting any new storage bags */
  acceptingNewBags: Scalars['Boolean']
  bagAssignments: Array<StorageBagStorageAssignment>
  /** Bucket's data object size limit in bytes */
  dataObjectsSizeLimit: Scalars['BigInt']
  /** Bucket's data object count limit */
  dataObjectCountLimit: Scalars['BigInt']
  /** Number of assigned data objects */
  dataObjectsCount: Scalars['BigInt']
  /** Total size of assigned data objects */
  dataObjectsSize: Scalars['BigInt']
}

export type StorageBucketConnection = {
  totalCount: Scalars['Int']
  edges: Array<StorageBucketEdge>
  pageInfo: PageInfo
}

export type StorageBucketCreateInput = {
  operatorStatus: Scalars['JSONObject']
  operatorMetadata?: Maybe<Scalars['ID']>
  acceptingNewBags: Scalars['Boolean']
  dataObjectsSizeLimit: Scalars['BigInt']
  dataObjectCountLimit: Scalars['BigInt']
  dataObjectsCount: Scalars['BigInt']
  dataObjectsSize: Scalars['BigInt']
}

export type StorageBucketEdge = {
  node: StorageBucket
  cursor: Scalars['String']
}

export type StorageBucketOperatorMetadata = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Root node endpoint */
  nodeEndpoint?: Maybe<Scalars['String']>
  nodeLocation?: Maybe<NodeLocationMetadata>
  nodeLocationId?: Maybe<Scalars['String']>
  /** Additional information about the node/operator */
  extra?: Maybe<Scalars['String']>
  storagebucketoperatorMetadata?: Maybe<Array<StorageBucket>>
}

export type StorageBucketOperatorMetadataConnection = {
  totalCount: Scalars['Int']
  edges: Array<StorageBucketOperatorMetadataEdge>
  pageInfo: PageInfo
}

export type StorageBucketOperatorMetadataCreateInput = {
  nodeEndpoint?: Maybe<Scalars['String']>
  nodeLocation?: Maybe<Scalars['ID']>
  extra?: Maybe<Scalars['String']>
}

export type StorageBucketOperatorMetadataEdge = {
  node: StorageBucketOperatorMetadata
  cursor: Scalars['String']
}

export enum StorageBucketOperatorMetadataOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  NodeEndpointAsc = 'nodeEndpoint_ASC',
  NodeEndpointDesc = 'nodeEndpoint_DESC',
  NodeLocationAsc = 'nodeLocation_ASC',
  NodeLocationDesc = 'nodeLocation_DESC',
  ExtraAsc = 'extra_ASC',
  ExtraDesc = 'extra_DESC',
}

export type StorageBucketOperatorMetadataUpdateInput = {
  nodeEndpoint?: Maybe<Scalars['String']>
  nodeLocation?: Maybe<Scalars['ID']>
  extra?: Maybe<Scalars['String']>
}

export type StorageBucketOperatorMetadataWhereInput = {
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
  nodeEndpoint_eq?: Maybe<Scalars['String']>
  nodeEndpoint_contains?: Maybe<Scalars['String']>
  nodeEndpoint_startsWith?: Maybe<Scalars['String']>
  nodeEndpoint_endsWith?: Maybe<Scalars['String']>
  nodeEndpoint_in?: Maybe<Array<Scalars['String']>>
  nodeLocation_eq?: Maybe<Scalars['ID']>
  nodeLocation_in?: Maybe<Array<Scalars['ID']>>
  extra_eq?: Maybe<Scalars['String']>
  extra_contains?: Maybe<Scalars['String']>
  extra_startsWith?: Maybe<Scalars['String']>
  extra_endsWith?: Maybe<Scalars['String']>
  extra_in?: Maybe<Array<Scalars['String']>>
  nodeLocation?: Maybe<NodeLocationMetadataWhereInput>
  storagebucketoperatorMetadata_none?: Maybe<StorageBucketWhereInput>
  storagebucketoperatorMetadata_some?: Maybe<StorageBucketWhereInput>
  storagebucketoperatorMetadata_every?: Maybe<StorageBucketWhereInput>
  AND?: Maybe<Array<StorageBucketOperatorMetadataWhereInput>>
  OR?: Maybe<Array<StorageBucketOperatorMetadataWhereInput>>
}

export type StorageBucketOperatorMetadataWhereUniqueInput = {
  id: Scalars['ID']
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
  DataObjectsCountAsc = 'dataObjectsCount_ASC',
  DataObjectsCountDesc = 'dataObjectsCount_DESC',
  DataObjectsSizeAsc = 'dataObjectsSize_ASC',
  DataObjectsSizeDesc = 'dataObjectsSize_DESC',
}

export type StorageBucketUpdateInput = {
  operatorStatus?: Maybe<Scalars['JSONObject']>
  operatorMetadata?: Maybe<Scalars['ID']>
  acceptingNewBags?: Maybe<Scalars['Boolean']>
  dataObjectsSizeLimit?: Maybe<Scalars['BigInt']>
  dataObjectCountLimit?: Maybe<Scalars['BigInt']>
  dataObjectsCount?: Maybe<Scalars['BigInt']>
  dataObjectsSize?: Maybe<Scalars['BigInt']>
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
  operatorMetadata_eq?: Maybe<Scalars['ID']>
  operatorMetadata_in?: Maybe<Array<Scalars['ID']>>
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
  dataObjectsCount_eq?: Maybe<Scalars['BigInt']>
  dataObjectsCount_gt?: Maybe<Scalars['BigInt']>
  dataObjectsCount_gte?: Maybe<Scalars['BigInt']>
  dataObjectsCount_lt?: Maybe<Scalars['BigInt']>
  dataObjectsCount_lte?: Maybe<Scalars['BigInt']>
  dataObjectsCount_in?: Maybe<Array<Scalars['BigInt']>>
  dataObjectsSize_eq?: Maybe<Scalars['BigInt']>
  dataObjectsSize_gt?: Maybe<Scalars['BigInt']>
  dataObjectsSize_gte?: Maybe<Scalars['BigInt']>
  dataObjectsSize_lt?: Maybe<Scalars['BigInt']>
  dataObjectsSize_lte?: Maybe<Scalars['BigInt']>
  dataObjectsSize_in?: Maybe<Array<Scalars['BigInt']>>
  operatorMetadata?: Maybe<StorageBucketOperatorMetadataWhereInput>
  bagAssignments_none?: Maybe<StorageBagStorageAssignmentWhereInput>
  bagAssignments_some?: Maybe<StorageBagStorageAssignmentWhereInput>
  bagAssignments_every?: Maybe<StorageBagStorageAssignmentWhereInput>
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
}

export type StorageDataObjectUpdateInput = {
  isAccepted?: Maybe<Scalars['Boolean']>
  size?: Maybe<Scalars['BigInt']>
  storageBag?: Maybe<Scalars['ID']>
  ipfsHash?: Maybe<Scalars['String']>
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
  /** How many buckets can be assigned to store a bag */
  storageBucketsPerBagLimit: Scalars['Int']
  /** How many buckets can be assigned to distribute a bag */
  distributionBucketsPerBagLimit: Scalars['Int']
  /** Whether the uploading is globally blocked */
  uploadingBlocked: Scalars['Boolean']
  /** Additional fee for storing 1 MB of data */
  dataObjectFeePerMb: Scalars['BigInt']
  /** Global max. number of objects a storage bucket can store (can also be further limitted the provider) */
  storageBucketMaxObjectsCountLimit: Scalars['BigInt']
  /** Global max. size of objects a storage bucket can store (can also be further limitted the provider) */
  storageBucketMaxObjectsSizeLimit: Scalars['BigInt']
  /** ID of the next data object when created */
  nextDataObjectId: Scalars['BigInt']
}

export type StorageSystemParametersConnection = {
  totalCount: Scalars['Int']
  edges: Array<StorageSystemParametersEdge>
  pageInfo: PageInfo
}

export type StorageSystemParametersCreateInput = {
  blacklist: Array<Scalars['String']>
  storageBucketsPerBagLimit: Scalars['Float']
  distributionBucketsPerBagLimit: Scalars['Float']
  uploadingBlocked: Scalars['Boolean']
  dataObjectFeePerMb: Scalars['BigInt']
  storageBucketMaxObjectsCountLimit: Scalars['BigInt']
  storageBucketMaxObjectsSizeLimit: Scalars['BigInt']
  nextDataObjectId: Scalars['BigInt']
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
  StorageBucketsPerBagLimitAsc = 'storageBucketsPerBagLimit_ASC',
  StorageBucketsPerBagLimitDesc = 'storageBucketsPerBagLimit_DESC',
  DistributionBucketsPerBagLimitAsc = 'distributionBucketsPerBagLimit_ASC',
  DistributionBucketsPerBagLimitDesc = 'distributionBucketsPerBagLimit_DESC',
  UploadingBlockedAsc = 'uploadingBlocked_ASC',
  UploadingBlockedDesc = 'uploadingBlocked_DESC',
  DataObjectFeePerMbAsc = 'dataObjectFeePerMb_ASC',
  DataObjectFeePerMbDesc = 'dataObjectFeePerMb_DESC',
  StorageBucketMaxObjectsCountLimitAsc = 'storageBucketMaxObjectsCountLimit_ASC',
  StorageBucketMaxObjectsCountLimitDesc = 'storageBucketMaxObjectsCountLimit_DESC',
  StorageBucketMaxObjectsSizeLimitAsc = 'storageBucketMaxObjectsSizeLimit_ASC',
  StorageBucketMaxObjectsSizeLimitDesc = 'storageBucketMaxObjectsSizeLimit_DESC',
  NextDataObjectIdAsc = 'nextDataObjectId_ASC',
  NextDataObjectIdDesc = 'nextDataObjectId_DESC',
}

export type StorageSystemParametersUpdateInput = {
  blacklist?: Maybe<Array<Scalars['String']>>
  storageBucketsPerBagLimit?: Maybe<Scalars['Float']>
  distributionBucketsPerBagLimit?: Maybe<Scalars['Float']>
  uploadingBlocked?: Maybe<Scalars['Boolean']>
  dataObjectFeePerMb?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsCountLimit?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsSizeLimit?: Maybe<Scalars['BigInt']>
  nextDataObjectId?: Maybe<Scalars['BigInt']>
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
  storageBucketsPerBagLimit_eq?: Maybe<Scalars['Int']>
  storageBucketsPerBagLimit_gt?: Maybe<Scalars['Int']>
  storageBucketsPerBagLimit_gte?: Maybe<Scalars['Int']>
  storageBucketsPerBagLimit_lt?: Maybe<Scalars['Int']>
  storageBucketsPerBagLimit_lte?: Maybe<Scalars['Int']>
  storageBucketsPerBagLimit_in?: Maybe<Array<Scalars['Int']>>
  distributionBucketsPerBagLimit_eq?: Maybe<Scalars['Int']>
  distributionBucketsPerBagLimit_gt?: Maybe<Scalars['Int']>
  distributionBucketsPerBagLimit_gte?: Maybe<Scalars['Int']>
  distributionBucketsPerBagLimit_lt?: Maybe<Scalars['Int']>
  distributionBucketsPerBagLimit_lte?: Maybe<Scalars['Int']>
  distributionBucketsPerBagLimit_in?: Maybe<Array<Scalars['Int']>>
  uploadingBlocked_eq?: Maybe<Scalars['Boolean']>
  uploadingBlocked_in?: Maybe<Array<Scalars['Boolean']>>
  dataObjectFeePerMb_eq?: Maybe<Scalars['BigInt']>
  dataObjectFeePerMb_gt?: Maybe<Scalars['BigInt']>
  dataObjectFeePerMb_gte?: Maybe<Scalars['BigInt']>
  dataObjectFeePerMb_lt?: Maybe<Scalars['BigInt']>
  dataObjectFeePerMb_lte?: Maybe<Scalars['BigInt']>
  dataObjectFeePerMb_in?: Maybe<Array<Scalars['BigInt']>>
  storageBucketMaxObjectsCountLimit_eq?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsCountLimit_gt?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsCountLimit_gte?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsCountLimit_lt?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsCountLimit_lte?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsCountLimit_in?: Maybe<Array<Scalars['BigInt']>>
  storageBucketMaxObjectsSizeLimit_eq?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsSizeLimit_gt?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsSizeLimit_gte?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsSizeLimit_lt?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsSizeLimit_lte?: Maybe<Scalars['BigInt']>
  storageBucketMaxObjectsSizeLimit_in?: Maybe<Array<Scalars['BigInt']>>
  nextDataObjectId_eq?: Maybe<Scalars['BigInt']>
  nextDataObjectId_gt?: Maybe<Scalars['BigInt']>
  nextDataObjectId_gte?: Maybe<Scalars['BigInt']>
  nextDataObjectId_lt?: Maybe<Scalars['BigInt']>
  nextDataObjectId_lte?: Maybe<Scalars['BigInt']>
  nextDataObjectId_in?: Maybe<Array<Scalars['BigInt']>>
  AND?: Maybe<Array<StorageSystemParametersWhereInput>>
  OR?: Maybe<Array<StorageSystemParametersWhereInput>>
}

export type StorageSystemParametersWhereUniqueInput = {
  id: Scalars['ID']
}

export type Subscription = {
  stateSubscription: ProcessorState
}

export type Video = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  channel: Channel
  channelId: Scalars['String']
  category?: Maybe<VideoCategory>
  categoryId?: Maybe<Scalars['String']>
  /** The title of the video */
  title?: Maybe<Scalars['String']>
  /** The description of the Video */
  description?: Maybe<Scalars['String']>
  /** Video duration in seconds */
  duration?: Maybe<Scalars['Int']>
  /** Video thumbnail asset (recommended ratio: 16:9) */
  thumbnailPhoto: Asset
  language?: Maybe<Language>
  languageId?: Maybe<Scalars['String']>
  /** Whether or not Video contains marketing */
  hasMarketing?: Maybe<Scalars['Boolean']>
  /** If the Video was published on other platform before beeing published on Joystream - the original publication date */
  publishedBeforeJoystream?: Maybe<Scalars['DateTime']>
  /** Whether the Video is supposed to be publically displayed */
  isPublic?: Maybe<Scalars['Boolean']>
  /** Flag signaling whether a video is censored. */
  isCensored: Scalars['Boolean']
  /** Whether the Video contains explicit material. */
  isExplicit?: Maybe<Scalars['Boolean']>
  license?: Maybe<License>
  licenseId?: Maybe<Scalars['String']>
  /** Video media asset */
  media: Asset
  mediaMetadata?: Maybe<VideoMediaMetadata>
  mediaMetadataId?: Maybe<Scalars['String']>
  createdInBlock: Scalars['Int']
  /** Is video featured or not */
  isFeatured: Scalars['Boolean']
}

export type VideoCategoriesByNameFtsOutput = {
  item: VideoCategoriesByNameSearchResult
  rank: Scalars['Float']
  isTypeOf: Scalars['String']
  highlight: Scalars['String']
}

export type VideoCategoriesByNameSearchResult = VideoCategory

export type VideoCategory = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** The name of the category */
  name?: Maybe<Scalars['String']>
  videos: Array<Video>
  createdInBlock: Scalars['Int']
}

export type VideoCategoryConnection = {
  totalCount: Scalars['Int']
  edges: Array<VideoCategoryEdge>
  pageInfo: PageInfo
}

export type VideoCategoryCreateInput = {
  name?: Maybe<Scalars['String']>
  createdInBlock: Scalars['Float']
}

export type VideoCategoryEdge = {
  node: VideoCategory
  cursor: Scalars['String']
}

export enum VideoCategoryOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  CreatedInBlockAsc = 'createdInBlock_ASC',
  CreatedInBlockDesc = 'createdInBlock_DESC',
}

export type VideoCategoryUpdateInput = {
  name?: Maybe<Scalars['String']>
  createdInBlock?: Maybe<Scalars['Float']>
}

export type VideoCategoryWhereInput = {
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
  name_eq?: Maybe<Scalars['String']>
  name_contains?: Maybe<Scalars['String']>
  name_startsWith?: Maybe<Scalars['String']>
  name_endsWith?: Maybe<Scalars['String']>
  name_in?: Maybe<Array<Scalars['String']>>
  createdInBlock_eq?: Maybe<Scalars['Int']>
  createdInBlock_gt?: Maybe<Scalars['Int']>
  createdInBlock_gte?: Maybe<Scalars['Int']>
  createdInBlock_lt?: Maybe<Scalars['Int']>
  createdInBlock_lte?: Maybe<Scalars['Int']>
  createdInBlock_in?: Maybe<Array<Scalars['Int']>>
  videos_none?: Maybe<VideoWhereInput>
  videos_some?: Maybe<VideoWhereInput>
  videos_every?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<VideoCategoryWhereInput>>
  OR?: Maybe<Array<VideoCategoryWhereInput>>
}

export type VideoCategoryWhereUniqueInput = {
  id: Scalars['ID']
}

export type VideoConnection = {
  totalCount: Scalars['Int']
  edges: Array<VideoEdge>
  pageInfo: PageInfo
}

export type VideoCreateInput = {
  channel: Scalars['ID']
  category?: Maybe<Scalars['ID']>
  title?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  duration?: Maybe<Scalars['Float']>
  thumbnailPhoto: Scalars['JSONObject']
  language?: Maybe<Scalars['ID']>
  hasMarketing?: Maybe<Scalars['Boolean']>
  publishedBeforeJoystream?: Maybe<Scalars['DateTime']>
  isPublic?: Maybe<Scalars['Boolean']>
  isCensored: Scalars['Boolean']
  isExplicit?: Maybe<Scalars['Boolean']>
  license?: Maybe<Scalars['ID']>
  media: Scalars['JSONObject']
  mediaMetadata?: Maybe<Scalars['ID']>
  createdInBlock: Scalars['Float']
  isFeatured: Scalars['Boolean']
}

export type VideoEdge = {
  node: Video
  cursor: Scalars['String']
}

export type VideoMediaEncoding = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Encoding of the video media object */
  codecName?: Maybe<Scalars['String']>
  /** Media container format */
  container?: Maybe<Scalars['String']>
  /** Content MIME type */
  mimeMediaType?: Maybe<Scalars['String']>
  videomediametadataencoding?: Maybe<Array<VideoMediaMetadata>>
}

export type VideoMediaEncodingConnection = {
  totalCount: Scalars['Int']
  edges: Array<VideoMediaEncodingEdge>
  pageInfo: PageInfo
}

export type VideoMediaEncodingCreateInput = {
  codecName?: Maybe<Scalars['String']>
  container?: Maybe<Scalars['String']>
  mimeMediaType?: Maybe<Scalars['String']>
}

export type VideoMediaEncodingEdge = {
  node: VideoMediaEncoding
  cursor: Scalars['String']
}

export enum VideoMediaEncodingOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  CodecNameAsc = 'codecName_ASC',
  CodecNameDesc = 'codecName_DESC',
  ContainerAsc = 'container_ASC',
  ContainerDesc = 'container_DESC',
  MimeMediaTypeAsc = 'mimeMediaType_ASC',
  MimeMediaTypeDesc = 'mimeMediaType_DESC',
}

export type VideoMediaEncodingUpdateInput = {
  codecName?: Maybe<Scalars['String']>
  container?: Maybe<Scalars['String']>
  mimeMediaType?: Maybe<Scalars['String']>
}

export type VideoMediaEncodingWhereInput = {
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
  codecName_eq?: Maybe<Scalars['String']>
  codecName_contains?: Maybe<Scalars['String']>
  codecName_startsWith?: Maybe<Scalars['String']>
  codecName_endsWith?: Maybe<Scalars['String']>
  codecName_in?: Maybe<Array<Scalars['String']>>
  container_eq?: Maybe<Scalars['String']>
  container_contains?: Maybe<Scalars['String']>
  container_startsWith?: Maybe<Scalars['String']>
  container_endsWith?: Maybe<Scalars['String']>
  container_in?: Maybe<Array<Scalars['String']>>
  mimeMediaType_eq?: Maybe<Scalars['String']>
  mimeMediaType_contains?: Maybe<Scalars['String']>
  mimeMediaType_startsWith?: Maybe<Scalars['String']>
  mimeMediaType_endsWith?: Maybe<Scalars['String']>
  mimeMediaType_in?: Maybe<Array<Scalars['String']>>
  videomediametadataencoding_none?: Maybe<VideoMediaMetadataWhereInput>
  videomediametadataencoding_some?: Maybe<VideoMediaMetadataWhereInput>
  videomediametadataencoding_every?: Maybe<VideoMediaMetadataWhereInput>
  AND?: Maybe<Array<VideoMediaEncodingWhereInput>>
  OR?: Maybe<Array<VideoMediaEncodingWhereInput>>
}

export type VideoMediaEncodingWhereUniqueInput = {
  id: Scalars['ID']
}

export type VideoMediaMetadata = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  encoding?: Maybe<VideoMediaEncoding>
  encodingId?: Maybe<Scalars['String']>
  /** Video media width in pixels */
  pixelWidth?: Maybe<Scalars['Int']>
  /** Video media height in pixels */
  pixelHeight?: Maybe<Scalars['Int']>
  /** Video media size in bytes */
  size?: Maybe<Scalars['BigInt']>
  video?: Maybe<Video>
  createdInBlock: Scalars['Int']
}

export type VideoMediaMetadataConnection = {
  totalCount: Scalars['Int']
  edges: Array<VideoMediaMetadataEdge>
  pageInfo: PageInfo
}

export type VideoMediaMetadataCreateInput = {
  encoding?: Maybe<Scalars['ID']>
  pixelWidth?: Maybe<Scalars['Float']>
  pixelHeight?: Maybe<Scalars['Float']>
  size?: Maybe<Scalars['BigInt']>
  createdInBlock: Scalars['Float']
}

export type VideoMediaMetadataEdge = {
  node: VideoMediaMetadata
  cursor: Scalars['String']
}

export enum VideoMediaMetadataOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EncodingAsc = 'encoding_ASC',
  EncodingDesc = 'encoding_DESC',
  PixelWidthAsc = 'pixelWidth_ASC',
  PixelWidthDesc = 'pixelWidth_DESC',
  PixelHeightAsc = 'pixelHeight_ASC',
  PixelHeightDesc = 'pixelHeight_DESC',
  SizeAsc = 'size_ASC',
  SizeDesc = 'size_DESC',
  CreatedInBlockAsc = 'createdInBlock_ASC',
  CreatedInBlockDesc = 'createdInBlock_DESC',
}

export type VideoMediaMetadataUpdateInput = {
  encoding?: Maybe<Scalars['ID']>
  pixelWidth?: Maybe<Scalars['Float']>
  pixelHeight?: Maybe<Scalars['Float']>
  size?: Maybe<Scalars['BigInt']>
  createdInBlock?: Maybe<Scalars['Float']>
}

export type VideoMediaMetadataWhereInput = {
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
  encoding_eq?: Maybe<Scalars['ID']>
  encoding_in?: Maybe<Array<Scalars['ID']>>
  pixelWidth_eq?: Maybe<Scalars['Int']>
  pixelWidth_gt?: Maybe<Scalars['Int']>
  pixelWidth_gte?: Maybe<Scalars['Int']>
  pixelWidth_lt?: Maybe<Scalars['Int']>
  pixelWidth_lte?: Maybe<Scalars['Int']>
  pixelWidth_in?: Maybe<Array<Scalars['Int']>>
  pixelHeight_eq?: Maybe<Scalars['Int']>
  pixelHeight_gt?: Maybe<Scalars['Int']>
  pixelHeight_gte?: Maybe<Scalars['Int']>
  pixelHeight_lt?: Maybe<Scalars['Int']>
  pixelHeight_lte?: Maybe<Scalars['Int']>
  pixelHeight_in?: Maybe<Array<Scalars['Int']>>
  size_eq?: Maybe<Scalars['BigInt']>
  size_gt?: Maybe<Scalars['BigInt']>
  size_gte?: Maybe<Scalars['BigInt']>
  size_lt?: Maybe<Scalars['BigInt']>
  size_lte?: Maybe<Scalars['BigInt']>
  size_in?: Maybe<Array<Scalars['BigInt']>>
  createdInBlock_eq?: Maybe<Scalars['Int']>
  createdInBlock_gt?: Maybe<Scalars['Int']>
  createdInBlock_gte?: Maybe<Scalars['Int']>
  createdInBlock_lt?: Maybe<Scalars['Int']>
  createdInBlock_lte?: Maybe<Scalars['Int']>
  createdInBlock_in?: Maybe<Array<Scalars['Int']>>
  encoding?: Maybe<VideoMediaEncodingWhereInput>
  video?: Maybe<VideoWhereInput>
  AND?: Maybe<Array<VideoMediaMetadataWhereInput>>
  OR?: Maybe<Array<VideoMediaMetadataWhereInput>>
}

export type VideoMediaMetadataWhereUniqueInput = {
  id: Scalars['ID']
}

export enum VideoOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  ChannelAsc = 'channel_ASC',
  ChannelDesc = 'channel_DESC',
  CategoryAsc = 'category_ASC',
  CategoryDesc = 'category_DESC',
  TitleAsc = 'title_ASC',
  TitleDesc = 'title_DESC',
  DescriptionAsc = 'description_ASC',
  DescriptionDesc = 'description_DESC',
  DurationAsc = 'duration_ASC',
  DurationDesc = 'duration_DESC',
  LanguageAsc = 'language_ASC',
  LanguageDesc = 'language_DESC',
  HasMarketingAsc = 'hasMarketing_ASC',
  HasMarketingDesc = 'hasMarketing_DESC',
  PublishedBeforeJoystreamAsc = 'publishedBeforeJoystream_ASC',
  PublishedBeforeJoystreamDesc = 'publishedBeforeJoystream_DESC',
  IsPublicAsc = 'isPublic_ASC',
  IsPublicDesc = 'isPublic_DESC',
  IsCensoredAsc = 'isCensored_ASC',
  IsCensoredDesc = 'isCensored_DESC',
  IsExplicitAsc = 'isExplicit_ASC',
  IsExplicitDesc = 'isExplicit_DESC',
  LicenseAsc = 'license_ASC',
  LicenseDesc = 'license_DESC',
  MediaMetadataAsc = 'mediaMetadata_ASC',
  MediaMetadataDesc = 'mediaMetadata_DESC',
  CreatedInBlockAsc = 'createdInBlock_ASC',
  CreatedInBlockDesc = 'createdInBlock_DESC',
  IsFeaturedAsc = 'isFeatured_ASC',
  IsFeaturedDesc = 'isFeatured_DESC',
}

export type VideoUpdateInput = {
  channel?: Maybe<Scalars['ID']>
  category?: Maybe<Scalars['ID']>
  title?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  duration?: Maybe<Scalars['Float']>
  thumbnailPhoto?: Maybe<Scalars['JSONObject']>
  language?: Maybe<Scalars['ID']>
  hasMarketing?: Maybe<Scalars['Boolean']>
  publishedBeforeJoystream?: Maybe<Scalars['DateTime']>
  isPublic?: Maybe<Scalars['Boolean']>
  isCensored?: Maybe<Scalars['Boolean']>
  isExplicit?: Maybe<Scalars['Boolean']>
  license?: Maybe<Scalars['ID']>
  media?: Maybe<Scalars['JSONObject']>
  mediaMetadata?: Maybe<Scalars['ID']>
  createdInBlock?: Maybe<Scalars['Float']>
  isFeatured?: Maybe<Scalars['Boolean']>
}

export type VideoWhereInput = {
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
  channel_eq?: Maybe<Scalars['ID']>
  channel_in?: Maybe<Array<Scalars['ID']>>
  category_eq?: Maybe<Scalars['ID']>
  category_in?: Maybe<Array<Scalars['ID']>>
  title_eq?: Maybe<Scalars['String']>
  title_contains?: Maybe<Scalars['String']>
  title_startsWith?: Maybe<Scalars['String']>
  title_endsWith?: Maybe<Scalars['String']>
  title_in?: Maybe<Array<Scalars['String']>>
  description_eq?: Maybe<Scalars['String']>
  description_contains?: Maybe<Scalars['String']>
  description_startsWith?: Maybe<Scalars['String']>
  description_endsWith?: Maybe<Scalars['String']>
  description_in?: Maybe<Array<Scalars['String']>>
  duration_eq?: Maybe<Scalars['Int']>
  duration_gt?: Maybe<Scalars['Int']>
  duration_gte?: Maybe<Scalars['Int']>
  duration_lt?: Maybe<Scalars['Int']>
  duration_lte?: Maybe<Scalars['Int']>
  duration_in?: Maybe<Array<Scalars['Int']>>
  thumbnailPhoto_json?: Maybe<Scalars['JSONObject']>
  language_eq?: Maybe<Scalars['ID']>
  language_in?: Maybe<Array<Scalars['ID']>>
  hasMarketing_eq?: Maybe<Scalars['Boolean']>
  hasMarketing_in?: Maybe<Array<Scalars['Boolean']>>
  publishedBeforeJoystream_eq?: Maybe<Scalars['DateTime']>
  publishedBeforeJoystream_lt?: Maybe<Scalars['DateTime']>
  publishedBeforeJoystream_lte?: Maybe<Scalars['DateTime']>
  publishedBeforeJoystream_gt?: Maybe<Scalars['DateTime']>
  publishedBeforeJoystream_gte?: Maybe<Scalars['DateTime']>
  isPublic_eq?: Maybe<Scalars['Boolean']>
  isPublic_in?: Maybe<Array<Scalars['Boolean']>>
  isCensored_eq?: Maybe<Scalars['Boolean']>
  isCensored_in?: Maybe<Array<Scalars['Boolean']>>
  isExplicit_eq?: Maybe<Scalars['Boolean']>
  isExplicit_in?: Maybe<Array<Scalars['Boolean']>>
  license_eq?: Maybe<Scalars['ID']>
  license_in?: Maybe<Array<Scalars['ID']>>
  media_json?: Maybe<Scalars['JSONObject']>
  mediaMetadata_eq?: Maybe<Scalars['ID']>
  mediaMetadata_in?: Maybe<Array<Scalars['ID']>>
  createdInBlock_eq?: Maybe<Scalars['Int']>
  createdInBlock_gt?: Maybe<Scalars['Int']>
  createdInBlock_gte?: Maybe<Scalars['Int']>
  createdInBlock_lt?: Maybe<Scalars['Int']>
  createdInBlock_lte?: Maybe<Scalars['Int']>
  createdInBlock_in?: Maybe<Array<Scalars['Int']>>
  isFeatured_eq?: Maybe<Scalars['Boolean']>
  isFeatured_in?: Maybe<Array<Scalars['Boolean']>>
  channel?: Maybe<ChannelWhereInput>
  category?: Maybe<VideoCategoryWhereInput>
  language?: Maybe<LanguageWhereInput>
  license?: Maybe<LicenseWhereInput>
  mediaMetadata?: Maybe<VideoMediaMetadataWhereInput>
  AND?: Maybe<Array<VideoWhereInput>>
  OR?: Maybe<Array<VideoWhereInput>>
}

export type VideoWhereUniqueInput = {
  id: Scalars['ID']
}

export type Worker = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Sign of worker still being active */
  isActive: Scalars['Boolean']
  /** Runtime identifier */
  workerId: Scalars['String']
  /** Associated working group */
  type: WorkerType
  /** Custom metadata set by provider */
  metadata?: Maybe<Scalars['String']>
}

export type WorkerConnection = {
  totalCount: Scalars['Int']
  edges: Array<WorkerEdge>
  pageInfo: PageInfo
}

export type WorkerCreateInput = {
  isActive: Scalars['Boolean']
  workerId: Scalars['String']
  type: WorkerType
  metadata?: Maybe<Scalars['String']>
}

export type WorkerEdge = {
  node: Worker
  cursor: Scalars['String']
}

export enum WorkerOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  IsActiveAsc = 'isActive_ASC',
  IsActiveDesc = 'isActive_DESC',
  WorkerIdAsc = 'workerId_ASC',
  WorkerIdDesc = 'workerId_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  MetadataAsc = 'metadata_ASC',
  MetadataDesc = 'metadata_DESC',
}

export enum WorkerType {
  Gateway = 'GATEWAY',
  Storage = 'STORAGE',
}

export type WorkerUpdateInput = {
  isActive?: Maybe<Scalars['Boolean']>
  workerId?: Maybe<Scalars['String']>
  type?: Maybe<WorkerType>
  metadata?: Maybe<Scalars['String']>
}

export type WorkerWhereInput = {
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
  isActive_eq?: Maybe<Scalars['Boolean']>
  isActive_in?: Maybe<Array<Scalars['Boolean']>>
  workerId_eq?: Maybe<Scalars['String']>
  workerId_contains?: Maybe<Scalars['String']>
  workerId_startsWith?: Maybe<Scalars['String']>
  workerId_endsWith?: Maybe<Scalars['String']>
  workerId_in?: Maybe<Array<Scalars['String']>>
  type_eq?: Maybe<WorkerType>
  type_in?: Maybe<Array<WorkerType>>
  metadata_eq?: Maybe<Scalars['String']>
  metadata_contains?: Maybe<Scalars['String']>
  metadata_startsWith?: Maybe<Scalars['String']>
  metadata_endsWith?: Maybe<Scalars['String']>
  metadata_in?: Maybe<Array<Scalars['String']>>
  AND?: Maybe<Array<WorkerWhereInput>>
  OR?: Maybe<Array<WorkerWhereInput>>
}

export type WorkerWhereUniqueInput = {
  id: Scalars['ID']
}
