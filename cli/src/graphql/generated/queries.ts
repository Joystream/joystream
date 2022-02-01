import * as Types from './schema'

import gql from 'graphql-tag'
export type MemberMetadataFieldsFragment = { name?: Types.Maybe<string>; about?: Types.Maybe<string> }

export type MembershipFieldsFragment = { id: string; handle: string; metadata: MemberMetadataFieldsFragment }

export type GetMembersByIdsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetMembersByIdsQuery = { memberships: Array<MembershipFieldsFragment> }

export type StorageNodeInfoFragment = {
  id: string
  operatorMetadata?: Types.Maybe<{ nodeEndpoint?: Types.Maybe<string> }>
}

export type GetStorageNodesInfoByBagIdQueryVariables = Types.Exact<{
  bagId?: Types.Maybe<Types.Scalars['ID']>
}>

export type GetStorageNodesInfoByBagIdQuery = { storageBuckets: Array<StorageNodeInfoFragment> }

export type DataObjectInfoFragment = {
  id: string
  size: any
  deletionPrize: any
  type:
    | { __typename: 'DataObjectTypeChannelAvatar'; channel?: Types.Maybe<{ id: string }> }
    | { __typename: 'DataObjectTypeChannelCoverPhoto'; channel?: Types.Maybe<{ id: string }> }
    | { __typename: 'DataObjectTypeVideoMedia'; video?: Types.Maybe<{ id: string }> }
    | { __typename: 'DataObjectTypeVideoThumbnail'; video?: Types.Maybe<{ id: string }> }
    | { __typename: 'DataObjectTypeUnknown' }
}

export type GetDataObjectsByBagIdQueryVariables = Types.Exact<{
  bagId?: Types.Maybe<Types.Scalars['ID']>
}>

export type GetDataObjectsByBagIdQuery = { storageDataObjects: Array<DataObjectInfoFragment> }

export type GetDataObjectsByChannelIdQueryVariables = Types.Exact<{
  channelId?: Types.Maybe<Types.Scalars['ID']>
}>

export type GetDataObjectsByChannelIdQuery = { storageDataObjects: Array<DataObjectInfoFragment> }

export type GetDataObjectsByVideoIdQueryVariables = Types.Exact<{
  videoId?: Types.Maybe<Types.Scalars['ID']>
}>

export type GetDataObjectsByVideoIdQuery = { storageDataObjects: Array<DataObjectInfoFragment> }

export const MemberMetadataFields = gql`
  fragment MemberMetadataFields on MemberMetadata {
    name
    about
  }
`
export const MembershipFields = gql`
  fragment MembershipFields on Membership {
    id
    handle
    metadata {
      ...MemberMetadataFields
    }
  }
  ${MemberMetadataFields}
`
export const StorageNodeInfo = gql`
  fragment StorageNodeInfo on StorageBucket {
    id
    operatorMetadata {
      nodeEndpoint
    }
  }
`
export const DataObjectInfo = gql`
  fragment DataObjectInfo on StorageDataObject {
    id
    size
    deletionPrize
    type {
      __typename
      ... on DataObjectTypeVideoMedia {
        video {
          id
        }
      }
      ... on DataObjectTypeVideoThumbnail {
        video {
          id
        }
      }
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
    }
  }
`
export const GetMembersByIds = gql`
  query getMembersByIds($ids: [ID!]) {
    memberships(where: { id_in: $ids }) {
      ...MembershipFields
    }
  }
  ${MembershipFields}
`
export const GetStorageNodesInfoByBagId = gql`
  query getStorageNodesInfoByBagId($bagId: ID) {
    storageBuckets(
      where: {
        operatorStatus_json: { isTypeOf_eq: "StorageBucketOperatorStatusActive" }
        bags_some: { id_eq: $bagId }
        operatorMetadata: { nodeEndpoint_contains: "http" }
      }
    ) {
      ...StorageNodeInfo
    }
  }
  ${StorageNodeInfo}
`
export const GetDataObjectsByBagId = gql`
  query getDataObjectsByBagId($bagId: ID) {
    storageDataObjects(where: { storageBag: { id_eq: $bagId } }) {
      ...DataObjectInfo
    }
  }
  ${DataObjectInfo}
`
export const GetDataObjectsByChannelId = gql`
  query getDataObjectsByChannelId($channelId: ID) {
    storageDataObjects(where: { type_json: { channelId_eq: $channelId } }) {
      ...DataObjectInfo
    }
  }
  ${DataObjectInfo}
`
export const GetDataObjectsByVideoId = gql`
  query getDataObjectsByVideoId($videoId: ID) {
    storageDataObjects(where: { type_json: { videoId_eq: $videoId } }) {
      ...DataObjectInfo
    }
  }
  ${DataObjectInfo}
`
