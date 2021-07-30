import * as Types from './schema'

import gql from 'graphql-tag'
export type StorageBucketDetailsFragment = {
  id: string
  operatorMetadata?: Types.Maybe<any>
  operatorStatus: { workerId: number } | { workerId: number }
}

export type GetStorageBucketDetailsQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']
}>

export type GetStorageBucketDetailsQuery = {
  storageBucketByUniqueInput?: Types.Maybe<StorageBucketDetailsFragment>
}

export type GetAllStorageBucketDetailsQueryVariables = Types.Exact<{
  [key: string]: never
}>

export type GetAllStorageBucketDetailsQuery = {
  storageBuckets: Array<StorageBucketDetailsFragment>
}

export type StorageBagDetailsFragment = {
  id: string
  storedBy: Array<{ id: string }>
}

export type GetStorageBagDetailsQueryVariables = Types.Exact<{
  bucketIds?: Types.Maybe<Types.StorageBucketWhereInput>
}>

export type GetStorageBagDetailsQuery = {
  storageBags: Array<StorageBagDetailsFragment>
}

export type DataObjectDetailsFragment = {
  ipfsHash: string
  storageBag: { id: string }
}

export type GetDataObjectDetailsQueryVariables = Types.Exact<{
  bagIds?: Types.Maybe<Types.StorageBagWhereInput>
}>

export type GetDataObjectDetailsQuery = {
  storageDataObjects: Array<DataObjectDetailsFragment>
}

export const StorageBucketDetails = gql`
  fragment StorageBucketDetails on StorageBucket {
    id
    operatorMetadata
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
    storedBy {
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
  query getStorageBucketDetails($id: ID!) {
    storageBucketByUniqueInput(where: { id: $id }) {
      ...StorageBucketDetails
    }
  }
  ${StorageBucketDetails}
`
export const GetAllStorageBucketDetails = gql`
  query getAllStorageBucketDetails {
    storageBuckets {
      ...StorageBucketDetails
    }
  }
  ${StorageBucketDetails}
`
export const GetStorageBagDetails = gql`
  query getStorageBagDetails($bucketIds: StorageBucketWhereInput) {
    storageBags(where: { storedBy_some: $bucketIds }) {
      ...StorageBagDetails
    }
  }
  ${StorageBagDetails}
`
export const GetDataObjectDetails = gql`
  query getDataObjectDetails($bagIds: StorageBagWhereInput) {
    storageDataObjects(where: { storageBag: $bagIds }) {
      ...DataObjectDetails
    }
  }
  ${DataObjectDetails}
`
