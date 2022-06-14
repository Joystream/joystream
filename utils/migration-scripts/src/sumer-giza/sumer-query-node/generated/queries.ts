import * as Types from './schema'

import gql from 'graphql-tag'
export type VideoCategoryFieldsFragment = { id: string; name?: Types.Maybe<string> }

export type ChannelCategoryFieldsFragment = { id: string; name?: Types.Maybe<string> }

export type DataObjectFieldsFragment = {
  id: string
  joystreamContentId: string
  size: number
  liaisonJudgement: Types.LiaisonJudgement
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
  thumbnailPhotoDataObject?: Types.Maybe<DataObjectFieldsFragment>
  language?: Types.Maybe<{ iso: string }>
  license?: Types.Maybe<{
    code?: Types.Maybe<number>
    attribution?: Types.Maybe<string>
    customText?: Types.Maybe<string>
  }>
  mediaDataObject?: Types.Maybe<DataObjectFieldsFragment>
  mediaMetadata?: Types.Maybe<{
    pixelWidth?: Types.Maybe<number>
    pixelHeight?: Types.Maybe<number>
    size?: Types.Maybe<number>
    encoding?: Types.Maybe<{
      codecName?: Types.Maybe<string>
      container?: Types.Maybe<string>
      mimeMediaType?: Types.Maybe<string>
    }>
  }>
  channel?: Types.Maybe<{ id: string; ownerMember?: Types.Maybe<{ id: string; controllerAccount: string }> }>
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
  coverPhotoDataObject?: Types.Maybe<DataObjectFieldsFragment>
  avatarPhotoDataObject?: Types.Maybe<DataObjectFieldsFragment>
  language?: Types.Maybe<{ iso: string }>
  videos: Array<{ id: string }>
}

export type WorkerFieldsFragment = { id: string; metadata?: Types.Maybe<string> }

export type GetChannelsByIdsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetChannelsByIdsQuery = { channels: Array<ChannelFieldsFragment> }

export type GetVideosByIdsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetVideosByIdsQuery = { videos: Array<VideoFieldsFragment> }

export type GetVideoCategoriesQueryVariables = Types.Exact<{ [key: string]: never }>

export type GetVideoCategoriesQuery = { videoCategories: Array<VideoCategoryFieldsFragment> }

export type GetChannelsCategoriesQueryVariables = Types.Exact<{ [key: string]: never }>

export type GetChannelsCategoriesQuery = { channelCategories: Array<ChannelCategoryFieldsFragment> }

export type GetStorageWorkersQueryVariables = Types.Exact<{ [key: string]: never }>

export type GetStorageWorkersQuery = { workers: Array<WorkerFieldsFragment> }

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
export const DataObjectFields = gql`
  fragment DataObjectFields on DataObject {
    id
    joystreamContentId
    size
    liaisonJudgement
  }
`
export const VideoFields = gql`
  fragment VideoFields on Video {
    id
    categoryId
    title
    description
    duration
    thumbnailPhotoDataObject {
      ...DataObjectFields
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
    mediaDataObject {
      ...DataObjectFields
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
  ${DataObjectFields}
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
    coverPhotoDataObject {
      ...DataObjectFields
    }
    avatarPhotoDataObject {
      ...DataObjectFields
    }
    isPublic
    isCensored
    language {
      iso
    }
    videos {
      id
    }
  }
  ${DataObjectFields}
`
export const WorkerFields = gql`
  fragment WorkerFields on Worker {
    id
    metadata
  }
`
export const GetChannelsByIds = gql`
  query getChannelsByIds($ids: [ID!]) {
    channels(where: { id_in: $ids }, limit: 1000) {
      ...ChannelFields
    }
  }
  ${ChannelFields}
`
export const GetVideosByIds = gql`
  query getVideosByIds($ids: [ID!]) {
    videos(where: { id_in: $ids }, limit: 1000) {
      ...VideoFields
    }
  }
  ${VideoFields}
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
export const GetStorageWorkers = gql`
  query getStorageWorkers {
    workers(where: { type_eq: STORAGE }) {
      ...WorkerFields
    }
  }
  ${WorkerFields}
`
