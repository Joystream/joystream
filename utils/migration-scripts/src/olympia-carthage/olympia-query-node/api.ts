import {
  ApolloClient,
  NormalizedCacheObject,
  HttpLink,
  InMemoryCache,
  DocumentNode,
  isApolloError,
  ApolloQueryResult,
} from '@apollo/client/core'
import { disableFragmentWarnings } from 'graphql-tag'
import fetch from 'cross-fetch'
import {
  MembershipConnectionFieldsFragment,
  GetMembershipsPageQuery,
  GetMembershipsPageQueryVariables,
  GetMembershipsPage,
} from './generated/queries'
import { Logger } from 'winston'
import { createLogger } from '../../logging'
import { Maybe } from '../../olympia-carthage/olympia-query-node/generated/schema'

disableFragmentWarnings()

export const MAX_RESULTS_PER_QUERY = 1000

export class QueryNodeApi {
  private endpoint: string
  private apolloClient: ApolloClient<NormalizedCacheObject>
  private retryAttempts: number
  private retryIntervalMs: number
  private logger: Logger

  public constructor(endpoint: string, retryAttempts = 5, retryIntervalMs = 5000) {
    this.endpoint = endpoint
    this.retryAttempts = retryAttempts
    this.retryIntervalMs = retryIntervalMs
    this.apolloClient = new ApolloClient({
      link: new HttpLink({ uri: endpoint, fetch }),
      cache: new InMemoryCache({ addTypename: false }),
      defaultOptions: { query: { fetchPolicy: 'no-cache', errorPolicy: 'all' } },
    })
    this.logger = createLogger('Query Node Api')
  }

  private async query<T>(queryFunc: () => Promise<ApolloQueryResult<T>>): Promise<ApolloQueryResult<T>> {
    let attempts = 0
    while (true) {
      try {
        const result = await queryFunc()
        return result
      } catch (e) {
        if (e instanceof Error && isApolloError(e) && e.networkError) {
          this.logger.error(`${this.endpoint} network error: ${e.networkError.message}`)
          if (attempts++ > this.retryAttempts) {
            throw new Error(`Maximum number of query retry attempts reached for ${this.endpoint}`)
          }
          this.logger.info(`Retrying in ${this.retryIntervalMs}ms...`)
          await new Promise((resolve) => setTimeout(resolve, this.retryIntervalMs))
        } else {
          throw e
        }
      }
    }
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

  // Query-node: get multiple entities
  protected async multipleEntitiesQuery<
    QueryT extends { [k: string]: unknown[] },
    VariablesT extends Record<string, unknown>
  >(query: DocumentNode, variables: VariablesT, resultKey: keyof QueryT): Promise<QueryT[keyof QueryT]> {
    const q = this.query<QueryT>(() => this.apolloClient.query<QueryT, VariablesT>({ query, variables }))
    return (await q).data[resultKey]
  }

  public async getMembershipsPage(
    lastCursor?: string,
    limit: number = MAX_RESULTS_PER_QUERY
  ): Promise<MembershipConnectionFieldsFragment> {
    const conn = await this.uniqueEntityQuery<GetMembershipsPageQuery, GetMembershipsPageQueryVariables>(
      GetMembershipsPage,
      {
        limit,
        lastCursor,
      },
      'membershipsConnection'
    )
    if (!conn) {
      throw new Error('Cannot get membershipsConnection!')
    }

    return conn
  }
}
