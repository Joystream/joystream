export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The javascript `Date` as string. Type represents date and time as the ISO Date string. */
  DateTime: any;
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: any;
  /** GraphQL representation of BigInt */
  BigInt: any;
};

export type BaseGraphQlObject = {
  id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  createdById: Scalars['String'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  updatedById?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['DateTime']>;
  deletedById?: Maybe<Scalars['String']>;
  version: Scalars['Int'];
};

export type BaseModel = BaseGraphQlObject & {
  id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  createdById: Scalars['String'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  updatedById?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['DateTime']>;
  deletedById?: Maybe<Scalars['String']>;
  version: Scalars['Int'];
};

export type BaseModelUuid = BaseGraphQlObject & {
  id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  createdById: Scalars['String'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  updatedById?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['DateTime']>;
  deletedById?: Maybe<Scalars['String']>;
  version: Scalars['Int'];
};

export type BaseWhereInput = {
  id_eq?: Maybe<Scalars['String']>;
  id_in?: Maybe<Array<Scalars['String']>>;
  createdAt_eq?: Maybe<Scalars['String']>;
  createdAt_lt?: Maybe<Scalars['String']>;
  createdAt_lte?: Maybe<Scalars['String']>;
  createdAt_gt?: Maybe<Scalars['String']>;
  createdAt_gte?: Maybe<Scalars['String']>;
  createdById_eq?: Maybe<Scalars['String']>;
  updatedAt_eq?: Maybe<Scalars['String']>;
  updatedAt_lt?: Maybe<Scalars['String']>;
  updatedAt_lte?: Maybe<Scalars['String']>;
  updatedAt_gt?: Maybe<Scalars['String']>;
  updatedAt_gte?: Maybe<Scalars['String']>;
  updatedById_eq?: Maybe<Scalars['String']>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['String']>;
  deletedAt_lt?: Maybe<Scalars['String']>;
  deletedAt_lte?: Maybe<Scalars['String']>;
  deletedAt_gt?: Maybe<Scalars['String']>;
  deletedAt_gte?: Maybe<Scalars['String']>;
  deletedById_eq?: Maybe<Scalars['String']>;
};



export type DeleteResponse = {
  id: Scalars['ID'];
};

export type DistributionBucket = BaseGraphQlObject & {
  id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  createdById: Scalars['String'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  updatedById?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['DateTime']>;
  deletedById?: Maybe<Scalars['String']>;
  version: Scalars['Int'];
  family: DistributionBucketFamily;
  familyId: Scalars['String'];
  operators: Array<DistributionBucketOperator>;
  /** Whether the bucket is accepting any new bags */
  acceptingNewBags: Scalars['Boolean'];
  /** Whether the bucket is currently distributing content */
  distributing: Scalars['Boolean'];
  distributedBags: Array<StorageBag>;
};

export type DistributionBucketConnection = {
  totalCount: Scalars['Int'];
  edges: Array<DistributionBucketEdge>;
  pageInfo: PageInfo;
};

export type DistributionBucketCreateInput = {
  family: Scalars['ID'];
  acceptingNewBags: Scalars['Boolean'];
  distributing: Scalars['Boolean'];
};

export type DistributionBucketEdge = {
  node: DistributionBucket;
  cursor: Scalars['String'];
};

export type DistributionBucketFamily = BaseGraphQlObject & {
  id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  createdById: Scalars['String'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  updatedById?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['DateTime']>;
  deletedById?: Maybe<Scalars['String']>;
  version: Scalars['Int'];
  metadata?: Maybe<DistributionBucketFamilyMetadata>;
  metadataId?: Maybe<Scalars['String']>;
  buckets: Array<DistributionBucket>;
};

export type DistributionBucketFamilyConnection = {
  totalCount: Scalars['Int'];
  edges: Array<DistributionBucketFamilyEdge>;
  pageInfo: PageInfo;
};

export type DistributionBucketFamilyCreateInput = {
  metadata?: Maybe<Scalars['ID']>;
};

export type DistributionBucketFamilyEdge = {
  node: DistributionBucketFamily;
  cursor: Scalars['String'];
};

export type DistributionBucketFamilyMetadata = BaseGraphQlObject & {
  id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  createdById: Scalars['String'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  updatedById?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['DateTime']>;
  deletedById?: Maybe<Scalars['String']>;
  version: Scalars['Int'];
  /** Name of the geographical region covered by the family (ie.: us-east-1) */
  region?: Maybe<Scalars['String']>;
  /** Optional, more specific description of the region covered by the family */
  description?: Maybe<Scalars['String']>;
  boundary: Array<GeoCoordinates>;
  distributionbucketfamilymetadata?: Maybe<Array<DistributionBucketFamily>>;
};

export type DistributionBucketFamilyMetadataConnection = {
  totalCount: Scalars['Int'];
  edges: Array<DistributionBucketFamilyMetadataEdge>;
  pageInfo: PageInfo;
};

export type DistributionBucketFamilyMetadataCreateInput = {
  region?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
};

export type DistributionBucketFamilyMetadataEdge = {
  node: DistributionBucketFamilyMetadata;
  cursor: Scalars['String'];
};

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
  DescriptionDesc = 'description_DESC'
}

export type DistributionBucketFamilyMetadataUpdateInput = {
  region?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
};

export type DistributionBucketFamilyMetadataWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  region_eq?: Maybe<Scalars['String']>;
  region_contains?: Maybe<Scalars['String']>;
  region_startsWith?: Maybe<Scalars['String']>;
  region_endsWith?: Maybe<Scalars['String']>;
  region_in?: Maybe<Array<Scalars['String']>>;
  description_eq?: Maybe<Scalars['String']>;
  description_contains?: Maybe<Scalars['String']>;
  description_startsWith?: Maybe<Scalars['String']>;
  description_endsWith?: Maybe<Scalars['String']>;
  description_in?: Maybe<Array<Scalars['String']>>;
  boundary_none?: Maybe<GeoCoordinatesWhereInput>;
  boundary_some?: Maybe<GeoCoordinatesWhereInput>;
  boundary_every?: Maybe<GeoCoordinatesWhereInput>;
  distributionbucketfamilymetadata_none?: Maybe<DistributionBucketFamilyWhereInput>;
  distributionbucketfamilymetadata_some?: Maybe<DistributionBucketFamilyWhereInput>;
  distributionbucketfamilymetadata_every?: Maybe<DistributionBucketFamilyWhereInput>;
  AND?: Maybe<Array<DistributionBucketFamilyMetadataWhereInput>>;
  OR?: Maybe<Array<DistributionBucketFamilyMetadataWhereInput>>;
};

export type DistributionBucketFamilyMetadataWhereUniqueInput = {
  id: Scalars['ID'];
};

export enum DistributionBucketFamilyOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  MetadataAsc = 'metadata_ASC',
  MetadataDesc = 'metadata_DESC'
}

export type DistributionBucketFamilyUpdateInput = {
  metadata?: Maybe<Scalars['ID']>;
};

export type DistributionBucketFamilyWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  metadata_eq?: Maybe<Scalars['ID']>;
  metadata_in?: Maybe<Array<Scalars['ID']>>;
  metadata?: Maybe<DistributionBucketFamilyMetadataWhereInput>;
  buckets_none?: Maybe<DistributionBucketWhereInput>;
  buckets_some?: Maybe<DistributionBucketWhereInput>;
  buckets_every?: Maybe<DistributionBucketWhereInput>;
  AND?: Maybe<Array<DistributionBucketFamilyWhereInput>>;
  OR?: Maybe<Array<DistributionBucketFamilyWhereInput>>;
};

export type DistributionBucketFamilyWhereUniqueInput = {
  id: Scalars['ID'];
};

export type DistributionBucketOperator = BaseGraphQlObject & {
  id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  createdById: Scalars['String'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  updatedById?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['DateTime']>;
  deletedById?: Maybe<Scalars['String']>;
  version: Scalars['Int'];
  distributionBucket: DistributionBucket;
  distributionBucketId: Scalars['String'];
  /** ID of the distribution group worker */
  workerId: Scalars['Int'];
  /** Current operator status */
  status: DistributionBucketOperatorStatus;
  metadata?: Maybe<DistributionBucketOperatorMetadata>;
  metadataId?: Maybe<Scalars['String']>;
};

export type DistributionBucketOperatorConnection = {
  totalCount: Scalars['Int'];
  edges: Array<DistributionBucketOperatorEdge>;
  pageInfo: PageInfo;
};

export type DistributionBucketOperatorCreateInput = {
  distributionBucket: Scalars['ID'];
  workerId: Scalars['Float'];
  status: DistributionBucketOperatorStatus;
  metadata?: Maybe<Scalars['ID']>;
};

export type DistributionBucketOperatorEdge = {
  node: DistributionBucketOperator;
  cursor: Scalars['String'];
};

export type DistributionBucketOperatorMetadata = BaseGraphQlObject & {
  id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  createdById: Scalars['String'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  updatedById?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['DateTime']>;
  deletedById?: Maybe<Scalars['String']>;
  version: Scalars['Int'];
  /** Root distributor node api endpoint */
  nodeEndpoint?: Maybe<Scalars['String']>;
  nodeLocation?: Maybe<NodeLocationMetadata>;
  nodeLocationId?: Maybe<Scalars['String']>;
  /** Additional information about the node/operator */
  extra?: Maybe<Scalars['String']>;
  distributionbucketoperatormetadata?: Maybe<Array<DistributionBucketOperator>>;
};

export type DistributionBucketOperatorMetadataConnection = {
  totalCount: Scalars['Int'];
  edges: Array<DistributionBucketOperatorMetadataEdge>;
  pageInfo: PageInfo;
};

export type DistributionBucketOperatorMetadataCreateInput = {
  nodeEndpoint?: Maybe<Scalars['String']>;
  nodeLocation?: Maybe<Scalars['ID']>;
  extra?: Maybe<Scalars['String']>;
};

export type DistributionBucketOperatorMetadataEdge = {
  node: DistributionBucketOperatorMetadata;
  cursor: Scalars['String'];
};

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
  ExtraDesc = 'extra_DESC'
}

export type DistributionBucketOperatorMetadataUpdateInput = {
  nodeEndpoint?: Maybe<Scalars['String']>;
  nodeLocation?: Maybe<Scalars['ID']>;
  extra?: Maybe<Scalars['String']>;
};

export type DistributionBucketOperatorMetadataWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  nodeEndpoint_eq?: Maybe<Scalars['String']>;
  nodeEndpoint_contains?: Maybe<Scalars['String']>;
  nodeEndpoint_startsWith?: Maybe<Scalars['String']>;
  nodeEndpoint_endsWith?: Maybe<Scalars['String']>;
  nodeEndpoint_in?: Maybe<Array<Scalars['String']>>;
  nodeLocation_eq?: Maybe<Scalars['ID']>;
  nodeLocation_in?: Maybe<Array<Scalars['ID']>>;
  extra_eq?: Maybe<Scalars['String']>;
  extra_contains?: Maybe<Scalars['String']>;
  extra_startsWith?: Maybe<Scalars['String']>;
  extra_endsWith?: Maybe<Scalars['String']>;
  extra_in?: Maybe<Array<Scalars['String']>>;
  nodeLocation?: Maybe<NodeLocationMetadataWhereInput>;
  distributionbucketoperatormetadata_none?: Maybe<DistributionBucketOperatorWhereInput>;
  distributionbucketoperatormetadata_some?: Maybe<DistributionBucketOperatorWhereInput>;
  distributionbucketoperatormetadata_every?: Maybe<DistributionBucketOperatorWhereInput>;
  AND?: Maybe<Array<DistributionBucketOperatorMetadataWhereInput>>;
  OR?: Maybe<Array<DistributionBucketOperatorMetadataWhereInput>>;
};

export type DistributionBucketOperatorMetadataWhereUniqueInput = {
  id: Scalars['ID'];
};

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
  MetadataDesc = 'metadata_DESC'
}

export enum DistributionBucketOperatorStatus {
  Invited = 'INVITED',
  Active = 'ACTIVE'
}

export type DistributionBucketOperatorUpdateInput = {
  distributionBucket?: Maybe<Scalars['ID']>;
  workerId?: Maybe<Scalars['Float']>;
  status?: Maybe<DistributionBucketOperatorStatus>;
  metadata?: Maybe<Scalars['ID']>;
};

export type DistributionBucketOperatorWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  distributionBucket_eq?: Maybe<Scalars['ID']>;
  distributionBucket_in?: Maybe<Array<Scalars['ID']>>;
  workerId_eq?: Maybe<Scalars['Int']>;
  workerId_gt?: Maybe<Scalars['Int']>;
  workerId_gte?: Maybe<Scalars['Int']>;
  workerId_lt?: Maybe<Scalars['Int']>;
  workerId_lte?: Maybe<Scalars['Int']>;
  workerId_in?: Maybe<Array<Scalars['Int']>>;
  status_eq?: Maybe<DistributionBucketOperatorStatus>;
  status_in?: Maybe<Array<DistributionBucketOperatorStatus>>;
  metadata_eq?: Maybe<Scalars['ID']>;
  metadata_in?: Maybe<Array<Scalars['ID']>>;
  distributionBucket?: Maybe<DistributionBucketWhereInput>;
  metadata?: Maybe<DistributionBucketOperatorMetadataWhereInput>;
  AND?: Maybe<Array<DistributionBucketOperatorWhereInput>>;
  OR?: Maybe<Array<DistributionBucketOperatorWhereInput>>;
};

