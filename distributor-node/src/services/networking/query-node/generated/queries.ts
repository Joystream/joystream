import * as Types from './schema';

import gql from 'graphql-tag';
export type DataObjectDetailsFragment = { id: string, size: any, ipfsHash: string, isAccepted: boolean, storageBag: { storedBy: Array<{ id: string, operatorMetadata?: Types.Maybe<{ nodeEndpoint?: Types.Maybe<string> }>, operatorStatus: { __typename: 'StorageBucketOperatorStatusMissing' } | { __typename: 'StorageBucketOperatorStatusInvited' } | { __typename: 'StorageBucketOperatorStatusActive' } }>, distributedBy: Array<{ id: string }> } };

export type GetDataObjectDetailsQueryVariables = Types.Exact<{
  id: Types.Scalars['ID'];
}>;


export type GetDataObjectDetailsQuery = { storageDataObjectByUniqueInput?: Types.Maybe<DataObjectDetailsFragment> };

export type DistirubtionBucketsWithObjectsFragment = { id: string, distributedBags: Array<{ objects: Array<{ id: string, size: any, ipfsHash: string }> }> };

export type GetDistributionBucketsWithObjectsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>;
}>;


export type GetDistributionBucketsWithObjectsQuery = { distributionBuckets: Array<DistirubtionBucketsWithObjectsFragment> };

export const DataObjectDetails = gql`
    fragment DataObjectDetails on StorageDataObject {
  id
  size
  ipfsHash
  isAccepted
  storageBag {
    storedBy {
      id
      operatorMetadata {
        nodeEndpoint
      }
      operatorStatus {
        __typename
      }
    }
    distributedBy {
      id
    }
  }
}
    `;
export const DistirubtionBucketsWithObjects = gql`
    fragment DistirubtionBucketsWithObjects on DistributionBucket {
  id
  distributedBags {
    objects {
      id
      size
      ipfsHash
    }
  }
}
    `;
export const GetDataObjectDetails = gql`
    query getDataObjectDetails($id: ID!) {
  storageDataObjectByUniqueInput(where: {id: $id}) {
    ...DataObjectDetails
  }
}
    ${DataObjectDetails}`;
export const GetDistributionBucketsWithObjects = gql`
    query getDistributionBucketsWithObjects($ids: [ID!]) {
  distributionBuckets(where: {id_in: $ids}) {
    ...DistirubtionBucketsWithObjects
  }
}
    ${DistirubtionBucketsWithObjects}`;