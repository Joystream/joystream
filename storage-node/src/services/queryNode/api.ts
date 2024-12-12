import { ApolloClient, DocumentNode, HttpLink, InMemoryCache, NormalizedCacheObject, from } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import fetch from 'cross-fetch'
import stringify from 'fast-safe-stringify'
import logger from '../logger'
import {
  DataObjectDetailsFragment,
  DataObjectIdsByBagId,
  DataObjectIdsByBagIdQuery,
  DataObjectIdsByBagIdQueryVariables,
  DataObjectsByBagsConnection,
  DataObjectsByBagsConnectionQuery,
  DataObjectsByBagsConnectionQueryVariables,
  DataObjectsByIdsConnection,
  DataObjectsByIdsConnectionQuery,
  DataObjectsByIdsConnectionQueryVariables,
  DataObjectsWithBagDetailsByIds,
  DataObjectsWithBagDetailsByIdsQuery,
  DataObjectsWithBagDetailsByIdsQueryVariables,
  DataObjectWithBagDetailsFragment,
  GetAllStorageBagDetails,
  GetAllStorageBagDetailsQuery,
  GetAllStorageBagDetailsQueryVariables,
  GetDataObjectsDeletedEvents,
  GetDataObjectsDeletedEventsQuery,
  GetDataObjectsDeletedEventsQueryVariables,
  GetSquidVersion,
  GetSquidVersionQuery,
  GetSquidVersionQueryVariables,
  GetStorageBagDetails,
  GetStorageBagDetailsQuery,
  GetStorageBagDetailsQueryVariables,
  GetStorageBucketDetails,
  GetStorageBucketDetailsQuery,
  GetStorageBucketDetailsQueryVariables,
  GetStorageBuckets,
  GetStorageBucketsByWorkerId,
  GetStorageBucketsByWorkerIdQuery,
  GetStorageBucketsByWorkerIdQueryVariables,
  GetStorageBucketsQuery,
  GetStorageBucketsQueryVariables,
  SquidStatus,
  SquidStatusFieldsFragment,
  SquidStatusQuery,
  SquidStatusQueryVariables,
  StorageBagDetailsFragment,
  StorageBucketDetailsFragment,
  StorageBucketIdsFragment,
} from './generated/queries'
import { Maybe } from './generated/schema'

/**
 * Defines query paging limits.
 */
export const MAX_RESULTS_PER_QUERY = 1000

type PaginationQueryVariables = {
  limit: number
  lastCursor?: Maybe<string>
}

export type PaginationQueryResult<T = unknown> = {
  edges: { node: T }[]
  pageInfo: {
    hasNextPage: boolean
    endCursor?: Maybe<string>
  }
}

/**
 * Query node class helper. Incapsulates custom queries.
 *
 */
export class QueryNodeApi {
  private apolloClient: ApolloClient<NormalizedCacheObject>

  public constructor(readonly endpoint: string) {
    const errorLink = onError((error) => {
      const { networkError } = error
      const message = networkError?.message || 'Graphql syntax errors found'
      logger.error(`Error when trying to execute a query: ${message}. ${stringify(error)}`)
    })

    this.apolloClient = new ApolloClient({
      link: from([errorLink, new HttpLink({ uri: endpoint, fetch })]),
      cache: new InMemoryCache(),
      defaultOptions: { query: { fetchPolicy: 'no-cache', errorPolicy: 'all' } },
    })
  }

  /**
   * Get entity by unique input
   *
   * @param query - actual query
   * @param variables - query parameters
   * @param resultKey - hepls result parsing
   */
  protected async uniqueEntityQuery<
    QueryT extends { [k: string]: Maybe<Record<string, unknown>> | undefined },
    VariablesT extends Record<string, unknown>
  >(
    query: DocumentNode,
    variables: VariablesT,
    resultKey: keyof QueryT
  ): Promise<Required<QueryT>[keyof QueryT] | null> {
    const result = await this.apolloClient.query<QueryT, VariablesT>({
      query,
      variables,
    })

    if (result?.data === null) {
      return null
    }

    return result.data[resultKey]
  }