export type DistributionBucketOperatorWhereUniqueInput = {
  id: Scalars['ID'];
};

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
  DistributingDesc = 'distributing_DESC'
}

export type DistributionBucketUpdateInput = {
  family?: Maybe<Scalars['ID']>;
  acceptingNewBags?: Maybe<Scalars['Boolean']>;
  distributing?: Maybe<Scalars['Boolean']>;
};

export type DistributionBucketWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  family_eq?: Maybe<Scalars['ID']>;
  family_in?: Maybe<Array<Scalars['ID']>>;
  acceptingNewBags_eq?: Maybe<Scalars['Boolean']>;
  acceptingNewBags_in?: Maybe<Array<Scalars['Boolean']>>;
  distributing_eq?: Maybe<Scalars['Boolean']>;
  distributing_in?: Maybe<Array<Scalars['Boolean']>>;
  family?: Maybe<DistributionBucketFamilyWhereInput>;
  operators_none?: Maybe<DistributionBucketOperatorWhereInput>;
  operators_some?: Maybe<DistributionBucketOperatorWhereInput>;
  operators_every?: Maybe<DistributionBucketOperatorWhereInput>;
  distributedBags_none?: Maybe<StorageBagWhereInput>;
  distributedBags_some?: Maybe<StorageBagWhereInput>;
  distributedBags_every?: Maybe<StorageBagWhereInput>;
  AND?: Maybe<Array<DistributionBucketWhereInput>>;
  OR?: Maybe<Array<DistributionBucketWhereInput>>;
};

