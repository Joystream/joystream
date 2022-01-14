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
}

export enum AssetAvailability {
  Accepted = 'ACCEPTED',
  Pending = 'PENDING',
  Invalid = 'INVALID',
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
  /** The title of the Channel */
  title?: Maybe<Scalars['String']>
  /** The description of a Channel */
  description?: Maybe<Scalars['String']>
  coverPhotoDataObject?: Maybe<DataObject>
  coverPhotoDataObjectId?: Maybe<Scalars['String']>
  /** URLs where the asset content can be accessed (if any) */
  coverPhotoUrls: Array<Scalars['String']>
  /** Availability meta information */
  coverPhotoAvailability: AssetAvailability
  avatarPhotoDataObject?: Maybe<DataObject>
  avatarPhotoDataObjectId?: Maybe<Scalars['String']>
  /** URLs where the asset content can be accessed (if any) */
  avatarPhotoUrls: Array<Scalars['String']>
  /** Availability meta information */
  avatarPhotoAvailability: AssetAvailability
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
  ownerMemberId?: Maybe<Scalars['ID']>
  ownerCuratorGroup?: Maybe<Scalars['ID']>
  ownerCuratorGroupId?: Maybe<Scalars['ID']>
  category?: Maybe<Scalars['ID']>
  categoryId?: Maybe<Scalars['ID']>
  rewardAccount?: Maybe<Scalars['String']>
  title?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  coverPhotoDataObject?: Maybe<Scalars['ID']>
  coverPhotoDataObjectId?: Maybe<Scalars['ID']>
  coverPhotoUrls: Array<Scalars['String']>
  coverPhotoAvailability: AssetAvailability
  avatarPhotoDataObject?: Maybe<Scalars['ID']>
  avatarPhotoDataObjectId?: Maybe<Scalars['ID']>
  avatarPhotoUrls: Array<Scalars['String']>
  avatarPhotoAvailability: AssetAvailability
  isPublic?: Maybe<Scalars['Boolean']>
  isCensored: Scalars['Boolean']
  language?: Maybe<Scalars['ID']>
  languageId?: Maybe<Scalars['ID']>
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
  OwnerMemberIdAsc = 'ownerMemberId_ASC',
  OwnerMemberIdDesc = 'ownerMemberId_DESC',
  OwnerCuratorGroupAsc = 'ownerCuratorGroup_ASC',
  OwnerCuratorGroupDesc = 'ownerCuratorGroup_DESC',
  OwnerCuratorGroupIdAsc = 'ownerCuratorGroupId_ASC',
  OwnerCuratorGroupIdDesc = 'ownerCuratorGroupId_DESC',
  CategoryAsc = 'category_ASC',
  CategoryDesc = 'category_DESC',
  CategoryIdAsc = 'categoryId_ASC',
  CategoryIdDesc = 'categoryId_DESC',
  RewardAccountAsc = 'rewardAccount_ASC',
  RewardAccountDesc = 'rewardAccount_DESC',
  TitleAsc = 'title_ASC',
  TitleDesc = 'title_DESC',
  DescriptionAsc = 'description_ASC',
  DescriptionDesc = 'description_DESC',
  CoverPhotoDataObjectAsc = 'coverPhotoDataObject_ASC',
  CoverPhotoDataObjectDesc = 'coverPhotoDataObject_DESC',
  CoverPhotoDataObjectIdAsc = 'coverPhotoDataObjectId_ASC',
  CoverPhotoDataObjectIdDesc = 'coverPhotoDataObjectId_DESC',
  CoverPhotoAvailabilityAsc = 'coverPhotoAvailability_ASC',
  CoverPhotoAvailabilityDesc = 'coverPhotoAvailability_DESC',
  AvatarPhotoDataObjectAsc = 'avatarPhotoDataObject_ASC',
  AvatarPhotoDataObjectDesc = 'avatarPhotoDataObject_DESC',
  AvatarPhotoDataObjectIdAsc = 'avatarPhotoDataObjectId_ASC',
  AvatarPhotoDataObjectIdDesc = 'avatarPhotoDataObjectId_DESC',
  AvatarPhotoAvailabilityAsc = 'avatarPhotoAvailability_ASC',
  AvatarPhotoAvailabilityDesc = 'avatarPhotoAvailability_DESC',
  IsPublicAsc = 'isPublic_ASC',
  IsPublicDesc = 'isPublic_DESC',
  IsCensoredAsc = 'isCensored_ASC',
  IsCensoredDesc = 'isCensored_DESC',
  LanguageAsc = 'language_ASC',
  LanguageDesc = 'language_DESC',
  LanguageIdAsc = 'languageId_ASC',
  LanguageIdDesc = 'languageId_DESC',
  CreatedInBlockAsc = 'createdInBlock_ASC',
  CreatedInBlockDesc = 'createdInBlock_DESC',
}

