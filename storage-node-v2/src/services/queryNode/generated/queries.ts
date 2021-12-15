import * as Types from './schema'

import gql from 'graphql-tag'
export type StorageBucketIdsFragment = { id: string }

export type GetStorageBucketsConnectionQueryVariables = Types.Exact<{
  limit?: Types.Maybe<Types.Scalars['Int']>
  cursor?: Types.Maybe<Types.Scalars['String']>
}>

export type GetStorageBucketsConnectionQuery = {
  storageBucketsConnection: {
    totalCount: number
    edges: Array<{ cursor: string; node: StorageBucketIdsFragment }>
    pageInfo: { hasNextPage: boolean; endCursor?: Types.Maybe<string> }
  }
}

export type GetStorageBucketDetailsByWorkerIdQueryVariables = Types.Exact<{
  workerId?: Types.Maybe<Types.Scalars['ID']>
  limit?: Types.Maybe<Types.Scalars['Int']>
  cursor?: Types.Maybe<Types.Scalars['String']>
}>

export type GetStorageBucketDetailsByWorkerIdQuery = {
  storageBucketsConnection: {
    totalCount: number
    edges: Array<{ cursor: string; node: StorageBucketIdsFragment }>
    pageInfo: { hasNextPage: boolean; endCursor?: Types.Maybe<string> }
  }
}

export type StorageBucketDetailsFragment = {
  id: string
  operatorMetadata?: Types.Maybe<{ id: string; nodeEndpoint?: Types.Maybe<string> }>
  operatorStatus: { workerId: number } | { workerId: number }
}

export type GetStorageBucketDetailsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
  offset?: Types.Maybe<Types.Scalars['Int']>
  limit?: Types.Maybe<Types.Scalars['Int']>
}>

export type GetStorageBucketDetailsQuery = { storageBuckets: Array<StorageBucketDetailsFragment> }

export type StorageBagDetailsFragment = { id: string; storageBuckets: Array<{ id: string }> }

export type GetStorageBagDetailsQueryVariables = Types.Exact<{
  bucketIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
  offset?: Types.Maybe<Types.Scalars['Int']>
  limit?: Types.Maybe<Types.Scalars['Int']>
}>

export type GetStorageBagDetailsQuery = { storageBags: Array<StorageBagDetailsFragment> }

export type GetBagConnectionQueryVariables = Types.Exact<{
  bucketIds?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
  limit?: Types.Maybe<Types.Scalars['Int']>
  cursor?: Types.Maybe<Types.Scalars['String']>
}>

export type GetBagConnectionQuery = {
  storageBagsConnection: {
    totalCount: number
    edges: Array<{ cursor: string; node: StorageBagDetailsFragment }>
    pageInfo: { hasNextPage: boolean; endCursor?: Types.Maybe<string> }
  }
}

export type DataObjectDetailsFragment = { id: string; storageBagId: string }

export type GetDataObjectConnectionQueryVariables = Types.Exact<{
  bagIds?: Types.Maybe<Types.StorageBagWhereInput>
  limit?: Types.Maybe<Types.Scalars['Int']>
  cursor?: Types.Maybe<Types.Scalars['String']>
}>

export type GetDataObjectConnectionQuery = {
  storageDataObjectsConnection: {
    totalCount: number
    edges: Array<{ cursor: string; node: DataObjectDetailsFragment }>
    pageInfo: { hasNextPage: boolean; endCursor?: Types.Maybe<string> }
  }
}

export const StorageBucketIds = gql`
  fragment StorageBucketIds on StorageBucket {
    id
  }
`
export const StorageBucketDetails = gql`
  fragment StorageBucketDetails on StorageBucket {
    id
    operatorMetadata {
      id
      nodeEndpoint
    }
    operatorStatus {
      ... on StorageBucketOperatorStatusActive {
        workerId
      }
      ... on StorageBucketOperatorStatusInvited {
        workerId
      }
    }
  }
`
export const StorageBagDetails = gql`
  fragment StorageBagDetails on StorageBag {
    id
    storageBuckets {
      id
    }
  }
`
export const DataObjectDetails = gql`
  fragment DataObjectDetails on StorageDataObject {
    id
    storageBagId
  }
`
export const GetStorageBucketsConnection = gql`
  query getStorageBucketsConnection($limit: Int, $cursor: String) {
    storageBucketsConnection(
      first: $limit
      after: $cursor
      where: { operatorStatus_json: { isTypeOf_eq: "StorageBucketOperatorStatusActive" } }
    ) {
      edges {
        cursor
        node {
          ...StorageBucketIds
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
  ${StorageBucketIds}
`
export const GetStorageBucketDetailsByWorkerId = gql`
  query getStorageBucketDetailsByWorkerId($workerId: ID, $limit: Int, $cursor: String) {
    storageBucketsConnection(
      first: $limit
      after: $cursor
      where: { operatorStatus_json: { isTypeOf_eq: "StorageBucketOperatorStatusActive", workerId_eq: $workerId } }
    ) {
      edges {
        cursor
        node {
          ...StorageBucketIds
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
  ${StorageBucketIds}
`
export const GetStorageBucketDetails = gql`
  query getStorageBucketDetails($ids: [ID!], $offset: Int, $limit: Int) {
    storageBuckets(where: { id_in: $ids }, offset: $offset, limit: $limit) {
      ...StorageBucketDetails
    }
  }
  ${StorageBucketDetails}
`
export const GetStorageBagDetails = gql`
  query getStorageBagDetails($bucketIds: [ID!], $offset: Int, $limit: Int) {
    storageBags(offset: $offset, limit: $limit, where: { storageBuckets_some: { id_in: $bucketIds } }) {
      ...StorageBagDetails
    }
  }
  ${StorageBagDetails}
`
export const GetBagConnection = gql`
  query getBagConnection($bucketIds: [ID!], $limit: Int, $cursor: String) {
    storageBagsConnection(first: $limit, after: $cursor, where: { storageBuckets_some: { id_in: $bucketIds } }) {
      edges {
        cursor
        node {
          ...StorageBagDetails
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
  ${StorageBagDetails}
`
export const GetDataObjectConnection = gql`
  query getDataObjectConnection($bagIds: StorageBagWhereInput, $limit: Int, $cursor: String) {
    storageDataObjectsConnection(first: $limit, after: $cursor, where: { storageBag: $bagIds, isAccepted_eq: true }) {
      edges {
        cursor
        node {
          ...DataObjectDetails
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
  ${DataObjectDetails}
`