export type DistributionBucketWhereUniqueInput = {
  id: Scalars['ID'];
};

export type GeoCoordinates = BaseGraphQlObject & {
  id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  createdById: Scalars['String'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  updatedById?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['DateTime']>;
  deletedById?: Maybe<Scalars['String']>;
  version: Scalars['Int'];
  latitude: Scalars['Float'];
  longitude: Scalars['Float'];
  boundarySourceBucketFamilyMeta?: Maybe<DistributionBucketFamilyMetadata>;
  boundarySourceBucketFamilyMetaId?: Maybe<Scalars['String']>;
  nodelocationmetadatacoordinates?: Maybe<Array<NodeLocationMetadata>>;
};

export type GeoCoordinatesConnection = {
  totalCount: Scalars['Int'];
  edges: Array<GeoCoordinatesEdge>;
  pageInfo: PageInfo;
};

export type GeoCoordinatesCreateInput = {
  latitude: Scalars['Float'];
  longitude: Scalars['Float'];
  boundarySourceBucketFamilyMeta?: Maybe<Scalars['ID']>;
};

export type GeoCoordinatesEdge = {
  node: GeoCoordinates;
  cursor: Scalars['String'];
};

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
  BoundarySourceBucketFamilyMetaDesc = 'boundarySourceBucketFamilyMeta_DESC'
}

export type GeoCoordinatesUpdateInput = {
  latitude?: Maybe<Scalars['Float']>;
  longitude?: Maybe<Scalars['Float']>;
  boundarySourceBucketFamilyMeta?: Maybe<Scalars['ID']>;
};

export type GeoCoordinatesWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  latitude_eq?: Maybe<Scalars['Float']>;
  latitude_gt?: Maybe<Scalars['Float']>;
  latitude_gte?: Maybe<Scalars['Float']>;
  latitude_lt?: Maybe<Scalars['Float']>;
  latitude_lte?: Maybe<Scalars['Float']>;
  latitude_in?: Maybe<Array<Scalars['Float']>>;
  longitude_eq?: Maybe<Scalars['Float']>;
  longitude_gt?: Maybe<Scalars['Float']>;
  longitude_gte?: Maybe<Scalars['Float']>;
  longitude_lt?: Maybe<Scalars['Float']>;
  longitude_lte?: Maybe<Scalars['Float']>;
  longitude_in?: Maybe<Array<Scalars['Float']>>;
  boundarySourceBucketFamilyMeta_eq?: Maybe<Scalars['ID']>;
  boundarySourceBucketFamilyMeta_in?: Maybe<Array<Scalars['ID']>>;
  boundarySourceBucketFamilyMeta?: Maybe<DistributionBucketFamilyMetadataWhereInput>;
  nodelocationmetadatacoordinates_none?: Maybe<NodeLocationMetadataWhereInput>;
  nodelocationmetadatacoordinates_some?: Maybe<NodeLocationMetadataWhereInput>;
  nodelocationmetadatacoordinates_every?: Maybe<NodeLocationMetadataWhereInput>;
  AND?: Maybe<Array<GeoCoordinatesWhereInput>>;
  OR?: Maybe<Array<GeoCoordinatesWhereInput>>;
};

export type GeoCoordinatesWhereUniqueInput = {
  id: Scalars['ID'];
};


export type NodeLocationMetadata = BaseGraphQlObject & {
  id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  createdById: Scalars['String'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  updatedById?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['DateTime']>;
  deletedById?: Maybe<Scalars['String']>;
  version: Scalars['Int'];
  /** ISO 3166-1 alpha-2 country code (2 letters) */
  countryCode?: Maybe<Scalars['String']>;
  /** City name */
  city?: Maybe<Scalars['String']>;
  coordinates?: Maybe<GeoCoordinates>;
  coordinatesId?: Maybe<Scalars['String']>;
  distributionbucketoperatormetadatanodeLocation?: Maybe<Array<DistributionBucketOperatorMetadata>>;
  storagebucketoperatormetadatanodeLocation?: Maybe<Array<StorageBucketOperatorMetadata>>;
};

export type NodeLocationMetadataConnection = {
  totalCount: Scalars['Int'];
  edges: Array<NodeLocationMetadataEdge>;
  pageInfo: PageInfo;
};

export type NodeLocationMetadataCreateInput = {
  countryCode?: Maybe<Scalars['String']>;
  city?: Maybe<Scalars['String']>;
  coordinates?: Maybe<Scalars['ID']>;
};

export type NodeLocationMetadataEdge = {
  node: NodeLocationMetadata;
  cursor: Scalars['String'];
};

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
  CoordinatesDesc = 'coordinates_DESC'
}

export type NodeLocationMetadataUpdateInput = {
  countryCode?: Maybe<Scalars['String']>;
  city?: Maybe<Scalars['String']>;
  coordinates?: Maybe<Scalars['ID']>;
};

export type NodeLocationMetadataWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  countryCode_eq?: Maybe<Scalars['String']>;
  countryCode_contains?: Maybe<Scalars['String']>;
  countryCode_startsWith?: Maybe<Scalars['String']>;
  countryCode_endsWith?: Maybe<Scalars['String']>;
  countryCode_in?: Maybe<Array<Scalars['String']>>;
  city_eq?: Maybe<Scalars['String']>;
  city_contains?: Maybe<Scalars['String']>;
  city_startsWith?: Maybe<Scalars['String']>;
  city_endsWith?: Maybe<Scalars['String']>;
  city_in?: Maybe<Array<Scalars['String']>>;
  coordinates_eq?: Maybe<Scalars['ID']>;
  coordinates_in?: Maybe<Array<Scalars['ID']>>;
  coordinates?: Maybe<GeoCoordinatesWhereInput>;
  distributionbucketoperatormetadatanodeLocation_none?: Maybe<DistributionBucketOperatorMetadataWhereInput>;
  distributionbucketoperatormetadatanodeLocation_some?: Maybe<DistributionBucketOperatorMetadataWhereInput>;
  distributionbucketoperatormetadatanodeLocation_every?: Maybe<DistributionBucketOperatorMetadataWhereInput>;
  storagebucketoperatormetadatanodeLocation_none?: Maybe<StorageBucketOperatorMetadataWhereInput>;
  storagebucketoperatormetadatanodeLocation_some?: Maybe<StorageBucketOperatorMetadataWhereInput>;
  storagebucketoperatormetadatanodeLocation_every?: Maybe<StorageBucketOperatorMetadataWhereInput>;
  AND?: Maybe<Array<NodeLocationMetadataWhereInput>>;
  OR?: Maybe<Array<NodeLocationMetadataWhereInput>>;
};