export type ChannelUpdateInput = {
  ownerMember?: Maybe<Scalars['ID']>
  ownerMemberId?: Maybe<Scalars['ID']>
  ownerCuratorGroup?: Maybe<Scalars['ID']>
  ownerCuratorGroupId?: Maybe<Scalars['ID']>
  category?: Maybe<Scalars['ID']>
  categoryId?: Maybe<Scalars['ID']>
  rewardAccount?: Maybe<Scalars['String']>
  title?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  coverPhotoDataObject?: Maybe<Scalars['ID']>
  coverPhotoDataObjectId?: Maybe<Scalars['ID']>
  coverPhotoUrls?: Maybe<Array<Scalars['String']>>
  coverPhotoAvailability?: Maybe<AssetAvailability>
  avatarPhotoDataObject?: Maybe<Scalars['ID']>
  avatarPhotoDataObjectId?: Maybe<Scalars['ID']>
  avatarPhotoUrls?: Maybe<Array<Scalars['String']>>
  avatarPhotoAvailability?: Maybe<AssetAvailability>
  isPublic?: Maybe<Scalars['Boolean']>
  isCensored?: Maybe<Scalars['Boolean']>
  language?: Maybe<Scalars['ID']>
  languageId?: Maybe<Scalars['ID']>
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
  ownerMemberId_eq?: Maybe<Scalars['ID']>
  ownerMemberId_in?: Maybe<Array<Scalars['ID']>>
  ownerCuratorGroupId_eq?: Maybe<Scalars['ID']>
  ownerCuratorGroupId_in?: Maybe<Array<Scalars['ID']>>
  categoryId_eq?: Maybe<Scalars['ID']>
  categoryId_in?: Maybe<Array<Scalars['ID']>>
  rewardAccount_eq?: Maybe<Scalars['String']>
  rewardAccount_contains?: Maybe<Scalars['String']>
  rewardAccount_startsWith?: Maybe<Scalars['String']>
  rewardAccount_endsWith?: Maybe<Scalars['String']>
  rewardAccount_in?: Maybe<Array<Scalars['String']>>
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
  coverPhotoDataObjectId_eq?: Maybe<Scalars['ID']>
  coverPhotoDataObjectId_in?: Maybe<Array<Scalars['ID']>>
  coverPhotoUrls_containsAll?: Maybe<Array<Scalars['String']>>
  coverPhotoUrls_containsNone?: Maybe<Array<Scalars['String']>>
  coverPhotoUrls_containsAny?: Maybe<Array<Scalars['String']>>
  coverPhotoAvailability_eq?: Maybe<AssetAvailability>
  coverPhotoAvailability_in?: Maybe<Array<AssetAvailability>>
  avatarPhotoDataObjectId_eq?: Maybe<Scalars['ID']>
  avatarPhotoDataObjectId_in?: Maybe<Array<Scalars['ID']>>
  avatarPhotoUrls_containsAll?: Maybe<Array<Scalars['String']>>
  avatarPhotoUrls_containsNone?: Maybe<Array<Scalars['String']>>
  avatarPhotoUrls_containsAny?: Maybe<Array<Scalars['String']>>
  avatarPhotoAvailability_eq?: Maybe<AssetAvailability>
  avatarPhotoAvailability_in?: Maybe<Array<AssetAvailability>>
  isPublic_eq?: Maybe<Scalars['Boolean']>
  isPublic_in?: Maybe<Array<Scalars['Boolean']>>
  isCensored_eq?: Maybe<Scalars['Boolean']>
  isCensored_in?: Maybe<Array<Scalars['Boolean']>>
  languageId_eq?: Maybe<Scalars['ID']>
  languageId_in?: Maybe<Array<Scalars['ID']>>
  createdInBlock_eq?: Maybe<Scalars['Int']>
  createdInBlock_gt?: Maybe<Scalars['Int']>
  createdInBlock_gte?: Maybe<Scalars['Int']>
  createdInBlock_lt?: Maybe<Scalars['Int']>
  createdInBlock_lte?: Maybe<Scalars['Int']>
  createdInBlock_in?: Maybe<Array<Scalars['Int']>>
  ownerMember?: Maybe<MembershipWhereInput>
  ownerCuratorGroup?: Maybe<CuratorGroupWhereInput>
  category?: Maybe<ChannelCategoryWhereInput>
  coverPhotoDataObject?: Maybe<DataObjectWhereInput>
  avatarPhotoDataObject?: Maybe<DataObjectWhereInput>
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
  curatorIds_containsAll?: Maybe<Array<Scalars['Int']>>
  curatorIds_containsNone?: Maybe<Array<Scalars['Int']>>
  curatorIds_containsAny?: Maybe<Array<Scalars['Int']>>
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

/** Manages content ids, type and storage provider decision about it */
export type DataObject = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Content owner */
  owner: DataObjectOwner
  /** Content added at */
  createdInBlock: Scalars['Int']
  /** Content type id */
  typeId: Scalars['Int']
  /** Content size in bytes */
  size: Scalars['Float']
  liaison?: Maybe<Worker>
  liaisonId?: Maybe<Scalars['String']>
  /** Storage provider as liaison judgment */
  liaisonJudgement: LiaisonJudgement
  /** IPFS content id */
  ipfsContentId: Scalars['String']
  /** Joystream runtime content */
  joystreamContentId: Scalars['String']
  channelcoverPhotoDataObject?: Maybe<Array<Channel>>
  channelavatarPhotoDataObject?: Maybe<Array<Channel>>
  videothumbnailPhotoDataObject?: Maybe<Array<Video>>
  videomediaDataObject?: Maybe<Array<Video>>
}

