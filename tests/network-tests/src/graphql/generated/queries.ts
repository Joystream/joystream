import * as Types from './schema'

import gql from 'graphql-tag'
type DataObjectTypeFields_DataObjectTypeChannelAvatar_Fragment = {
  __typename: 'DataObjectTypeChannelAvatar'
  channel?: Types.Maybe<{ id: string }>
}

type DataObjectTypeFields_DataObjectTypeChannelCoverPhoto_Fragment = {
  __typename: 'DataObjectTypeChannelCoverPhoto'
  channel?: Types.Maybe<{ id: string }>
}

type DataObjectTypeFields_DataObjectTypeVideoMedia_Fragment = {
  __typename: 'DataObjectTypeVideoMedia'
  video?: Types.Maybe<{ id: string }>
}

type DataObjectTypeFields_DataObjectTypeVideoThumbnail_Fragment = {
  __typename: 'DataObjectTypeVideoThumbnail'
  video?: Types.Maybe<{ id: string }>
}

type DataObjectTypeFields_DataObjectTypeUnknown_Fragment = { __typename: 'DataObjectTypeUnknown' }

export type DataObjectTypeFieldsFragment =
  | DataObjectTypeFields_DataObjectTypeChannelAvatar_Fragment
  | DataObjectTypeFields_DataObjectTypeChannelCoverPhoto_Fragment
  | DataObjectTypeFields_DataObjectTypeVideoMedia_Fragment
  | DataObjectTypeFields_DataObjectTypeVideoThumbnail_Fragment
  | DataObjectTypeFields_DataObjectTypeUnknown_Fragment

export type StorageDataObjectFieldsFragment = {
  id: string
  ipfsHash: string
  isAccepted: boolean
  size: any
  deletionPrize: any
  unsetAt?: Types.Maybe<any>
  storageBagId: string
  type:
    | DataObjectTypeFields_DataObjectTypeChannelAvatar_Fragment
    | DataObjectTypeFields_DataObjectTypeChannelCoverPhoto_Fragment
    | DataObjectTypeFields_DataObjectTypeVideoMedia_Fragment
    | DataObjectTypeFields_DataObjectTypeVideoThumbnail_Fragment
    | DataObjectTypeFields_DataObjectTypeUnknown_Fragment
}

export type ChannelFieldsFragment = {
  title?: Types.Maybe<string>
  description?: Types.Maybe<string>
  isPublic?: Types.Maybe<boolean>
  rewardAccount?: Types.Maybe<string>
  isCensored: boolean
  language?: Types.Maybe<{ iso: string }>
  ownerMember?: Types.Maybe<{ id: string }>
  ownerCuratorGroup?: Types.Maybe<{ id: string }>
  category?: Types.Maybe<{ name?: Types.Maybe<string> }>
  avatarPhoto?: Types.Maybe<StorageDataObjectFieldsFragment>
  coverPhoto?: Types.Maybe<StorageDataObjectFieldsFragment>
}

export type GetDataObjectsByIdsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetDataObjectsByIdsQuery = { storageDataObjects: Array<StorageDataObjectFieldsFragment> }

export type GetChannelByIdQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']
}>

export type GetChannelByIdQuery = { channelByUniqueInput?: Types.Maybe<ChannelFieldsFragment> }

export const DataObjectTypeFields = gql`
  fragment DataObjectTypeFields on DataObjectType {
    __typename
    ... on DataObjectTypeChannelAvatar {
      channel {
        id
      }
    }
    ... on DataObjectTypeChannelCoverPhoto {
      channel {
        id
      }
    }
    ... on DataObjectTypeVideoThumbnail {
      video {
        id
      }
    }
    ... on DataObjectTypeVideoMedia {
      video {
        id
      }
    }
  }
`
export const StorageDataObjectFields = gql`
  fragment StorageDataObjectFields on StorageDataObject {
    id
    ipfsHash
    isAccepted
    size
    type {
      ...DataObjectTypeFields
    }
    deletionPrize
    unsetAt
    storageBagId
  }
  ${DataObjectTypeFields}
`
export const ChannelFields = gql`
  fragment ChannelFields on Channel {
    title
    description
    isPublic
    language {
      iso
    }
    rewardAccount
    isCensored
    ownerMember {
      id
    }
    ownerCuratorGroup {
      id
    }
    category {
      name
    }
    avatarPhoto {
      ...StorageDataObjectFields
    }
    coverPhoto {
      ...StorageDataObjectFields
    }
  }
  ${StorageDataObjectFields}
`
export const GetDataObjectsByIds = gql`
  query getDataObjectsByIds($ids: [ID!]) {
    storageDataObjects(where: { id_in: $ids }) {
      ...StorageDataObjectFields
    }
  }
  ${StorageDataObjectFields}
`
export const GetChannelById = gql`
  query getChannelById($id: ID!) {
    channelByUniqueInput(where: { id: $id }) {
      ...ChannelFields
    }
  }
  ${ChannelFields}
`