export type NodeLocationMetadataWhereUniqueInput = {
  id: Scalars['ID'];
};

export type PageInfo = {
  hasNextPage: Scalars['Boolean'];
  hasPreviousPage: Scalars['Boolean'];
  startCursor?: Maybe<Scalars['String']>;
  endCursor?: Maybe<Scalars['String']>;
};

export type ProcessorState = {
  lastCompleteBlock: Scalars['Float'];
  lastProcessedEvent: Scalars['String'];
  indexerHead: Scalars['Float'];
  chainHead: Scalars['Float'];
};

export type Query = {
  distributionBucketFamilyMetadata: Array<DistributionBucketFamilyMetadata>;
  distributionBucketFamilyMetadataByUniqueInput?: Maybe<DistributionBucketFamilyMetadata>;
  distributionBucketFamilyMetadataConnection: DistributionBucketFamilyMetadataConnection;
  distributionBucketFamilies: Array<DistributionBucketFamily>;
  distributionBucketFamilyByUniqueInput?: Maybe<DistributionBucketFamily>;
  distributionBucketFamiliesConnection: DistributionBucketFamilyConnection;
  distributionBucketOperatorMetadata: Array<DistributionBucketOperatorMetadata>;
  distributionBucketOperatorMetadataByUniqueInput?: Maybe<DistributionBucketOperatorMetadata>;
  distributionBucketOperatorMetadataConnection: DistributionBucketOperatorMetadataConnection;
  distributionBucketOperators: Array<DistributionBucketOperator>;
  distributionBucketOperatorByUniqueInput?: Maybe<DistributionBucketOperator>;
  distributionBucketOperatorsConnection: DistributionBucketOperatorConnection;
  distributionBuckets: Array<DistributionBucket>;
  distributionBucketByUniqueInput?: Maybe<DistributionBucket>;
  distributionBucketsConnection: DistributionBucketConnection;
  geoCoordinates: Array<GeoCoordinates>;
  geoCoordinatesByUniqueInput?: Maybe<GeoCoordinates>;
  geoCoordinatesConnection: GeoCoordinatesConnection;
  nodeLocationMetadata: Array<NodeLocationMetadata>;
  nodeLocationMetadataByUniqueInput?: Maybe<NodeLocationMetadata>;
  nodeLocationMetadataConnection: NodeLocationMetadataConnection;
  storageBags: Array<StorageBag>;
  storageBagByUniqueInput?: Maybe<StorageBag>;
  storageBagsConnection: StorageBagConnection;
  storageBucketOperatorMetadata: Array<StorageBucketOperatorMetadata>;
  storageBucketOperatorMetadataByUniqueInput?: Maybe<StorageBucketOperatorMetadata>;
  storageBucketOperatorMetadataConnection: StorageBucketOperatorMetadataConnection;
  storageBuckets: Array<StorageBucket>;
  storageBucketByUniqueInput?: Maybe<StorageBucket>;
  storageBucketsConnection: StorageBucketConnection;
  storageDataObjects: Array<StorageDataObject>;
  storageDataObjectByUniqueInput?: Maybe<StorageDataObject>;
  storageDataObjectsConnection: StorageDataObjectConnection;
  storageSystemParameters: Array<StorageSystemParameters>;
  storageSystemParametersByUniqueInput?: Maybe<StorageSystemParameters>;
  storageSystemParametersConnection: StorageSystemParametersConnection;
};


export type QueryDistributionBucketFamilyMetadataArgs = {
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  where?: Maybe<DistributionBucketFamilyMetadataWhereInput>;
  orderBy?: Maybe<Array<DistributionBucketFamilyMetadataOrderByInput>>;
};


export type QueryDistributionBucketFamilyMetadataByUniqueInputArgs = {
  where: DistributionBucketFamilyMetadataWhereUniqueInput;
};


export type QueryDistributionBucketFamilyMetadataConnectionArgs = {
  first?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  last?: Maybe<Scalars['Int']>;
  before?: Maybe<Scalars['String']>;
  where?: Maybe<DistributionBucketFamilyMetadataWhereInput>;
  orderBy?: Maybe<Array<DistributionBucketFamilyMetadataOrderByInput>>;
};


export type QueryDistributionBucketFamiliesArgs = {
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  where?: Maybe<DistributionBucketFamilyWhereInput>;
  orderBy?: Maybe<Array<DistributionBucketFamilyOrderByInput>>;
};


export type QueryDistributionBucketFamilyByUniqueInputArgs = {
  where: DistributionBucketFamilyWhereUniqueInput;
};


export type QueryDistributionBucketFamiliesConnectionArgs = {
  first?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  last?: Maybe<Scalars['Int']>;
  before?: Maybe<Scalars['String']>;
  where?: Maybe<DistributionBucketFamilyWhereInput>;
  orderBy?: Maybe<Array<DistributionBucketFamilyOrderByInput>>;
};


export type QueryDistributionBucketOperatorMetadataArgs = {
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  where?: Maybe<DistributionBucketOperatorMetadataWhereInput>;
  orderBy?: Maybe<Array<DistributionBucketOperatorMetadataOrderByInput>>;
};


export type QueryDistributionBucketOperatorMetadataByUniqueInputArgs = {
  where: DistributionBucketOperatorMetadataWhereUniqueInput;
};


export type QueryDistributionBucketOperatorMetadataConnectionArgs = {
  first?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  last?: Maybe<Scalars['Int']>;
  before?: Maybe<Scalars['String']>;
  where?: Maybe<DistributionBucketOperatorMetadataWhereInput>;
  orderBy?: Maybe<Array<DistributionBucketOperatorMetadataOrderByInput>>;
};


export type QueryDistributionBucketOperatorsArgs = {
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  where?: Maybe<DistributionBucketOperatorWhereInput>;
  orderBy?: Maybe<Array<DistributionBucketOperatorOrderByInput>>;
};


export type QueryDistributionBucketOperatorByUniqueInputArgs = {
  where: DistributionBucketOperatorWhereUniqueInput;
};


export type QueryDistributionBucketOperatorsConnectionArgs = {
  first?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  last?: Maybe<Scalars['Int']>;
  before?: Maybe<Scalars['String']>;
  where?: Maybe<DistributionBucketOperatorWhereInput>;
  orderBy?: Maybe<Array<DistributionBucketOperatorOrderByInput>>;
};


export type QueryDistributionBucketsArgs = {
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  where?: Maybe<DistributionBucketWhereInput>;
  orderBy?: Maybe<Array<DistributionBucketOrderByInput>>;
};


export type QueryDistributionBucketByUniqueInputArgs = {
  where: DistributionBucketWhereUniqueInput;
};


export type QueryDistributionBucketsConnectionArgs = {
  first?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  last?: Maybe<Scalars['Int']>;
  before?: Maybe<Scalars['String']>;
  where?: Maybe<DistributionBucketWhereInput>;
  orderBy?: Maybe<Array<DistributionBucketOrderByInput>>;
};


