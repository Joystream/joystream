import * as Types from './schema';

import gql from 'graphql-tag';
export type DistributionBucketOperatorDetailsFragment = { workerId: number, status: Types.DistributionBucketOperatorStatus };

export type DistributionBucketDetailsFragment = { id: string, operators: Array<DistributionBucketOperatorDetailsFragment> };

export type StorageBucketDetailsFragment = { id: string, operatorMetadata?: Types.Maybe<{ nodeEndpoint?: Types.Maybe<string> }>, operatorStatus: { __typename: 'StorageBucketOperatorStatusMissing' } | { __typename: 'StorageBucketOperatorStatusInvited' } | { __typename: 'StorageBucketOperatorStatusActive' } };

export type DataObjectDetailsFragment = { id: string, size: any, ipfsHash: string, isAccepted: boolean, storageBag: { storageAssignments: Array<{ storageBucket: StorageBucketDetailsFragment }>, distirbutionAssignments: Array<{ distributionBucket: DistributionBucketDetailsFragment }> } };

export type GetDataObjectDetailsQueryVariables = Types.Exact<{
  id: Types.Scalars['ID'];
}>;


export type GetDataObjectDetailsQuery = { storageDataObjectByUniqueInput?: Types.Maybe<DataObjectDetailsFragment> };

export type DistirubtionBucketWithObjectsFragment = { id: string, bagAssignments: Array<{ storageBag: { objects: Array<{ id: string, size: any, ipfsHash: string }> } }> };

export type GetDistributionBucketsWithObjectsByIdsQueryVariables = Types.Exact<{
  ids?: Types.Maybe<Array<Types.Scalars['ID']> | Types.Scalars['ID']>;
}>;


export type GetDistributionBucketsWithObjectsByIdsQuery = { distributionBuckets: Array<DistirubtionBucketWithObjectsFragment> };

export type GetDistributionBucketsWithObjectsByWorkerIdQueryVariables = Types.Exact<{
  workerId: Types.Scalars['Int'];
}>;


export type GetDistributionBucketsWithObjectsByWorkerIdQuery = { distributionBuckets: Array<DistirubtionBucketWithObjectsFragment> };

export type StorageBucketOperatorFieldsFragment = { id: string, operatorMetadata?: Types.Maybe<{ nodeEndpoint?: Types.Maybe<string> }> };

export type StorageBucketsConnectionFieldsFragment = { edges: Array<{ node: StorageBucketOperatorFieldsFragment }>, pageInfo: { hasNextPage: boolean, endCursor?: Types.Maybe<string> } };

export type GetActiveStorageBucketOperatorsDataQueryVariables = Types.Exact<{
  limit: Types.Scalars['Int'];
  lastCursor?: Types.Maybe<Types.Scalars['String']>;
}>;


export type GetActiveStorageBucketOperatorsDataQuery = { storageBucketsConnection: StorageBucketsConnectionFieldsFragment };

export const StorageBucketDetails = gql`
    fragment StorageBucketDetails on StorageBucket {
  id
  operatorMetadata {
    nodeEndpoint
  }
  operatorStatus {
    __typename
  }
}
    `;
export const DistributionBucketOperatorDetails = gql`
    fragment DistributionBucketOperatorDetails on DistributionBucketOperator {
  workerId
  status
}
    `;
export const DistributionBucketDetails = gql`
    fragment DistributionBucketDetails on DistributionBucket {
  id
  operators {
    ...DistributionBucketOperatorDetails
  }
}
    ${DistributionBucketOperatorDetails}`;
export const DataObjectDetails = gql`
    fragment DataObjectDetails on StorageDataObject {
  id
  size
  ipfsHash
  isAccepted
  storageBag {
    storageAssignments {
      storageBucket {
        ...StorageBucketDetails
      }
    }
    distirbutionAssignments {
      distributionBucket {
        ...DistributionBucketDetails
      }
    }
  }
}
    ${StorageBucketDetails}
${DistributionBucketDetails}`;
export const DistirubtionBucketWithObjects = gql`
    fragment DistirubtionBucketWithObjects on DistributionBucket {
  id
  bagAssignments {
    storageBag {
      objects {
        id
        size
        ipfsHash
      }
    }
  }
}
    `;
export const StorageBucketOperatorFields = gql`
    fragment StorageBucketOperatorFields on StorageBucket {
  id
  operatorMetadata {
    nodeEndpoint
  }
}
    `;
export const StorageBucketsConnectionFields = gql`
    fragment StorageBucketsConnectionFields on StorageBucketConnection {
  edges {
    node {
      ...StorageBucketOperatorFields
    }
  }
  pageInfo {
    hasNextPage
    endCursor
  }
}
    ${StorageBucketOperatorFields}`;
export const GetDataObjectDetails = gql`
    query getDataObjectDetails($id: ID!) {
  storageDataObjectByUniqueInput(where: {id: $id}) {
    ...DataObjectDetails
  }
}
    ${DataObjectDetails}`;
export const GetDistributionBucketsWithObjectsByIds = gql`
    query getDistributionBucketsWithObjectsByIds($ids: [ID!]) {
  distributionBuckets(where: {id_in: $ids}) {
    ...DistirubtionBucketWithObjects
  }
}
    ${DistirubtionBucketWithObjects}`;
export const GetDistributionBucketsWithObjectsByWorkerId = gql`
    query getDistributionBucketsWithObjectsByWorkerId($workerId: Int!) {
  distributionBuckets(where: {operators_some: {workerId_eq: $workerId, status_eq: ACTIVE}}) {
    ...DistirubtionBucketWithObjects
  }
}
    ${DistirubtionBucketWithObjects}`;
export const GetActiveStorageBucketOperatorsData = gql`
    query getActiveStorageBucketOperatorsData($limit: Int!, $lastCursor: String) {
  storageBucketsConnection(first: $limit, after: $lastCursor, where: {operatorStatus_json: {isTypeOf_eq: "StorageBucketOperatorStatusActive"}}) {
    ...StorageBucketsConnectionFields
  }
}
    ${StorageBucketsConnectionFields}`;