import { ApolloClient, NormalizedCacheObject, HttpLink, InMemoryCache, DocumentNode } from '@apollo/client'
import fetch from 'cross-fetch'
import {
  DataObjectDetailsFragment,
  GetDataObjectDetails,
  GetDataObjectDetailsQuery,
  GetDataObjectDetailsQueryVariables,
  DistirubtionBucketWithObjectsFragment,
  GetDistributionBucketsWithObjectsByIdsQuery,
  GetDistributionBucketsWithObjectsByIdsQueryVariables,
  GetDistributionBucketsWithObjectsByIds,
  GetDistributionBucketsWithObjectsByWorkerIdQuery,
  GetDistributionBucketsWithObjectsByWorkerIdQueryVariables,
  GetDistributionBucketsWithObjectsByWorkerId,
  StorageBucketOperatorFieldsFragment,
  GetActiveStorageBucketOperatorsDataQuery,
  GetActiveStorageBucketOperatorsDataQueryVariables,
  GetActiveStorageBucketOperatorsData,
} from './generated/queries'
import { Maybe } from './generated/schema'

export class QueryNodeApi {
  private apolloClient: ApolloClient<NormalizedCacheObject>

  public constructor(endpoint: string) {
    this.apolloClient = new ApolloClient({
      link: new HttpLink({ uri: endpoint, fetch }),
      cache: new InMemoryCache(),
      defaultOptions: { query: { fetchPolicy: 'no-cache', errorPolicy: 'all' } },
    })
  }

  // Get entity by unique input
  protected async uniqueEntityQuery<
    QueryT extends { [k: string]: Maybe<Record<string, unknown>> | undefined },
    VariablesT extends Record<string, unknown>
  >(
    query: DocumentNode,
    variables: VariablesT,
    resultKey: keyof QueryT
  ): Promise<Required<QueryT>[keyof QueryT] | null> {
    return (await this.apolloClient.query<QueryT, VariablesT>({ query, variables })).data[resultKey] || null
  }

  // Get entities by "non-unique" input and return first result
  protected async firstEntityQuery<
    QueryT extends { [k: string]: unknown[] },
    VariablesT extends Record<string, unknown>
  >(query: DocumentNode, variables: VariablesT, resultKey: keyof QueryT): Promise<QueryT[keyof QueryT][number] | null> {
    return (await this.apolloClient.query<QueryT, VariablesT>({ query, variables })).data[resultKey][0] || null
  }

  // Query-node: get multiple entities
  protected async multipleEntitiesQuery<
    QueryT extends { [k: string]: unknown[] },
    VariablesT extends Record<string, unknown>
  >(query: DocumentNode, variables: VariablesT, resultKey: keyof QueryT): Promise<QueryT[keyof QueryT]> {
    return (await this.apolloClient.query<QueryT, VariablesT>({ query, variables })).data[resultKey]
  }

  public getDataObjectDetails(objectId: string): Promise<DataObjectDetailsFragment | null> {
    return this.uniqueEntityQuery<GetDataObjectDetailsQuery, GetDataObjectDetailsQueryVariables>(
      GetDataObjectDetails,
      { id: objectId },
      'storageDataObjectByUniqueInput'
    )
  }

  public getDistributionBucketsWithObjectsByIds(ids: string[]): Promise<DistirubtionBucketWithObjectsFragment[]> {
    return this.multipleEntitiesQuery<
      GetDistributionBucketsWithObjectsByIdsQuery,
      GetDistributionBucketsWithObjectsByIdsQueryVariables
    >(GetDistributionBucketsWithObjectsByIds, { ids }, 'distributionBuckets')
  }

  public getDistributionBucketsWithObjectsByWorkerId(
    workerId: number
  ): Promise<DistirubtionBucketWithObjectsFragment[]> {
    return this.multipleEntitiesQuery<
      GetDistributionBucketsWithObjectsByWorkerIdQuery,
      GetDistributionBucketsWithObjectsByWorkerIdQueryVariables
    >(GetDistributionBucketsWithObjectsByWorkerId, { workerId }, 'distributionBuckets')
  }

  public getActiveStorageBucketOperatorsData(): Promise<StorageBucketOperatorFieldsFragment[]> {
    return this.multipleEntitiesQuery<
      GetActiveStorageBucketOperatorsDataQuery,
      GetActiveStorageBucketOperatorsDataQueryVariables
    >(GetActiveStorageBucketOperatorsData, {}, 'storageBuckets')
  }
}
