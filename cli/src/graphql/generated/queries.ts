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

export type WorkingGroupOpeningMetadataFieldsFragment = {
  description?: Types.Maybe<string>
  shortDescription?: Types.Maybe<string>
  hiringLimit?: Types.Maybe<number>
  expectedEnding?: Types.Maybe<any>
  applicationDetails?: Types.Maybe<string>
  applicationFormQuestions: Array<{ question?: Types.Maybe<string>; type: Types.ApplicationFormQuestionType }>
}

export type WorkingGroupOpeningDetailsFragment = { metadata: WorkingGroupOpeningMetadataFieldsFragment }

export type WorkingGroupApplicationDetailsFragment = {
  answers: Array<{ answer: string; question: { question?: Types.Maybe<string> } }>
}

export type UpcomingWorkingGroupOpeningDetailsFragment = {
  id: string
  groupId: string
  expectedStart?: Types.Maybe<any>
  stakeAmount?: Types.Maybe<any>
  rewardPerBlock?: Types.Maybe<any>
  metadata: WorkingGroupOpeningMetadataFieldsFragment
}

export type OpeningDetailsByIdQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']
}>

export type OpeningDetailsByIdQuery = {
  workingGroupOpeningByUniqueInput?: Types.Maybe<WorkingGroupOpeningDetailsFragment>
}

export type ApplicationDetailsByIdQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']
}>

export type ApplicationDetailsByIdQuery = {
  workingGroupApplicationByUniqueInput?: Types.Maybe<WorkingGroupApplicationDetailsFragment>
}

export type UpcomingWorkingGroupOpeningByEventQueryVariables = Types.Exact<{
  blockNumber: Types.Scalars['Int']
  indexInBlock: Types.Scalars['Int']
}>

export type UpcomingWorkingGroupOpeningByEventQuery = {
  upcomingWorkingGroupOpenings: Array<UpcomingWorkingGroupOpeningDetailsFragment>
}

export type UpcomingWorkingGroupOpeningsByGroupQueryVariables = Types.Exact<{
  workingGroupId: Types.Scalars['ID']
}>

export type UpcomingWorkingGroupOpeningsByGroupQuery = {
  upcomingWorkingGroupOpenings: Array<UpcomingWorkingGroupOpeningDetailsFragment>
}

export type UpcomingWorkingGroupOpeningByIdQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']
}>

export type UpcomingWorkingGroupOpeningByIdQuery = {
  upcomingWorkingGroupOpeningByUniqueInput?: Types.Maybe<UpcomingWorkingGroupOpeningDetailsFragment>
}

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
export const WorkingGroupOpeningMetadataFields = gql`
  fragment WorkingGroupOpeningMetadataFields on WorkingGroupOpeningMetadata {
    description
    shortDescription
    hiringLimit
    expectedEnding
    applicationDetails
    applicationFormQuestions {
      question
      type
    }
  }
`
export const WorkingGroupOpeningDetails = gql`
  fragment WorkingGroupOpeningDetails on WorkingGroupOpening {
    metadata {
      ...WorkingGroupOpeningMetadataFields
    }
  }
  ${WorkingGroupOpeningMetadataFields}
`
export const WorkingGroupApplicationDetails = gql`
  fragment WorkingGroupApplicationDetails on WorkingGroupApplication {
    answers {
      question {
        question
      }
      answer
    }
  }
`
export const UpcomingWorkingGroupOpeningDetails = gql`
  fragment UpcomingWorkingGroupOpeningDetails on UpcomingWorkingGroupOpening {
    id
    groupId
    expectedStart
    stakeAmount
    rewardPerBlock
    metadata {
      ...WorkingGroupOpeningMetadataFields
    }
  }
  ${WorkingGroupOpeningMetadataFields}
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
export const OpeningDetailsById = gql`
  query openingDetailsById($id: ID!) {
    workingGroupOpeningByUniqueInput(where: { id: $id }) {
      ...WorkingGroupOpeningDetails
    }
  }
  ${WorkingGroupOpeningDetails}
`
export const ApplicationDetailsById = gql`
  query applicationDetailsById($id: ID!) {
    workingGroupApplicationByUniqueInput(where: { id: $id }) {
      ...WorkingGroupApplicationDetails
    }
  }
  ${WorkingGroupApplicationDetails}
`
export const UpcomingWorkingGroupOpeningByEvent = gql`
  query upcomingWorkingGroupOpeningByEvent($blockNumber: Int!, $indexInBlock: Int!) {
    upcomingWorkingGroupOpenings(
      where: { createdInEvent: { inBlock_eq: $blockNumber, indexInBlock_eq: $indexInBlock } }
    ) {
      ...UpcomingWorkingGroupOpeningDetails
    }
  }
  ${UpcomingWorkingGroupOpeningDetails}
`
export const UpcomingWorkingGroupOpeningsByGroup = gql`
  query upcomingWorkingGroupOpeningsByGroup($workingGroupId: ID!) {
    upcomingWorkingGroupOpenings(where: { group: { id_eq: $workingGroupId } }, orderBy: createdAt_DESC) {
      ...UpcomingWorkingGroupOpeningDetails
    }
  }
  ${UpcomingWorkingGroupOpeningDetails}
`
export const UpcomingWorkingGroupOpeningById = gql`
  query upcomingWorkingGroupOpeningById($id: ID!) {
    upcomingWorkingGroupOpeningByUniqueInput(where: { id: $id }) {
      ...UpcomingWorkingGroupOpeningDetails
    }
  }
  ${UpcomingWorkingGroupOpeningDetails}
`
