import * as Types from './schema'

import gql from 'graphql-tag'
export type StorageDataObjectFieldsFragment = {
  id: string
  ipfsHash: string
  isAccepted: boolean
  size: any
  deletionPrize: any
  unsetAt?: Types.Maybe<any>
  storageBagId: string
  type:
    | { __typename: 'DataObjectTypeChannelAvatar' }
    | { __typename: 'DataObjectTypeChannelCoverPhoto' }
    | { __typename: 'DataObjectTypeVideoMedia' }
    | { __typename: 'DataObjectTypeVideoThumbnail' }
    | { __typename: 'DataObjectTypeUnknown' }
}

export type GetDataObjectsByIdsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>
}>

export type GetDataObjectsByIdsQuery = { storageDataObjects: Array<StorageDataObjectFieldsFragment> }

export const StorageDataObjectFields = gql`
  fragment StorageDataObjectFields on StorageDataObject {
    id
    ipfsHash
    isAccepted
    size
    type {
      __typename
    }
    deletionPrize
    unsetAt
    storageBagId
  }
`
export const GetDataObjectsByIds = gql`
  query getDataObjectsByIds($ids: [ID!]) {
    storageDataObjects(where: { id_in: $ids }) {
      ...StorageDataObjectFields
    }
  }
  ${StorageDataObjectFields}
`
