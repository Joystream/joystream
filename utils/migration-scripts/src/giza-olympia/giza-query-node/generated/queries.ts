import * as Types from './schema'

import gql from 'graphql-tag'
export type VideoCategoryFieldsFragment = { id: string; name?: Types.Maybe<string> }

export type ChannelCategoryFieldsFragment = { id: string; name?: Types.Maybe<string> }

export type StorageDataObjectFieldsFragment = {
  id: string
  updatedAt?: Types.Maybe<any>
  ipfsHash: string
  isAccepted: boolean
  size: any
  storageBagId: string
}

export type StorageDataObjectConnectionFieldsFragment = {
  edges: Array<{ node: StorageDataObjectFieldsFragment }>
  pageInfo: { hasNextPage: boolean; endCursor?: Types.Maybe<string> }
}

export type VideoFieldsFragment = {
  id: string
  categoryId?: Types.Maybe<string>
  title?: Types.Maybe<string>
  description?: Types.Maybe<string>
  duration?: Types.Maybe<number>
  hasMarketing?: Types.Maybe<boolean>
  publishedBeforeJoystream?: Types.Maybe<any>
  isPublic?: Types.Maybe<boolean>
  isCensored: boolean
  isExplicit?: Types.Maybe<boolean>
  isFeatured: boolean
  thumbnailPhoto?: Types.Maybe<StorageDataObjectFieldsFragment>
  language?: Types.Maybe<{ iso: string }>
  license?: Types.Maybe<{
    code?: Types.Maybe<number>
    attribution?: Types.Maybe<string>
    customText?: Types.Maybe<string>
  }>
  media?: Types.Maybe<StorageDataObjectFieldsFragment>
  mediaMetadata?: Types.Maybe<{
    pixelWidth?: Types.Maybe<number>
    pixelHeight?: Types.Maybe<number>
    size?: Types.Maybe<any>
    encoding?: Types.Maybe<{
      codecName?: Types.Maybe<string>
      container?: Types.Maybe<string>
      mimeMediaType?: Types.Maybe<string>
    }>
  }>
  channel: { id: string; ownerMember?: Types.Maybe<{ id: string; controllerAccount: string }> }
}

export type VideoConnectionFieldsFragment = {
  edges: Array<{ node: VideoFieldsFragment }>
  pageInfo: { hasNextPage: boolean; endCursor?: Types.Maybe<string> }
}

export type ChannelFieldsFragment = {
  id: string
  categoryId?: Types.Maybe<string>
  rewardAccount?: Types.Maybe<string>
  title?: Types.Maybe<string>
  description?: Types.Maybe<string>
  isPublic?: Types.Maybe<boolean>
  isCensored: boolean
  ownerMember?: Types.Maybe<{ id: string; controllerAccount: string }>
  coverPhoto?: Types.Maybe<StorageDataObjectFieldsFragment>
  avatarPhoto?: Types.Maybe<StorageDataObjectFieldsFragment>
  language?: Types.Maybe<{ iso: string }>
  videos: Array<{ id: string }>
  collaborators: Array<{ id: string }>
}

export type ChannelConnectionFieldsFragment = {
  edges: Array<{ node: ChannelFieldsFragment }>
  pageInfo: { hasNextPage: boolean; endCursor?: Types.Maybe<string> }
}

export type DistributionBucketFieldsFragment = {
  distributing: boolean
  bags: Array<{ id: string }>
  operators: Array<{
    status: Types.DistributionBucketOperatorStatus
    metadata?: Types.Maybe<{ nodeEndpoint?: Types.Maybe<string> }>
  }>
}

export type GetVideoCategoriesQueryVariables = Types.Exact<{ [key: string]: never }>

export type GetVideoCategoriesQuery = { videoCategories: Array<VideoCategoryFieldsFragment> }

export type GetChannelsCategoriesQueryVariables = Types.Exact<{ [key: string]: never }>

export type GetChannelsCategoriesQuery = { channelCategories: Array<ChannelCategoryFieldsFragment> }

export type GetDistributorsByBagIdsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetDistributorsByBagIdsQuery = { distributionBuckets: Array<DistributionBucketFieldsFragment> }

export type GetDataObjectsPageQueryVariables = Types.Exact<{
  updatedAfter?: Types.Maybe<Types.Scalars['DateTime']>
  limit: Types.Scalars['Int']
  lastCursor?: Types.Maybe<Types.Scalars['String']>
}>

export type GetDataObjectsPageQuery = { storageDataObjectsConnection: StorageDataObjectConnectionFieldsFragment }