export type QueryGeoCoordinatesArgs = {
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  where?: Maybe<GeoCoordinatesWhereInput>;
  orderBy?: Maybe<Array<GeoCoordinatesOrderByInput>>;
};


export type QueryGeoCoordinatesByUniqueInputArgs = {
  where: GeoCoordinatesWhereUniqueInput;
};


export type QueryGeoCoordinatesConnectionArgs = {
  first?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  last?: Maybe<Scalars['Int']>;
  before?: Maybe<Scalars['String']>;
  where?: Maybe<GeoCoordinatesWhereInput>;
  orderBy?: Maybe<Array<GeoCoordinatesOrderByInput>>;
};


export type QueryNodeLocationMetadataArgs = {
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  where?: Maybe<NodeLocationMetadataWhereInput>;
  orderBy?: Maybe<Array<NodeLocationMetadataOrderByInput>>;
};


export type QueryNodeLocationMetadataByUniqueInputArgs = {
  where: NodeLocationMetadataWhereUniqueInput;
};


export type QueryNodeLocationMetadataConnectionArgs = {
  first?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  last?: Maybe<Scalars['Int']>;
  before?: Maybe<Scalars['String']>;
  where?: Maybe<NodeLocationMetadataWhereInput>;
  orderBy?: Maybe<Array<NodeLocationMetadataOrderByInput>>;
};


export type QueryStorageBagsArgs = {
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  where?: Maybe<StorageBagWhereInput>;
  orderBy?: Maybe<Array<StorageBagOrderByInput>>;
};


export type QueryStorageBagByUniqueInputArgs = {
  where: StorageBagWhereUniqueInput;
};


export type QueryStorageBagsConnectionArgs = {
  first?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  last?: Maybe<Scalars['Int']>;
  before?: Maybe<Scalars['String']>;
  where?: Maybe<StorageBagWhereInput>;
  orderBy?: Maybe<Array<StorageBagOrderByInput>>;
};


export type QueryStorageBucketOperatorMetadataArgs = {
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  where?: Maybe<StorageBucketOperatorMetadataWhereInput>;
  orderBy?: Maybe<Array<StorageBucketOperatorMetadataOrderByInput>>;
};


export type QueryStorageBucketOperatorMetadataByUniqueInputArgs = {
  where: StorageBucketOperatorMetadataWhereUniqueInput;
};


export type QueryStorageBucketOperatorMetadataConnectionArgs = {
  first?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  last?: Maybe<Scalars['Int']>;
  before?: Maybe<Scalars['String']>;
  where?: Maybe<StorageBucketOperatorMetadataWhereInput>;
  orderBy?: Maybe<Array<StorageBucketOperatorMetadataOrderByInput>>;
};


export type QueryStorageBucketsArgs = {
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  where?: Maybe<StorageBucketWhereInput>;
  orderBy?: Maybe<Array<StorageBucketOrderByInput>>;
};


export type QueryStorageBucketByUniqueInputArgs = {
  where: StorageBucketWhereUniqueInput;
};


export type QueryStorageBucketsConnectionArgs = {
  first?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  last?: Maybe<Scalars['Int']>;
  before?: Maybe<Scalars['String']>;
  where?: Maybe<StorageBucketWhereInput>;
  orderBy?: Maybe<Array<StorageBucketOrderByInput>>;
};


export type QueryStorageDataObjectsArgs = {
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  where?: Maybe<StorageDataObjectWhereInput>;
  orderBy?: Maybe<Array<StorageDataObjectOrderByInput>>;
};


export type QueryStorageDataObjectByUniqueInputArgs = {
  where: StorageDataObjectWhereUniqueInput;
};


export type QueryStorageDataObjectsConnectionArgs = {
  first?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  last?: Maybe<Scalars['Int']>;
  before?: Maybe<Scalars['String']>;
  where?: Maybe<StorageDataObjectWhereInput>;
  orderBy?: Maybe<Array<StorageDataObjectOrderByInput>>;
};


export type QueryStorageSystemParametersArgs = {
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  where?: Maybe<StorageSystemParametersWhereInput>;
  orderBy?: Maybe<Array<StorageSystemParametersOrderByInput>>;
};


export type QueryStorageSystemParametersByUniqueInputArgs = {
  where: StorageSystemParametersWhereUniqueInput;
};


export type QueryStorageSystemParametersConnectionArgs = {
  first?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  last?: Maybe<Scalars['Int']>;
  before?: Maybe<Scalars['String']>;
  where?: Maybe<StorageSystemParametersWhereInput>;
  orderBy?: Maybe<Array<StorageSystemParametersOrderByInput>>;
};

export type StandardDeleteResponse = {
  id: Scalars['ID'];
};

export type StorageBag = BaseGraphQlObject & {
  id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  createdById: Scalars['String'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  updatedById?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['DateTime']>;
  deletedById?: Maybe<Scalars['String']>;
  version: Scalars['Int'];
  objects: Array<StorageDataObject>;
  storedBy: Array<StorageBucket>;
  distributedBy: Array<DistributionBucket>;
  /** Owner of the storage bag */
  owner: StorageBagOwner;
};

export type StorageBagConnection = {
  totalCount: Scalars['Int'];
  edges: Array<StorageBagEdge>;
  pageInfo: PageInfo;
};

export type StorageBagCreateInput = {
  owner: Scalars['JSONObject'];
};

export type StorageBagEdge = {
  node: StorageBag;
  cursor: Scalars['String'];
};

export enum StorageBagOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC'
}

export type StorageBagOwner = StorageBagOwnerCouncil | StorageBagOwnerWorkingGroup | StorageBagOwnerMember | StorageBagOwnerChannel | StorageBagOwnerDao;

export type StorageBagOwnerChannel = {
  channelId?: Maybe<Scalars['Int']>;
};

export type StorageBagOwnerChannelCreateInput = {
  channelId?: Maybe<Scalars['Float']>;
};

export type StorageBagOwnerChannelUpdateInput = {
  channelId?: Maybe<Scalars['Float']>;
};

export type StorageBagOwnerChannelWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  channelId_eq?: Maybe<Scalars['Int']>;
  channelId_gt?: Maybe<Scalars['Int']>;
  channelId_gte?: Maybe<Scalars['Int']>;
  channelId_lt?: Maybe<Scalars['Int']>;
  channelId_lte?: Maybe<Scalars['Int']>;
  channelId_in?: Maybe<Array<Scalars['Int']>>;
  AND?: Maybe<Array<StorageBagOwnerChannelWhereInput>>;
  OR?: Maybe<Array<StorageBagOwnerChannelWhereInput>>;
};

export type StorageBagOwnerChannelWhereUniqueInput = {
  id: Scalars['ID'];
};

export type StorageBagOwnerCouncil = {
  phantom?: Maybe<Scalars['Int']>;
};

export type StorageBagOwnerCouncilCreateInput = {
  phantom?: Maybe<Scalars['Float']>;
};

export type StorageBagOwnerCouncilUpdateInput = {
  phantom?: Maybe<Scalars['Float']>;
};

export type StorageBagOwnerCouncilWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  phantom_eq?: Maybe<Scalars['Int']>;
  phantom_gt?: Maybe<Scalars['Int']>;
  phantom_gte?: Maybe<Scalars['Int']>;
  phantom_lt?: Maybe<Scalars['Int']>;
  phantom_lte?: Maybe<Scalars['Int']>;
  phantom_in?: Maybe<Array<Scalars['Int']>>;
  AND?: Maybe<Array<StorageBagOwnerCouncilWhereInput>>;
  OR?: Maybe<Array<StorageBagOwnerCouncilWhereInput>>;
};

export type StorageBagOwnerCouncilWhereUniqueInput = {
  id: Scalars['ID'];
};

export type StorageBagOwnerDao = {
  daoId?: Maybe<Scalars['Int']>;
};

export type StorageBagOwnerDaoCreateInput = {
  daoId?: Maybe<Scalars['Float']>;
};

export type StorageBagOwnerDaoUpdateInput = {
  daoId?: Maybe<Scalars['Float']>;
};

export type StorageBagOwnerDaoWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  daoId_eq?: Maybe<Scalars['Int']>;
  daoId_gt?: Maybe<Scalars['Int']>;
  daoId_gte?: Maybe<Scalars['Int']>;
  daoId_lt?: Maybe<Scalars['Int']>;
  daoId_lte?: Maybe<Scalars['Int']>;
  daoId_in?: Maybe<Array<Scalars['Int']>>;
  AND?: Maybe<Array<StorageBagOwnerDaoWhereInput>>;
  OR?: Maybe<Array<StorageBagOwnerDaoWhereInput>>;
};

export type StorageBagOwnerDaoWhereUniqueInput = {
  id: Scalars['ID'];
};

export type StorageBagOwnerMember = {
  memberId?: Maybe<Scalars['Int']>;
};

export type StorageBagOwnerMemberCreateInput = {
  memberId?: Maybe<Scalars['Float']>;
};

export type StorageBagOwnerMemberUpdateInput = {
  memberId?: Maybe<Scalars['Float']>;
};

export type StorageBagOwnerMemberWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  memberId_eq?: Maybe<Scalars['Int']>;
  memberId_gt?: Maybe<Scalars['Int']>;
  memberId_gte?: Maybe<Scalars['Int']>;
  memberId_lt?: Maybe<Scalars['Int']>;
  memberId_lte?: Maybe<Scalars['Int']>;
  memberId_in?: Maybe<Array<Scalars['Int']>>;
  AND?: Maybe<Array<StorageBagOwnerMemberWhereInput>>;
  OR?: Maybe<Array<StorageBagOwnerMemberWhereInput>>;
};

export type StorageBagOwnerMemberWhereUniqueInput = {
  id: Scalars['ID'];
};

export type StorageBagOwnerWorkingGroup = {
  workingGroupId?: Maybe<Scalars['String']>;
};

export type StorageBagOwnerWorkingGroupCreateInput = {
  workingGroupId?: Maybe<Scalars['String']>;
};

export type StorageBagOwnerWorkingGroupUpdateInput = {
  workingGroupId?: Maybe<Scalars['String']>;
};

export type StorageBagOwnerWorkingGroupWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  workingGroupId_eq?: Maybe<Scalars['String']>;
  workingGroupId_contains?: Maybe<Scalars['String']>;
  workingGroupId_startsWith?: Maybe<Scalars['String']>;
  workingGroupId_endsWith?: Maybe<Scalars['String']>;
  workingGroupId_in?: Maybe<Array<Scalars['String']>>;
  AND?: Maybe<Array<StorageBagOwnerWorkingGroupWhereInput>>;
  OR?: Maybe<Array<StorageBagOwnerWorkingGroupWhereInput>>;
};

export type StorageBagOwnerWorkingGroupWhereUniqueInput = {
  id: Scalars['ID'];
};

export type StorageBagUpdateInput = {
  owner?: Maybe<Scalars['JSONObject']>;
};

export type StorageBagWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  owner_json?: Maybe<Scalars['JSONObject']>;
  objects_none?: Maybe<StorageDataObjectWhereInput>;
  objects_some?: Maybe<StorageDataObjectWhereInput>;
  objects_every?: Maybe<StorageDataObjectWhereInput>;
  storedBy_none?: Maybe<StorageBucketWhereInput>;
  storedBy_some?: Maybe<StorageBucketWhereInput>;
  storedBy_every?: Maybe<StorageBucketWhereInput>;
  distributedBy_none?: Maybe<DistributionBucketWhereInput>;
  distributedBy_some?: Maybe<DistributionBucketWhereInput>;
  distributedBy_every?: Maybe<DistributionBucketWhereInput>;
  AND?: Maybe<Array<StorageBagWhereInput>>;
  OR?: Maybe<Array<StorageBagWhereInput>>;
};

export type StorageBagWhereUniqueInput = {
  id: Scalars['ID'];
};

export type StorageBucket = BaseGraphQlObject & {
  id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  createdById: Scalars['String'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  updatedById?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['DateTime']>;
  deletedById?: Maybe<Scalars['String']>;
  version: Scalars['Int'];
  /** Current bucket operator status */
  operatorStatus: StorageBucketOperatorStatus;
  operatorMetadata?: Maybe<StorageBucketOperatorMetadata>;
  operatorMetadataId?: Maybe<Scalars['String']>;
  /** Whether the bucket is accepting any new storage bags */
  acceptingNewBags: Scalars['Boolean'];
  storedBags: Array<StorageBag>;
  /** Bucket's data object size limit in bytes */
  dataObjectsSizeLimit: Scalars['BigInt'];
  /** Bucket's data object count limit */
  dataObjectCountLimit: Scalars['BigInt'];
};

export type StorageBucketConnection = {
  totalCount: Scalars['Int'];
  edges: Array<StorageBucketEdge>;
  pageInfo: PageInfo;
};

export type StorageBucketCreateInput = {
  operatorStatus: Scalars['JSONObject'];
  operatorMetadata?: Maybe<Scalars['ID']>;
  acceptingNewBags: Scalars['Boolean'];
  dataObjectsSizeLimit: Scalars['BigInt'];
  dataObjectCountLimit: Scalars['BigInt'];
};

export type StorageBucketEdge = {
  node: StorageBucket;
  cursor: Scalars['String'];
};

export type StorageBucketOperatorMetadata = BaseGraphQlObject & {
  id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  createdById: Scalars['String'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  updatedById?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['DateTime']>;
  deletedById?: Maybe<Scalars['String']>;
  version: Scalars['Int'];
  /** Root node endpoint */
  nodeEndpoint?: Maybe<Scalars['String']>;
  nodeLocation?: Maybe<NodeLocationMetadata>;
  nodeLocationId?: Maybe<Scalars['String']>;
  /** Additional information about the node/operator */
  extra?: Maybe<Scalars['String']>;
  storagebucketoperatorMetadata?: Maybe<Array<StorageBucket>>;
};

export type StorageBucketOperatorMetadataConnection = {
  totalCount: Scalars['Int'];
  edges: Array<StorageBucketOperatorMetadataEdge>;
  pageInfo: PageInfo;
};

export type StorageBucketOperatorMetadataCreateInput = {
  nodeEndpoint?: Maybe<Scalars['String']>;
  nodeLocation?: Maybe<Scalars['ID']>;
  extra?: Maybe<Scalars['String']>;
};

export type StorageBucketOperatorMetadataEdge = {
  node: StorageBucketOperatorMetadata;
  cursor: Scalars['String'];
};

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
  ExtraDesc = 'extra_DESC'
}

export type StorageBucketOperatorMetadataUpdateInput = {
  nodeEndpoint?: Maybe<Scalars['String']>;
  nodeLocation?: Maybe<Scalars['ID']>;
  extra?: Maybe<Scalars['String']>;
};

export type StorageBucketOperatorMetadataWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  nodeEndpoint_eq?: Maybe<Scalars['String']>;
  nodeEndpoint_contains?: Maybe<Scalars['String']>;
  nodeEndpoint_startsWith?: Maybe<Scalars['String']>;
  nodeEndpoint_endsWith?: Maybe<Scalars['String']>;
  nodeEndpoint_in?: Maybe<Array<Scalars['String']>>;
  nodeLocation_eq?: Maybe<Scalars['ID']>;
  nodeLocation_in?: Maybe<Array<Scalars['ID']>>;
  extra_eq?: Maybe<Scalars['String']>;
  extra_contains?: Maybe<Scalars['String']>;
  extra_startsWith?: Maybe<Scalars['String']>;
  extra_endsWith?: Maybe<Scalars['String']>;
  extra_in?: Maybe<Array<Scalars['String']>>;
  nodeLocation?: Maybe<NodeLocationMetadataWhereInput>;
  storagebucketoperatorMetadata_none?: Maybe<StorageBucketWhereInput>;
  storagebucketoperatorMetadata_some?: Maybe<StorageBucketWhereInput>;
  storagebucketoperatorMetadata_every?: Maybe<StorageBucketWhereInput>;
  AND?: Maybe<Array<StorageBucketOperatorMetadataWhereInput>>;
  OR?: Maybe<Array<StorageBucketOperatorMetadataWhereInput>>;
};

