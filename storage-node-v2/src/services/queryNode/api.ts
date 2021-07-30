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
  GetAllStorageBucketDetails,
  GetAllStorageBucketDetailsQuery,
  GetAllStorageBucketDetailsQueryVariables,
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
      link: new HttpLink({ uri: endpoint, fetch }),
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
    return (
      (await this.apolloClient.query<QueryT, VariablesT>({ query, variables }))
        .data[resultKey] || null
    )
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
    return (
      (await this.apolloClient.query<QueryT, VariablesT>({ query, variables }))
        .data[resultKey][0] || null
    )
  }

  // Query-node: get multiple entities
  protected async multipleEntitiesQuery<
    QueryT extends { [k: string]: unknown[] },
    VariablesT extends Record<string, unknown>
  >(
    query: DocumentNode,
    variables: VariablesT,
    resultKey: keyof QueryT
  ): Promise<QueryT[keyof QueryT]> {
    return (
      await this.apolloClient.query<QueryT, VariablesT>({ query, variables })
    ).data[resultKey]
  }

  public getStorageBucketDetails(
    objectId: string
  ): Promise<StorageBucketDetailsFragment | null> {
    return this.uniqueEntityQuery<
      GetStorageBucketDetailsQuery,
      GetStorageBucketDetailsQueryVariables
    >(GetStorageBucketDetails, { id: objectId }, 'storageBucketByUniqueInput')
  }

  public getAllStorageBucketDetails(): Promise<
    Array<StorageBucketDetailsFragment>
  > {
    return this.multipleEntitiesQuery<
      GetAllStorageBucketDetailsQuery,
      GetAllStorageBucketDetailsQueryVariables
    >(GetAllStorageBucketDetails, {}, 'storageBuckets')
  }

  public getStorageBagsDetails(
    bucketIds: string[]
  ): Promise<Array<StorageBagDetailsFragment>> {
    const input: StorageBucketWhereInput = { id_in: bucketIds }
    return this.multipleEntitiesQuery<
      GetStorageBagDetailsQuery,
      GetStorageBagDetailsQueryVariables
    >(GetStorageBagDetails, { bucketIds: input }, 'storageBags')
  }

  public getDataObjectDetails(
    bagIds: string[]
  ): Promise<Array<DataObjectDetailsFragment>> {
    const input: StorageBagWhereInput = { id_in: bagIds }
    return this.multipleEntitiesQuery<
      GetDataObjectDetailsQuery,
      GetDataObjectDetailsQueryVariables
    >(GetDataObjectDetails, { bagIds: input }, 'storageDataObjects')
  }
}
