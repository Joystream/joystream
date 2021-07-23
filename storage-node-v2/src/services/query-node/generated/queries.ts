import * as Types from './schema'

import gql from 'graphql-tag'
export type StorageBucketDetailsFragment = {
  id: string
  acceptingNewBags: boolean
}

export type GetStorageBucketDetailsQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']
}>

export type GetStorageBucketDetailsQuery = {
  storageBucketByUniqueInput?: Types.Maybe<StorageBucketDetailsFragment>
}

export const StorageBucketDetails = gql`
  fragment StorageBucketDetails on StorageBucket {
    id
    acceptingNewBags
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