export type StorageBucketOperatorMetadataWhereUniqueInput = {
  id: Scalars['ID'];
};

export type StorageBucketOperatorStatus = StorageBucketOperatorStatusMissing | StorageBucketOperatorStatusInvited | StorageBucketOperatorStatusActive;

export type StorageBucketOperatorStatusActive = {
  workerId: Scalars['Int'];
};

export type StorageBucketOperatorStatusActiveCreateInput = {
  workerId: Scalars['Float'];
};

export type StorageBucketOperatorStatusActiveUpdateInput = {
  workerId?: Maybe<Scalars['Float']>;
};

export type StorageBucketOperatorStatusActiveWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  workerId_eq?: Maybe<Scalars['Int']>;
  workerId_gt?: Maybe<Scalars['Int']>;
  workerId_gte?: Maybe<Scalars['Int']>;
  workerId_lt?: Maybe<Scalars['Int']>;
  workerId_lte?: Maybe<Scalars['Int']>;
  workerId_in?: Maybe<Array<Scalars['Int']>>;
  AND?: Maybe<Array<StorageBucketOperatorStatusActiveWhereInput>>;
  OR?: Maybe<Array<StorageBucketOperatorStatusActiveWhereInput>>;
};

export type StorageBucketOperatorStatusActiveWhereUniqueInput = {
  id: Scalars['ID'];
};

export type StorageBucketOperatorStatusInvited = {
  workerId: Scalars['Int'];
};

export type StorageBucketOperatorStatusInvitedCreateInput = {
  workerId: Scalars['Float'];
};

export type StorageBucketOperatorStatusInvitedUpdateInput = {
  workerId?: Maybe<Scalars['Float']>;
};

export type StorageBucketOperatorStatusInvitedWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  workerId_eq?: Maybe<Scalars['Int']>;
  workerId_gt?: Maybe<Scalars['Int']>;
  workerId_gte?: Maybe<Scalars['Int']>;
  workerId_lt?: Maybe<Scalars['Int']>;
  workerId_lte?: Maybe<Scalars['Int']>;
  workerId_in?: Maybe<Array<Scalars['Int']>>;
  AND?: Maybe<Array<StorageBucketOperatorStatusInvitedWhereInput>>;
  OR?: Maybe<Array<StorageBucketOperatorStatusInvitedWhereInput>>;
};

export type StorageBucketOperatorStatusInvitedWhereUniqueInput = {
  id: Scalars['ID'];
};

export type StorageBucketOperatorStatusMissing = {
  phantom?: Maybe<Scalars['Int']>;
};

export type StorageBucketOperatorStatusMissingCreateInput = {
  phantom?: Maybe<Scalars['Float']>;
};

export type StorageBucketOperatorStatusMissingUpdateInput = {
  phantom?: Maybe<Scalars['Float']>;
};

export type StorageBucketOperatorStatusMissingWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  phantom_eq?: Maybe<Scalars['Int']>;
  phantom_gt?: Maybe<Scalars['Int']>;
  phantom_gte?: Maybe<Scalars['Int']>;
  phantom_lt?: Maybe<Scalars['Int']>;
  phantom_lte?: Maybe<Scalars['Int']>;
  phantom_in?: Maybe<Array<Scalars['Int']>>;
  AND?: Maybe<Array<StorageBucketOperatorStatusMissingWhereInput>>;
  OR?: Maybe<Array<StorageBucketOperatorStatusMissingWhereInput>>;
};

export type StorageBucketOperatorStatusMissingWhereUniqueInput = {
  id: Scalars['ID'];
};

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
  DataObjectCountLimitDesc = 'dataObjectCountLimit_DESC'
}

export type StorageBucketUpdateInput = {
  operatorStatus?: Maybe<Scalars['JSONObject']>;
  operatorMetadata?: Maybe<Scalars['ID']>;
  acceptingNewBags?: Maybe<Scalars['Boolean']>;
  dataObjectsSizeLimit?: Maybe<Scalars['BigInt']>;
  dataObjectCountLimit?: Maybe<Scalars['BigInt']>;
};

export type StorageBucketWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  operatorStatus_json?: Maybe<Scalars['JSONObject']>;
  operatorMetadata_eq?: Maybe<Scalars['ID']>;
  operatorMetadata_in?: Maybe<Array<Scalars['ID']>>;
  acceptingNewBags_eq?: Maybe<Scalars['Boolean']>;
  acceptingNewBags_in?: Maybe<Array<Scalars['Boolean']>>;
  dataObjectsSizeLimit_eq?: Maybe<Scalars['BigInt']>;
  dataObjectsSizeLimit_gt?: Maybe<Scalars['BigInt']>;
  dataObjectsSizeLimit_gte?: Maybe<Scalars['BigInt']>;
  dataObjectsSizeLimit_lt?: Maybe<Scalars['BigInt']>;
  dataObjectsSizeLimit_lte?: Maybe<Scalars['BigInt']>;
  dataObjectsSizeLimit_in?: Maybe<Array<Scalars['BigInt']>>;
  dataObjectCountLimit_eq?: Maybe<Scalars['BigInt']>;
  dataObjectCountLimit_gt?: Maybe<Scalars['BigInt']>;
  dataObjectCountLimit_gte?: Maybe<Scalars['BigInt']>;
  dataObjectCountLimit_lt?: Maybe<Scalars['BigInt']>;
  dataObjectCountLimit_lte?: Maybe<Scalars['BigInt']>;
  dataObjectCountLimit_in?: Maybe<Array<Scalars['BigInt']>>;
  operatorMetadata?: Maybe<StorageBucketOperatorMetadataWhereInput>;
  storedBags_none?: Maybe<StorageBagWhereInput>;
  storedBags_some?: Maybe<StorageBagWhereInput>;
  storedBags_every?: Maybe<StorageBagWhereInput>;
  AND?: Maybe<Array<StorageBucketWhereInput>>;
  OR?: Maybe<Array<StorageBucketWhereInput>>;
};

