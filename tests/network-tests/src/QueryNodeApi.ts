import { ApolloClient, DocumentNode, NormalizedCacheObject } from '@apollo/client/core'
import { extendDebug, Debugger } from './Debugger'
import {
  StorageDataObjectFieldsFragment,
  GetDataObjectsByIdsQuery,
  GetDataObjectsByIdsQueryVariables,
  GetDataObjectsByIds,
} from './graphql/generated/queries'
import { Maybe } from './graphql/generated/schema'
import { OperationDefinitionNode } from 'graphql'
import { Utils } from './utils'

export class QueryNodeApi {
  private readonly queryNodeProvider: ApolloClient<NormalizedCacheObject>
  private readonly debug: Debugger.Debugger
  private readonly queryDebug: Debugger.Debugger
  private readonly tryDebug: Debugger.Debugger

  constructor(queryNodeProvider: ApolloClient<NormalizedCacheObject>) {
    this.queryNodeProvider = queryNodeProvider
    this.debug = extendDebug('query-node-api')
    this.queryDebug = this.debug.extend('query')
    this.tryDebug = this.debug.extend('try')
  }

  public async tryQueryWithTimeout<QueryResultT>(
    query: () => Promise<QueryResultT>,
    assertResultIsValid: (res: QueryResultT) => void,
    retryTimeMs = 18000,
    retries = 6
  ): Promise<QueryResultT> {
    const label = query.toString().replace(/^.*\.([A-za-z0-9]+\(.*\))$/g, '$1')
    const debug = this.tryDebug.extend(label)
    let retryCounter = 0
    const retry = async (error: any) => {
      if (retryCounter === retries) {
        debug(`Max number of query retries (${retries}) reached!`)
        throw error
      }
      debug(`Retrying query in ${retryTimeMs}ms...`)
      ++retryCounter
      await Utils.wait(retryTimeMs)
    }
    while (true) {
      let result: QueryResultT
      try {
        result = await query()
      } catch (e) {
        debug(`Query node unreachable`)
        await retry(e)
        continue
      }

      try {
        assertResultIsValid(result)
      } catch (e) {
        debug(`Unexpected query result${e instanceof Error ? ` (${e.message})` : ''}`)
        await retry(e)
        continue
      }

      return result
    }
  }

  private debugQuery(query: DocumentNode, args: Record<string, unknown>): void {
    const queryDef = query.definitions.find((d) => d.kind === 'OperationDefinition') as OperationDefinitionNode
    this.queryDebug(`${queryDef.name!.value}(${JSON.stringify(args)})`)
  }

  // Query entity by unique input
  private async uniqueEntityQuery<
    QueryT extends { [k: string]: Maybe<Record<string, unknown>> | undefined },
    VariablesT extends Record<string, unknown>
  >(
    query: DocumentNode,
    variables: VariablesT,
    resultKey: keyof QueryT
  ): Promise<Required<QueryT>[keyof QueryT] | null> {
    this.debugQuery(query, variables)
    return (await this.queryNodeProvider.query<QueryT, VariablesT>({ query, variables })).data[resultKey] || null
  }

  // Query entities by "non-unique" input and return first result
  private async firstEntityQuery<QueryT extends { [k: string]: unknown[] }, VariablesT extends Record<string, unknown>>(
    query: DocumentNode,
    variables: VariablesT,
    resultKey: keyof QueryT
  ): Promise<QueryT[keyof QueryT][number] | null> {
    this.debugQuery(query, variables)
    return (await this.queryNodeProvider.query<QueryT, VariablesT>({ query, variables })).data[resultKey][0] || null
  }

  // Query multiple entities
  private async multipleEntitiesQuery<
    QueryT extends { [k: string]: unknown[] },
    VariablesT extends Record<string, unknown>
  >(query: DocumentNode, variables: VariablesT, resultKey: keyof QueryT): Promise<QueryT[keyof QueryT]> {
    this.debugQuery(query, variables)
    return (await this.queryNodeProvider.query<QueryT, VariablesT>({ query, variables })).data[resultKey]
  }

  public async getDataObjectsByIds(ids: string[]): Promise<StorageDataObjectFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetDataObjectsByIdsQuery, GetDataObjectsByIdsQueryVariables>(
      GetDataObjectsByIds,
      { ids },
      'storageDataObjects'
    )
  }
}