export type DataObjectConnection = {
  totalCount: Scalars['Int']
  edges: Array<DataObjectEdge>
  pageInfo: PageInfo
}

export type DataObjectCreateInput = {
  owner: Scalars['JSONObject']
  createdInBlock: Scalars['Float']
  typeId: Scalars['Float']
  size: Scalars['Float']
  liaison?: Maybe<Scalars['ID']>
  liaisonId?: Maybe<Scalars['ID']>
  liaisonJudgement: LiaisonJudgement
  ipfsContentId: Scalars['String']
  joystreamContentId: Scalars['String']
}

export type DataObjectEdge = {
  node: DataObject
  cursor: Scalars['String']
}

export enum DataObjectOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  CreatedInBlockAsc = 'createdInBlock_ASC',
  CreatedInBlockDesc = 'createdInBlock_DESC',
  TypeIdAsc = 'typeId_ASC',
  TypeIdDesc = 'typeId_DESC',
  SizeAsc = 'size_ASC',
  SizeDesc = 'size_DESC',
  LiaisonAsc = 'liaison_ASC',
  LiaisonDesc = 'liaison_DESC',
  LiaisonIdAsc = 'liaisonId_ASC',
  LiaisonIdDesc = 'liaisonId_DESC',
  LiaisonJudgementAsc = 'liaisonJudgement_ASC',
  LiaisonJudgementDesc = 'liaisonJudgement_DESC',
  IpfsContentIdAsc = 'ipfsContentId_ASC',
  IpfsContentIdDesc = 'ipfsContentId_DESC',
  JoystreamContentIdAsc = 'joystreamContentId_ASC',
  JoystreamContentIdDesc = 'joystreamContentId_DESC',
}

export type DataObjectOwner =
  | DataObjectOwnerMember
  | DataObjectOwnerChannel
  | DataObjectOwnerDao
  | DataObjectOwnerCouncil
  | DataObjectOwnerWorkingGroup

export type DataObjectOwnerChannel = {
  /** Channel identifier */
  channel: Scalars['Int']
  /** Variant needs to have at least one property. This value is not used. */
  dummy?: Maybe<Scalars['Int']>
}

export type DataObjectOwnerChannelCreateInput = {
  channel: Scalars['Float']
  dummy?: Maybe<Scalars['Float']>
}

export type DataObjectOwnerChannelUpdateInput = {
  channel?: Maybe<Scalars['Float']>
  dummy?: Maybe<Scalars['Float']>
}

export type DataObjectOwnerChannelWhereInput = {
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
  channel_eq?: Maybe<Scalars['Int']>
  channel_gt?: Maybe<Scalars['Int']>
  channel_gte?: Maybe<Scalars['Int']>
  channel_lt?: Maybe<Scalars['Int']>
  channel_lte?: Maybe<Scalars['Int']>
  channel_in?: Maybe<Array<Scalars['Int']>>
  dummy_eq?: Maybe<Scalars['Int']>
  dummy_gt?: Maybe<Scalars['Int']>
  dummy_gte?: Maybe<Scalars['Int']>
  dummy_lt?: Maybe<Scalars['Int']>
  dummy_lte?: Maybe<Scalars['Int']>
  dummy_in?: Maybe<Array<Scalars['Int']>>
  AND?: Maybe<Array<DataObjectOwnerChannelWhereInput>>
  OR?: Maybe<Array<DataObjectOwnerChannelWhereInput>>
}

