import {
  ApolloClient,
  NormalizedCacheObject,
  HttpLink,
  InMemoryCache,
  DocumentNode,
} from '@apollo/client'
import fetch from 'node-fetch'
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

export class QueryNodeApi {
  private apolloClient: ApolloClient<NormalizedCacheObject>

  public constructor(endpoint: string) {
    this.apolloClient = new ApolloClient({
      link: new HttpLink({ uri: endpoint, fetch: fetch as any }),
      cache: new InMemoryCache(),
      defaultOptions: {
        query: { fetchPolicy: 'no-cache', errorPolicy: 'all' },
      },
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

  // Query-node: get multiple entities
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
