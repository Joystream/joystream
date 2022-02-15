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
  ChannelCategoryFieldsFragment,
  ChannelFieldsFragment,
  GetChannelsByIds,
  GetChannelsByIdsQuery,
  GetChannelsByIdsQueryVariables,
  GetChannelsCategories,
  GetChannelsCategoriesQuery,
  GetChannelsCategoriesQueryVariables,
  GetVideoCategories,
  GetVideoCategoriesQuery,
  GetVideoCategoriesQueryVariables,
  GetVideosByIds,
  GetVideosByIdsQuery,
  GetVideosByIdsQueryVariables,
  VideoCategoryFieldsFragment,
  VideoFieldsFragment,
  GetDataObjectsPage,
  GetDataObjectsPageQuery,
  GetDataObjectsPageQueryVariables,
  StorageDataObjectConnectionFieldsFragment,
  DistributionBucketFieldsFragment,
  GetDistributorsByBagIdsQuery,
  GetDistributorsByBagIdsQueryVariables,
  GetDistributorsByBagIds,
} from './generated/queries'
import { Logger } from 'winston'
import { createLogger } from '../../logging'
import { Maybe } from '../../sumer-giza/sumer-query-node/generated/schema'

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
      cache: new InMemoryCache(),
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

  public getChannelCategories(): Promise<ChannelCategoryFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetChannelsCategoriesQuery, GetChannelsCategoriesQueryVariables>(
      GetChannelsCategories,
      {},
      'channelCategories'
    )
  }

  public getVideoCategories(): Promise<VideoCategoryFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetVideoCategoriesQuery, GetVideoCategoriesQueryVariables>(
      GetVideoCategories,
      {},
      'videoCategories'
    )
  }

  public getChannelsByIds(channelIds: string[] | number[]): Promise<ChannelFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetChannelsByIdsQuery, GetChannelsByIdsQueryVariables>(
      GetChannelsByIds,
      { ids: channelIds.map((id) => id.toString()) },
      'channels'
    )
  }

  public getVideosByIds(videoIds: string[] | number[]): Promise<VideoFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetVideosByIdsQuery, GetVideosByIdsQueryVariables>(
      GetVideosByIds,
      { ids: videoIds.map((id) => id.toString()) },
      'videos'
    )
  }

  public async getStorageDataObjectsPage(
    updatedAfter?: Date,
    limit: number = MAX_RESULTS_PER_QUERY,
    lastCursor?: string
  ): Promise<StorageDataObjectConnectionFieldsFragment> {
    const conn = await this.uniqueEntityQuery<GetDataObjectsPageQuery, GetDataObjectsPageQueryVariables>(
      GetDataObjectsPage,
      {
        updatedAfter,
        limit,
        lastCursor,
      },
      'storageDataObjectsConnection'
    )
    if (!conn) {
      throw new Error('Cannot get storageDataObjectsConnection!')
    }

    return conn
  }

  public async getDistributorsByBagIds(bagIds: string[]): Promise<DistributionBucketFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetDistributorsByBagIdsQuery, GetDistributorsByBagIdsQueryVariables>(
      GetDistributorsByBagIds,
      { ids: bagIds },
      'distributionBuckets'
    )
  }
}