export type DataObjectOwnerChannelWhereUniqueInput = {
  id: Scalars['ID']
}

export type DataObjectOwnerCouncil = {
  /** Variant needs to have at least one property. This value is not used. */
  dummy?: Maybe<Scalars['Int']>
}

export type DataObjectOwnerCouncilCreateInput = {
  dummy?: Maybe<Scalars['Float']>
}

export type DataObjectOwnerCouncilUpdateInput = {
  dummy?: Maybe<Scalars['Float']>
}

export type DataObjectOwnerCouncilWhereInput = {
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
  dummy_eq?: Maybe<Scalars['Int']>
  dummy_gt?: Maybe<Scalars['Int']>
  dummy_gte?: Maybe<Scalars['Int']>
  dummy_lt?: Maybe<Scalars['Int']>
  dummy_lte?: Maybe<Scalars['Int']>
  dummy_in?: Maybe<Array<Scalars['Int']>>
  AND?: Maybe<Array<DataObjectOwnerCouncilWhereInput>>
  OR?: Maybe<Array<DataObjectOwnerCouncilWhereInput>>
}

export type DataObjectOwnerCouncilWhereUniqueInput = {
  id: Scalars['ID']
}

export type DataObjectOwnerDao = {
  /** DAO identifier */
  dao: Scalars['Int']
}

export type DataObjectOwnerDaoCreateInput = {
  dao: Scalars['Float']
}

export type DataObjectOwnerDaoUpdateInput = {
  dao?: Maybe<Scalars['Float']>
}

export type DataObjectOwnerDaoWhereInput = {
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
  dao_eq?: Maybe<Scalars['Int']>
  dao_gt?: Maybe<Scalars['Int']>
  dao_gte?: Maybe<Scalars['Int']>
  dao_lt?: Maybe<Scalars['Int']>
  dao_lte?: Maybe<Scalars['Int']>
  dao_in?: Maybe<Array<Scalars['Int']>>
  AND?: Maybe<Array<DataObjectOwnerDaoWhereInput>>
  OR?: Maybe<Array<DataObjectOwnerDaoWhereInput>>
}

export type DataObjectOwnerDaoWhereUniqueInput = {
  id: Scalars['ID']
}

export type DataObjectOwnerMember = {
  /** Member identifier */
  member: Scalars['Int']
  /** Variant needs to have at least one property. This value is not used. */
  dummy?: Maybe<Scalars['Int']>
}

export type DataObjectOwnerMemberCreateInput = {
  member: Scalars['Float']
  dummy?: Maybe<Scalars['Float']>
}

export type DataObjectOwnerMemberUpdateInput = {
  member?: Maybe<Scalars['Float']>
  dummy?: Maybe<Scalars['Float']>
}

export type DataObjectOwnerMemberWhereInput = {
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
  member_eq?: Maybe<Scalars['Int']>
  member_gt?: Maybe<Scalars['Int']>
  member_gte?: Maybe<Scalars['Int']>
  member_lt?: Maybe<Scalars['Int']>
  member_lte?: Maybe<Scalars['Int']>
  member_in?: Maybe<Array<Scalars['Int']>>
  dummy_eq?: Maybe<Scalars['Int']>
  dummy_gt?: Maybe<Scalars['Int']>
  dummy_gte?: Maybe<Scalars['Int']>
  dummy_lt?: Maybe<Scalars['Int']>
  dummy_lte?: Maybe<Scalars['Int']>
  dummy_in?: Maybe<Array<Scalars['Int']>>
  AND?: Maybe<Array<DataObjectOwnerMemberWhereInput>>
  OR?: Maybe<Array<DataObjectOwnerMemberWhereInput>>
}

export type DataObjectOwnerMemberWhereUniqueInput = {
  id: Scalars['ID']
}

export type DataObjectOwnerWorkingGroup = {
  /** Working group identifier */
  workingGroup: Scalars['Int']
}

export type DataObjectOwnerWorkingGroupCreateInput = {
  workingGroup: Scalars['Float']
}

export type DataObjectOwnerWorkingGroupUpdateInput = {
  workingGroup?: Maybe<Scalars['Float']>
}

