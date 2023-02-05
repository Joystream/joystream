import {
  ApolloClient,
  NormalizedCacheObject,
  HttpLink,
  defaultDataIdFromObject,
  InMemoryCache,
  DocumentNode,
  split,
} from '@apollo/client'
import fetch from 'cross-fetch'
import {
  GetBagConnection,
  GetBagConnectionQuery,
  GetBagConnectionQueryVariables,
  GetStorageBucketDetails,
  GetStorageBucketDetailsQuery,
  GetStorageBucketDetailsByWorkerIdQuery,
  GetStorageBucketDetailsByWorkerIdQueryVariables,
  GetStorageBucketDetailsQueryVariables,
  StorageBucketDetailsFragment,
  StorageBagDetailsFragment,
  DataObjectDetailsFragment,
  GetDataObjectConnectionQuery,
  GetDataObjectConnectionQueryVariables,
  GetDataObjectConnection,
  StorageBucketIdsFragment,
  GetStorageBucketsConnection,
  GetStorageBucketsConnectionQuery,
  GetStorageBucketsConnectionQueryVariables,
  GetStorageBucketDetailsByWorkerId,
  QueryNodeStateFieldsFragment,
  QueryNodeStateSubscription,
  QueryNodeStateSubscriptionVariables,
  QueryNodeState,
  QueryNodeStateFields,
} from './generated/queries'
import { Maybe, StorageBagWhereInput } from './generated/schema'
import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'
import ws from 'ws'
import logger from '../logger'

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
  readonly endpoint: string

  public constructor(endpoint: string) {
    this.endpoint = endpoint
    const queryLink = new HttpLink({ uri: endpoint, fetch })
    const wsLink = new WebSocketLink({
      uri: endpoint,
      options: {
        reconnect: true,
      },
      webSocketImpl: ws,
    })
    const splitLink = split(
      ({ query }) => {
        const definition = getMainDefinition(query)
        return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
      },
      wsLink,
      queryLink
    )

    this.apolloClient = new ApolloClient({
      link: splitLink,
      cache: new InMemoryCache({
        dataIdFromObject: (object) => {
          // setup cache object id for ProcessorState entity type
          if (object.__typename === 'ProcessorState') {
            return object.__typename
          }
          return defaultDataIdFromObject(object)
        },
      }),
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
  >(query: DocumentNode, variables: VariablesT, resultKey: keyof QueryT): Promise<QueryT[keyof QueryT] | null> {
    const result = await this.apolloClient.query<QueryT, VariablesT>({
      query,
      variables,
    })

    if (result?.data === null) {
      return null
    }

    return result.data[resultKey]
  }

  /**
   * Get entity from subscription
   *
   * @param query - actual query
   * @param variables - query parameters
   * @param resultKey - helps result parsing
   */
  protected async uniqueEntitySubscription<
    SubscriptionT extends { [k: string]: Maybe<Record<string, unknown>> | undefined },
    VariablesT extends Record<string, unknown>
  >(
    query: DocumentNode,
    variables: VariablesT,
    resultKey: keyof SubscriptionT
  ): Promise<SubscriptionT[keyof SubscriptionT] | null> {
    return new Promise((resolve) => {
      this.apolloClient.subscribe<SubscriptionT, VariablesT>({ query, variables }).subscribe(({ data }) => {
        resolve(data ? data[resultKey] : null)
      })
    })
  }

  /**
   * Returns storage bucket IDs filtered by worker ID.
   *
   * @param workerId - worker ID
   */
  public async getStorageBucketIdsByWorkerId(workerId: string): Promise<Array<StorageBucketIdsFragment>> {
    const result = await this.multipleEntitiesWithPagination<
      StorageBucketIdsFragment,
      GetStorageBucketDetailsByWorkerIdQuery,
      GetStorageBucketDetailsByWorkerIdQueryVariables
    >(GetStorageBucketDetailsByWorkerId, { workerId, limit: MAX_RESULTS_PER_QUERY }, 'storageBucketsConnection')

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
  public async getStorageBucketDetails(
    ids: string[],
    offset: number,
    limit: number
  ): Promise<Array<StorageBucketDetailsFragment>> {
    const result = await this.multipleEntitiesQuery<
      GetStorageBucketDetailsQuery,
      GetStorageBucketDetailsQueryVariables
    >(GetStorageBucketDetails, { offset, limit, ids }, 'storageBuckets')

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
    const result = await this.multipleEntitiesWithPagination<
      StorageBagDetailsFragment,
      GetBagConnectionQuery,
      GetBagConnectionQueryVariables
    >(GetBagConnection, { limit: MAX_RESULTS_PER_QUERY, bucketIds }, 'storageBagsConnection')

    if (!result) {
      return []
    }

    return result
  }

  /**
   * Returns data objects info by pages for the given bags.
   *
   * @param bagIds - query filter: bag IDs
   * @param offset - starting record of the page
   */
  public async getDataObjectDetails(bagIds: string[]): Promise<Array<DataObjectDetailsFragment>> {
    const input: StorageBagWhereInput = { id_in: bagIds }
    const result = await this.multipleEntitiesWithPagination<
      DataObjectDetailsFragment,
      GetDataObjectConnectionQuery,
      GetDataObjectConnectionQueryVariables
    >(GetDataObjectConnection, { limit: MAX_RESULTS_PER_QUERY, bagIds: input }, 'storageDataObjectsConnection')

    if (!result) {
      return []
    }

    return result
  }

  /**
   * Returns storage bucket IDs.
   *
   */
  public async getStorageBucketIds(): Promise<Array<StorageBucketIdsFragment>> {
    const result = await this.multipleEntitiesWithPagination<
      StorageBucketIdsFragment,
      GetStorageBucketsConnectionQuery,
      GetStorageBucketsConnectionQueryVariables
    >(GetStorageBucketsConnection, { limit: MAX_RESULTS_PER_QUERY }, 'storageBucketsConnection')

    if (!result) {
      return []
    }

    return result
  }

  public async getQueryNodeState(): Promise<QueryNodeStateFieldsFragment | null> {
    // fetch cached state
    const cachedState = this.apolloClient.readFragment<
      QueryNodeStateSubscription['stateSubscription'],
      QueryNodeStateSubscriptionVariables
    >({
      id: 'ProcessorState',
      fragment: QueryNodeStateFields,
    })

    // If we have the state in cache, return it
    if (cachedState) {
      return cachedState
    }

    // Otherwise setup the subscription (which will periodically update the cache) and return for the first result
    return this.uniqueEntitySubscription<QueryNodeStateSubscription, QueryNodeStateSubscriptionVariables>(
      QueryNodeState,
      {},
      'stateSubscription'
    )
  }
}