  // Get entities by "non-unique" input and return first result
  protected async firstEntityQuery<
    QueryT extends { [k: string]: unknown[] },
    VariablesT extends Record<string, unknown>
  >(query: DocumentNode, variables: VariablesT, resultKey: keyof QueryT): Promise<QueryT[keyof QueryT][number] | null> {
    const result = await this.apolloClient.query<QueryT, VariablesT>({
      query,
      variables,
    })

    if (result?.data === null) {
      return null
    }
    return result.data[resultKey][0]
  }

  protected async multipleEntitiesWithPagination<
    NodeT,
    QueryT extends { [k: string]: PaginationQueryResult<NodeT> },
    CustomVariablesT extends Record<string, unknown>
  >(
    query: DocumentNode,
    variables: CustomVariablesT,
    resultKey: keyof QueryT,
    itemsPerPage = MAX_RESULTS_PER_QUERY
  ): Promise<NodeT[]> {
    let hasNextPage = true
    let results: NodeT[] = []
    let lastCursor: string | undefined
    while (hasNextPage) {
      const paginationVariables = { limit: itemsPerPage, cursor: lastCursor }
      const queryVariables = { ...variables, ...paginationVariables }
      logger.debug(`Query - ${String(resultKey)}`)
      const result = await this.apolloClient.query<QueryT, PaginationQueryVariables & CustomVariablesT>({
        query,
        variables: queryVariables,
      })

      if (!result?.data) {
        return results
      }

      const page = result.data[resultKey]
      results = results.concat(page.edges.map((e) => e.node))
      hasNextPage = page.pageInfo.hasNextPage
      lastCursor = page.pageInfo.endCursor || undefined
    }
    return results
  }

  /**
   * Query-node: get multiple entities
   *
   * @param query - actual query
   * @param variables - query parameters
   * @param resultKey - hepls result parsing
   */
  protected async multipleEntitiesQuery<
    QueryT extends { [k: string]: unknown[] },
    VariablesT extends Record<string, unknown>
  >(query: DocumentNode, variables: VariablesT, resultKey: keyof QueryT): Promise<QueryT[keyof QueryT]> {
    const result = await this.apolloClient.query<QueryT, VariablesT>({
      query,
      variables,
    })

    if (result?.data === null) {
      return [] as unknown as QueryT[keyof QueryT]
    }

    return result.data[resultKey]
  }

  /**
   * Returns storage bucket IDs filtered by worker ID.
   *
   * @param workerId - worker ID
   */
  public async getStorageBucketIdsByWorkerId(workerId: number): Promise<Array<StorageBucketIdsFragment>> {
    const result = await this.multipleEntitiesQuery<
      GetStorageBucketsByWorkerIdQuery,
      GetStorageBucketsByWorkerIdQueryVariables
    >(GetStorageBucketsByWorkerId, { workerId }, 'storageBuckets')

    if (!result) {
      return []
    }

    return result
  }

  /**
   * Returns storage bucket info by pages.
   *
   * @param ids - bucket IDs to fetch
   * @param offset - starting record of the page
   * @param limit - page size
   */
  public async getStorageBucketDetails(ids: string[]): Promise<Array<StorageBucketDetailsFragment>> {
    const result = await this.multipleEntitiesQuery<
      GetStorageBucketDetailsQuery,
      GetStorageBucketDetailsQueryVariables
    >(GetStorageBucketDetails, { ids }, 'storageBuckets')

    if (result === null) {
      return []
    }

    return result
  }

  /**
   * Returns storage bag info by pages for the given buckets.
   *
   * @param bucketIds - query filter: bucket IDs
   */
  public async getStorageBagsDetails(bucketIds: string[]): Promise<Array<StorageBagDetailsFragment>> {
    const result = await this.multipleEntitiesQuery<GetStorageBagDetailsQuery, GetStorageBagDetailsQueryVariables>(
      GetStorageBagDetails,
      { bucketIds },
      'storageBags'
    )

    if (!result) {
      return []
    }

    return result
  }

  public async getAllStorageBagsDetails(): Promise<Array<StorageBagDetailsFragment>> {
    const result = await this.multipleEntitiesQuery<
      GetAllStorageBagDetailsQuery,
      GetAllStorageBagDetailsQueryVariables
    >(GetAllStorageBagDetails, {}, 'storageBags')

    return result
  }