export type DataObjectOwnerWorkingGroupWhereInput = {
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
  workingGroup_eq?: Maybe<Scalars['Int']>
  workingGroup_gt?: Maybe<Scalars['Int']>
  workingGroup_gte?: Maybe<Scalars['Int']>
  workingGroup_lt?: Maybe<Scalars['Int']>
  workingGroup_lte?: Maybe<Scalars['Int']>
  workingGroup_in?: Maybe<Array<Scalars['Int']>>
  AND?: Maybe<Array<DataObjectOwnerWorkingGroupWhereInput>>
  OR?: Maybe<Array<DataObjectOwnerWorkingGroupWhereInput>>
}

export type DataObjectOwnerWorkingGroupWhereUniqueInput = {
  id: Scalars['ID']
}

export type DataObjectUpdateInput = {
  owner?: Maybe<Scalars['JSONObject']>
  createdInBlock?: Maybe<Scalars['Float']>
  typeId?: Maybe<Scalars['Float']>
  size?: Maybe<Scalars['Float']>
  liaison?: Maybe<Scalars['ID']>
  liaisonId?: Maybe<Scalars['ID']>
  liaisonJudgement?: Maybe<LiaisonJudgement>
  ipfsContentId?: Maybe<Scalars['String']>
  joystreamContentId?: Maybe<Scalars['String']>
}

export type DataObjectWhereInput = {
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
  createdInBlock_eq?: Maybe<Scalars['Int']>
  createdInBlock_gt?: Maybe<Scalars['Int']>
  createdInBlock_gte?: Maybe<Scalars['Int']>
  createdInBlock_lt?: Maybe<Scalars['Int']>
  createdInBlock_lte?: Maybe<Scalars['Int']>
  createdInBlock_in?: Maybe<Array<Scalars['Int']>>
  typeId_eq?: Maybe<Scalars['Int']>
  typeId_gt?: Maybe<Scalars['Int']>
  typeId_gte?: Maybe<Scalars['Int']>
  typeId_lt?: Maybe<Scalars['Int']>
  typeId_lte?: Maybe<Scalars['Int']>
  typeId_in?: Maybe<Array<Scalars['Int']>>
  size_eq?: Maybe<Scalars['Float']>
  size_gt?: Maybe<Scalars['Float']>
  size_gte?: Maybe<Scalars['Float']>
  size_lt?: Maybe<Scalars['Float']>
  size_lte?: Maybe<Scalars['Float']>
  size_in?: Maybe<Array<Scalars['Float']>>
  liaisonId_eq?: Maybe<Scalars['ID']>
  liaisonId_in?: Maybe<Array<Scalars['ID']>>
  liaisonJudgement_eq?: Maybe<LiaisonJudgement>
  liaisonJudgement_in?: Maybe<Array<LiaisonJudgement>>
  ipfsContentId_eq?: Maybe<Scalars['String']>
  ipfsContentId_contains?: Maybe<Scalars['String']>
  ipfsContentId_startsWith?: Maybe<Scalars['String']>
  ipfsContentId_endsWith?: Maybe<Scalars['String']>
  ipfsContentId_in?: Maybe<Array<Scalars['String']>>
  joystreamContentId_eq?: Maybe<Scalars['String']>
  joystreamContentId_contains?: Maybe<Scalars['String']>
  joystreamContentId_startsWith?: Maybe<Scalars['String']>
  joystreamContentId_endsWith?: Maybe<Scalars['String']>
  joystreamContentId_in?: Maybe<Array<Scalars['String']>>
  liaison?: Maybe<WorkerWhereInput>
  channelcoverPhotoDataObject_none?: Maybe<ChannelWhereInput>
  channelcoverPhotoDataObject_some?: Maybe<ChannelWhereInput>
  channelcoverPhotoDataObject_every?: Maybe<ChannelWhereInput>
  channelavatarPhotoDataObject_none?: Maybe<ChannelWhereInput>
  channelavatarPhotoDataObject_some?: Maybe<ChannelWhereInput>
  channelavatarPhotoDataObject_every?: Maybe<ChannelWhereInput>
  videothumbnailPhotoDataObject_none?: Maybe<VideoMediaMetadataWhereInput>
  videothumbnailPhotoDataObject_some?: Maybe<VideoMediaMetadataWhereInput>
  videothumbnailPhotoDataObject_every?: Maybe<VideoMediaMetadataWhereInput>
  videomediaDataObject_none?: Maybe<VideoMediaMetadataWhereInput>
  videomediaDataObject_some?: Maybe<VideoMediaMetadataWhereInput>
  videomediaDataObject_every?: Maybe<VideoMediaMetadataWhereInput>
  AND?: Maybe<Array<DataObjectWhereInput>>
  OR?: Maybe<Array<DataObjectWhereInput>>
}

export type DataObjectWhereUniqueInput = {
  id: Scalars['ID']
}

