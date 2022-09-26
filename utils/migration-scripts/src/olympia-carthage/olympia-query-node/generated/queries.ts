import * as Types from './schema'

import gql from 'graphql-tag'
export type MembershipFieldsFragment = {
  id: string
  handle: string
  controllerAccount: string
  rootAccount: string
  isFoundingMember: boolean
  metadata: {
    name?: Types.Maybe<string>
    about?: Types.Maybe<string>
    avatar?: Types.Maybe<{ avatarUri: string }>
    externalResources?: Types.Maybe<Array<{ value: string }>>
  }
}

export type MembershipConnectionFieldsFragment = {
  edges: Array<{ node: MembershipFieldsFragment }>
  pageInfo: { hasNextPage: boolean; endCursor?: Types.Maybe<string> }
}

export type GetMembershipsPageQueryVariables = Types.Exact<{
  limit: Types.Scalars['Int']
  lastCursor?: Types.Maybe<Types.Scalars['String']>
}>

export type GetMembershipsPageQuery = { membershipsConnection: MembershipConnectionFieldsFragment }

export const MembershipFields = gql`
  fragment MembershipFields on Membership {
    id
    handle
    metadata {
      name
      about
      avatar {
        ... on AvatarUri {
          avatarUri
        }
      }
      externalResources {
        value
      }
    }
    controllerAccount
    rootAccount
    isFoundingMember
  }
`
export const MembershipConnectionFields = gql`
  fragment MembershipConnectionFields on MembershipConnection {
    edges {
      node {
        ...MembershipFields
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
  ${MembershipFields}
`
export const GetMembershipsPage = gql`
  query getMembershipsPage($limit: Int!, $lastCursor: String) {
    membershipsConnection(first: $limit, after: $lastCursor) {
      ...MembershipConnectionFields
    }
  }
  ${MembershipConnectionFields}
`
