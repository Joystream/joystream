import * as Types from './schema'

import gql from 'graphql-tag'
export type StorageBucketDetailsFragment = {
  id: string
  operatorMetadata?: Types.Maybe<{ id: string; nodeEndpoint?: Types.Maybe<string> }>
  operatorStatus: { workerId: number } | { workerId: number }
}

export type GetStorageBucketDetailsQueryVariables = Types.Exact<{
  offset?: Types.Maybe<Types.Scalars['Int']>
  limit?: Types.Maybe<Types.Scalars['Int']>
}>

export type GetStorageBucketDetailsQuery = { storageBuckets: Array<StorageBucketDetailsFragment> }

export type StorageBagDetailsFragment = { id: string; storageAssignments: Array<{ id: string }> }

export type GetStorageBagDetailsQueryVariables = Types.Exact<{
  bucketIds?: Types.Maybe<Types.StorageBagStorageAssignmentWhereInput>
  offset?: Types.Maybe<Types.Scalars['Int']>
  limit?: Types.Maybe<Types.Scalars['Int']>
}>

export type GetStorageBagDetailsQuery = { storageBags: Array<StorageBagDetailsFragment> }

export type DataObjectDetailsFragment = { ipfsHash: string; storageBag: { id: string } }

export type GetDataObjectDetailsQueryVariables = Types.Exact<{
  bagIds?: Types.Maybe<Types.StorageBagWhereInput>
  offset?: Types.Maybe<Types.Scalars['Int']>
  limit?: Types.Maybe<Types.Scalars['Int']>
}>

export type GetDataObjectDetailsQuery = { storageDataObjects: Array<DataObjectDetailsFragment> }

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
    storageAssignments {
      id
    }
  }
`
export const DataObjectDetails = gql`
  fragment DataObjectDetails on StorageDataObject {
    ipfsHash
    storageBag {
      id
    }
  }
`
export const GetStorageBucketDetails = gql`
  query getStorageBucketDetails($offset: Int, $limit: Int) {
    storageBuckets(offset: $offset, limit: $limit) {
      ...StorageBucketDetails
    }
  }
  ${StorageBucketDetails}
`
export const GetStorageBagDetails = gql`
  query getStorageBagDetails($bucketIds: StorageBagStorageAssignmentWhereInput, $offset: Int, $limit: Int) {
    storageBags(offset: $offset, limit: $limit, where: { storageAssignments_some: $bucketIds }) {
      ...StorageBagDetails
    }
  }
  ${StorageBagDetails}
`
export const GetDataObjectDetails = gql`
  query getDataObjectDetails($bagIds: StorageBagWhereInput, $offset: Int, $limit: Int) {
    storageDataObjects(offset: $offset, limit: $limit, where: { storageBag: $bagIds, isAccepted_eq: true }) {
      ...DataObjectDetails
    }
  }
  ${DataObjectDetails}
`