  /**
   * Gets a page of data objects belonging to specified bags.
   *
   * @param bagIds - query filter: bag IDs
   */
  public async getDataObjectsByBagsPage<IncludeDetails extends boolean>(
    bagIds: string[],
    limit: number,
    after: string | undefined,
    includeDetails: IncludeDetails,
    isAccepted?: boolean
  ): Promise<
    IncludeDetails extends true
      ? PaginationQueryResult<DataObjectDetailsFragment> | null
      : PaginationQueryResult<{ id: string }> | null
  > {
    return this.uniqueEntityQuery<DataObjectsByBagsConnectionQuery, DataObjectsByBagsConnectionQueryVariables>(
      DataObjectsByBagsConnection,
      {
        bagIds: [...bagIds],
        isAccepted,
        limit,
        after,
        includeDetails: includeDetails,
      },
      'storageDataObjectsConnection'
    )
  }

  /**
   * Gets a page of data objects by the given list of dataObject IDs.
   *
   * @param ids - query filter: data object ids
   */
  public async getDataObjectsByIdsPage<IncludeDetails extends boolean>(
    ids: string[],
    limit: number,
    after: string | undefined,
    includeDetails: IncludeDetails,
    isAccepted?: boolean
  ): Promise<
    IncludeDetails extends true
      ? PaginationQueryResult<DataObjectDetailsFragment> | null
      : PaginationQueryResult<{ id: string }> | null
  > {
    return this.uniqueEntityQuery<DataObjectsByIdsConnectionQuery, DataObjectsByIdsConnectionQueryVariables>(
      DataObjectsByIdsConnection,
      {
        ids: [...ids],
        isAccepted,
        limit,
        after,
        includeDetails: includeDetails,
      },
      'storageDataObjectsConnection'
    )
  }

  /**
   * Returns a list of data objects by ids, with their corresponding bag details
   *
   * @param ids - query filter: data object ids
   */
  public async getDataObjectsWithBagDetails(ids: string[]): Promise<DataObjectWithBagDetailsFragment[]> {
    return this.multipleEntitiesQuery<
      DataObjectsWithBagDetailsByIdsQuery,
      DataObjectsWithBagDetailsByIdsQueryVariables
    >(DataObjectsWithBagDetailsByIds, { ids: [...ids] }, 'storageDataObjects')
  }

  /**
   * Returns a list of data object ids that belong to a given bag.
   *
   * @param bagId - query filter: bag ID
   */
  public async getDataObjectIdsByBagId(bagId: string): Promise<string[]> {
    const result = await this.multipleEntitiesQuery<DataObjectIdsByBagIdQuery, DataObjectIdsByBagIdQueryVariables>(
      DataObjectIdsByBagId,
      { bagId },
      'storageDataObjects'
    )
    return result.map((o) => o.id)
  }

  /**
   * Returns storage bucket IDs.
   *
   */
  public async getStorageBucketIds(): Promise<Array<StorageBucketIdsFragment>> {
    const result = await this.multipleEntitiesQuery<GetStorageBucketsQuery, GetStorageBucketsQueryVariables>(
      GetStorageBuckets,
      {},
      'storageBuckets'
    )

    if (!result) {
      return []
    }

    return result
  }

  public async getDataObjectDeletedEvents(
    dataObjectIds: string[]
  ): Promise<Array<GetDataObjectsDeletedEventsQuery['events'][number]>> {
    const result = await this.multipleEntitiesQuery<
      GetDataObjectsDeletedEventsQuery,
      GetDataObjectsDeletedEventsQueryVariables
    >(GetDataObjectsDeletedEvents, { dataObjectIds }, 'events')

    if (!result) {
      return []
    }

    return result
  }

  public async getPackageVersion(): Promise<string> {
    const squidVersion = await this.uniqueEntityQuery<GetSquidVersionQuery, GetSquidVersionQueryVariables>(
      GetSquidVersion,
      {},
      'squidVersion'
    )
    return squidVersion?.version || ''
  }

  public async getState(): Promise<SquidStatusFieldsFragment | null> {
    const squidStatus = await this.uniqueEntityQuery<SquidStatusQuery, SquidStatusQueryVariables>(
      SquidStatus,
      {},
      'squidStatus'
    )
    return squidStatus
  }
}