export type DeleteResponse = {
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

export enum LiaisonJudgement {
  Pending = 'PENDING',
  Accepted = 'ACCEPTED',
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
  videolanguage_none?: Maybe<VideoWhereInput>
  videolanguage_some?: Maybe<VideoWhereInput>
  videolanguage_every?: Maybe<VideoWhereInput>
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

export type NextEntityId = BaseGraphQlObject & {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Next deterministic id for entities without custom id */
  nextId: Scalars['Float']
}

export type NextEntityIdConnection = {
  totalCount: Scalars['Int']
  edges: Array<NextEntityIdEdge>
  pageInfo: PageInfo
}

export type NextEntityIdCreateInput = {
  nextId: Scalars['Float']
}

export type NextEntityIdEdge = {
  node: NextEntityId
  cursor: Scalars['String']
}

export enum NextEntityIdOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  NextIdAsc = 'nextId_ASC',
  NextIdDesc = 'nextId_DESC',
}

export type NextEntityIdUpdateInput = {
  nextId?: Maybe<Scalars['Float']>
}

export type NextEntityIdWhereInput = {
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
  nextId_eq?: Maybe<Scalars['Float']>
  nextId_gt?: Maybe<Scalars['Float']>
  nextId_gte?: Maybe<Scalars['Float']>
  nextId_lt?: Maybe<Scalars['Float']>
  nextId_lte?: Maybe<Scalars['Float']>
  nextId_in?: Maybe<Array<Scalars['Float']>>
  AND?: Maybe<Array<NextEntityIdWhereInput>>
  OR?: Maybe<Array<NextEntityIdWhereInput>>
}

export type NextEntityIdWhereUniqueInput = {
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
  dataObjects: Array<DataObject>
  dataObjectByUniqueInput?: Maybe<DataObject>
  dataObjectsConnection: DataObjectConnection
  languages: Array<Language>
  languageByUniqueInput?: Maybe<Language>
  languagesConnection: LanguageConnection
  licenses: Array<License>
  licenseByUniqueInput?: Maybe<License>
  licensesConnection: LicenseConnection
  memberships: Array<Membership>
  membershipByUniqueInput?: Maybe<Membership>
  membershipsConnection: MembershipConnection
  nextEntityIds: Array<NextEntityId>
  nextEntityIdByUniqueInput?: Maybe<NextEntityId>
  nextEntityIdsConnection: NextEntityIdConnection
  channelCategoriesByName: Array<ChannelCategoriesByNameFtsOutput>
  membersByHandle: Array<MembersByHandleFtsOutput>
  search: Array<SearchFtsOutput>
  videoCategoriesByName: Array<VideoCategoriesByNameFtsOutput>
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

export type QueryDataObjectsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<DataObjectWhereInput>
  orderBy?: Maybe<Array<DataObjectOrderByInput>>
}

export type QueryDataObjectByUniqueInputArgs = {
  where: DataObjectWhereUniqueInput
}

export type QueryDataObjectsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<DataObjectWhereInput>
  orderBy?: Maybe<Array<DataObjectOrderByInput>>
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

export type QueryNextEntityIdsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<NextEntityIdWhereInput>
  orderBy?: Maybe<Array<NextEntityIdOrderByInput>>
}

export type QueryNextEntityIdByUniqueInputArgs = {
  where: NextEntityIdWhereUniqueInput
}