export type StorageBucketWhereUniqueInput = {
  id: Scalars['ID'];
};

export type StorageDataObject = BaseGraphQlObject & {
  id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  createdById: Scalars['String'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  updatedById?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['DateTime']>;
  deletedById?: Maybe<Scalars['String']>;
  version: Scalars['Int'];
  /** Whether the data object was uploaded and accepted by the storage provider */
  isAccepted: Scalars['Boolean'];
  /** Data object size in bytes */
  size: Scalars['BigInt'];
  storageBag: StorageBag;
  storageBagId: Scalars['String'];
  /** IPFS content hash */
  ipfsHash: Scalars['String'];
  /** Public key used to authenticate the uploader by the storage provider */
  authenticationKey?: Maybe<Scalars['String']>;
};

export type StorageDataObjectConnection = {
  totalCount: Scalars['Int'];
  edges: Array<StorageDataObjectEdge>;
  pageInfo: PageInfo;
};

export type StorageDataObjectCreateInput = {
  isAccepted: Scalars['Boolean'];
  size: Scalars['BigInt'];
  storageBag: Scalars['ID'];
  ipfsHash: Scalars['String'];
  authenticationKey?: Maybe<Scalars['String']>;
};

export type StorageDataObjectEdge = {
  node: StorageDataObject;
  cursor: Scalars['String'];
};

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
  AuthenticationKeyDesc = 'authenticationKey_DESC'
}

export type StorageDataObjectUpdateInput = {
  isAccepted?: Maybe<Scalars['Boolean']>;
  size?: Maybe<Scalars['BigInt']>;
  storageBag?: Maybe<Scalars['ID']>;
  ipfsHash?: Maybe<Scalars['String']>;
  authenticationKey?: Maybe<Scalars['String']>;
};

export type StorageDataObjectWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  isAccepted_eq?: Maybe<Scalars['Boolean']>;
  isAccepted_in?: Maybe<Array<Scalars['Boolean']>>;
  size_eq?: Maybe<Scalars['BigInt']>;
  size_gt?: Maybe<Scalars['BigInt']>;
  size_gte?: Maybe<Scalars['BigInt']>;
  size_lt?: Maybe<Scalars['BigInt']>;
  size_lte?: Maybe<Scalars['BigInt']>;
  size_in?: Maybe<Array<Scalars['BigInt']>>;
  storageBag_eq?: Maybe<Scalars['ID']>;
  storageBag_in?: Maybe<Array<Scalars['ID']>>;
  ipfsHash_eq?: Maybe<Scalars['String']>;
  ipfsHash_contains?: Maybe<Scalars['String']>;
  ipfsHash_startsWith?: Maybe<Scalars['String']>;
  ipfsHash_endsWith?: Maybe<Scalars['String']>;
  ipfsHash_in?: Maybe<Array<Scalars['String']>>;
  authenticationKey_eq?: Maybe<Scalars['String']>;
  authenticationKey_contains?: Maybe<Scalars['String']>;
  authenticationKey_startsWith?: Maybe<Scalars['String']>;
  authenticationKey_endsWith?: Maybe<Scalars['String']>;
  authenticationKey_in?: Maybe<Array<Scalars['String']>>;
  storageBag?: Maybe<StorageBagWhereInput>;
  AND?: Maybe<Array<StorageDataObjectWhereInput>>;
  OR?: Maybe<Array<StorageDataObjectWhereInput>>;
};

export type StorageDataObjectWhereUniqueInput = {
  id: Scalars['ID'];
};

/** Global storage system parameters */
export type StorageSystemParameters = BaseGraphQlObject & {
  id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  createdById: Scalars['String'];
  updatedAt?: Maybe<Scalars['DateTime']>;
  updatedById?: Maybe<Scalars['String']>;
  deletedAt?: Maybe<Scalars['DateTime']>;
  deletedById?: Maybe<Scalars['String']>;
  version: Scalars['Int'];
  /** Blacklisted content hashes */
  blacklist: Array<Scalars['String']>;
};

export type StorageSystemParametersConnection = {
  totalCount: Scalars['Int'];
  edges: Array<StorageSystemParametersEdge>;
  pageInfo: PageInfo;
};

export type StorageSystemParametersCreateInput = {
  blacklist: Array<Scalars['String']>;
};

export type StorageSystemParametersEdge = {
  node: StorageSystemParameters;
  cursor: Scalars['String'];
};

export enum StorageSystemParametersOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC'
}

export type StorageSystemParametersUpdateInput = {
  blacklist?: Maybe<Array<Scalars['String']>>;
};

export type StorageSystemParametersWhereInput = {
  id_eq?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  createdAt_eq?: Maybe<Scalars['DateTime']>;
  createdAt_lt?: Maybe<Scalars['DateTime']>;
  createdAt_lte?: Maybe<Scalars['DateTime']>;
  createdAt_gt?: Maybe<Scalars['DateTime']>;
  createdAt_gte?: Maybe<Scalars['DateTime']>;
  createdById_eq?: Maybe<Scalars['ID']>;
  createdById_in?: Maybe<Array<Scalars['ID']>>;
  updatedAt_eq?: Maybe<Scalars['DateTime']>;
  updatedAt_lt?: Maybe<Scalars['DateTime']>;
  updatedAt_lte?: Maybe<Scalars['DateTime']>;
  updatedAt_gt?: Maybe<Scalars['DateTime']>;
  updatedAt_gte?: Maybe<Scalars['DateTime']>;
  updatedById_eq?: Maybe<Scalars['ID']>;
  updatedById_in?: Maybe<Array<Scalars['ID']>>;
  deletedAt_all?: Maybe<Scalars['Boolean']>;
  deletedAt_eq?: Maybe<Scalars['DateTime']>;
  deletedAt_lt?: Maybe<Scalars['DateTime']>;
  deletedAt_lte?: Maybe<Scalars['DateTime']>;
  deletedAt_gt?: Maybe<Scalars['DateTime']>;
  deletedAt_gte?: Maybe<Scalars['DateTime']>;
  deletedById_eq?: Maybe<Scalars['ID']>;
  deletedById_in?: Maybe<Array<Scalars['ID']>>;
  AND?: Maybe<Array<StorageSystemParametersWhereInput>>;
  OR?: Maybe<Array<StorageSystemParametersWhereInput>>;
};

export type StorageSystemParametersWhereUniqueInput = {
  id: Scalars['ID'];
};

export type Subscription = {
  stateSubscription: ProcessorState;
};
