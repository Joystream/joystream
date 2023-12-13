import { ApolloClient, DocumentNode, HttpLink, InMemoryCache, NormalizedCacheObject, from } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import fetch from 'cross-fetch'
import stringify from 'fast-safe-stringify'
import logger from '../logger'
import {
  DataObjectByBagIdsDetailsFragment,
  DataObjectDetailsFragment,
  GetDataObjects,
  GetDataObjectsByBagIds,
  GetDataObjectsByBagIdsQuery,
  GetDataObjectsByBagIdsQueryVariables,
  GetDataObjectsQuery,
  GetDataObjectsQueryVariables,
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
import { Maybe, StorageBagWhereInput } from './generated/schema'

/**
 * Defines query paging limits.
 */
export const MAX_RESULTS_PER_QUERY = 1000

type PaginationQueryVariables = {
  limit: number
  lastCursor?: Maybe<string>
}

type PaginationQueryResult<T = unknown> = {
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
      logger.debug(`Query - ${resultKey}`)
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

  /**
   * Returns data objects info by pages for the given bags.
   *
   * @param bagIds - query filter: bag IDs
   */
  public async getDataObjectsByBagIds(bagIds: string[]): Promise<Array<DataObjectByBagIdsDetailsFragment>> {
    const allBagIds = [...bagIds] // Copy to avoid modifying the original array
    const fullResult: DataObjectByBagIdsDetailsFragment[] = []
    while (allBagIds.length) {
      const bagIdsBatch = allBagIds.splice(0, 1000)
      const input: StorageBagWhereInput = { id_in: bagIdsBatch }
      fullResult.push(
        ...(await this.multipleEntitiesQuery<GetDataObjectsByBagIdsQuery, GetDataObjectsByBagIdsQueryVariables>(
          GetDataObjectsByBagIds,
          { bagIds: input },
          'storageDataObjects'
        ))
      )
    }

    return fullResult
  }

  /**
   * Returns data objects info by pages for the given dataObject IDs.
   *
   * @param bagIds - query filter: dataObject IDs
   */
  public async getDataObjectDetails(dataObjectIds: string[]): Promise<Array<DataObjectDetailsFragment>> {
    const allDataObjectIds = [...dataObjectIds] // Copy to avoid modifying the original array
    const fullResult: DataObjectDetailsFragment[] = []
    while (allDataObjectIds.length) {
      const dataObjectIdsBatch = allDataObjectIds.splice(0, 1000)
      fullResult.push(
        ...(await this.multipleEntitiesQuery<GetDataObjectsQuery, GetDataObjectsQueryVariables>(
          GetDataObjects,
          { dataObjectIds: dataObjectIdsBatch },
          'storageDataObjects'
        ))
      )
    }

    return fullResult
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

  public async getQueryNodeState(): Promise<SquidStatusFieldsFragment | null> {
    const squidStatus = await this.uniqueEntityQuery<SquidStatusQuery, SquidStatusQueryVariables>(
      SquidStatus,
      {},
      'squidStatus'
    )
    return squidStatus
  }
}