export type QueryNextEntityIdsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<NextEntityIdWhereInput>
  orderBy?: Maybe<Array<NextEntityIdOrderByInput>>
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
  channel?: Maybe<Channel>
  channelId?: Maybe<Scalars['String']>
  category?: Maybe<VideoCategory>
  categoryId?: Maybe<Scalars['String']>
  /** The title of the video */
  title?: Maybe<Scalars['String']>
  /** The description of the Video */
  description?: Maybe<Scalars['String']>
  /** Video duration in seconds */
  duration?: Maybe<Scalars['Int']>
  thumbnailPhotoDataObject?: Maybe<DataObject>
  thumbnailPhotoDataObjectId?: Maybe<Scalars['String']>
  /** URLs where the asset content can be accessed (if any) */
  thumbnailPhotoUrls: Array<Scalars['String']>
  /** Availability meta information */
  thumbnailPhotoAvailability: AssetAvailability
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
  mediaDataObject?: Maybe<DataObject>
  mediaDataObjectId?: Maybe<Scalars['String']>
  /** URLs where the asset content can be accessed (if any) */
  mediaUrls: Array<Scalars['String']>
  /** Availability meta information */
  mediaAvailability: AssetAvailability
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
  channel?: Maybe<Scalars['ID']>
  channelId?: Maybe<Scalars['ID']>
  category?: Maybe<Scalars['ID']>
  categoryId?: Maybe<Scalars['ID']>
  title?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  duration?: Maybe<Scalars['Float']>
  thumbnailPhotoDataObject?: Maybe<Scalars['ID']>
  thumbnailPhotoDataObjectId?: Maybe<Scalars['ID']>
  thumbnailPhotoUrls: Array<Scalars['String']>
  thumbnailPhotoAvailability: AssetAvailability
  language?: Maybe<Scalars['ID']>
  languageId?: Maybe<Scalars['ID']>
  hasMarketing?: Maybe<Scalars['Boolean']>
  publishedBeforeJoystream?: Maybe<Scalars['DateTime']>
  isPublic?: Maybe<Scalars['Boolean']>
  isCensored: Scalars['Boolean']
  isExplicit?: Maybe<Scalars['Boolean']>
  license?: Maybe<Scalars['ID']>
  licenseId?: Maybe<Scalars['ID']>
  mediaDataObject?: Maybe<Scalars['ID']>
  mediaDataObjectId?: Maybe<Scalars['ID']>
  mediaUrls: Array<Scalars['String']>
  mediaAvailability: AssetAvailability
  mediaMetadata?: Maybe<Scalars['ID']>
  mediaMetadataId?: Maybe<Scalars['ID']>
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
  size?: Maybe<Scalars['Float']>
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
  encodingId?: Maybe<Scalars['ID']>
  pixelWidth?: Maybe<Scalars['Float']>
  pixelHeight?: Maybe<Scalars['Float']>
  size?: Maybe<Scalars['Float']>
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
  EncodingIdAsc = 'encodingId_ASC',
  EncodingIdDesc = 'encodingId_DESC',
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
  encodingId?: Maybe<Scalars['ID']>
  pixelWidth?: Maybe<Scalars['Float']>
  pixelHeight?: Maybe<Scalars['Float']>
  size?: Maybe<Scalars['Float']>
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
  encodingId_eq?: Maybe<Scalars['ID']>
  encodingId_in?: Maybe<Array<Scalars['ID']>>
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
  size_eq?: Maybe<Scalars['Float']>
  size_gt?: Maybe<Scalars['Float']>
  size_gte?: Maybe<Scalars['Float']>
  size_lt?: Maybe<Scalars['Float']>
  size_lte?: Maybe<Scalars['Float']>
  size_in?: Maybe<Array<Scalars['Float']>>
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
  ChannelIdAsc = 'channelId_ASC',
  ChannelIdDesc = 'channelId_DESC',
  CategoryAsc = 'category_ASC',
  CategoryDesc = 'category_DESC',
  CategoryIdAsc = 'categoryId_ASC',
  CategoryIdDesc = 'categoryId_DESC',
  TitleAsc = 'title_ASC',
  TitleDesc = 'title_DESC',
  DescriptionAsc = 'description_ASC',
  DescriptionDesc = 'description_DESC',
  DurationAsc = 'duration_ASC',
  DurationDesc = 'duration_DESC',
  ThumbnailPhotoDataObjectAsc = 'thumbnailPhotoDataObject_ASC',
  ThumbnailPhotoDataObjectDesc = 'thumbnailPhotoDataObject_DESC',
  ThumbnailPhotoDataObjectIdAsc = 'thumbnailPhotoDataObjectId_ASC',
  ThumbnailPhotoDataObjectIdDesc = 'thumbnailPhotoDataObjectId_DESC',
  ThumbnailPhotoAvailabilityAsc = 'thumbnailPhotoAvailability_ASC',
  ThumbnailPhotoAvailabilityDesc = 'thumbnailPhotoAvailability_DESC',
  LanguageAsc = 'language_ASC',
  LanguageDesc = 'language_DESC',
  LanguageIdAsc = 'languageId_ASC',
  LanguageIdDesc = 'languageId_DESC',
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
  LicenseIdAsc = 'licenseId_ASC',
  LicenseIdDesc = 'licenseId_DESC',
  MediaDataObjectAsc = 'mediaDataObject_ASC',
  MediaDataObjectDesc = 'mediaDataObject_DESC',
  MediaDataObjectIdAsc = 'mediaDataObjectId_ASC',
  MediaDataObjectIdDesc = 'mediaDataObjectId_DESC',
  MediaAvailabilityAsc = 'mediaAvailability_ASC',
  MediaAvailabilityDesc = 'mediaAvailability_DESC',
  MediaMetadataAsc = 'mediaMetadata_ASC',
  MediaMetadataDesc = 'mediaMetadata_DESC',
  MediaMetadataIdAsc = 'mediaMetadataId_ASC',
  MediaMetadataIdDesc = 'mediaMetadataId_DESC',
  CreatedInBlockAsc = 'createdInBlock_ASC',
  CreatedInBlockDesc = 'createdInBlock_DESC',
  IsFeaturedAsc = 'isFeatured_ASC',
  IsFeaturedDesc = 'isFeatured_DESC',
}

