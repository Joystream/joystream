import {
  ApolloClient,
  DocumentNode,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
  defaultDataIdFromObject,
  from,
  split,
} from '@apollo/client/core'
import { onError } from '@apollo/client/link/error'
import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'
import fetch from 'cross-fetch'
import { Logger } from 'winston'
import ws from 'ws'
import { LoggingService } from '../../logging'
import {
  DataObjectDetailsFragment,
  DistirubtionBucketWithObjectsFragment,
  GetActiveStorageBucketOperatorsData,
  GetActiveStorageBucketOperatorsDataQuery,
  GetActiveStorageBucketOperatorsDataQueryVariables,
  GetDataObjectDetails,
  GetDataObjectDetailsQuery,
  GetDataObjectDetailsQueryVariables,
  GetDistributionBucketsWithObjectsByIds,
  GetDistributionBucketsWithObjectsByIdsQuery,
  GetDistributionBucketsWithObjectsByIdsQueryVariables,
  GetDistributionBucketsWithObjectsByWorkerId,
  GetDistributionBucketsWithObjectsByWorkerIdQuery,
  GetDistributionBucketsWithObjectsByWorkerIdQueryVariables,
  QueryNodeState,
  QueryNodeStateFields,
  QueryNodeStateFieldsFragment,
  QueryNodeStateSubscription,
  QueryNodeStateSubscriptionVariables,
  StorageBucketOperatorFieldsFragment,
} from './generated/queries'
import { Maybe } from './generated/schema'

const MAX_RESULTS_PER_QUERY = 1000

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

type CustomVariables<T> = Omit<T, keyof PaginationQueryVariables>

export class QueryNodeApi {
  private apolloClient: ApolloClient<NormalizedCacheObject>
  private logger: Logger

  public constructor(endpoint: string, logging: LoggingService, exitOnError = false) {
    this.logger = logging.createLogger('QueryNodeApi')
    const errorLink = onError(({ graphQLErrors, networkError }) => {
      const message = networkError?.message || 'Graphql syntax errors found'
      this.logger.error('Error when trying to execute a query!', { err: { message, graphQLErrors, networkError } })
      exitOnError && process.exit(-1)
    })

    const queryLink = from([errorLink, new HttpLink({ uri: endpoint, fetch })])
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
      const paginationVariables = { limit: itemsPerPage, lastCursor }
      const queryVariables = { ...variables, ...paginationVariables }
      const page = (
        await this.apolloClient.query<QueryT, PaginationQueryVariables & CustomVariablesT>({
          query,
          variables: queryVariables,
        })
      ).data[resultKey]
      results = results.concat(page.edges.map((e) => e.node))
      hasNextPage = page.pageInfo.hasNextPage
      lastCursor = page.pageInfo.endCursor || undefined
    }
    return results
  }

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
    return this.multipleEntitiesWithPagination<
      StorageBucketOperatorFieldsFragment,
      GetActiveStorageBucketOperatorsDataQuery,
      CustomVariables<GetActiveStorageBucketOperatorsDataQueryVariables>
    >(GetActiveStorageBucketOperatorsData, {}, 'storageBucketsConnection')
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
