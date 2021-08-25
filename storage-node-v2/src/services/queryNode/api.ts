import {
  ApolloClient,
  NormalizedCacheObject,
  HttpLink,
  InMemoryCache,
  DocumentNode,
} from '@apollo/client'
import fetch from 'cross-fetch'
import {
  GetStorageBucketDetails,
  GetStorageBucketDetailsQuery,
  GetStorageBucketDetailsQueryVariables,
  StorageBucketDetailsFragment,
  GetStorageBagDetailsQuery,
  GetStorageBagDetails,
  StorageBagDetailsFragment,
  GetStorageBagDetailsQueryVariables,
  DataObjectDetailsFragment,
  GetDataObjectDetailsQuery,
  GetDataObjectDetailsQueryVariables,
  GetDataObjectDetails,
} from './generated/queries'
import {
  Maybe,
  StorageBucketWhereInput,
  StorageBagWhereInput,
} from './generated/schema'

/**
 * Query node class helper. Incapsulates custom queries.
 *
 */
export class QueryNodeApi {
  private apolloClient: ApolloClient<NormalizedCacheObject>

  public constructor(endpoint: string) {
    this.apolloClient = new ApolloClient({
      link: new HttpLink({ uri: endpoint, fetch }),
      cache: new InMemoryCache(),
      defaultOptions: {
        query: { fetchPolicy: 'no-cache', errorPolicy: 'all' },
      },
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
  >(
    query: DocumentNode,
    variables: VariablesT,
    resultKey: keyof QueryT
  ): Promise<QueryT[keyof QueryT][number] | null> {
    const result = await this.apolloClient.query<QueryT, VariablesT>({
      query,
      variables,
    })

    if (result?.data === null) {
      return null
    }
    return result.data[resultKey][0]
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
  >(
    query: DocumentNode,
    variables: VariablesT,
    resultKey: keyof QueryT
  ): Promise<QueryT[keyof QueryT] | null> {
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
   * Returns storage bucket info by pages.
   *
   * @param offset - starting record of the page
   * @param limit - page size
   */
  public async getStorageBucketDetails(
    offset: number,
    limit: number
  ): Promise<Array<StorageBucketDetailsFragment>> {
    const result = await this.multipleEntitiesQuery<
      GetStorageBucketDetailsQuery,
      GetStorageBucketDetailsQueryVariables
    >(GetStorageBucketDetails, { offset, limit }, 'storageBuckets')

    if (result === null) {
      return []
    }

    return result
  }

  /**
   * Returns storage bag info by pages for the given buckets.
   *
   * @param bucketIds - query filter: bucket IDs
   * @param offset - starting record of the page
   * @param limit - page size
   */
  public async getStorageBagsDetails(
    bucketIds: string[],
    offset: number,
    limit: number
  ): Promise<Array<StorageBagDetailsFragment>> {
    const input: StorageBucketWhereInput = { id_in: bucketIds }
    const result = await this.multipleEntitiesQuery<
      GetStorageBagDetailsQuery,
      GetStorageBagDetailsQueryVariables
    >(GetStorageBagDetails, { offset, limit, bucketIds: input }, 'storageBags')

    if (result === null) {
      return []
    }

    return result
  }

  /**
   * Returns data objects info by pages for the given bags.
   *
   * @param bagIds - query filter: bag IDs
   * @param offset - starting record of the page
   * @param limit - page size
   */
  public async getDataObjectDetails(
    bagIds: string[],
    offset: number,
    limit: number
  ): Promise<Array<DataObjectDetailsFragment>> {
    const input: StorageBagWhereInput = { id_in: bagIds }
    const result = await this.multipleEntitiesQuery<
      GetDataObjectDetailsQuery,
      GetDataObjectDetailsQueryVariables
    >(
      GetDataObjectDetails,
      { offset, limit, bagIds: input },
      'storageDataObjects'
    )

    if (result === null) {
      return []
    }

    return result
  }
}