export type VideoUpdateInput = {
  channel?: Maybe<Scalars['ID']>
  channelId?: Maybe<Scalars['ID']>
  category?: Maybe<Scalars['ID']>
  categoryId?: Maybe<Scalars['ID']>
  title?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  duration?: Maybe<Scalars['Float']>
  thumbnailPhotoDataObject?: Maybe<Scalars['ID']>
  thumbnailPhotoDataObjectId?: Maybe<Scalars['ID']>
  thumbnailPhotoUrls?: Maybe<Array<Scalars['String']>>
  thumbnailPhotoAvailability?: Maybe<AssetAvailability>
  language?: Maybe<Scalars['ID']>
  languageId?: Maybe<Scalars['ID']>
  hasMarketing?: Maybe<Scalars['Boolean']>
  publishedBeforeJoystream?: Maybe<Scalars['DateTime']>
  isPublic?: Maybe<Scalars['Boolean']>
  isCensored?: Maybe<Scalars['Boolean']>
  isExplicit?: Maybe<Scalars['Boolean']>
  license?: Maybe<Scalars['ID']>
  licenseId?: Maybe<Scalars['ID']>
  mediaDataObject?: Maybe<Scalars['ID']>
  mediaDataObjectId?: Maybe<Scalars['ID']>
  mediaUrls?: Maybe<Array<Scalars['String']>>
  mediaAvailability?: Maybe<AssetAvailability>
  mediaMetadata?: Maybe<Scalars['ID']>
  mediaMetadataId?: Maybe<Scalars['ID']>
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
  channelId_eq?: Maybe<Scalars['ID']>
  channelId_in?: Maybe<Array<Scalars['ID']>>
  categoryId_eq?: Maybe<Scalars['ID']>
  categoryId_in?: Maybe<Array<Scalars['ID']>>
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
  thumbnailPhotoDataObjectId_eq?: Maybe<Scalars['ID']>
  thumbnailPhotoDataObjectId_in?: Maybe<Array<Scalars['ID']>>
  thumbnailPhotoUrls_containsAll?: Maybe<Array<Scalars['String']>>
  thumbnailPhotoUrls_containsNone?: Maybe<Array<Scalars['String']>>
  thumbnailPhotoUrls_containsAny?: Maybe<Array<Scalars['String']>>
  thumbnailPhotoAvailability_eq?: Maybe<AssetAvailability>
  thumbnailPhotoAvailability_in?: Maybe<Array<AssetAvailability>>
  languageId_eq?: Maybe<Scalars['ID']>
  languageId_in?: Maybe<Array<Scalars['ID']>>
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
  licenseId_eq?: Maybe<Scalars['ID']>
  licenseId_in?: Maybe<Array<Scalars['ID']>>
  mediaDataObjectId_eq?: Maybe<Scalars['ID']>
  mediaDataObjectId_in?: Maybe<Array<Scalars['ID']>>
  mediaUrls_containsAll?: Maybe<Array<Scalars['String']>>
  mediaUrls_containsNone?: Maybe<Array<Scalars['String']>>
  mediaUrls_containsAny?: Maybe<Array<Scalars['String']>>
  mediaAvailability_eq?: Maybe<AssetAvailability>
  mediaAvailability_in?: Maybe<Array<AssetAvailability>>
  mediaMetadataId_eq?: Maybe<Scalars['ID']>
  mediaMetadataId_in?: Maybe<Array<Scalars['ID']>>
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
  thumbnailPhotoDataObject?: Maybe<DataObjectWhereInput>
  language?: Maybe<LanguageWhereInput>
  license?: Maybe<LicenseWhereInput>
  mediaDataObject?: Maybe<DataObjectWhereInput>
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
  dataObjects: Array<DataObject>
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
  dataObjects_none?: Maybe<DataObjectWhereInput>
  dataObjects_some?: Maybe<DataObjectWhereInput>
  dataObjects_every?: Maybe<DataObjectWhereInput>
  AND?: Maybe<Array<WorkerWhereInput>>
  OR?: Maybe<Array<WorkerWhereInput>>
}

export type WorkerWhereUniqueInput = {
  id: Scalars['ID']
}
