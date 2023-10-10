import {
  ApolloClient,
  DocumentNode,
  FetchPolicy,
  HttpLink,
  NormalizedCacheObject,
  from,
  split,
} from '@apollo/client/core'
import { onError } from '@apollo/client/link/error'
import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'
import { InvalidationPolicyCache } from '@nerdwallet/apollo-cache-policies'
import fetch from 'cross-fetch'
import { FragmentDefinitionNode } from 'graphql'
import { Logger } from 'winston'
import ws from 'ws'
import { ReadonlyConfig } from '../../../types'
import { LoggingService } from '../../logging'
import {
  DataObjectDetailsFragment,
  GetActiveStorageBucketOperatorsData,
  GetActiveStorageBucketOperatorsDataQuery,
  GetActiveStorageBucketOperatorsDataQueryVariables,
  GetDataObjectDetails,
  GetDataObjectDetailsQuery,
  GetDataObjectDetailsQueryVariables,
  GetDataObjectsWithBagsByIds,
  GetDataObjectsWithBagsByIdsQuery,
  GetDataObjectsWithBagsByIdsQueryVariables,
  GetDistributionBucketsWithBagsByIds,
  GetDistributionBucketsWithBagsByIdsQuery,
  GetDistributionBucketsWithBagsByIdsQueryVariables,
  GetDistributionBucketsWithBagsByWorkerId,
  GetDistributionBucketsWithBagsByWorkerIdQuery,
  GetDistributionBucketsWithBagsByWorkerIdQueryVariables,
  MinimalDataObjectFragment,
  QueryNodeState,
  QueryNodeStateFields,
  QueryNodeStateFieldsFragment,
  QueryNodeStateSubscription,
  QueryNodeStateSubscriptionVariables,
  StorageBagWithObjectsFragment,
  StorageBucketOperatorFieldsFragment,
} from './generated/queries'
import { Maybe } from './generated/schema'

const MAX_RESULTS_PER_QUERY = 1000

export type QueryFetchPolicy = Extract<FetchPolicy, 'cache-first' | 'no-cache'>

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
  private config: ReadonlyConfig
  private apolloClient: ApolloClient<NormalizedCacheObject>
  private logger: Logger

  public constructor(config: ReadonlyConfig, logging: LoggingService, exitOnError = false) {
    this.config = config

    this.logger = logging.createLogger('QueryNodeApi')
    const errorLink = onError(({ graphQLErrors, networkError }) => {
      const message = networkError?.message || 'Graphql syntax errors found'
      this.logger.error('Error when trying to execute a query!', { err: { message, graphQLErrors, networkError } })
      exitOnError && process.exit(-1)
    })

    const queryLink = from([errorLink, new HttpLink({ uri: this.config.endpoints.queryNode, fetch })])
    const wsLink = new WebSocketLink({
      uri: this.config.endpoints.queryNode,
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
      // Ref: https://www.apollographql.com/docs/react/api/core/ApolloClient/#assumeimmutableresults
      assumeImmutableResults: true,
      cache: new InvalidationPolicyCache({
        typePolicies: {
          ProcessorState: {
            keyFields: (object) => object.__typename,
          },
        },
        invalidationPolicies: {
          types: {
            StorageDataObject: {
              timeToLive: (this.config.limits.queryNodeCacheTTL || 60) * 1000, // in MS,
            },
          },
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
    resultKey: keyof QueryT,
    fetchPolicy: QueryFetchPolicy
  ): Promise<Required<QueryT>[keyof QueryT] | null> {
    return (
      (await this.apolloClient.query<QueryT, VariablesT>({ query, variables, fetchPolicy })).data[resultKey] || null
    )
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

  protected readFragment<FragmentT, VariablesT extends Record<string, unknown>>(
    id: string,
    fragment: DocumentNode
  ): FragmentT | null {
    // Get the fragment name, usually first element of the definitions array is the name of the top level fragment
    const fragmentName = (fragment.definitions[0] as FragmentDefinitionNode).name.value
    if (!fragmentName) {
      throw new Error('Unable to extract fragment name from provided DocumentNode.')
    }
    return this.apolloClient.cache.readFragment<FragmentT, VariablesT>({ id, fragment, fragmentName })
  }

  public async getDataObjectDetails(
    objectId: string,
    fetchPolicy: QueryFetchPolicy
  ): Promise<DataObjectDetailsFragment | null> {
    const result = await this.uniqueEntityQuery<GetDataObjectDetailsQuery, GetDataObjectDetailsQueryVariables>(
      GetDataObjectDetails,
      { id: objectId },
      'storageDataObjectByUniqueInput',
      fetchPolicy
    )

    return result
  }

  private async getDataObjectsByBagIds(bagIds: string[]): Promise<MinimalDataObjectFragment[]> {
    const allBagIds = [...bagIds] // Copy to avoid modifying the original array
    const fullResult: StorageBagWithObjectsFragment[] = []
    while (allBagIds.length) {
      const bagIdsBatch = allBagIds.splice(0, 1000)
      fullResult.push(
        ...(await this.multipleEntitiesQuery<
          GetDataObjectsWithBagsByIdsQuery,
          GetDataObjectsWithBagsByIdsQueryVariables
        >(GetDataObjectsWithBagsByIds, { bagIds: bagIdsBatch, limit: bagIdsBatch.length }, 'storageBags'))
      )
    }

    return fullResult.map((bag) => bag.objects).flat()
  }

  public async getDistributionBucketsWithObjectsByIds(ids: string[]): Promise<MinimalDataObjectFragment[]> {
    const distributionBucketsWithBags = await this.multipleEntitiesQuery<
      GetDistributionBucketsWithBagsByIdsQuery,
      GetDistributionBucketsWithBagsByIdsQueryVariables
    >(GetDistributionBucketsWithBagsByIds, { ids }, 'distributionBuckets')

    const bagIds = distributionBucketsWithBags
      .map((bucket) => bucket.bags)
      .flat()
      .map((bag) => bag.id)

    return this.getDataObjectsByBagIds(bagIds)
  }

  public async getDistributionBucketsWithObjectsByWorkerId(workerId: number): Promise<MinimalDataObjectFragment[]> {
    const distributionBucketsWithBags = await this.multipleEntitiesQuery<
      GetDistributionBucketsWithBagsByWorkerIdQuery,
      GetDistributionBucketsWithBagsByWorkerIdQueryVariables
    >(GetDistributionBucketsWithBagsByWorkerId, { workerId }, 'distributionBuckets')

    const bagIds = distributionBucketsWithBags
      .map((bucket) => bucket.bags)
      .flat()
      .map((bag) => bag.id)

    return this.getDataObjectsByBagIds(bagIds)
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
    const cachedState = this.readFragment<QueryNodeStateFieldsFragment, QueryNodeStateSubscriptionVariables>(
      'ProcessorState',
      QueryNodeStateFields
    )

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