export type GetChannelsPageQueryVariables = Types.Exact<{
  limit: Types.Scalars['Int']
  lastCursor?: Types.Maybe<Types.Scalars['String']>
}>

export type GetChannelsPageQuery = { channelsConnection: ChannelConnectionFieldsFragment }

export type GetVideosPageQueryVariables = Types.Exact<{
  limit: Types.Scalars['Int']
  lastCursor?: Types.Maybe<Types.Scalars['String']>
}>

export type GetVideosPageQuery = { videosConnection: VideoConnectionFieldsFragment }

export const VideoCategoryFields = gql`
  fragment VideoCategoryFields on VideoCategory {
    id
    name
  }
`
export const ChannelCategoryFields = gql`
  fragment ChannelCategoryFields on ChannelCategory {
    id
    name
  }
`
export const StorageDataObjectFields = gql`
  fragment StorageDataObjectFields on StorageDataObject {
    id
    updatedAt
    ipfsHash
    isAccepted
    size
    storageBagId
  }
`
export const StorageDataObjectConnectionFields = gql`
  fragment StorageDataObjectConnectionFields on StorageDataObjectConnection {
    edges {
      node {
        ...StorageDataObjectFields
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
  ${StorageDataObjectFields}
`
export const VideoFields = gql`
  fragment VideoFields on Video {
    id
    categoryId
    title
    description
    duration
    thumbnailPhoto {
      ...StorageDataObjectFields
    }
    language {
      iso
    }
    hasMarketing
    publishedBeforeJoystream
    isPublic
    isCensored
    isExplicit
    license {
      code
      attribution
      customText
    }
    media {
      ...StorageDataObjectFields
    }
    mediaMetadata {
      encoding {
        codecName
        container
        mimeMediaType
      }
      pixelWidth
      pixelHeight
      size
    }
    isFeatured
    channel {
      id
      ownerMember {
        id
        controllerAccount
      }
    }
  }
  ${StorageDataObjectFields}
`
export const VideoConnectionFields = gql`
  fragment VideoConnectionFields on VideoConnection {
    edges {
      node {
        ...VideoFields
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
  ${VideoFields}
`
export const ChannelFields = gql`
  fragment ChannelFields on Channel {
    id
    ownerMember {
      id
      controllerAccount
    }
    categoryId
    rewardAccount
    title
    description
    coverPhoto {
      ...StorageDataObjectFields
    }
    avatarPhoto {
      ...StorageDataObjectFields
    }
    isPublic
    isCensored
    language {
      iso
    }
    videos {
      id
    }
    collaborators {
      id
    }
  }
  ${StorageDataObjectFields}
`
export const ChannelConnectionFields = gql`
  fragment ChannelConnectionFields on ChannelConnection {
    edges {
      node {
        ...ChannelFields
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
  ${ChannelFields}
`
export const DistributionBucketFields = gql`
  fragment DistributionBucketFields on DistributionBucket {
    distributing
    bags {
      id
    }
    operators {
      status
      metadata {
        nodeEndpoint
      }
    }
  }
`
export const GetVideoCategories = gql`
  query getVideoCategories {
    videoCategories {
      ...VideoCategoryFields
    }
  }
  ${VideoCategoryFields}
`
export const GetChannelsCategories = gql`
  query getChannelsCategories {
    channelCategories {
      ...ChannelCategoryFields
    }
  }
  ${ChannelCategoryFields}
`
export const GetDistributorsByBagIds = gql`
  query getDistributorsByBagIds($ids: [ID!]) {
    distributionBuckets(where: { bags_some: { id_in: $ids }, distributing_eq: true }) {
      ...DistributionBucketFields
    }
  }
  ${DistributionBucketFields}
`
export const GetDataObjectsPage = gql`
  query getDataObjectsPage($updatedAfter: DateTime, $limit: Int!, $lastCursor: String) {
    storageDataObjectsConnection(
      where: { updatedAt_gt: $updatedAfter, isAccepted_eq: true }
      first: $limit
      after: $lastCursor
    ) {
      ...StorageDataObjectConnectionFields
    }
  }
  ${StorageDataObjectConnectionFields}
`
export const GetChannelsPage = gql`
  query getChannelsPage($limit: Int!, $lastCursor: String) {
    channelsConnection(first: $limit, after: $lastCursor) {
      ...ChannelConnectionFields
    }
  }
  ${ChannelConnectionFields}
`
export const GetVideosPage = gql`
  query getVideosPage($limit: Int!, $lastCursor: String) {
    videosConnection(first: $limit, after: $lastCursor) {
      ...VideoConnectionFields
    }
  }
  ${VideoConnectionFields}
`
